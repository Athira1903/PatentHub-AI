import crypto from 'crypto';
import Razorpay from 'razorpay';

export interface RazorpaySubscriptionResponse {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  charge_at?: number;
  short_url?: string;
  total_count?: number;
}

export class RazorpayService {
  private static instance: any = null;

  public static isConfigured(): boolean {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    return !!(keyId && keySecret && keyId.trim() !== '' && keySecret.trim() !== '');
  }

  public static getPublicKey(): string | null {
    return process.env.RAZORPAY_KEY_ID || null;
  }

  private static getClient(): any {
    if (!this.isConfigured()) {
      throw new Error('Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.');
    }
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
    }
    return this.instance;
  }

  /**
   * Create a recurring subscription on Razorpay
   */
  public static async createSubscription(params: {
    planId: string;
    totalCount?: number;
    customerNotify?: 1 | 0;
    notes?: Record<string, string>;
  }): Promise<RazorpaySubscriptionResponse> {
    const client = this.getClient();
    const payload = {
      plan_id: params.planId,
      total_count: params.totalCount || 12, // 12 monthly cycles default
      customer_notify: params.customerNotify !== undefined ? params.customerNotify : 1,
      notes: params.notes || {},
    };

    const response = await client.subscriptions.create(payload);
    return response as RazorpaySubscriptionResponse;
  }

  /**
   * Fetch subscription details from Razorpay
   */
  public static async fetchSubscription(subscriptionId: string): Promise<any> {
    const client = this.getClient();
    return await client.subscriptions.fetch(subscriptionId);
  }

  /**
   * Cancel subscription on Razorpay (cancel_at_cycle_end: 1 or 0)
   */
  public static async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = true
  ): Promise<any> {
    const client = this.getClient();
    return await client.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  }

  /**
   * Create a standard order on Razorpay for one-off charges or checkout fallbacks
   */
  public static async createOrder(params: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    const client = this.getClient();
    return await client.orders.create({
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    });
  }

  /**
   * Verify checkout payment signature
   * For subscriptions: HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
   * For one-off orders: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
   */
  public static verifyPaymentSignature(params: {
    paymentId: string;
    subscriptionId?: string;
    orderId?: string;
    signature: string;
  }): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('RAZORPAY_KEY_SECRET is not configured on the backend.');
    }

    if (!params.signature || !params.paymentId) {
      return false;
    }

    let payload = '';
    const verificationType = params.subscriptionId ? 'SUBSCRIPTION' : (params.orderId ? 'ORDER' : 'UNKNOWN');
    
    console.log('[RazorpayService.verifyPaymentSignature] Signature verification attempt:', {
      verificationType,
      orderIdPresent: Boolean(params.orderId),
      paymentIdPresent: Boolean(params.paymentId),
      subscriptionIdPresent: Boolean(params.subscriptionId),
      signaturePresent: Boolean(params.signature),
      secretConfigured: Boolean(secret && secret.trim() !== ''),
    });

    if (params.subscriptionId) {
      payload = `${params.paymentId}|${params.subscriptionId}`;
    } else if (params.orderId) {
      payload = `${params.orderId}|${params.paymentId}`;
    } else {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const sigBuffer = Buffer.from(params.signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  /**
   * Verify Razorpay Webhook signature
   */
  public static verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured on the backend.');
    }

    if (!rawBody || !signature) {
      return false;
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return Razorpay.validateWebhookSignature(bodyString, signature, secret);
  }
}
