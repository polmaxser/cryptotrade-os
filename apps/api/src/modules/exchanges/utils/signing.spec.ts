import {
  signBinanceQuery,
  signBybitRequest,
  signGateioRequest,
  signKucoinPassphrase,
  signKucoinRequest,
  signOkxRequest,
} from './signing';

/**
 * Expected values are hand-computed independently of the implementation
 * (Node's `crypto` module run once against fixed fixtures, not copy-pasted
 * from the source) — a regression in algorithm, encoding, or the exact
 * string-to-sign construction breaks these without needing a live 401
 * against a real exchange to notice. Each scheme was already confirmed
 * correct against the real exchanges during earlier live testing; these
 * tests exist to keep it that way.
 */
describe('exchange request signing', () => {
  const secret = 'test-secret';

  it('signs a Binance query string with HMAC-SHA256 hex', () => {
    const queryString = 'symbol=BTCUSDT&timestamp=1700000000000&recvWindow=10000';
    expect(signBinanceQuery(secret, queryString)).toBe(
      '0bd8efe8be4a5108c783ae73c8a414da20c86d51b8744d11674a5ca3ae09a208',
    );
  });

  it('signs a Bybit request (timestamp+apiKey+recvWindow+query) with HMAC-SHA256 hex', () => {
    const signature = signBybitRequest(
      secret,
      '1700000000000',
      'test-api-key',
      '5000',
      'category=linear&symbol=BTCUSDT',
    );
    expect(signature).toBe('184dd5531d8077974f3a400e537b3ec9b117b9915683f889177fe56e8a97f4e9');
  });

  it('signs an OKX request (isoTimestamp+method+requestPath) with HMAC-SHA256 base64', () => {
    const signature = signOkxRequest(
      secret,
      '2026-09-17T00:00:00.000Z',
      'GET',
      '/api/v5/account/bills?limit=100',
    );
    expect(signature).toBe('bu7xyIU3EDBXT4HUEY0Um/OxYxA6RR2cuU98dfsmdwA=');
  });

  it('signs a KuCoin request (msTimestamp+method+requestPath) with HMAC-SHA256 base64', () => {
    const signature = signKucoinRequest(
      secret,
      '1700000000000',
      'GET',
      '/api/v1/fills?tradeType=TRADE',
    );
    expect(signature).toBe('V9fwRaylANG2zkwSw3h8gIyoKWEEUtPnbN9Lol4okAE=');
  });

  it('signs a KuCoin passphrase with HMAC-SHA256 base64', () => {
    expect(signKucoinPassphrase(secret, 'test-passphrase')).toBe(
      'UbgWiL7WdjQOVBl1OLuMgUbTl9VlKFsjFbLedtCDPrY=',
    );
  });

  it('signs a Gate.io request (method/path/query/bodyHash/timestamp joined by newlines) with HMAC-SHA512 hex', () => {
    const signature = signGateioRequest(
      secret,
      'GET',
      '/api/v4/spot/my_trades',
      'currency_pair=BTC_USDT',
      '1700000000',
    );
    expect(signature).toBe(
      '6201e1a104c8591b86a8729ebf0439624c61747f3b168c51b5af873660fc8a0b05d725c61a105d8efe2b19285575f4593b5019a78f3a9d79bf8543a6a2e5f420',
    );
  });

  it('produces different signatures for different secrets (sanity check against a no-op implementation)', () => {
    const a = signBinanceQuery('secret-a', 'symbol=BTCUSDT');
    const b = signBinanceQuery('secret-b', 'symbol=BTCUSDT');
    expect(a).not.toBe(b);
  });
});
