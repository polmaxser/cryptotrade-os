import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@cryptotrade/database';
import { DATABASE_PROVIDER } from '../../common/database/database.constants';

@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE_PROVIDER) private readonly db: PrismaClient) {}

  async check() {
    await this.db.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
      },
    };
  }
}
