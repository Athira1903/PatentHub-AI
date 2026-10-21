# PatentHub AI — Database Design & Schema Dictionary

This document provides the exhaustive relational database architecture for **PatentHub AI**. It details all **43 database entities** (Prisma ORM models) grouped across 9 subsystems.

## 1. Master Table of Database Entities (43 Tables)

| # | Table / Entity Name | Functional Module | Primary Purpose |
| :- | :--- | :--- | :--- |
| 1 | **`Role`** | Authentication, Identity & Access Control | Defines system access roles for Role-Based Access Control (RBAC). |
| 2 | **`User`** | Authentication, Identity & Access Control | Stores registered user accounts, authentication credentials, and organizational linkages. |
| 3 | **`Profile`** | Authentication, Identity & Access Control | Extended academic credentials, research specialization, and avatar storage. |
| 4 | **`LoginOtp`** | Authentication, Identity & Access Control | Temporary one-time passwords for passwordless authentication and email verification. |
| 5 | **`VerificationRequest`** | Authentication, Identity & Access Control | Professional credential verification for Guide and Patent Expert applications. |
| 6 | **`SystemSetting`** | Authentication, Identity & Access Control | System-wide feature flags, maintenance mode settings, and platform configurations. |
| 7 | **`Organization`** | Organization Governance & Enterprise Policies | Educational institutions, research centers, and corporate enterprises. |
| 8 | **`Policy`** | Organization Governance & Enterprise Policies | Mandatory IP governance terms, submission rules, and compliance regulations. |
| 9 | **`PolicyAssignment`** | Organization Governance & Enterprise Policies | Tracks user compliance, policy assignments, sign-offs, and waivers. |
| 10 | **`PatentProject`** | Patent Project Management & Collaboration | Central patent workspace entity containing invention metadata, lifecycle stage, and readiness scores. |
| 11 | **`ProjectMember`** | Patent Project Management & Collaboration | Collaboration team membership (co-inventors, assigned guides, and patent experts). |
| 12 | **`Invitation`** | Patent Project Management & Collaboration | Cryptographic invitation tokens for inviting external co-inventors or guides. |
| 13 | **`Notification`** | Patent Project Management & Collaboration | Real-time in-app alerts, reviews, and task assignments. |
| 14 | **`Comment`** | Patent Project Management & Collaboration | Multi-level threaded discussions across project stages, claims, and figures. |
| 15 | **`ActivityLog`** | Patent Project Management & Collaboration | Immutable chronological audit trail recording every user action and project state change. |
| 16 | **`Document`** | Patent Project Management & Collaboration | Uploaded project assets, research papers, lab notebooks, and PDF certificates. |
| 17 | **`Task`** | Patent Project Management & Collaboration | Inventor workflow task tracking, deliverables, and milestone completion. |
| 18 | **`Specification`** | Patent Drafting, Claims & Specification Studio | Live editable patent specification draft for Indian Patent Office Form 2 generation. |
| 19 | **`SpecificationVersion`** | Patent Drafting, Claims & Specification Studio | Immutable versioned history snapshots of drafts for audit trails and revert capabilities. |
| 20 | **`PatentClaim`** | Patent Drafting, Claims & Specification Studio | Independent and dependent claims drafted in accordance with Patent Office standards. |
| 21 | **`ClaimElement`** | Patent Drafting, Claims & Specification Studio | Deconstructs legal claims into atomic technical limitations for novelty mapping. |
| 22 | **`ClaimChart`** | Patent Drafting, Claims & Specification Studio | Freedom-To-Operate (FTO) and infringement analysis charts. |
| 23 | **`ClaimChartElement`** | Patent Drafting, Claims & Specification Studio | Technical mapping of claim limitations against cited prior art patents. |
| 24 | **`Prototype`** | Technical Drawings & Prototype Intelligence | Tracks physical and digital prototypes, Technology Readiness Levels (TRL), and bill of materials. |
| 25 | **`DrawingFigure`** | Technical Drawings & Prototype Intelligence | Official patent figures, block diagrams, schematic illustrations, and flowcharts. |
| 26 | **`DrawingComponent`** | Technical Drawings & Prototype Intelligence | Numbered reference numeral callouts on drawings (e.g. 102: Microcontroller). |
| 27 | **`Patent`** | Prior Art Search, Classification & AI Intelligence | External prior art cache and patent database search results. |
| 28 | **`PatentReference`** | Prior Art Search, Classification & AI Intelligence | Curated prior art citations, relevance scores, and novelty comparisons. |
| 29 | **`IPCClassification`** | Prior Art Search, Classification & AI Intelligence | International Patent Classification (IPC) taxonomy definitions. |
| 30 | **`PatentProjectIPC`** | Prior Art Search, Classification & AI Intelligence | Many-to-many junction mapping between projects and IPC classifications. |
| 31 | **`AIAnalysis`** | Prior Art Search, Classification & AI Intelligence | Gemini AI diagnostic runs, novelty evaluations, and automated claim suggestions. |
| 32 | **`Applicant`** | Patent Filing Management & Legal Entities | Legal entities or individuals holding legal ownership of the patent rights. |
| 33 | **`Inventor`** | Patent Filing Management & Legal Entities | Legal inventors contributing to the technical novelty of the patent application. |
| 34 | **`PatentForm`** | Patent Filing Management & Legal Entities | Generated Indian Patent Office statutory forms (Form 1, 2, 3, 5). |
| 35 | **`Deadline`** | Patent Filing Management & Legal Entities | Statutory deadlines, First Examination Report (FER) timelines, and office actions. |
| 36 | **`FilingEvent`** | Patent Filing Management & Legal Entities | History of patent submission events, filing dates, and official docket milestones. |
| 37 | **`ProjectReview`** | Expert Review & Quality Assurance | Formal peer reviews, Guide approvals, and Patent Expert audit reports. |
| 38 | **`SubscriptionPlan`** | Subscriptions, Payments & Entitlements | Catalog of tiered subscription plans (Community, Scholar Pro, Campus Enterprise). |
| 39 | **`Subscription`** | Subscriptions, Payments & Entitlements | Active institutional or user billing subscription instances. |
| 40 | **`Trial`** | Subscriptions, Payments & Entitlements | Tracks 14-day institutional trial periods and expiration trackers. |
| 41 | **`Payment`** | Subscriptions, Payments & Entitlements | Transaction receipts, payment gateway IDs, and invoices. |
| 42 | **`Entitlement`** | Subscriptions, Payments & Entitlements | Feature gate quotas (maximum projects, AI generation limits, storage limit). |
| 43 | **`WebhookEvent`** | Subscriptions, Payments & Entitlements | Idempotency tracking for payment gateway webhooks. |

