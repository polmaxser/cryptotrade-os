import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Thin JSON cache over the same Redis instance BullMQ uses — for data that's
 * expensive or rate-limit-risky to fetch fresh every time (e.g. an exchange's
 * full ticker list) but fine to serve a few seconds stale. Not a general
 * key-value store: every value is JSON-serialized and every read can return
 * null, so callers must always have a "compute it fresh" fallback.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.get<string>('redis.url')!);
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
