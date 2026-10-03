# PatentHub AI — Backend & Test Suites Guide

This directory contains the Express + Prisma backend API and integration test suites for PatentHub AI.

---

## 🚀 Running the Backend Server

```bash
# 1. Install dependencies
npm install

# 2. Database validation and schema sync
npx prisma validate
npx prisma db push
npx prisma generate

# 3. Start development server (Port 5000)
npm run dev
```

The health check endpoint will be available at:
`http://localhost:5000/api/health`

---

## 🧪 Running Integration & Acceptance Tests

Make sure the backend server is running on port 5000 before running tests.

### Run All 13 Test Suites (Master Integration)
```bash
npx ts-node test-master-all-roles.ts
```

### Run Next Action Engine (30 Scenarios)
```bash
npx ts-node test-next-action-engine.ts
```

### Run Patent Expert Role Acceptance Audit (34 Steps)
```bash
npx ts-node test-patent-expert-acceptance-audit.ts
```

### Run Faculty Guide Acceptance Audit
```bash
npx ts-node test-guide-acceptance-audit.ts
```

### Run Inventor Acceptance Audit
```bash
npx ts-node test-inventor-acceptance-audit.ts
```

### Other Role Suites
```bash
npx ts-node test-auth-otp.ts
npx ts-node test-registration-intact.ts
npx ts-node test-account-registration.ts
npx ts-node test-coinventor-workflow.ts
npx ts-node test-admin-workflow.ts
npx ts-node test-specification-workflow.ts
npx ts-node test-multitenant-policy.ts
npx ts-node test-subscription-razorpay.ts
npx ts-node test-platform-admin-complete.ts
```

---

## 📦 Production Build

```bash
npm run build
```
Compiles TypeScript into `dist/index.js`.
