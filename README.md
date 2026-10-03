# PatentHub AI — Intelligent Patent Drafting & Lifecycle Management Platform

PatentHub AI is an enterprise-grade patent intelligence, drafting, review, and filing platform built for universities, research institutions, startups, and patent attorneys. It features multi-role governance (Inventor, Co-Inventor, Faculty Guide, Patent Expert, Organization Admin, and Platform Admin), AI-assisted prior-art and technical similarity analysis, Freedom-to-Operate (FTO) claim charting, Form 2 Complete Specification drafting, and Indian Patent Office (IPO) compliance engines.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v7, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT Authentication, Zod validation
- **Database**: PostgreSQL (Prisma Client)
- **AI Engine**: Google Gemini API with deterministic heuristic fallback engines
- **Document / PDF Generation**: jsPDF, pdf-parse (IPO Forms 1, 2, 3, 5, 18, 26, Filing Packages)
- **Payments / Subscriptions**: Razorpay integration with Free Trial & Pro tiers

---

## 📋 Prerequisites

Before running the application, ensure you have installed:

- **Node.js**: `v18.x` or higher (`v20+` recommended)
- **npm**: `v9.x` or higher
- **PostgreSQL**: Running locally or via a cloud connection string (e.g. Supabase, Neon, AWS RDS)

---

## ⚙️ Environment Configuration

### 1. Backend (`server/.env`)

Ensure the file `server/.env` exists and contains the required configurations:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/patenthub_ai?schema=public"

# Authentication & Security
JWT_SECRET="patenthub_secret_key_change_in_production"
JWT_EXPIRES_IN="7d"

# Google Gemini AI (Optional: deterministic fallback engine operates automatically if offline)
GEMINI_API_KEY="your-google-gemini-api-key"

# Email / Mail Service (Optional in development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="notifications@patenthub.ai"
SMTP_PASS="your_app_password"

# Razorpay Subscriptions (Optional in development)
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Client URL
CLIENT_URL="http://localhost:5173"
```

### 2. Frontend (`client/.env` or default proxy)

By default, the client communicates with the backend at `http://localhost:5000/api`.

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### Step 2: Database Setup & Migration

```bash
cd server

# Validate Prisma schema
npx prisma validate

# Push schema to PostgreSQL database
npx prisma db push

# Generate Prisma Client bindings
npx prisma generate
```

### Step 3: Run the Development Servers

Open two terminal sessions:

#### Terminal 1 — Backend API Server (Port 5000)
```bash
cd server
npm run dev
```
*Health check:* `http://localhost:5000/api/health`

#### Terminal 2 — Frontend Client (Port 5173)
```bash
cd client
npm run dev
```
*Web Application:* `http://localhost:5173`

---

## 🧪 Running Test Suites & Acceptance Audits

All tests use real PostgreSQL database persistence and exercise live API endpoints. Make sure the backend server is running on port 5000 before executing the tests.

```bash
cd server
```

### 1. Master Integration Suite (All 13 Roles & Engines)
Runs the entire master test suite covering all roles, registration isolation, multi-tenancy, and payment workflows:
```bash
npx ts-node test-master-all-roles.ts
```
*Verified Suites:*
1. `test-auth-otp.ts` — Auth OTP Login Suite
2. `test-registration-intact.ts` — Registration Isolation Suite
3. `test-account-registration.ts` — Individual vs Organization Registration
4. `test-inventor-workflow.ts` — Inventor Complete Workflow
5. `test-coinventor-workflow.ts` — Co-Inventor Collaboration Workflow
6. `test-guide-workflow.ts` — Faculty Guide Review Workflow
7. `test-patent-expert-workflow.ts` — Patent Expert Audit Workflow
8. `test-admin-workflow.ts` — Organization Admin Workflow
9. `test-specification-workflow.ts` — Form 2 Complete Specification Suite
10. `test-next-action-engine.ts` — Next Action Engine (30 Scenarios)
11. `test-multitenant-policy.ts` — Multi-Tenant Organization Isolation
12. `test-subscription-razorpay.ts` — Free Trial, Pro & Razorpay
13. `test-platform-admin-complete.ts` — Platform Admin Operations

---

### 2. Next Action Engine Test Suite
Tests the 30-scenario dynamic decision tree for next recommended actions across all stages and roles:
```bash
npx ts-node test-next-action-engine.ts
```

---

### 3. Patent Expert Acceptance Audit (34-Point Audit)
Validates end-to-end Patent Expert capabilities including FTO Claim Charts, Antecedent Basis, Form 2 Specification version diffing, and RBAC lockouts:
```bash
npx ts-node test-patent-expert-acceptance-audit.ts
```

---

### 4. Faculty Guide Acceptance Audit
Validates Guide review, student submission evaluation, mandatory forms clearance, and rejection/approval cycles:
```bash
npx ts-node test-guide-acceptance-audit.ts
```

---

### 5. Inventor Acceptance Audit
Validates full inventor invention lifecycle from idea creation to filing readiness:
```bash
npx ts-node test-inventor-acceptance-audit.ts
```

---

## 📦 Production Build

To verify TypeScript compilation and bundle production assets:

```bash
# Build backend
cd server
npm run build

# Build frontend
cd ../client
npm run build
```

---

## 🏛️ Project Directory Structure

```
PatentHub-AI/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components & studios
│   │   │   ├── claims/         # ClaimsEngineeringStudio
│   │   │   ├── dashboard/      # Role-specific dashboards (Inventor, Guide, Expert)
│   │   │   └── project/        # SpecificationStudio, ProjectReviewCenter, NextActionCard
│   │   ├── pages/              # Routed pages (ProjectDetailsPage, ResearchPage, etc.)
│   │   └── services/           # API clients and HTTP abstractions
│   └── package.json
│
├── server/                     # Express + Prisma Backend
│   ├── prisma/
│   │   └── schema.prisma       # Database schema & models
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, entitlement, and policy guards
│   │   ├── policies/           # Granular ABAC/RBAC authorization policies
│   │   ├── routes/             # Express API routes
│   │   └── services/           # Core business logic (FTO, NextAction, Specification, AI)
│   ├── test-master-all-roles.ts
│   ├── test-next-action-engine.ts
│   ├── test-patent-expert-acceptance-audit.ts
│   └── package.json
│
└── README.md
```

---

## 🛡️ License

Proprietary & Confidential — PatentHub AI Engineering Team.
