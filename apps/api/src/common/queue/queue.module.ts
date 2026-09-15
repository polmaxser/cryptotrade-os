import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

/**
 * Registers the shared BullMQ connection every queue in the app uses
 * (AI Coach detection, AI Report generation, ...) — imported once, globally,
 * so individual feature modules only need `BullModule.registerQueue(...)`
 * without repeating connection config.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('queue.redisUrl'),
          maxRetriesPerRequest: null,
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
