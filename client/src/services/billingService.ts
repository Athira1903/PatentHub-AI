import { api } from './api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  amount: number;
  currency: string;
  billingInterval: string;
  razorpayPlanId: string | null;
  features: string[] | null;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAYMENT_FAILED' | 'NONE';
  isCurrent: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  razorpaySubscriptionId: string | null;
  plan?: SubscriptionPlan;
}

export interface TrialStatus {
  hasTrial: boolean;
  active: boolean;
  daysRemaining: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'NONE';
  startedAt?: string;
  expiresAt?: string;
}

export interface CurrentSubscriptionResponse {
  organizationId: string | null;
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAYMENT_FAILED' | 'NONE';
  trial: TrialStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  razorpaySubscriptionId: string | null;
  entitlements: string[];
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  razorpayPaymentId: string | null;
  razorpaySubscriptionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  total: number;
  limit: number;
  offset: number;
}

export const billingService = {
  // Fetch available subscription plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await api.get('/billing/plans');
    return res.data.plans;
  },

  // Fetch current organization's subscription state
  getCurrentSubscription: async (): Promise<CurrentSubscriptionResponse> => {
    const res = await api.get('/billing/current');
    return res.data;
  },

  // Fetch trial status
  getTrialStatus: async (): Promise<TrialStatus> => {
    const res = await api.get('/billing/trial');
    return res.data;
  },

  // Start 14-day free trial
  startTrial: async () => {
    const res = await api.post('/billing/trial/start');
    return res.data;
  },

  // Initiate Razorpay checkout order for PRO subscription
  createSubscriptionOrder: async (planId: string) => {
    const res = await api.post('/billing/subscription/create', { planId });
    return res.data;
  },

  // Verify payment after Razorpay checkout modal completes
  verifyPayment: async (data: {
    planId: string;
    razorpayPaymentId: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    razorpaySignature: string;
  }) => {
    const res = await api.post('/billing/subscription/verify', data);
    return res.data;
  },

  // Cancel subscription at period end
  cancelSubscription: async () => {
    const res = await api.post('/billing/subscription/cancel');
    return res.data;
  },

  // Resume subscription scheduled for cancellation
  resumeSubscription: async () => {
    const res = await api.post('/billing/subscription/resume');
    return res.data;
  },

  // Fetch payment history
  getPayments: async (limit = 20, offset = 0): Promise<PaymentHistoryResponse> => {
    const res = await api.get('/billing/payments', {
      params: { limit, offset },
    });
    return res.data;
  },

  // Fetch active entitlements
  getEntitlements: async (): Promise<string[]> => {
    const res = await api.get('/billing/entitlements');
    return res.data.entitlements;
  },

  // Reset subscription to NONE (useful for testing checkout flow)
  resetSubscription: async () => {
    const res = await api.post('/billing/subscription/reset');
    return res.data;
  },
};
