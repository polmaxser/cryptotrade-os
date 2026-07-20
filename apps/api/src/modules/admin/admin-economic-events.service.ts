import { Injectable, NotFoundException } from '@nestjs/common';
import { EconomicEvent } from '@cryptotrade/database';

import { ListEconomicEventsDto } from '@/modules/economic-calendar/dto/list-economic-events.dto';
import { EconomicEventRepository } from '@/modules/economic-calendar/repositories/economic-event.repository';

import { CreateEconomicEventDto } from './dto/create-economic-event.dto';
import { UpdateEconomicEventDto } from './dto/update-economic-event.dto';

@Injectable()
export class AdminEconomicEventsService {
  constructor(private readonly eventRepository: EconomicEventRepository) {}

  async listEvents(dto: ListEconomicEventsDto): Promise<EconomicEvent[]> {
    return this.eventRepository.findInRange(new Date(dto.from), new Date(dto.to), dto.category);
  }

  async createEvent(dto: CreateEconomicEventDto): Promise<EconomicEvent> {
    return this.eventRepository.create({
      category: dto.category,
      importance: dto.importance,
      country: dto.country ?? 'US',
      title: dto.title,
      description: dto.description,
      eventDate: new Date(dto.eventDate),
      forecast: dto.forecast,
      previous: dto.previous,
      actual: dto.actual,
    });
  }

  async updateEvent(id: string, dto: UpdateEconomicEventDto): Promise<EconomicEvent> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Economic event not found');
    }

    return this.eventRepository.update(id, {
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.importance !== undefined ? { importance: dto.importance } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.eventDate !== undefined ? { eventDate: new Date(dto.eventDate) } : {}),
      ...(dto.forecast !== undefined ? { forecast: dto.forecast } : {}),
      ...(dto.previous !== undefined ? { previous: dto.previous } : {}),
      ...(dto.actual !== undefined ? { actual: dto.actual } : {}),
    });
  }

  async deleteEvent(id: string): Promise<void> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Economic event not found');
    }

    await this.eventRepository.delete(id);
  }
}
