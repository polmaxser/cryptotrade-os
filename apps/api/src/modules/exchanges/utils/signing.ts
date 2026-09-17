import { createHash, createHmac } from 'node:crypto';

/**
 * Pure signature-construction functions, extracted out of each exchange
 * client's `signedGet` so the exact string-to-sign format (encoding,
 * concatenation order, digest algorithm) is independently unit-testable —
 * these are the one place a typo would silently break auth against a real
 * account, which unit tests catch far cheaper than a live 401 does.
 */

/** Binance: HMAC-SHA256, hex — message is the full query string (already includes timestamp/recvWindow). */
export function signBinanceQuery(secret: string, queryString: string): string {
  return createHmac('sha256', secret).update(queryString).digest('hex');
}

/** Bybit: HMAC-SHA256, hex — message is timestamp + apiKey + recvWindow + queryString concatenated with no separator. */
export function signBybitRequest(
  secret: string,
  timestamp: string,
  apiKey: string,
  recvWindow: string,
  queryString: string,
): string {
  const payload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** OKX: HMAC-SHA256, base64 — message is ISO timestamp + method + requestPath (path + query string). */
export function signOkxRequest(
  secret: string,
  isoTimestamp: string,
  method: string,
  requestPath: string,
): string {
  const payload = `${isoTimestamp}${method}${requestPath}`;
  return createHmac('sha256', secret).update(payload).digest('base64');
}

/** KuCoin: same string shape as OKX (ms timestamp instead of ISO), base64. */
export function signKucoinRequest(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
): string {
  const payload = `${timestamp}${method}${requestPath}`;
  return createHmac('sha256', secret).update(payload).digest('base64');
}

/** KuCoin also HMAC-signs the passphrase itself (not sent in plaintext). */
export function signKucoinPassphrase(secret: string, passphrase: string): string {
  return createHmac('sha256', secret).update(passphrase).digest('base64');
}

/** Gate.io: HMAC-SHA512, hex — message joins method/path/query/bodyHash/timestamp with newlines; bodyHash is SHA512 of the (always-empty, GET-only) body. */
export function signGateioRequest(
  secret: string,
  method: string,
  fullPath: string,
  queryString: string,
  timestamp: string,
): string {
  const bodyHash = createHash('sha512').update('').digest('hex');
  const payload = [method, fullPath, queryString, bodyHash, timestamp].join('\n');
  return createHmac('sha512', secret).update(payload).digest('hex');
}
