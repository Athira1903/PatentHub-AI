"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
class RazorpayService {
    static instance = null;
    static isConfigured() {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        return !!(keyId && keySecret && keyId.trim() !== '' && keySecret.trim() !== '');
    }
    static getPublicKey() {
        return process.env.RAZORPAY_KEY_ID || null;
    }
    static getClient() {
        if (!this.isConfigured()) {
            throw new Error('Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.');
        }
        if (!this.instance) {
            this.instance = new razorpay_1.default({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
        }
        return this.instance;
    }
    /**
     * Create a recurring subscription on Razorpay
     */
    static async createSubscription(params) {
        const client = this.getClient();
        const payload = {
            plan_id: params.planId,
            total_count: params.totalCount || 12, // 12 monthly cycles default
            customer_notify: params.customerNotify !== undefined ? params.customerNotify : 1,
            notes: params.notes || {},
        };
        const response = await client.subscriptions.create(payload);
        return response;
    }
    /**
     * Fetch subscription details from Razorpay
     */
    static async fetchSubscription(subscriptionId) {
        const client = this.getClient();
        return await client.subscriptions.fetch(subscriptionId);
    }
    /**
     * Cancel subscription on Razorpay (cancel_at_cycle_end: 1 or 0)
     */
    static async cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
        const client = this.getClient();
        return await client.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    }
    /**
     * Create a standard order on Razorpay for one-off charges or checkout fallbacks
     */
    static async createOrder(params) {
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
    static verifyPaymentSignature(params) {
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
        }
        else if (params.orderId) {
            payload = `${params.orderId}|${params.paymentId}`;
        }
        else {
            return false;
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        const sigBuffer = Buffer.from(params.signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }
        return crypto_1.default.timingSafeEqual(sigBuffer, expectedBuffer);
    }
    /**
     * Verify Razorpay Webhook signature
     */
    static verifyWebhookSignature(rawBody, signature) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured on the backend.');
        }
        if (!rawBody || !signature) {
            return false;
        }
        const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
        return razorpay_1.default.validateWebhookSignature(bodyString, signature, secret);
    }
}
exports.RazorpayService = RazorpayService;
