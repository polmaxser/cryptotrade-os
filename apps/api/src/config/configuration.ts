export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  api: {
    port: parseInt(process.env.API_PORT ?? '4000', 10),
    host: process.env.API_HOST ?? '0.0.0.0',
    prefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    accessTokenTtlSeconds: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
    refreshTokenTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '30', 10),
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
  },
  billing: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceIdStandard: process.env.STRIPE_PRICE_ID_STANDARD,
    stripePriceIdPremium: process.env.STRIPE_PRICE_ID_PREMIUM,
    checkoutSuccessUrl:
      process.env.BILLING_CHECKOUT_SUCCESS_URL ?? 'http://localhost:3000/settings?checkout=success',
    checkoutCancelUrl:
      process.env.BILLING_CHECKOUT_CANCEL_URL ?? 'http://localhost:3000/pricing?checkout=cancelled',
    portalReturnUrl: process.env.BILLING_PORTAL_RETURN_URL ?? 'http://localhost:3000/settings',
  },
});
