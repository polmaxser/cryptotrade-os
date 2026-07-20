import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PromoCode } from '@cryptotrade/database';

import { PromoCodeRepository } from '@/modules/billing/repositories/promo-code.repository';

import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Injectable()
export class AdminPromoCodesService {
  constructor(private readonly promoCodeRepository: PromoCodeRepository) {}

  async listPromoCodes(): Promise<PromoCode[]> {
    return this.promoCodeRepository.findAll();
  }

  async createPromoCode(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.promoCodeRepository.findByCode(code);
    if (existing) {
      throw new ConflictException('A promo code with this code already exists.');
    }

    return this.promoCodeRepository.create({
      code,
      description: dto.description,
      grantsPlan: dto.grantsPlan,
      freeDays: dto.freeDays,
      maxRedemptions: dto.maxRedemptions,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  async updatePromoCode(id: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const existing = await this.promoCodeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Promo code not found');
    }

    return this.promoCodeRepository.update(id, { isActive: dto.isActive });
  }
}
