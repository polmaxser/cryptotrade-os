import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { AlertsService } from './alerts.service';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.alertsService.listForUser(userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreatePriceAlertDto) {
    return this.alertsService.create(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.alertsService.remove(id, userId);
    return { success: true };
  }
}
