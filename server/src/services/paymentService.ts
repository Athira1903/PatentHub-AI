import { prisma } from '../config/db';

export interface RecordPaymentInput {
  organizationId: string;
  subscriptionId?: string | null;
  amount: number;
  currency?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  razorpaySubscriptionId?: string | null;
  razorpaySignature?: string | null;
  paymentMethod?: string | null;
  paidAt?: Date | null;
  failureReason?: string | null;
}

export class PaymentService {
  /**
   * Idempotent payment recording.
   * If razorpayPaymentId is provided and already exists, it updates or returns the existing record.
   */
  public static async recordPayment(input: RecordPaymentInput) {
    if (input.razorpayPaymentId) {
      const existing = await prisma.payment.findUnique({
        where: { razorpayPaymentId: input.razorpayPaymentId },
      });

      if (existing) {
        // If already recorded, return without creating duplicate
        return existing;
      }
    }

    return await prisma.payment.create({
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
  public static async getOrganizationPayments(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    if (!organizationId) {
      return { payments: [], total: 0 };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({
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
