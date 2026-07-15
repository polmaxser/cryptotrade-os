import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { TradesModule } from '@/modules/trades/trades.module';

import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [DatabaseModule, TradesModule],

  controllers: [CalendarController],

  providers: [CalendarService],
})
export class CalendarModule {}
