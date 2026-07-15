import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

/**
 * AES-256-GCM encryption for secrets that must be stored at rest (e.g. exchange
 * API credentials). Fails fast at startup if ENCRYPTION_KEY is missing or the
 * wrong size — storing secrets insecurely, or crashing unpredictably on first
 * use, are both worse than refusing to boot.
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const rawKey = this.configService.get<string>('security.encryptionKey');

    if (!rawKey) {
      throw new Error(
        'ENCRYPTION_KEY is not set — required to store exchange API credentials securely.',
      );
    }

    const key = Buffer.from(rawKey, 'base64');

    if (key.length !== KEY_LENGTH_BYTES) {
      throw new Error(
        `ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH_BYTES} bytes (base64-encoded AES-256 key).`,
      );
    }

    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, ciphertext].map((buf) => buf.toString('base64')).join('.');
  }

  decrypt(encrypted: string): string {
    const [ivB64, authTagB64, ciphertextB64] = encrypted.split('.');

    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new Error('Malformed encrypted payload');
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  }
}