---

## 2. Detailed Schema Tables by Module

### Module 1: Authentication, Identity & Access Control

*Manages user accounts, authentication credentials, role-based access control, security OTPs, and verification requests.*

#### Table: `Role`

**Purpose**: Defines system access roles for Role-Based Access Control (RBAC).

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Unique role identifier |
| `name` | String | UNIQUE, Not Null | Role name (INVENTOR, GUIDE, PATENT_EXPERT, ADMIN) |
| `createdAt` | DateTime | Default now() | Timestamp of role creation |
| `updatedAt` | DateTime | Auto-updated | Timestamp of last modification |

#### Table: `User`

**Purpose**: Stores registered user accounts, authentication credentials, and organizational linkages.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Unique user identifier |
| `email` | String | UNIQUE, Not Null | Official or personal email address |
| `username` | String | UNIQUE, Not Null | Unique system handle / username |
| `password` | String | Not Null | Bcrypt-hashed password |
| `fullName` | String | Not Null | User legal full name |
| `roleId` | String | FK -> Role(id) | Assigned system RBAC role |
| `accountType` | String | Default 'INDIVIDUAL' | Account tier (INDIVIDUAL or ORGANIZATION) |
| `institution` | String | Nullable | University, college, or affiliated institution |
| `organizationId` | String | FK -> Organization(id), Nullable | Affiliated enterprise organization |
| `isActive` | Boolean | Default true | Account active / suspended status |
| `isEmailVerified` | Boolean | Default false | Email verification status |
| `createdAt` | DateTime | Default now() | Account registration timestamp |
| `updatedAt` | DateTime | Auto-updated | Profile last updated timestamp |

#### Table: `Profile`

