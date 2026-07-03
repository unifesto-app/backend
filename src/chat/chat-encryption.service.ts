import { Injectable, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Encrypts/decrypts chat message bodies at rest with AES-256-GCM.
 *
 * Key source: process.env.CHAT_ENCRYPTION_KEY — a base64-encoded 32-byte key.
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * For production, consider moving the key into AWS KMS / Secrets Manager
 * instead of a plain env var — this is a drop-in placeholder to get you
 * running quickly. Swap `getKey()` for a KMS decrypt call later without
 * touching any other file.
 */
@Injectable()
export class ChatEncryptionService implements OnModuleInit {
  private key: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  onModuleInit() {
    const keyB64 = process.env.CHAT_ENCRYPTION_KEY;
    if (!keyB64) {
      throw new Error(
        'CHAT_ENCRYPTION_KEY env var is not set. Generate one with: ' +
          `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
      );
    }
    this.key = Buffer.from(keyB64, 'base64');
    if (this.key.length !== 32) {
      throw new Error('CHAT_ENCRYPTION_KEY must decode to exactly 32 bytes.');
    }
  }

  encrypt(plaintext: string): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = crypto.randomBytes(12); // 96-bit IV, standard for GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return { ciphertext, iv, authTag };
  }

  decrypt(ciphertext: Buffer, iv: Buffer, authTag: Buffer): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
