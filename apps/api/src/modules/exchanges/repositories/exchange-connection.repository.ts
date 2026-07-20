import { Injectable } from '@nestjs/common';
import { ExchangeConnection, ExchangeProvider } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class ExchangeConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<ExchangeConnection[]> {
    return this.prisma.exchangeConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<ExchangeConnection | null> {
    return this.prisma.exchangeConnection.findUnique({ where: { id } });
  }

  async create(data: {
    userId: string;
    exchange: ExchangeProvider;
    label: string;
    encryptedApiKey?: string;
    encryptedApiSecret?: string;
    encryptedApiPassphrase?: string;
    encryptedWalletAddress?: string;
    apiKeyPreview: string;
  }): Promise<ExchangeConnection> {
    return this.prisma.exchangeConnection.create({ data });
  }

  async delete(id: string): Promise<ExchangeConnection> {
    return this.prisma.exchangeConnection.delete({ where: { id } });
  }

  async touchLastImported(id: string): Promise<void> {
    await this.prisma.exchangeConnection.update({
      where: { id },
      data: { lastImportedAt: new Date() },
    });
  }
}
