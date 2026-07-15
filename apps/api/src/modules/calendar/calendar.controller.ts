import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { CalendarService } from './calendar.service';
import { GetCalendarDto } from './dto/get-calendar.dto';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getMonthlyPnl(@CurrentUser('id') userId: string, @Query() query: GetCalendarDto) {
    return this.calendarService.getMonthlyPnl(userId, query.month);
  }
}
