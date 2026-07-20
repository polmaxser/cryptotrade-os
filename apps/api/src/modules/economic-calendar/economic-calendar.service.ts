import { BadRequestException, Injectable } from '@nestjs/common';
import { EconomicEvent } from '@cryptotrade/database';

import { BillingService } from '@/modules/billing/billing.service';

import { ListEconomicEventsDto } from './dto/list-economic-events.dto';
import { EconomicEventRepository } from './repositories/economic-event.repository';

@Injectable()
export class EconomicCalendarService {
  constructor(
    private readonly eventRepository: EconomicEventRepository,
    private readonly billingService: BillingService,
  ) {}

  async listEvents(userId: string, dto: ListEconomicEventsDto): Promise<EconomicEvent[]> {
    await this.billingService.assertCanUseEconomicCalendar(userId);

    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (from >= to) {
      throw new BadRequestException('"from" must be before "to".');
    }

    return this.eventRepository.findInRange(from, to, dto.category);
  }
}
