import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { EconomicCalendarService } from './economic-calendar.service';
import { ListEconomicEventsDto } from './dto/list-economic-events.dto';

@Controller('economic-calendar')
export class EconomicCalendarController {
  constructor(private readonly economicCalendarService: EconomicCalendarService) {}

  @Get()
  async list(@CurrentUser('id') userId: string, @Query() query: ListEconomicEventsDto) {
    return this.economicCalendarService.listEvents(userId, query);
  }
}
