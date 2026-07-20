import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { AdminGuard } from '@/modules/auth/guards/admin.guard';

import { AdminPromoCodesService } from './admin-promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Controller('admin/promo-codes')
@UseGuards(AdminGuard)
export class AdminPromoCodesController {
  constructor(private readonly adminPromoCodesService: AdminPromoCodesService) {}

  @Get()
  async list() {
    return this.adminPromoCodesService.listPromoCodes();
  }

  @Post()
  async create(@Body() dto: CreatePromoCodeDto) {
    return this.adminPromoCodesService.createPromoCode(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.adminPromoCodesService.updatePromoCode(id, dto);
  }
}
