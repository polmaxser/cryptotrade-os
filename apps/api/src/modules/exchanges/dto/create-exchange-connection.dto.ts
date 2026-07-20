import { IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ExchangeProvider } from '@cryptotrade/database';

const EXCHANGES_REQUIRING_PASSPHRASE: ExchangeProvider[] = [
  ExchangeProvider.OKX,
  ExchangeProvider.KUCOIN,
];

/** Identifies accounts by wallet address instead of an API key/secret pair — see ExchangeCredentials. */
const WALLET_ADDRESS_EXCHANGES: ExchangeProvider[] = [ExchangeProvider.HYPERLIQUID];

function isWalletAddressExchange(dto: CreateExchangeConnectionDto): boolean {
  return WALLET_ADDRESS_EXCHANGES.includes(dto.exchange);
}

export class CreateExchangeConnectionDto {
  @IsEnum(ExchangeProvider)
  exchange!: ExchangeProvider;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  @ValidateIf((dto: CreateExchangeConnectionDto) => !isWalletAddressExchange(dto))
  @IsString()
  @MinLength(1)
  apiKey?: string;

  @ValidateIf((dto: CreateExchangeConnectionDto) => !isWalletAddressExchange(dto))
  @IsString()
  @MinLength(1)
  apiSecret?: string;

  /** Required for exchanges (e.g. OKX, KuCoin) that set a passphrase at API key creation time. */
  @ValidateIf((dto: CreateExchangeConnectionDto) =>
    EXCHANGES_REQUIRING_PASSPHRASE.includes(dto.exchange),
  )
  @IsString()
  @MinLength(1)
  apiPassphrase?: string;

  /** Required for HYPERLIQUID — the account's public wallet address, in place of an API key/secret. */
  @ValidateIf((dto: CreateExchangeConnectionDto) => isWalletAddressExchange(dto))
  @IsString()
  @MinLength(1)
  walletAddress?: string;
}