**Purpose**: Extended academic credentials, research specialization, and avatar storage.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Profile record identifier |
| `userId` | String | UNIQUE, FK -> User(id) | Associated user account |
| `profileCompleted` | Boolean | Default false | Onboarding completion flag |
| `phone` | String | Nullable | Contact telephone / mobile |
| `dob` | DateTime | Nullable | Date of birth |
| `gender` | String | Nullable | Gender |
| `department` | String | Nullable | Academic department / faculty |
| `designation` | String | Nullable | Academic rank or student programme |
| `organization` | String | Nullable | Affiliated laboratory or department unit |
| `researchDomain` | String | Nullable | Primary research domain (e.g. AI, CleanTech) |
| `bio` | String | Nullable | Researcher biographical summary |
| `profileImage` | String | Nullable | Cloudinary CDN avatar URL |

#### Table: `LoginOtp`

**Purpose**: Temporary one-time passwords for passwordless authentication and email verification.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | OTP session identifier |
| `userId` | String | FK -> User(id) | Target user account |
| `code` | String | Not Null | 6-digit numeric OTP |
| `type` | String | Default 'LOGIN' | Purpose (LOGIN, VERIFICATION, RESET) |
| `expiresAt` | DateTime | Not Null | OTP expiration timestamp |
| `isUsed` | Boolean | Default false | Consumption tracking |

#### Table: `VerificationRequest`

**Purpose**: Professional credential verification for Guide and Patent Expert applications.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Verification ticket identifier |
| `userId` | String | FK -> User(id) | Applicant user account |
| `roleApplied` | String | Not Null | Requested role (GUIDE or PATENT_EXPERT) |
| `status` | String | Default 'PENDING' | Application state (PENDING, VERIFIED, REJECTED) |
| `adminNotes` | String | Nullable | Admin review feedback |
| `submittedAt` | DateTime | Default now() | Submission timestamp |

#### Table: `SystemSetting`

**Purpose**: System-wide feature flags, maintenance mode settings, and platform configurations.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Setting entry identifier |
| `key` | String | UNIQUE, Not Null | Configuration key name |
| `value` | String | Not Null | Configuration value string |
| `category` | String | Default 'GENERAL' | Config category |

---

### Module 2: Organization Governance & Enterprise Policies

*Manages colleges, universities, research labs, institutional IP policies, and compliance assignments.*

#### Table: `Organization`

**Purpose**: Educational institutions, research centers, and corporate enterprises.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Unique organization identifier |
| `name` | String | Not Null | Legal institution name |
| `domain` | String | Nullable | Institutional email domain (e.g. ajce.in) |
| `type` | String | Default 'UNIVERSITY' | Org type (UNIVERSITY, LAB, ENTERPRISE) |
| `location` | String | Nullable | Campus or regional location |
| `address` | String | Nullable | Full postal address |
| `contactEmail` | String | Nullable | Official administrative contact email |
| `contactNumber` | String | Nullable | Official telephone contact |
| `status` | String | Default 'ACTIVE' | Institution status (ACTIVE, SUSPENDED) |
| `verificationStatus` | String | Default 'VERIFIED' | Accreditation verification status |

#### Table: `Policy`

**Purpose**: Mandatory IP governance terms, submission rules, and compliance regulations.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Unique policy identifier |
| `organizationId` | String | FK -> Organization(id) | Governing organization |
| `name` | String | Not Null | Policy title |
| `description` | String | Nullable | Detailed policy description |
| `rules` | Json | Nullable | Structured machine-readable compliance rules |
| `status` | String | Default 'ACTIVE' | Policy status (ACTIVE, INACTIVE) |

#### Table: `PolicyAssignment`

**Purpose**: Tracks user compliance, policy assignments, sign-offs, and waivers.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Assignment record identifier |
| `policyId` | String | FK -> Policy(id) | Assigned policy |
| `userId` | String | FK -> User(id) | Recipient user account |
| `status` | String | Default 'ACTIVE' | Status (ACTIVE, ACCEPTED, WAIVED) |
| `acknowledgedAt` | DateTime | Nullable | Timestamp of user sign-off |
| `expiresAt` | DateTime | Nullable | Expiration / renewal timestamp |

---

### Module 3: Patent Project Management & Collaboration

*Central patent project workspace, collaboration members, invitations, activity logs, tasks, comments, and uploaded assets.*

#### Table: `PatentProject`

