import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpData>();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 5;

  constructor(private readonly configService: ConfigService) {
    // Clean up expired OTPs every 5 minutes
    setInterval(() => this.cleanupExpiredOtps(), 5 * 60 * 1000);
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOtp(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }

  /**
   * Store OTP for email/phone
   */
  storeOtp(identifier: string, otp: string): void {
    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;
    
    this.otpStore.set(identifier, {
      otp,
      expiresAt,
      attempts: 0,
    });

    this.logger.log(`OTP stored for ${identifier}, expires at ${new Date(expiresAt).toISOString()}`);
  }

  /**
   * Verify OTP
   */
  verifyOtp(identifier: string, otp: string): boolean {
    const data = this.otpStore.get(identifier);

    if (!data) {
      this.logger.warn(`No OTP found for ${identifier}`);
      return false;
    }

    // Check expiry
    if (Date.now() > data.expiresAt) {
      this.logger.warn(`OTP expired for ${identifier}`);
      this.otpStore.delete(identifier);
      return false;
    }

    // Check attempts
    if (data.attempts >= this.MAX_ATTEMPTS) {
      this.logger.warn(`Max attempts reached for ${identifier}`);
      this.otpStore.delete(identifier);
      return false;
    }

    // Increment attempts
    data.attempts++;

    // Verify OTP
    if (data.otp === otp) {
      this.logger.log(`OTP verified successfully for ${identifier}`);
      this.otpStore.delete(identifier);
      return true;
    }

    this.logger.warn(`Invalid OTP attempt ${data.attempts}/${this.MAX_ATTEMPTS} for ${identifier}`);
    return false;
  }

  /**
   * Check if OTP exists and is valid
   */
  hasValidOtp(identifier: string): boolean {
    const data = this.otpStore.get(identifier);
    
    if (!data) {
      return false;
    }

    if (Date.now() > data.expiresAt) {
      this.otpStore.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Delete OTP
   */
  deleteOtp(identifier: string): void {
    this.otpStore.delete(identifier);
  }

  /**
   * Clean up expired OTPs
   */
  private cleanupExpiredOtps(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(identifier);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired OTPs`);
    }
  }

  /**
   * Get OTP stats (for debugging)
   */
  getStats(): { total: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const data of this.otpStore.values()) {
      if (now > data.expiresAt) {
        expired++;
      }
    }

    return {
      total: this.otpStore.size,
      expired,
    };
  }
}
