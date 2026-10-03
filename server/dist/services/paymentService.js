"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const db_1 = require("../config/db");
class PaymentService {
    /**
     * Idempotent payment recording.
     * If razorpayPaymentId is provided and already exists, it updates or returns the existing record.
     */
    static async recordPayment(input) {
        if (input.razorpayPaymentId) {
            const existing = await db_1.prisma.payment.findUnique({
                where: { razorpayPaymentId: input.razorpayPaymentId },
            });
            if (existing) {
                // If already recorded, return without creating duplicate
                return existing;
            }
        }
        return await db_1.prisma.payment.create({
            data: {
                organizationId: input.organizationId,
                subscriptionId: input.subscriptionId || null,
                amount: input.amount,
                currency: input.currency || 'INR',
                status: input.status,
                razorpayPaymentId: input.razorpayPaymentId || null,
                razorpayOrderId: input.razorpayOrderId || null,
                razorpaySubscriptionId: input.razorpaySubscriptionId || null,
                razorpaySignature: input.razorpaySignature || null,
                paymentMethod: input.paymentMethod || 'card',
                paidAt: input.paidAt || (input.status === 'SUCCESS' ? new Date() : null),
                failureReason: input.failureReason || null,
            },
        });
    }
    /**
     * Retrieve paginated payments for an organization
     */
    static async getOrganizationPayments(organizationId, limit = 20, offset = 0) {
        if (!organizationId) {
            return { payments: [], total: 0 };
        }
        const [payments, total] = await Promise.all([
            db_1.prisma.payment.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            db_1.prisma.payment.count({
                where: { organizationId },
            }),
        ]);
        return {
            payments,
            total,
            limit,
            offset,
        };
    }
}
exports.PaymentService = PaymentService;
