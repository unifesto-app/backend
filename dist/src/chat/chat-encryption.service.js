"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let ChatEncryptionService = class ChatEncryptionService {
    key;
    algorithm = 'aes-256-gcm';
    onModuleInit() {
        const keyB64 = process.env.CHAT_ENCRYPTION_KEY;
        if (!keyB64) {
            throw new Error('CHAT_ENCRYPTION_KEY env var is not set. Generate one with: ' +
                `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`);
        }
        this.key = Buffer.from(keyB64, 'base64');
        if (this.key.length !== 32) {
            throw new Error('CHAT_ENCRYPTION_KEY must decode to exactly 32 bytes.');
        }
    }
    encrypt(plaintext) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return { ciphertext, iv, authTag };
    }
    decrypt(ciphertext, iv, authTag) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        const plaintext = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return plaintext.toString('utf8');
    }
};
exports.ChatEncryptionService = ChatEncryptionService;
exports.ChatEncryptionService = ChatEncryptionService = __decorate([
    (0, common_1.Injectable)()
], ChatEncryptionService);
//# sourceMappingURL=chat-encryption.service.js.map