**Purpose**: Central patent workspace entity containing invention metadata, lifecycle stage, and readiness scores.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Unique project identifier |
| `title` | String | Not Null | Title of the invention |
| `problemStatement` | String | Nullable | Technical problem addressed |
| `solution` | String | Nullable | Proposed inventive technical solution |
| `noveltySummary` | String | Nullable | Core novelty and inventiveness summary |
| `technicalDomain` | String | Not Null | Primary technology domain |
| `category` | String | Nullable | Patent categorization |
| `stage` | String | Default 'IDEA' | Lifecycle stage (IDEA, RESEARCH, DRAFTING, REVIEW, FILING, SUBMITTED) |
| `ownerId` | String | FK -> User(id) | Lead inventor / creator |
| `organizationId` | String | FK -> Organization(id), Nullable | Governing organization |
| `status` | String | Default 'ACTIVE' | Workspace state (ACTIVE, ARCHIVED) |
| `readinessScore` | Int | Default 0 | Automated filing readiness index (0-100%) |
| `createdAt` | DateTime | Default now() | Project initialization timestamp |
| `updatedAt` | DateTime | Auto-updated | Last project activity timestamp |

#### Table: `ProjectMember`

**Purpose**: Collaboration team membership (co-inventors, assigned guides, and patent experts).

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Membership identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `userId` | String | FK -> User(id) | Team member user account |
| `role` | String | Not Null | Project role (CO_INVENTOR, GUIDE, PATENT_EXPERT) |
| `permissions` | Json | Nullable | Granular permissions (edit, review, sign) |
| `joinedAt` | DateTime | Default now() | Timestamp joined |

#### Table: `Invitation`

**Purpose**: Cryptographic invitation tokens for inviting external co-inventors or guides.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Invitation ticket identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `inviterId` | String | FK -> User(id) | Sender user account |
| `inviteeEmail` | String | Not Null | Target invitee email |
| `role` | String | Not Null | Proposed project role |
| `token` | String | UNIQUE, Not Null | Cryptographic URL token |
| `status` | String | Default 'PENDING' | State (PENDING, ACCEPTED, EXPIRED) |
| `expiresAt` | DateTime | Not Null | Token expiration timestamp |

#### Table: `Notification`

**Purpose**: Real-time in-app alerts, reviews, and task assignments.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Notification record identifier |
| `userId` | String | FK -> User(id) | Recipient user account |
| `title` | String | Not Null | Headline subject |
| `message` | String | Not Null | Body message text |
| `type` | String | Default 'INFO' | Category (INFO, REVIEW, DEADLINE, TASK) |
| `isRead` | Boolean | Default false | Read status flag |
| `link` | String | Nullable | Target deep-link URL in dashboard |

#### Table: `Comment`

**Purpose**: Multi-level threaded discussions across project stages, claims, and figures.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Comment identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `userId` | String | FK -> User(id) | Author user account |
| `content` | String | Not Null | Comment message body |
| `parentId` | String | FK -> Comment(id), Nullable | Parent comment identifier for replies |

#### Table: `ActivityLog`

**Purpose**: Immutable chronological audit trail recording every user action and project state change.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Audit entry identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `userId` | String | FK -> User(id) | Action author |
| `action` | String | Not Null | Action verb (CREATE, UPDATE, REVIEW, SUBMIT) |
| `details` | Json | Nullable | State delta / metadata payload |
| `createdAt` | DateTime | Default now() | Event timestamp |

#### Table: `Document`

**Purpose**: Uploaded project assets, research papers, lab notebooks, and PDF certificates.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Document record identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `name` | String | Not Null | Original file name |
| `url` | String | Not Null | Cloudinary CDN asset URL |
| `fileType` | String | Not Null | MIME file type |
| `sizeBytes` | Int | Not Null | File size in bytes |
| `category` | String | Default 'RESEARCH' | Category (RESEARCH, DRAWING, FORM) |

#### Table: `Task`

**Purpose**: Inventor workflow task tracking, deliverables, and milestone completion.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Task record identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `title` | String | Not Null | Task title |
| `description` | String | Nullable | Actionable instructions |
| `status` | String | Default 'PENDING' | Status (PENDING, IN_PROGRESS, COMPLETED) |
| `priority` | String | Default 'MEDIUM' | Priority (LOW, MEDIUM, HIGH, URGENT) |
| `assignedToId` | String | FK -> User(id), Nullable | Assignee user account |
| `dueDate` | DateTime | Nullable | Task deadline date |

