import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExchangeConnection, ExchangeProvider, TradeSource } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';
import { EncryptionService } from '@/common/crypto/encryption.service';
import { TradeRepository } from '@/modules/trades/repositories/trade.repository';
import { PortfoliosService } from '@/modules/portfolios/portfolios.service';
import { BillingService } from '@/modules/billing/billing.service';

import { ExchangeClientRegistry } from './exchange-client-registry.service';
import { matchFillsToTrades, MatchedTrade } from './trade-matcher';
import { ExchangeConnectionRepository } from './repositories/exchange-connection.repository';
import { CreateExchangeConnectionDto } from './dto/create-exchange-connection.dto';
import { ImportTradesDto } from './dto/import-trades.dto';
import { ExchangeClient, ExchangeCredentials, FillsRange } from './types/exchange-client';
import { NormalizedFill } from './types/normalized-fill';
import {
  ExchangeConnectionSummary,
  ImportResult,
  toConnectionSummary,
} from './types/exchange-connection-summary';

@Injectable()
export class ExchangesService {
  constructor(
    private readonly connectionRepository: ExchangeConnectionRepository,
    private readonly encryptionService: EncryptionService,
    private readonly clientRegistry: ExchangeClientRegistry,
    private readonly tradeRepository: TradeRepository,
    private readonly portfoliosService: PortfoliosService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async listConnections(userId: string): Promise<ExchangeConnectionSummary[]> {
    const connections = await this.connectionRepository.findAllByUser(userId);
    return connections.map(toConnectionSummary);
  }

  async createConnection(
    userId: string,
    dto: CreateExchangeConnectionDto,
  ): Promise<ExchangeConnectionSummary> {
    // Validate the credentials actually work before we ever store them.
    const client = this.clientRegistry.getClient(dto.exchange);
    await client.testConnection({
      apiKey: dto.apiKey ?? '',
      apiSecret: dto.apiSecret ?? '',
      apiPassphrase: dto.apiPassphrase,
      walletAddress: dto.walletAddress,
    });

    const previewSource = dto.walletAddress ?? dto.apiKey ?? '';

    const connection = await this.connectionRepository.create({
      userId,
      exchange: dto.exchange,
      label: dto.label,
      encryptedApiKey: dto.apiKey ? this.encryptionService.encrypt(dto.apiKey) : undefined,
      encryptedApiSecret: dto.apiSecret ? this.encryptionService.encrypt(dto.apiSecret) : undefined,
      encryptedApiPassphrase: dto.apiPassphrase
        ? this.encryptionService.encrypt(dto.apiPassphrase)
        : undefined,
      encryptedWalletAddress: dto.walletAddress
        ? this.encryptionService.encrypt(dto.walletAddress)
        : undefined,
      apiKeyPreview: previewSource.slice(-4),
    });

    return toConnectionSummary(connection);
  }

  async deleteConnection(id: string, userId: string): Promise<void> {
    const connection = await this.getConnectionOrThrow(id, userId);
    await this.connectionRepository.delete(connection.id);
  }

  async importTrades(id: string, userId: string, dto: ImportTradesDto): Promise<ImportResult[]> {
    const connection = await this.getConnectionOrThrow(id, userId);
    const client = this.clientRegistry.getClient(connection.exchange);

    const portfolioId = dto.portfolioId
      ? (await this.portfoliosService.findOne(dto.portfolioId, userId)).id
      : (await this.portfoliosService.getDefaultForUser(userId))?.id;

    const credentials = {
      apiKey: connection.encryptedApiKey
        ? this.encryptionService.decrypt(connection.encryptedApiKey)
        : '',
      apiSecret: connection.encryptedApiSecret
        ? this.encryptionService.decrypt(connection.encryptedApiSecret)
        : '',
      apiPassphrase: connection.encryptedApiPassphrase
        ? this.encryptionService.decrypt(connection.encryptedApiPassphrase)
        : undefined,
      walletAddress: connection.encryptedWalletAddress
        ? this.encryptionService.decrypt(connection.encryptedWalletAddress)
        : undefined,
    };

    const range = this.resolveImportRange(dto);
    const matchedBySymbol = await this.fetchAndMatchBySymbol(
      client,
      connection,
      credentials,
      dto,
      range,
    );

    const totalTrades = [...matchedBySymbol.values()].reduce(
      (sum, matched) => sum + matched.length,
      0,
    );

    await this.billingService.assertCanImportTrades(userId, totalTrades);

    const results: ImportResult[] = [];
    const source = toTradeSource(connection.exchange);

    await this.prisma.$transaction(async (tx) => {
      for (const [symbol, matched] of matchedBySymbol) {
        await this.tradeRepository.deleteByExchangeConnectionAndSymbol(connection.id, symbol, tx);

        if (matched.length > 0) {
          await this.tradeRepository.createMany(
            matched.map((trade) => ({
              symbol,
              side: trade.side,
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice ?? undefined,
              quantity: trade.quantity,
              pnl: trade.pnl ?? undefined,
              status: trade.status,
              openedAt: trade.openedAt,
              closedAt: trade.closedAt ?? undefined,
              userId,
              portfolioId: portfolioId ?? undefined,
              source,
              exchangeConnectionId: connection.id,
            })),
            tx,
          );
        }

        results.push({ symbol, tradesImported: matched.length });
      }
    });

    await this.connectionRepository.touchLastImported(connection.id);

    return results;
  }

  /**
   * With explicit symbols, fetches each one individually as before. Without
   * any, sweeps every symbol at once (only some exchanges support this —
   * see ExchangeClient.supportsAllSymbolsFetch) and groups the results by
   * each fill's own symbol, since the caller has no symbol list to iterate.
   */
  private async fetchAndMatchBySymbol(
    client: ExchangeClient,
    connection: ExchangeConnection,
    credentials: ExchangeCredentials,
    dto: ImportTradesDto,
    range: FillsRange | undefined,
  ): Promise<Map<string, MatchedTrade[]>> {
    const matchedBySymbol = new Map<string, MatchedTrade[]>();

    if (dto.symbols && dto.symbols.length > 0) {
      for (const rawSymbol of dto.symbols) {
        const symbol = rawSymbol.toUpperCase();
        const fills = await client.fetchFills(credentials, symbol, range);
        matchedBySymbol.set(symbol, matchFillsToTrades(fills));
      }

      return matchedBySymbol;
    }

    if (!client.supportsAllSymbolsFetch) {
      throw new BadRequestException(
        `${connection.exchange} requires at least one symbol — it has no way to list every pair at once`,
      );
    }

    const fills = await client.fetchFills(credentials, undefined, range);
    const fillsBySymbol = new Map<string, NormalizedFill[]>();

    for (const fill of fills) {
      const bucket = fillsBySymbol.get(fill.symbol) ?? [];
      bucket.push(fill);
      fillsBySymbol.set(fill.symbol, bucket);
    }

    for (const [symbol, symbolFills] of fillsBySymbol) {
      matchedBySymbol.set(symbol, matchFillsToTrades(symbolFills));
    }

    return matchedBySymbol;
  }

  private resolveImportRange(dto: ImportTradesDto): FillsRange | undefined {
    if (!dto.from && !dto.to) {
      return undefined;
    }

    if (!dto.from || !dto.to) {
      throw new BadRequestException('Both "from" and "to" must be provided together');
    }

    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (from >= to) {
      throw new BadRequestException('"from" must be before "to"');
    }

    return { from, to };
  }

  private async getConnectionOrThrow(id: string, userId: string): Promise<ExchangeConnection> {
    const connection = await this.connectionRepository.findById(id);

    if (!connection) {
      throw new NotFoundException('Exchange connection not found');
    }

    if (connection.userId !== userId) {
      throw new ForbiddenException('You do not have access to this exchange connection');
    }

    return connection;
  }
}

const EXCHANGE_TO_TRADE_SOURCE: Record<ExchangeProvider, TradeSource> = {
  [ExchangeProvider.BINANCE]: TradeSource.BINANCE,
  [ExchangeProvider.BYBIT]: TradeSource.BYBIT,
  [ExchangeProvider.OKX]: TradeSource.OKX,
  [ExchangeProvider.KUCOIN]: TradeSource.KUCOIN,
  [ExchangeProvider.GATEIO]: TradeSource.GATEIO,
  [ExchangeProvider.HYPERLIQUID]: TradeSource.HYPERLIQUID,
};

function toTradeSource(exchange: ExchangeProvider): TradeSource {
  return EXCHANGE_TO_TRADE_SOURCE[exchange];
}
