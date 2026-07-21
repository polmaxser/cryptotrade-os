import { randomBytes } from 'node:crypto';

import { EncryptionService } from './encryption.service';

function buildService(rawKey: string | undefined): EncryptionService {
  const configService = { get: jest.fn().mockReturnValue(rawKey) } as never;
  return new EncryptionService(configService);
}

describe('EncryptionService', () => {
  const validKey = randomBytes(32).toString('base64');

  it('round-trips a plaintext through encrypt then decrypt', () => {
    const service = buildService(validKey);
    service.onModuleInit();

    const ciphertext = service.encrypt('super-secret-api-key');

    expect(service.decrypt(ciphertext)).toBe('super-secret-api-key');
  });

  it('produces a different ciphertext each time for the same plaintext (random IV)', () => {
    const service = buildService(validKey);
    service.onModuleInit();

    const first = service.encrypt('same-plaintext');
    const second = service.encrypt('same-plaintext');

    expect(first).not.toBe(second);
    expect(service.decrypt(first)).toBe('same-plaintext');
    expect(service.decrypt(second)).toBe('same-plaintext');
  });

  it('rejects a malformed encrypted payload missing its parts', () => {
    const service = buildService(validKey);
    service.onModuleInit();

    expect(() => service.decrypt('not-a-valid-payload')).toThrow('Malformed encrypted payload');
  });

  it('rejects a ciphertext whose auth tag has been tampered with', () => {
    const service = buildService(validKey);
    service.onModuleInit();

    const ciphertext = service.encrypt('super-secret-api-key');
    const [iv, authTag, body] = ciphertext.split('.');
    const tamperedAuthTag = Buffer.from(authTag ?? '', 'base64');
    tamperedAuthTag[0] = (tamperedAuthTag[0] ?? 0) ^ 0xff;
    const tampered = [iv, tamperedAuthTag.toString('base64'), body].join('.');

    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('fails to decrypt with a different key than the one it was encrypted with', () => {
    const serviceA = buildService(validKey);
    serviceA.onModuleInit();
    const serviceB = buildService(randomBytes(32).toString('base64'));
    serviceB.onModuleInit();

    const ciphertext = serviceA.encrypt('super-secret-api-key');

    expect(() => serviceB.decrypt(ciphertext)).toThrow();
  });

  it('refuses to start with no ENCRYPTION_KEY configured', () => {
    const service = buildService(undefined);

    expect(() => service.onModuleInit()).toThrow('ENCRYPTION_KEY is not set');
  });

  it('refuses to start with an ENCRYPTION_KEY of the wrong length', () => {
    const service = buildService(Buffer.from('too-short').toString('base64'));

    expect(() => service.onModuleInit()).toThrow('ENCRYPTION_KEY must decode to exactly 32 bytes');
  });
});