---

### Module 4: Patent Drafting, Claims & Specification Studio

*Structured patent specification drafting, version control snapshots, claims hierarchy, and Freedom-To-Operate charts.*

#### Table: `Specification`

**Purpose**: Live editable patent specification draft for Indian Patent Office Form 2 generation.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Specification identifier |
| `projectId` | String | UNIQUE, FK -> PatentProject(id) | Parent project |
| `title` | String | Not Null | Patent drafting title |
| `fieldOfInvention` | String | Nullable | Field of the invention |
| `background` | String | Nullable | Background & prior art limitations |
| `summary` | String | Nullable | Summary of the invention |
| `briefDescriptionDrawings` | String | Nullable | Brief description of figures |
| `detailedDescription` | String | Nullable | Detailed technical description |
| `abstract` | String | Nullable | Formal statutory abstract |
| `status` | String | Default 'DRAFT' | Status (DRAFT, REVIEW, APPROVED) |

#### Table: `SpecificationVersion`

**Purpose**: Immutable versioned history snapshots of drafts for audit trails and revert capabilities.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Version record identifier |
| `specificationId` | String | FK -> Specification(id) | Parent specification |
| `versionNumber` | Int | Not Null | Sequential version index (v1, v2, v3) |
| `snapshot` | Json | Not Null | Full JSON snapshot of draft fields |
| `changeSummary` | String | Nullable | Summary notes of modifications |
| `createdAt` | DateTime | Default now() | Timestamp of snapshot save |

#### Table: `PatentClaim`

**Purpose**: Independent and dependent claims drafted in accordance with Patent Office standards.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Claim record identifier |
| `projectId` | String | FK -> PatentProject(id) | Parent project |
| `claimNumber` | Int | Not Null | Claim sequence number (1, 2, 3...) |
| `claimType` | String | Default 'INDEPENDENT' | Claim type (INDEPENDENT, DEPENDENT) |
| `dependsOnClaimNumber` | Int | Nullable | Parent claim number if dependent |
| `text` | String | Not Null | Full claim legal wording |
| `status` | String | Default 'DRAFT' | Status (DRAFT, VERIFIED, APPROVED) |

#### Table: `ClaimElement`

**Purpose**: Deconstructs legal claims into atomic technical limitations for novelty mapping.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Element identifier |
| `claimId` | String | FK -> PatentClaim(id) | Associated claim |
| `elementNumber` | String | Not Null | Sub-element label (1a, 1b, 1c) |
| `text` | String | Not Null | Technical limitation text |
| `isNovel` | Boolean | Default false | Flag indicating technical novelty |

#### Table: `ClaimChart`

**Purpose**: Freedom-To-Operate (FTO) and infringement analysis charts.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Chart identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `targetPatentNumber` | String | Not Null | Target competitor patent number |

#### Table: `ClaimChartElement`

**Purpose**: Technical mapping of claim limitations against cited prior art patents.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Chart element mapping identifier |
| `claimChartId` | String | FK -> ClaimChart(id) | Parent chart |
| `claimElementId` | String | FK -> ClaimElement(id) | Claim element being mapped |
| `priorArtText` | String | Not Null | Corresponding text from prior art |
| `isInfringing` | Boolean | Default false | Flag indicating infringement match |

---

### Module 5: Technical Drawings & Prototype Intelligence

*Hardware prototypes, TRL ratings, patent drawings, sheet management, and reference numeral annotations.*

#### Table: `Prototype`

**Purpose**: Tracks physical and digital prototypes, Technology Readiness Levels (TRL), and bill of materials.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Prototype record identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `title` | String | Not Null | Prototype model name |
| `trlLevel` | Int | Default 3 | Technology Readiness Level (1-9) |
| `billOfMaterials` | Json | Nullable | Hardware components and bill of materials |
| `testedMetrics` | Json | Nullable | Experimental testing results |

#### Table: `DrawingFigure`

**Purpose**: Official patent figures, block diagrams, schematic illustrations, and flowcharts.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Figure identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `figureNumber` | String | Not Null | Figure label (FIG. 1, FIG. 2A) |
| `caption` | String | Not Null | Formal statutory figure caption |
| `imageUrl` | String | Not Null | Cloudinary CDN high-res image URL |
| `sheetNumber` | Int | Default 1 | Official drawing sheet number |

