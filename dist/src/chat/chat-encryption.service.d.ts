import { OnModuleInit } from '@nestjs/common';
export declare class ChatEncryptionService implements OnModuleInit {
    private key;
    private readonly algorithm;
    onModuleInit(): void;
    encrypt(plaintext: string): {
        ciphertext: Buffer;
        iv: Buffer;
        authTag: Buffer;
    };
    decrypt(ciphertext: Buffer, iv: Buffer, authTag: Buffer): string;
}
