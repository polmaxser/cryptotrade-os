import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '@/modules/auth/guards/admin.guard';
import { ListEconomicEventsDto } from '@/modules/economic-calendar/dto/list-economic-events.dto';

import { AdminEconomicEventsService } from './admin-economic-events.service';
import { CreateEconomicEventDto } from './dto/create-economic-event.dto';
import { UpdateEconomicEventDto } from './dto/update-economic-event.dto';

@Controller('admin/economic-events')
@UseGuards(AdminGuard)
export class AdminEconomicEventsController {
  constructor(private readonly adminEconomicEventsService: AdminEconomicEventsService) {}

  @Get()
  async list(@Query() query: ListEconomicEventsDto) {
    return this.adminEconomicEventsService.listEvents(query);
  }

  @Post()
  async create(@Body() dto: CreateEconomicEventDto) {
    return this.adminEconomicEventsService.createEvent(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEconomicEventDto) {
    return this.adminEconomicEventsService.updateEvent(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.adminEconomicEventsService.deleteEvent(id);
    return { success: true };
  }
}
