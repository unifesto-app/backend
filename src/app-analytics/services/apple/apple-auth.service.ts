import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AppleAuthConfig, AppleJWT, AppleAPIError } from '../../types/analytics.types';

/**
 * Apple App Store Connect API Authentication Service
 * Handles JWT token generation for API requests
 * 
 * Documentation: https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests
 */
@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);
  private cachedToken: AppleJWT | null = null;

  constructor() {}

  /**
   * Generate JWT token for Apple App Store Connect API
   */
  async generateToken(config: AppleAuthConfig): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (this.cachedToken && this.cachedToken.expiresAt > new Date()) {
        this.logger.debug('Using cached Apple JWT token');
        return this.cachedToken.token;
      }

      // Generate new token
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 20 * 60; // 20 minutes (max allowed by Apple)

      const payload = {
        iss: config.issuerId,
        iat: now,
        exp: now + expiresIn,
        aud: 'appstoreconnect-v1',
        bid: config.bundleId,
      };

      const header = {
        alg: 'ES256',
        kid: config.keyId,
        typ: 'JWT',
      };

      const token = jwt.sign(payload, config.privateKey, {
        algorithm: 'ES256',
        header,
      });

      // Cache the token
      this.cachedToken = {
        token,
        expiresAt: new Date((now + expiresIn - 60) * 1000), // Refresh 1 minute before expiry
      };

      this.logger.log('Generated new Apple JWT token');
      return token;
    } catch (error) {
      this.logger.error(`Failed to generate Apple JWT token: ${error.message}`);
      throw new AppleAPIError('Failed to generate authentication token', 'AUTH_ERROR', error);
    }
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(config: AppleAuthConfig): Promise<Record<string, string>> {
    const token = await this.generateToken(config);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Validate Apple API configuration
   */
  validateConfig(config: AppleAuthConfig): boolean {
    if (!config.keyId || !config.issuerId || !config.privateKey || !config.bundleId) {
      throw new AppleAPIError(
        'Invalid Apple API configuration. Missing required fields.',
        'INVALID_CONFIG',
      );
    }

    // Validate private key format
    if (!config.privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new AppleAPIError(
        'Invalid private key format. Must be in PEM format.',
        'INVALID_KEY_FORMAT',
      );
    }

    return true;
  }

  /**
   * Clear cached token (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cachedToken = null;
    this.logger.debug('Cleared Apple JWT token cache');
  }
}