#### Table: `DrawingComponent`

**Purpose**: Numbered reference numeral callouts on drawings (e.g. 102: Microcontroller).

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Component callout identifier |
| `figureId` | String | FK -> DrawingFigure(id) | Target figure |
| `referenceNumber` | String | Not Null | Reference numeral (e.g. 102, 104) |
| `componentName` | String | Not Null | Technical part name |
| `description` | String | Nullable | Function in figure |

---

### Module 6: Prior Art Search, Classification & AI Intelligence

*Prior art citations, semantic similarity scores, IPC taxonomy classifications, and Gemini AI diagnostic runs.*

#### Table: `Patent`

**Purpose**: External prior art cache and patent database search results.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Patent cache identifier |
| `patentNumber` | String | UNIQUE, Not Null | Publication number (US10234567B2) |
| `title` | String | Not Null | Published patent title |
| `abstract` | String | Nullable | Published patent abstract |
| `publicationDate` | DateTime | Nullable | Date of patent publication |

#### Table: `PatentReference`

**Purpose**: Curated prior art citations, relevance scores, and novelty comparisons.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Reference citation identifier |
| `projectId` | String | FK -> PatentProject(id) | Citing project |
| `patentId` | String | FK -> Patent(id) | Cited patent record |
| `relevanceScore` | Float | Default 0.0 | Relevance score (0.00-1.00) |
| `citationType` | String | Default 'PRIOR_ART' | Type (PRIOR_ART, CLOSEST_ART) |

#### Table: `IPCClassification`

**Purpose**: International Patent Classification (IPC) taxonomy definitions.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | IPC code identifier |
| `code` | String | UNIQUE, Not Null | Official IPC symbol (G06F 16/00) |
| `description` | String | Not Null | Hierarchy description and scope |

#### Table: `PatentProjectIPC`

**Purpose**: Many-to-many junction mapping between projects and IPC classifications.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Junction identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `ipcId` | String | FK -> IPCClassification(id) | Assigned IPC code |

#### Table: `AIAnalysis`

**Purpose**: Gemini AI diagnostic runs, novelty evaluations, and automated claim suggestions.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Analysis run identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `analysisType` | String | Not Null | Type (NOVELTY_SEARCH, CLAIM_DRAFTING) |
| `output` | Json | Not Null | Structured AI diagnostic output payload |
| `safetyDisclaimer` | String | Default disclaimer | AI safety disclaimer |
| `createdAt` | DateTime | Default now() | Timestamp of AI generation |

---

### Module 7: Patent Filing Management & Legal Entities

*Official legal entities, applicants, inventors, statutory IPO forms (Form 1, 2, 3, 5), deadlines, and filing events.*

#### Table: `Applicant`

**Purpose**: Legal entities or individuals holding legal ownership of the patent rights.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Applicant record identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `name` | String | Not Null | Legal entity or individual name |
| `nationality` | String | Not Null | Nationality or country of incorporation |
| `address` | String | Not Null | Official postal address |
| `isSmallEntity` | Boolean | Default true | MSME / Educational discount status |

#### Table: `Inventor`

**Purpose**: Legal inventors contributing to the technical novelty of the patent application.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Inventor legal identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `fullName` | String | Not Null | Full legal name |
| `nationality` | String | Not Null | Nationality |
| `address` | String | Not Null | Residential address |
| `contributionPercentage` | Float | Default 100.0 | Contribution percentage split |

#### Table: `PatentForm`

**Purpose**: Generated Indian Patent Office statutory forms (Form 1, 2, 3, 5).

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Form record identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `formType` | String | Not Null | Form code (FORM_1, FORM_2, FORM_3, FORM_5) |
| `status` | String | Default 'DRAFT' | Status (DRAFT, GENERATED, SIGNED, FILED) |
| `formData` | Json | Not Null | Auto-populated statutory payload |
| `generatedPdfUrl` | String | Nullable | Official generated PDF download URL |

#### Table: `Deadline`

**Purpose**: Statutory deadlines, First Examination Report (FER) timelines, and office actions.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Deadline record identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `title` | String | Not Null | Milestone title (e.g. FER Response) |
| `dueDate` | DateTime | Not Null | Statutory cutoff date |
| `isCompleted` | Boolean | Default false | Completion status |

