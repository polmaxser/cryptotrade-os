import { Logger, ServiceUnavailableException } from '@nestjs/common';

const logger = new Logger('ExchangeClient');

/**
 * An exchange's raw error body can contain account/rate-limit details we
 * don't want forwarded verbatim to the client in an HTTP error message —
 * log it server-side for debugging and throw a generic, status-only message
 * instead.
 */
export function exchangeApiError(
  exchangeName: string,
  status: number | string,
  rawBody: string,
): ServiceUnavailableException {
  logger.warn(`${exchangeName} API error (${status}): ${rawBody}`);
  return new ServiceUnavailableException(`${exchangeName} API error (${status})`);
}
