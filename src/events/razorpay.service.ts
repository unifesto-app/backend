import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: Razorpay;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      this.logger.warn('Razorpay credentials not configured');
    } else {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      this.logger.log('Razorpay service initialized');
    }
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(amount: number, currency: string, receiptId: string, notes?: any) {
    try {
      if (!this.razorpay) {
        throw new BadRequestException('Razorpay not configured');
      }

      // Razorpay expects amount in smallest currency unit (paise for INR)
      const amountInPaise = Math.round(amount * 100);

      const options = {
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: receiptId,
        notes: notes || {},
      };

      const order = await this.razorpay.orders.create(options);
      this.logger.log(`Razorpay order created: ${order.id}`);

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      this.logger.error(`Error creating Razorpay order: ${error.message}`);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    try {
      if (!this.razorpay) {
        throw new BadRequestException('Razorpay not configured');
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new BadRequestException('Razorpay key secret not configured');
      }

      const body = orderId + '|' + paymentId;
      
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === signature;
      
      if (isValid) {
        this.logger.log(`Payment signature verified for payment: ${paymentId}`);
      } else {
        this.logger.warn(`Invalid payment signature for payment: ${paymentId}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying payment signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async getPaymentDetails(paymentId: string) {
    try {
      if (!this.razorpay) {
        throw new BadRequestException('Razorpay not configured');
      }

      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      this.logger.error(`Error fetching payment details: ${error.message}`);
      throw new BadRequestException('Failed to fetch payment details');
    }
  }

  /**
   * Create a refund
   */
  async createRefund(paymentId: string, amount?: number, notes?: any) {
    try {
      if (!this.razorpay) {
        throw new BadRequestException('Razorpay not configured');
      }

      const options: any = {
        notes: notes || {},
      };

      if (amount) {
        options.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, options);
      this.logger.log(`Refund created: ${refund.id} for payment: ${paymentId}`);

      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`);
      throw new BadRequestException('Failed to create refund');
    }
  }

  /**
   * Get Razorpay key ID for client-side integration
   */
  getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || '';
  }
}