#### Table: `FilingEvent`

**Purpose**: History of patent submission events, filing dates, and official docket milestones.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Filing event identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `eventType` | String | Not Null | Event type (APPLICATION_FILED, CBR_ISSUED) |
| `docketNumber` | String | Nullable | Official IPO / USPTO application number |

---

### Module 8: Expert Review & Quality Assurance

*Formal academic Guide approvals, Patent Expert quality audits, structured rubrics, and feedback.*

#### Table: `ProjectReview`

**Purpose**: Formal peer reviews, Guide approvals, and Patent Expert audit reports.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Review ticket identifier |
| `projectId` | String | FK -> PatentProject(id) | Associated project |
| `reviewerId` | String | FK -> User(id) | Reviewer user account |
| `stage` | String | Not Null | Stage reviewed (DRAFTING, CLAIMS, FILING) |
| `status` | String | Default 'PENDING' | Decision (PENDING, APPROVED, CHANGES_REQUESTED) |
| `feedback` | String | Not Null | Qualitative critique and guidance |
| `rating` | Int | Nullable | Rating score (1 to 5 stars) |
| `checklistAnswers` | Json | Nullable | Structured compliance rubric responses |
| `reviewedAt` | DateTime | Nullable | Timestamp of review decision |

---

### Module 9: Subscriptions, Payments & Entitlements

*Tiered SaaS subscription catalog, active institutional subscriptions, 14-day trials, Razorpay payments, feature quotas, and webhooks.*

#### Table: `SubscriptionPlan`

**Purpose**: Catalog of tiered subscription plans (Community, Scholar Pro, Campus Enterprise).

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Plan identifier |
| `name` | String | UNIQUE, Not Null | Plan tier name |
| `price` | Float | Not Null | Subscription price |
| `billingCycle` | String | Default 'MONTHLY' | Cycle (MONTHLY, ANNUAL) |

#### Table: `Subscription`

**Purpose**: Active institutional or user billing subscription instances.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Subscription record identifier |
| `organizationId` | String | FK -> Organization(id), Nullable | Subscribed organization |
| `planId` | String | FK -> SubscriptionPlan(id) | Associated plan |
| `status` | String | Default 'ACTIVE' | State (ACTIVE, PAST_DUE, CANCELED) |
| `currentPeriodEnd` | DateTime | Not Null | Expiration / renewal date |

#### Table: `Trial`

**Purpose**: Tracks 14-day institutional trial periods and expiration trackers.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Trial record identifier |
| `organizationId` | String | UNIQUE, FK -> Organization(id) | Target organization |
| `startDate` | DateTime | Default now() | Trial inception date |
| `endDate` | DateTime | Not Null | Trial expiration date |
| `status` | String | Default 'ACTIVE' | State (ACTIVE, EXPIRED, CONVERTED) |

#### Table: `Payment`

**Purpose**: Transaction receipts, payment gateway IDs, and invoices.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Payment transaction identifier |
| `subscriptionId` | String | FK -> Subscription(id) | Parent subscription |
| `amount` | Float | Not Null | Payment amount |
| `currency` | String | Default 'INR' | Currency code (INR, USD) |
| `gatewayPaymentId` | String | UNIQUE, Nullable | Razorpay / Stripe payment ID |
| `status` | String | Default 'PAID' | State (PAID, FAILED, REFUNDED) |

#### Table: `Entitlement`

**Purpose**: Feature gate quotas (maximum projects, AI generation limits, storage limit).

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Entitlement identifier |
| `organizationId` | String | FK -> Organization(id) | Target organization |
| `featureKey` | String | Not Null | Feature quota key |
| `quotaLimit` | Int | Not Null | Numerical limit value |

#### Table: `WebhookEvent`

**Purpose**: Idempotency tracking for payment gateway webhooks.

| Column Name | Data Type | Constraints / Keys | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | PK, UUID | Webhook event identifier |
| `eventId` | String | UNIQUE, Not Null | Provider unique event ID |
| `provider` | String | Not Null | Payment gateway provider (RAZORPAY) |
| `status` | String | Default 'PROCESSED' | Status (PENDING, PROCESSED) |

---

