"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
async function main() {
    console.log('=== DATABASE BILLING DIAGNOSTIC ===');
    // 1. List all organizations and their billing details
    const orgs = await db_1.prisma.organization.findMany({
        include: {
            trial: true,
            subscriptions: {
                include: {
                    plan: true,
                },
                orderBy: { createdAt: 'desc' },
            },
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 3,
            },
        },
    });
    console.log(`Found ${orgs.length} organizations:`);
    for (const org of orgs) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Organization ID:    ${org.id}`);
        console.log(`Organization Name:  ${org.name}`);
        console.log(`Status:             ${org.status}`);
        // Trial
        if (org.trial) {
            const t = org.trial;
            console.log(`Trial: ID=${t.id}, status=${t.status}, start=${t.startedAt?.toISOString()}, end=${t.expiresAt?.toISOString()}`);
        }
        else {
            console.log(`Trial: None`);
        }
        // Subscriptions
        if (org.subscriptions && org.subscriptions.length > 0) {
            for (const s of org.subscriptions) {
                console.log(`Subscription: ID=${s.id}, plan=${s.plan?.code}, status=${s.status}, isCurrent=${s.isCurrent}, rzpSubId=${s.razorpaySubscriptionId || 'none'}, cancelAtPeriodEnd=${s.cancelAtPeriodEnd}, start=${s.currentPeriodStart?.toISOString()}, end=${s.currentPeriodEnd?.toISOString()}`);
            }
        }
        else {
            console.log(`Subscriptions: None`);
        }
        // Payments
        if (org.payments && org.payments.length > 0) {
            for (const p of org.payments) {
                console.log(`Payment: ID=${p.id}, amount=${p.amount}, status=${p.status}, rzpPayId=${p.razorpayPaymentId}, rzpSubId=${p.razorpaySubscriptionId || 'none'}, paidAt=${p.paidAt?.toISOString()}`);
            }
        }
        else {
            console.log(`Payments: None`);
        }
    }
    // 2. Check Subscription Plans in DB
    const plans = await db_1.prisma.subscriptionPlan.findMany();
    console.log(`\n=== SUBSCRIPTION PLANS IN DATABASE ===`);
    for (const p of plans) {
        console.log(`Plan: code=${p.code}, name=${p.name}, amount=${p.amount} paise, rzpPlanId=${p.razorpayPlanId || 'none'}, isActive=${p.isActive}`);
    }
    // 3. Global table counts
    console.log(`\n=== GLOBAL TABLE COUNTS ===`);
    console.log(`Total Trials in DB:        ${await db_1.prisma.trial.count()}`);
    console.log(`Total Subscriptions in DB: ${await db_1.prisma.subscription.count()}`);
    console.log(`Total Payments in DB:      ${await db_1.prisma.payment.count()}`);
    console.log(`Total Entitlements in DB:  ${await db_1.prisma.entitlement.count()}`);
}
main()
    .catch((err) => {
    console.error('Diagnostic error:', err);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});
