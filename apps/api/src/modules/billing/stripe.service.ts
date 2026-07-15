import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly client: Stripe;
  private readonly configuredSecretKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.configuredSecretKey = this.configService.get<string>('billing.stripeSecretKey');

    // The SDK never validates the key at construction time — only calls that
    // actually reach Stripe's API do. That lets webhook signature verification
    // (pure local HMAC, no network call) work even with no real key configured.
    this.client = new Stripe(this.configuredSecretKey || 'sk_test_not_configured');
  }

  get isConfigured(): boolean {
    return Boolean(this.configuredSecretKey);
  }

  /** For webhook verification and other operations that never call Stripe's API. */
  get raw(): Stripe {
    return this.client;
  }

  /** For checkout/portal/customer creation — throws a clean 503 if unconfigured. */
  requireClient(): Stripe {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Billing is not configured yet — no Stripe secret key is set',
      );
    }

    return this.client;
  }

  get webhookSecret(): string | undefined {
    return this.configService.get<string>('billing.stripeWebhookSecret');
  }
}
