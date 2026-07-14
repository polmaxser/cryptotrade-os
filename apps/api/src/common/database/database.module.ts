import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DATABASE_PROVIDER } from './database.constants';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: DATABASE_PROVIDER,
      useExisting: PrismaService,
    },
  ],
  exports: [PrismaService, DATABASE_PROVIDER],
})
export class DatabaseModule {}
