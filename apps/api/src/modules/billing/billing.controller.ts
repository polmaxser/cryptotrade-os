import { BadRequestException, Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { RedeemPromoCodeDto } from './dto/redeem-promo-code.dto';
import { PLAN_DEFINITIONS } from './types/plan-config';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('plans')
  getPlans() {
    return Object.values(PLAN_DEFINITIONS);
  }

  @Get('subscription')
  async getMySubscription(@CurrentUser('id') userId: string) {
    return this.billingService.getMySubscription(userId);
  }

  @Post('checkout')
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(userId, dto.plan);
  }

  @Post('portal')
  async createPortalSession(@CurrentUser('id') userId: string) {
    return this.billingService.createPortalSession(userId);
  }

  @Post('promo-codes/redeem')
  async redeemPromoCode(@CurrentUser('id') userId: string, @Body() dto: RedeemPromoCodeDto) {
    return this.billingService.redeemPromoCode(userId, dto.code);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook payload or signature');
    }

    await this.billingService.handleWebhookEvent(req.rawBody, signature);

    return { received: true };
  }
}
