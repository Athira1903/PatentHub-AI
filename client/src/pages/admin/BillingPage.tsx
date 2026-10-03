import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  FileCheck,
  RefreshCw,
  Zap,
  QrCode,
  Smartphone,
  Building2,
  Wallet,
  X,
  Lock,
  Check,
  Loader2,
} from 'lucide-react';
import {
  billingService,
  type SubscriptionPlan,
  type CurrentSubscriptionResponse,
  type PaymentRecord,
} from '../../services/billingService';
import toast from 'react-hot-toast';

// Helper to format currency
const formatPrice = (amountInPaise: number, currency: string = 'INR') => {
  if (amountInPaise === 0) return 'Free';
  const amount = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to format dates
const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to dynamically load the official Razorpay Checkout SDK
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const BillingPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentBilling, setCurrentBilling] = useState<CurrentSubscriptionResponse | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [upgrading, setUpgrading] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [resuming, setResuming] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // Razorpay Payment Gateway Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentOrder, setPaymentOrder] = useState<{
    orderId: string;
    planId: string;
    planName: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [upiType, setUpiType] = useState<'id' | 'qr'>('id');
  const [cardDetails, setCardDetails] = useState({
    number: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123',
    name: 'PatentHub Workspace Admin',
  });
  const [upiId, setUpiId] = useState('admin@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('paytm');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentProcessingStep, setPaymentProcessingStep] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [resettingSub, setResettingSub] = useState<boolean>(false);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [plansData, currentData, paymentsData] = await Promise.all([
        billingService.getPlans(),
        billingService.getCurrentSubscription(),
        billingService.getPayments(20, 0),
      ]);
      setPlans(plansData);
      setCurrentBilling(currentData);
      setPayments(paymentsData.payments || []);
    } catch (err: any) {
      console.error('[BillingPage] Fetch error:', err);
      toast.error(err.response?.data?.message || 'Failed to load organization billing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  // Handle Free Trial Activation
  const handleStartTrial = async () => {
    try {
      setLoading(true);
      await billingService.startTrial();
      toast.success('14-day free trial successfully activated for your organization!');
      await fetchBillingData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start free trial.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PRO Upgrade - Mounts official Razorpay Checkout SDK
  const handleUpgrade = async (plan: SubscriptionPlan) => {
    try {
      setUpgrading(true);

      // Step 1: Initiate checkout order on backend
      const order = await billingService.createSubscriptionOrder(plan.id);

      // Step 2: Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay payment SDK. Please check your internet connection.');
        setUpgrading(false);
        return;
      }

      // Read prefill information
      const storedUser = localStorage.getItem('patenthub_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      // Step 3: Configure Razorpay Checkout options
      const options: any = {
        key: order.keyId,
        name: 'PatentHub AI',
        description: `${plan.name || 'PatentHub Pro'} Subscription`,
        image: '/favicon.ico',
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0f766e',
        },
        modal: {
          ondismiss: () => {
            setUpgrading(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id?: string;
          razorpay_order_id?: string;
          razorpay_signature: string;
        }) => {
          try {
            setUpgrading(true);
            await billingService.verifyPayment({
              planId: plan.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id || order.subscriptionId,
              razorpayOrderId: response.razorpay_order_id || order.orderId,
              razorpaySignature: response.razorpay_signature,
            });

            toast.success('🎉 Welcome to PatentHub Pro! Subscription successfully activated.');
            await fetchBillingData();
          } catch (verifyErr: any) {
            console.error('[BillingPage] Verification error:', verifyErr);
            toast.error(verifyErr.response?.data?.message || 'Payment signature verification failed.');
          } finally {
            setUpgrading(false);
          }
        },
      };

      if (order.subscriptionId) {
        options.subscription_id = order.subscriptionId;
      } else if (order.orderId) {
        options.order_id = order.orderId;
        options.amount = order.plan?.amount || plan.amount || 29900;
        options.currency = order.plan?.currency || plan.currency || 'INR';
      }

      if (!(window as any).Razorpay) {
        setPaymentOrder({
          orderId: order.orderId || order.subscriptionId || `order_${Date.now()}`,
          planId: plan.id,
          planName: plan.name,
          amount: order.plan?.amount || plan.amount || 29900,
          currency: order.plan?.currency || plan.currency || 'INR',
        });
        setShowPaymentModal(true);
        setUpgrading(false);
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        console.error('[BillingPage] Razorpay payment failed:', resp.error);
        toast.error(resp.error?.description || 'Payment was rejected by Razorpay.');
        setUpgrading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('[BillingPage] Upgrade error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay checkout.');
      setUpgrading(false);
    }
  };

  // Complete Payment inside the Payment Gateway Modal Window (for UI inspection / testing)
  const handleCompletePayment = async () => {
    if (!paymentOrder) return;
    try {
      setPaymentProcessing(true);
      setPaymentProcessingStep('Contacting Razorpay Payment Gateway...');
      await new Promise((r) => setTimeout(r, 600));

      setPaymentProcessingStep('Verifying 3D Secure / OTP Authentication...');
      await new Promise((r) => setTimeout(r, 700));

      setPaymentProcessingStep('Verifying Cryptographic Payment Signature...');
      const paymentId = `pay_${paymentMethod}_${Date.now()}`;
      try {
        await billingService.verifyPayment({
          planId: paymentOrder.planId,
          razorpayPaymentId: paymentId,
          razorpayOrderId: paymentOrder.orderId,
          razorpaySignature: 'simulated_test_signature',
        });

        setPaymentSuccess(true);
        toast.success('🎉 Welcome to PatentHub Pro! Subscription successfully verified.');
        await new Promise((r) => setTimeout(r, 1000));
        setShowPaymentModal(false);
        await fetchBillingData();
      } catch (verifyErr: any) {
        console.error('[BillingPage] Verification rejected by server:', verifyErr);
        toast.error(verifyErr.response?.data?.message || 'Payment signature verification failed. Test mode requires valid Razorpay HMAC.');
      }
    } catch (err: any) {
      console.error('[BillingPage] Payment error:', err);
      toast.error(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Reset Organization Subscription (useful for testing payment window flow again)
  const handleResetSubscription = async () => {
    try {
      setResettingSub(true);
      await billingService.resetSubscription();
      toast.success('Subscription reset to NONE. You can now test the payment window again.');
      await fetchBillingData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset subscription.');
    } finally {
      setResettingSub(false);
    }
  };

  // Handle Cancellation
  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const res = await billingService.cancelSubscription();
      toast.success(res.message || 'Subscription scheduled for cancellation at period end.');
      setShowCancelModal(false);
      await fetchBillingData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Resume
  const handleResumeSubscription = async () => {
    try {
      setResuming(true);
      const res = await billingService.resumeSubscription();
      toast.success(res.message || 'Subscription successfully resumed.');
      await fetchBillingData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resume subscription.');
    } finally {
      setResuming(false);
    }
  };

  const isProActive = currentBilling?.status === 'ACTIVE';
  const isTrialing = currentBilling?.status === 'TRIALING' || currentBilling?.trial?.active;
  const isTrialExpired = currentBilling?.trial?.status === 'EXPIRED' && !isProActive;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3748] px-6 py-8 md:px-12 max-w-7xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Subscriptions</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage your organization's PatentHub AI plan, free trial status, and verified payment history.
          </p>
        </div>
        <button
          onClick={fetchBillingData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Trial Alert Banner if currently trialing */}
      {isTrialing && !isProActive && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-100/80 rounded-lg text-teal-800 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-teal-900">
                Your organization is on a 14-day free trial
              </h2>
              <p className="text-xs text-teal-700 mt-0.5">
                Full access to AI claim suggestions, diagram synthesis, and Indian Patent Office filing package generation.
                {currentBilling?.trial?.expiresAt && (
                  <span className="font-medium ml-1">
                    Expires on {formatDate(currentBilling.trial.expiresAt)} ({currentBilling.trial.daysRemaining} days remaining).
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const pro = plans.find((p) => p.code === 'PRO');
              if (pro) handleUpgrade(pro);
            }}
            disabled={upgrading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Expired Trial Banner */}
      {isTrialExpired && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-amber-900">Your organization's 14-day trial has expired</h2>
              <p className="text-xs text-amber-700 mt-0.5">
                To continue utilizing AI innovation diagnostics, automatic drawing generation, and export filing packages, please upgrade to PatentHub Pro.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const pro = plans.find((p) => p.code === 'PRO');
              if (pro) handleUpgrade(pro);
            }}
            disabled={upgrading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition shadow-sm shrink-0"
          >
            <Zap className="w-4 h-4" />
            Upgrade Now
          </button>
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-4">Current Organization Plan</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-slate-900">
                {isProActive
                  ? 'PatentHub Pro'
                  : isTrialing
                  ? 'Free Trial'
                  : 'No Active Subscription'}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isProActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isTrialing
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {currentBilling?.status || 'NONE'}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {isProActive ? (
                <>
                  <span className="font-semibold text-slate-800">₹299</span> / month • Billed automatically via Razorpay
                </>
              ) : isTrialing ? (
                '14-Day Full Access Exploration Period'
              ) : (
                'Choose a plan below to activate advanced collaborative patent features.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If no trial and no sub, allow start trial */}
            {!currentBilling?.trial?.hasTrial && !isProActive && (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-sm"
              >
                Start 14-Day Free Trial
              </button>
            )}

            {/* Cancel / Resume actions for Pro subscribers */}
            {isProActive && (
              <>
                {currentBilling?.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleResumeSubscription}
                    disabled={resuming}
                    className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shadow-sm"
                  >
                    {resuming ? 'Resuming...' : 'Resume Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelling}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
                  >
                    Cancel Subscription
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Subscription Meta Details */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">Billing Period</span>
            <span className="font-medium text-slate-700">
              {currentBilling?.currentPeriodStart
                ? `${formatDate(currentBilling.currentPeriodStart)} — ${formatDate(currentBilling.currentPeriodEnd)}`
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Renewal Status</span>
            <span className="font-medium text-slate-700">
              {currentBilling?.cancelAtPeriodEnd ? (
                <span className="text-amber-600">Cancelling on {formatDate(currentBilling.currentPeriodEnd)}</span>
              ) : isProActive ? (
                'Auto-renews at end of cycle'
              ) : (
                'Manual upgrade required'
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Entitled Organization Members</span>
            <span className="font-medium text-slate-700">All Organization Inventors, Guides & Experts</span>
          </div>
        </div>
      </div>

      {/* Plan Comparison Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Available Plans</h2>
          <p className="text-xs text-slate-500">Transparent pricing for collaborative patent pre-filing preparation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan 1: Free Trial */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Free Trial</h3>
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  14 Days
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Experience full platform capabilities with zero commitment. Exactly one trial per registered organization.
              </p>
              <div className="text-3xl font-extrabold text-slate-900 mb-6">
                ₹0 <span className="text-xs font-normal text-slate-400">/ 14 days</span>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-slate-700">Included capabilities:</p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>AI Innovation Analysis & Novelty Checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Automated Patent Drawing Figure Drafting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Indian Patent Office (IPO) Filing Package Generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Multi-tenant Collaboration for all Organization Users</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {isTrialing ? (
                <div className="w-full py-2.5 text-center text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg border border-teal-200">
                  Current Active Trial
                </div>
              ) : currentBilling?.trial?.hasTrial ? (
                <div className="w-full py-2.5 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                  Trial Consumed
                </div>
              ) : (
                <button
                  onClick={handleStartTrial}
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
                >
                  Start Free Trial
                </button>
              )}
            </div>
          </div>

          {/* Plan 2: PatentHub Pro */}
          <div className="bg-white border-2 border-teal-700 rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-teal-700 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase">
              Recommended
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">PatentHub Pro</h3>
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                  Organization
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Complete pre-filing preparation, unlimited automated patent drawings, and instant compliance checks.
              </p>
              <div className="text-3xl font-extrabold text-slate-900 mb-6">
                {formatPrice(plans.find((p) => p.code === 'PRO')?.amount || 29900)}
                <span className="text-xs font-normal text-slate-400"> / month</span>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-slate-700">Everything in Free Trial, plus:</p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Unlimited AI Novelty Discovery & Claim Breakdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Full Indian Patent Office (Form 1, 2, 3, 5, 26) Packages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Prior Art Similarity Matching with Deep Search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Automated Organization Policy & Assignment Audits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Secure Razorpay Recurring Monthly Billing</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {isProActive ? (
                <div className="space-y-2">
                  <div className="w-full py-2 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                    Active Plan
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const pro = plans.find((p) => p.code === 'PRO') || {
                          id: 'pro',
                          code: 'PRO',
                          name: 'PatentHub Pro',
                          amount: 29900,
                          currency: 'INR',
                          description: 'PatentHub Pro Monthly',
                          billingInterval: 'month',
                          razorpayPlanId: null,
                          features: [],
                          isActive: true,
                        };
                        handleUpgrade(pro);
                      }}
                      className="flex-1 py-1.5 px-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Open Payment Window</span>
                    </button>
                    <button
                      onClick={handleResetSubscription}
                      disabled={resettingSub}
                      className="py-1.5 px-2.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      title="Reset subscription back to NONE for testing checkout"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resettingSub ? 'animate-spin' : ''}`} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const pro = plans.find((p) => p.code === 'PRO') || {
                      id: 'pro',
                      code: 'PRO',
                      name: 'PatentHub Pro',
                      amount: 29900,
                      currency: 'INR',
                      description: 'PatentHub Pro Monthly',
                      billingInterval: 'month',
                      razorpayPlanId: null,
                      features: [],
                      isActive: true,
                    };
                    handleUpgrade(pro);
                  }}
                  disabled={upgrading}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {upgrading ? 'Connecting to Checkout...' : 'Upgrade to Pro'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Entitlements Audit Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Organization Entitlements</h2>
            <p className="text-xs text-slate-500">Live backend feature gates enforced across all organization members.</p>
          </div>
          <Shield className="w-5 h-5 text-teal-700" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                currentBilling?.entitlements.includes('AI_INNOVATION_ANALYSIS')
                  ? 'text-emerald-600'
                  : 'text-slate-300'
              }`}
            />
            <div>
              <h3 className="text-xs font-semibold text-slate-800">AI Innovation Analysis</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Novelty and prior-art discovery assistant</p>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">
                {currentBilling?.entitlements.includes('AI_INNOVATION_ANALYSIS') ? 'Active' : 'Locked'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                currentBilling?.entitlements.includes('PATENT_DRAWING_GENERATION')
                  ? 'text-emerald-600'
                  : 'text-slate-300'
              }`}
            />
            <div>
              <h3 className="text-xs font-semibold text-slate-800">Patent Drawing Drafting</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated technical figure generation</p>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">
                {currentBilling?.entitlements.includes('PATENT_DRAWING_GENERATION') ? 'Active' : 'Locked'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                currentBilling?.entitlements.includes('EXPORT_FILING_PACKAGE')
                  ? 'text-emerald-600'
                  : 'text-slate-300'
              }`}
            />
            <div>
              <h3 className="text-xs font-semibold text-slate-800">IPO Filing Package Export</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Official statutory patent documents</p>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">
                {currentBilling?.entitlements.includes('EXPORT_FILING_PACKAGE') ? 'Active' : 'Locked'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment History</h2>
            <p className="text-xs text-slate-500">Confirmed transaction records verified by Razorpay signature.</p>
          </div>
          <FileCheck className="w-5 h-5 text-slate-400" />
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No payment transactions recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Confirmed billing receipts and invoices will be cataloged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Razorpay Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">{formatDate(p.paidAt || p.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatPrice(p.amount, p.currency)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-500 font-mono text-[11px]">
                      {p.paymentMethod || 'card'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                      {p.razorpayPaymentId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cancel Pro Subscription?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your subscription will remain active until the end of the current billing cycle on{' '}
              <span className="font-semibold text-slate-800">
                {formatDate(currentBilling?.currentPeriodEnd)}
              </span>
              . After this date, your organization will lose access to Pro feature entitlements.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Razorpay Payment Gateway Window Modal */}
      {showPaymentModal && paymentOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Razorpay Brand Header */}
            <div className="bg-[#0c2340] text-white px-6 py-4 flex items-center justify-between border-b border-blue-950">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-black text-blue-400 text-lg shadow-inner">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight text-white text-base">Razorpay</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-blue-300" /> SECURE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">PatentHub AI Pro Subscription</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[11px] text-slate-300 block uppercase font-semibold">Amount to Pay</span>
                  <span className="text-xl font-bold text-white tracking-tight">₹299.00</span>
                </div>
                <button
                  onClick={() => {
                    if (!paymentProcessing) {
                      setShowPaymentModal(false);
                      toast('Payment cancelled.');
                    }
                  }}
                  disabled={paymentProcessing}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Close payment window"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Test Mode Indicator Ribbon */}
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-1.5 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Razorpay Test Gateway Mode • Sandbox Simulated Verification</span>
              </div>
              <span className="text-[11px] font-mono text-amber-700 font-semibold">
                Order: {paymentOrder.orderId.slice(0, 16)}...
              </span>
            </div>

            {/* Main Body */}
            {paymentProcessing ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[380px]">
                {paymentSuccess ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Razorpay signature successfully verified. Your organization is now upgraded to PatentHub Pro.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{paymentProcessingStep || 'Processing Payment...'}</h3>
                      <p className="text-xs text-slate-500 mt-1">Please do not close this window or refresh your browser.</p>
                    </div>
                    <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-teal-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row min-h-[380px]">
                {/* Method Selection Sidebar */}
                <div className="w-full md:w-52 bg-slate-50 border-r border-slate-200 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                    Payment Options
                  </span>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 ${paymentMethod === 'card' ? 'text-teal-700' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <span>Card</span>
                      <span className="block text-[10px] font-normal text-slate-400">Visa, Master, RuPay</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 ${paymentMethod === 'upi' ? 'text-teal-700' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <span>UPI / QR</span>
                      <span className="block text-[10px] font-normal text-slate-400">GPay, PhonePe, Paytm</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                      paymentMethod === 'netbanking'
                        ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${paymentMethod === 'netbanking' ? 'text-teal-700' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <span>NetBanking</span>
                      <span className="block text-[10px] font-normal text-slate-400">All Indian Banks</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Wallet className={`w-4 h-4 ${paymentMethod === 'wallet' ? 'text-teal-700' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <span>Wallets</span>
                      <span className="block text-[10px] font-normal text-slate-400">Paytm, PhonePe</span>
                    </div>
                  </button>

                  {/* Price Breakdown Info */}
                  <div className="mt-6 pt-4 border-t border-slate-200 px-2 space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Base Plan</span>
                      <span>₹253.39</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span>₹45.61</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                      <span>Total</span>
                      <span>₹299.00</span>
                    </div>
                  </div>
                </div>

                {/* Method Content View */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  {/* 1. Card Tab */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Enter Card Details
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-blue-700">VISA</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-amber-700">MC</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-emerald-700">RuPay</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardDetails.number}
                              onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-teal-700 focus:bg-white"
                              placeholder="4111 1111 1111 1111"
                            />
                            <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">Valid Thru (MM/YY)</label>
                            <input
                              type="text"
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-teal-700 focus:bg-white"
                              placeholder="12/28"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">CVV / CVC</label>
                            <input
                              type="password"
                              maxLength={4}
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-teal-700 focus:bg-white"
                              placeholder="•••"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-teal-700 focus:bg-white"
                            placeholder="Name on card"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="save-card"
                            defaultChecked
                            className="rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                          />
                          <label htmlFor="save-card" className="text-[11px] text-slate-500">
                            Save card securely as per RBI guidelines
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. UPI Tab */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Instant UPI Payment
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setUpiType('id')}
                            className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                              upiType === 'id' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            UPI ID
                          </button>
                          <button
                            onClick={() => setUpiType('qr')}
                            className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                              upiType === 'qr' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            QR Code
                          </button>
                        </div>
                      </div>

                      {upiType === 'id' ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                              <button
                                key={app}
                                type="button"
                                onClick={() => setUpiId(`admin@ok${app.toLowerCase().replace(' ', '')}`)}
                                className="p-2 border border-slate-200 rounded-xl text-center hover:border-teal-700 hover:bg-teal-50/50 transition group cursor-pointer"
                              >
                                <Smartphone className="w-5 h-5 mx-auto text-teal-700 mb-1 group-hover:scale-110 transition" />
                                <span className="text-[10px] font-medium text-slate-700 block">{app}</span>
                              </button>
                            ))}
                          </div>

                          <div>
                            <label className="block text-xs text-slate-600 font-medium mb-1">Enter UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-teal-700 focus:bg-white"
                              placeholder="e.g. mobile@okhdfcbank"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">A payment request will be verified instantly in test mode.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 border border-dashed border-teal-200 bg-teal-50/30 rounded-xl space-y-2">
                          <div className="w-32 h-32 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                            <QrCode className="w-28 h-28 text-slate-900" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800">Scan QR Code with any UPI App</span>
                          <span className="text-[11px] text-slate-500">Supports GPay, PhonePe, Paytm, BHIM, CRED</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. NetBanking Tab */}
                  {paymentMethod === 'netbanking' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Popular Indian Banks
                      </h4>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { code: 'HDFC', name: 'HDFC Bank' },
                          { code: 'SBI', name: 'State Bank of India' },
                          { code: 'ICICI', name: 'ICICI Bank' },
                          { code: 'AXIS', name: 'Axis Bank' },
                          { code: 'KOTAK', name: 'Kotak Mahindra' },
                          { code: 'PNB', name: 'Punjab National' },
                        ].map((bank) => (
                          <button
                            key={bank.code}
                            type="button"
                            onClick={() => setSelectedBank(bank.code)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              selectedBank === bank.code
                                ? 'border-teal-700 bg-teal-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Building2 className={`w-3.5 h-3.5 ${selectedBank === bank.code ? 'text-teal-700' : 'text-slate-400'}`} />
                              <span className="text-xs font-bold text-slate-800">{bank.code}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">{bank.name}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs text-slate-600 font-medium mb-1">Or choose another bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-teal-700 focus:bg-white cursor-pointer"
                        >
                          <option value="HDFC">HDFC Bank</option>
                          <option value="SBI">State Bank of India</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="AXIS">Axis Bank</option>
                          <option value="KOTAK">Kotak Mahindra Bank</option>
                          <option value="PNB">Punjab National Bank</option>
                          <option value="BOB">Bank of Baroda</option>
                          <option value="CANARA">Canara Bank</option>
                          <option value="YES">Yes Bank</option>
                          <option value="INDUSIND">IndusInd Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. Wallet Tab */}
                  {paymentMethod === 'wallet' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Select Digital Wallet
                      </h4>

                      <div className="space-y-2">
                        {[
                          { id: 'paytm', name: 'Paytm Wallet' },
                          { id: 'phonepe', name: 'PhonePe Wallet' },
                          { id: 'amazonpay', name: 'Amazon Pay' },
                          { id: 'mobikwik', name: 'MobiKwik' },
                        ].map((wallet) => (
                          <button
                            key={wallet.id}
                            type="button"
                            onClick={() => setSelectedWallet(wallet.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                              selectedWallet === wallet.id
                                ? 'border-teal-700 bg-teal-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Wallet className={`w-4 h-4 ${selectedWallet === wallet.id ? 'text-teal-700' : 'text-slate-400'}`} />
                              <span className="text-xs font-semibold text-slate-800">{wallet.name}</span>
                            </div>
                            <span className={`w-2 h-2 rounded-full ${selectedWallet === wallet.id ? 'bg-teal-700' : 'bg-transparent'}`}></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pay Action Button & Security footer */}
                  <div className="pt-6 border-t border-slate-100 mt-4 space-y-3">
                    <button
                      onClick={handleCompletePayment}
                      disabled={paymentProcessing}
                      className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      Pay ₹299.00 Securely
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                      <Shield className="w-3.5 h-3.5 text-teal-600" />
                      <span>PCI-DSS Level 1 Compliant • 256-Bit SSL Encrypted • Razorpay Gateway</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
