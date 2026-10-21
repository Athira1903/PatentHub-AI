const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
} = require('docx');

// --- Schema Definitions for all 43 Tables ---
const modulesData = [
  {
    moduleName: 'Module 1: Authentication, Identity & Access Control',
    description: 'Manages user accounts, authentication credentials, role-based access control, security OTPs, and verification requests.',
    tables: [
      {
        name: 'Role',
        purpose: 'Defines system access roles for Role-Based Access Control (RBAC).',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Unique role identifier' },
          { name: 'name', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Role name (INVENTOR, GUIDE, PATENT_EXPERT, ADMIN)' },
          { name: 'createdAt', type: 'DateTime', constraints: 'Default now()', desc: 'Timestamp of role creation' },
          { name: 'updatedAt', type: 'DateTime', constraints: 'Auto-updated', desc: 'Timestamp of last modification' },
        ],
      },
      {
        name: 'User',
        purpose: 'Stores registered user accounts, authentication credentials, and organizational linkages.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Unique user identifier' },
          { name: 'email', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Official or personal email address' },
          { name: 'username', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Unique system handle / username' },
          { name: 'password', type: 'String', constraints: 'Not Null', desc: 'Bcrypt-hashed password' },
          { name: 'fullName', type: 'String', constraints: 'Not Null', desc: 'User legal full name' },
          { name: 'roleId', type: 'String', constraints: 'FK -> Role(id)', desc: 'Assigned system RBAC role' },
          { name: 'accountType', type: 'String', constraints: "Default 'INDIVIDUAL'", desc: 'Account tier (INDIVIDUAL or ORGANIZATION)' },
          { name: 'institution', type: 'String', constraints: 'Nullable', desc: 'University, college, or affiliated institution' },
          { name: 'organizationId', type: 'String', constraints: 'FK -> Organization(id), Nullable', desc: 'Affiliated enterprise organization' },
          { name: 'isActive', type: 'Boolean', constraints: 'Default true', desc: 'Account active / suspended status' },
          { name: 'isEmailVerified', type: 'Boolean', constraints: 'Default false', desc: 'Email verification status' },
          { name: 'createdAt', type: 'DateTime', constraints: 'Default now()', desc: 'Account registration timestamp' },
          { name: 'updatedAt', type: 'DateTime', constraints: 'Auto-updated', desc: 'Profile last updated timestamp' },
        ],
      },
      {
        name: 'Profile',
        purpose: 'Extended academic credentials, research specialization, and avatar storage.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Profile record identifier' },
          { name: 'userId', type: 'String', constraints: 'UNIQUE, FK -> User(id)', desc: 'Associated user account' },
          { name: 'profileCompleted', type: 'Boolean', constraints: 'Default false', desc: 'Onboarding completion flag' },
          { name: 'phone', type: 'String', constraints: 'Nullable', desc: 'Contact telephone / mobile' },
          { name: 'dob', type: 'DateTime', constraints: 'Nullable', desc: 'Date of birth' },
          { name: 'gender', type: 'String', constraints: 'Nullable', desc: 'Gender' },
          { name: 'department', type: 'String', constraints: 'Nullable', desc: 'Academic department / faculty' },
          { name: 'designation', type: 'String', constraints: 'Nullable', desc: 'Academic rank or student programme' },
          { name: 'organization', type: 'String', constraints: 'Nullable', desc: 'Affiliated laboratory or department unit' },
          { name: 'researchDomain', type: 'String', constraints: 'Nullable', desc: 'Primary research domain (e.g. AI, CleanTech)' },
          { name: 'bio', type: 'String', constraints: 'Nullable', desc: 'Researcher biographical summary' },
          { name: 'profileImage', type: 'String', constraints: 'Nullable', desc: 'Cloudinary CDN avatar URL' },
        ],
      },
      {
        name: 'LoginOtp',
        purpose: 'Temporary one-time passwords for passwordless authentication and email verification.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'OTP session identifier' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Target user account' },
          { name: 'code', type: 'String', constraints: 'Not Null', desc: '6-digit numeric OTP' },
          { name: 'type', type: 'String', constraints: "Default 'LOGIN'", desc: 'Purpose (LOGIN, VERIFICATION, RESET)' },
          { name: 'expiresAt', type: 'DateTime', constraints: 'Not Null', desc: 'OTP expiration timestamp' },
          { name: 'isUsed', type: 'Boolean', constraints: 'Default false', desc: 'Consumption tracking' },
        ],
      },
      {
        name: 'VerificationRequest',
        purpose: 'Professional credential verification for Guide and Patent Expert applications.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Verification ticket identifier' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Applicant user account' },
          { name: 'roleApplied', type: 'String', constraints: 'Not Null', desc: 'Requested role (GUIDE or PATENT_EXPERT)' },
          { name: 'status', type: 'String', constraints: "Default 'PENDING'", desc: 'Application state (PENDING, VERIFIED, REJECTED)' },
          { name: 'adminNotes', type: 'String', constraints: 'Nullable', desc: 'Admin review feedback' },
          { name: 'submittedAt', type: 'DateTime', constraints: 'Default now()', desc: 'Submission timestamp' },
        ],
      },
      {
        name: 'SystemSetting',
        purpose: 'System-wide feature flags, maintenance mode settings, and platform configurations.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Setting entry identifier' },
          { name: 'key', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Configuration key name' },
          { name: 'value', type: 'String', constraints: 'Not Null', desc: 'Configuration value string' },
          { name: 'category', type: 'String', constraints: "Default 'GENERAL'", desc: 'Config category' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 2: Organization Governance & Enterprise Policies',
    description: 'Manages colleges, universities, research labs, institutional IP policies, and compliance assignments.',
    tables: [
      {
        name: 'Organization',
        purpose: 'Educational institutions, research centers, and corporate enterprises.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Unique organization identifier' },
          { name: 'name', type: 'String', constraints: 'Not Null', desc: 'Legal institution name' },
          { name: 'domain', type: 'String', constraints: 'Nullable', desc: 'Institutional email domain (e.g. ajce.in)' },
          { name: 'type', type: 'String', constraints: "Default 'UNIVERSITY'", desc: 'Org type (UNIVERSITY, LAB, ENTERPRISE)' },
          { name: 'location', type: 'String', constraints: 'Nullable', desc: 'Campus or regional location' },
          { name: 'address', type: 'String', constraints: 'Nullable', desc: 'Full postal address' },
          { name: 'contactEmail', type: 'String', constraints: 'Nullable', desc: 'Official administrative contact email' },
          { name: 'contactNumber', type: 'String', constraints: 'Nullable', desc: 'Official telephone contact' },
          { name: 'status', type: 'String', constraints: "Default 'ACTIVE'", desc: 'Institution status (ACTIVE, SUSPENDED)' },
          { name: 'verificationStatus', type: 'String', constraints: "Default 'VERIFIED'", desc: 'Accreditation verification status' },
        ],
      },
      {
        name: 'Policy',
        purpose: 'Mandatory IP governance terms, submission rules, and compliance regulations.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Unique policy identifier' },
          { name: 'organizationId', type: 'String', constraints: 'FK -> Organization(id)', desc: 'Governing organization' },
          { name: 'name', type: 'String', constraints: 'Not Null', desc: 'Policy title' },
          { name: 'description', type: 'String', constraints: 'Nullable', desc: 'Detailed policy description' },
          { name: 'rules', type: 'Json', constraints: 'Nullable', desc: 'Structured machine-readable compliance rules' },
          { name: 'status', type: 'String', constraints: "Default 'ACTIVE'", desc: 'Policy status (ACTIVE, INACTIVE)' },
        ],
      },
      {
        name: 'PolicyAssignment',
        purpose: 'Tracks user compliance, policy assignments, sign-offs, and waivers.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Assignment record identifier' },
          { name: 'policyId', type: 'String', constraints: 'FK -> Policy(id)', desc: 'Assigned policy' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Recipient user account' },
          { name: 'status', type: 'String', constraints: "Default 'ACTIVE'", desc: 'Status (ACTIVE, ACCEPTED, WAIVED)' },
          { name: 'acknowledgedAt', type: 'DateTime', constraints: 'Nullable', desc: 'Timestamp of user sign-off' },
          { name: 'expiresAt', type: 'DateTime', constraints: 'Nullable', desc: 'Expiration / renewal timestamp' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 3: Patent Project Management & Collaboration',
    description: 'Central patent project workspace, collaboration members, invitations, activity logs, tasks, comments, and uploaded assets.',
    tables: [
      {
        name: 'PatentProject',
        purpose: 'Central patent workspace entity containing invention metadata, lifecycle stage, and readiness scores.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Unique project identifier' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Title of the invention' },
          { name: 'problemStatement', type: 'String', constraints: 'Nullable', desc: 'Technical problem addressed' },
          { name: 'solution', type: 'String', constraints: 'Nullable', desc: 'Proposed inventive technical solution' },
          { name: 'noveltySummary', type: 'String', constraints: 'Nullable', desc: 'Core novelty and inventiveness summary' },
          { name: 'technicalDomain', type: 'String', constraints: 'Not Null', desc: 'Primary technology domain' },
          { name: 'category', type: 'String', constraints: 'Nullable', desc: 'Patent categorization' },
          { name: 'stage', type: 'String', constraints: "Default 'IDEA'", desc: 'Lifecycle stage (IDEA, RESEARCH, DRAFTING, REVIEW, FILING, SUBMITTED)' },
          { name: 'ownerId', type: 'String', constraints: 'FK -> User(id)', desc: 'Lead inventor / creator' },
          { name: 'organizationId', type: 'String', constraints: 'FK -> Organization(id), Nullable', desc: 'Governing organization' },
          { name: 'status', type: 'String', constraints: "Default 'ACTIVE'", desc: 'Workspace state (ACTIVE, ARCHIVED)' },
          { name: 'readinessScore', type: 'Int', constraints: 'Default 0', desc: 'Automated filing readiness index (0-100%)' },
          { name: 'createdAt', type: 'DateTime', constraints: 'Default now()', desc: 'Project initialization timestamp' },
          { name: 'updatedAt', type: 'DateTime', constraints: 'Auto-updated', desc: 'Last project activity timestamp' },
        ],
      },
      {
        name: 'ProjectMember',
        purpose: 'Collaboration team membership (co-inventors, assigned guides, and patent experts).',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Membership identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Team member user account' },
          { name: 'role', type: 'String', constraints: 'Not Null', desc: 'Project role (CO_INVENTOR, GUIDE, PATENT_EXPERT)' },
          { name: 'permissions', type: 'Json', constraints: 'Nullable', desc: 'Granular permissions (edit, review, sign)' },
          { name: 'joinedAt', type: 'DateTime', constraints: 'Default now()', desc: 'Timestamp joined' },
        ],
      },
      {
        name: 'Invitation',
        purpose: 'Cryptographic invitation tokens for inviting external co-inventors or guides.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Invitation ticket identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'inviterId', type: 'String', constraints: 'FK -> User(id)', desc: 'Sender user account' },
          { name: 'inviteeEmail', type: 'String', constraints: 'Not Null', desc: 'Target invitee email' },
          { name: 'role', type: 'String', constraints: 'Not Null', desc: 'Proposed project role' },
          { name: 'token', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Cryptographic URL token' },
          { name: 'status', type: 'String', constraints: "Default 'PENDING'", desc: 'State (PENDING, ACCEPTED, EXPIRED)' },
          { name: 'expiresAt', type: 'DateTime', constraints: 'Not Null', desc: 'Token expiration timestamp' },
        ],
      },
      {
        name: 'Notification',
        purpose: 'Real-time in-app alerts, reviews, and task assignments.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Notification record identifier' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Recipient user account' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Headline subject' },
          { name: 'message', type: 'String', constraints: 'Not Null', desc: 'Body message text' },
          { name: 'type', type: 'String', constraints: "Default 'INFO'", desc: 'Category (INFO, REVIEW, DEADLINE, TASK)' },
          { name: 'isRead', type: 'Boolean', constraints: 'Default false', desc: 'Read status flag' },
          { name: 'link', type: 'String', constraints: 'Nullable', desc: 'Target deep-link URL in dashboard' },
        ],
      },
      {
        name: 'Comment',
        purpose: 'Multi-level threaded discussions across project stages, claims, and figures.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Comment identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Author user account' },
          { name: 'content', type: 'String', constraints: 'Not Null', desc: 'Comment message body' },
          { name: 'parentId', type: 'String', constraints: 'FK -> Comment(id), Nullable', desc: 'Parent comment identifier for replies' },
        ],
      },
      {
        name: 'ActivityLog',
        purpose: 'Immutable chronological audit trail recording every user action and project state change.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Audit entry identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'userId', type: 'String', constraints: 'FK -> User(id)', desc: 'Action author' },
          { name: 'action', type: 'String', constraints: 'Not Null', desc: 'Action verb (CREATE, UPDATE, REVIEW, SUBMIT)' },
          { name: 'details', type: 'Json', constraints: 'Nullable', desc: 'State delta / metadata payload' },
          { name: 'createdAt', type: 'DateTime', constraints: 'Default now()', desc: 'Event timestamp' },
        ],
      },
      {
        name: 'Document',
        purpose: 'Uploaded project assets, research papers, lab notebooks, and PDF certificates.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Document record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'name', type: 'String', constraints: 'Not Null', desc: 'Original file name' },
          { name: 'url', type: 'String', constraints: 'Not Null', desc: 'Cloudinary CDN asset URL' },
          { name: 'fileType', type: 'String', constraints: 'Not Null', desc: 'MIME file type' },
          { name: 'sizeBytes', type: 'Int', constraints: 'Not Null', desc: 'File size in bytes' },
          { name: 'category', type: 'String', constraints: "Default 'RESEARCH'", desc: 'Category (RESEARCH, DRAWING, FORM)' },
        ],
      },
      {
        name: 'Task',
        purpose: 'Inventor workflow task tracking, deliverables, and milestone completion.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Task record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Task title' },
          { name: 'description', type: 'String', constraints: 'Nullable', desc: 'Actionable instructions' },
          { name: 'status', type: 'String', constraints: "Default 'PENDING'", desc: 'Status (PENDING, IN_PROGRESS, COMPLETED)' },
          { name: 'priority', type: 'String', constraints: "Default 'MEDIUM'", desc: 'Priority (LOW, MEDIUM, HIGH, URGENT)' },
          { name: 'assignedToId', type: 'String', constraints: 'FK -> User(id), Nullable', desc: 'Assignee user account' },
          { name: 'dueDate', type: 'DateTime', constraints: 'Nullable', desc: 'Task deadline date' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 4: Patent Drafting, Claims & Specification Studio',
    description: 'Structured patent specification drafting, version control snapshots, claims hierarchy, and Freedom-To-Operate charts.',
    tables: [
      {
        name: 'Specification',
        purpose: 'Live editable patent specification draft for Indian Patent Office Form 2 generation.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Specification identifier' },
          { name: 'projectId', type: 'String', constraints: 'UNIQUE, FK -> PatentProject(id)', desc: 'Parent project' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Patent drafting title' },
          { name: 'fieldOfInvention', type: 'String', constraints: 'Nullable', desc: 'Field of the invention' },
          { name: 'background', type: 'String', constraints: 'Nullable', desc: 'Background & prior art limitations' },
          { name: 'summary', type: 'String', constraints: 'Nullable', desc: 'Summary of the invention' },
          { name: 'briefDescriptionDrawings', type: 'String', constraints: 'Nullable', desc: 'Brief description of figures' },
          { name: 'detailedDescription', type: 'String', constraints: 'Nullable', desc: 'Detailed technical description' },
          { name: 'abstract', type: 'String', constraints: 'Nullable', desc: 'Formal statutory abstract' },
          { name: 'status', type: 'String', constraints: "Default 'DRAFT'", desc: 'Status (DRAFT, REVIEW, APPROVED)' },
        ],
      },
      {
        name: 'SpecificationVersion',
        purpose: 'Immutable versioned history snapshots of drafts for audit trails and revert capabilities.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Version record identifier' },
          { name: 'specificationId', type: 'String', constraints: 'FK -> Specification(id)', desc: 'Parent specification' },
          { name: 'versionNumber', type: 'Int', constraints: 'Not Null', desc: 'Sequential version index (v1, v2, v3)' },
          { name: 'snapshot', type: 'Json', constraints: 'Not Null', desc: 'Full JSON snapshot of draft fields' },
          { name: 'changeSummary', type: 'String', constraints: 'Nullable', desc: 'Summary notes of modifications' },
          { name: 'createdAt', type: 'DateTime', constraints: 'Default now()', desc: 'Timestamp of snapshot save' },
        ],
      },
      {
        name: 'PatentClaim',
        purpose: 'Independent and dependent claims drafted in accordance with Patent Office standards.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Claim record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Parent project' },
          { name: 'claimNumber', type: 'Int', constraints: 'Not Null', desc: 'Claim sequence number (1, 2, 3...)' },
          { name: 'claimType', type: 'String', constraints: "Default 'INDEPENDENT'", desc: 'Claim type (INDEPENDENT, DEPENDENT)' },
          { name: 'dependsOnClaimNumber', type: 'Int', constraints: 'Nullable', desc: 'Parent claim number if dependent' },
          { name: 'text', type: 'String', constraints: 'Not Null', desc: 'Full claim legal wording' },
          { name: 'status', type: 'String', constraints: "Default 'DRAFT'", desc: 'Status (DRAFT, VERIFIED, APPROVED)' },
        ],
      },
      {
        name: 'ClaimElement',
        purpose: 'Deconstructs legal claims into atomic technical limitations for novelty mapping.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Element identifier' },
          { name: 'claimId', type: 'String', constraints: 'FK -> PatentClaim(id)', desc: 'Associated claim' },
          { name: 'elementNumber', type: 'String', constraints: 'Not Null', desc: 'Sub-element label (1a, 1b, 1c)' },
          { name: 'text', type: 'String', constraints: 'Not Null', desc: 'Technical limitation text' },
          { name: 'isNovel', type: 'Boolean', constraints: 'Default false', desc: 'Flag indicating technical novelty' },
        ],
      },
      {
        name: 'ClaimChart',
        purpose: 'Freedom-To-Operate (FTO) and infringement analysis charts.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Chart identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'targetPatentNumber', type: 'String', constraints: 'Not Null', desc: 'Target competitor patent number' },
        ],
      },
      {
        name: 'ClaimChartElement',
        purpose: 'Technical mapping of claim limitations against cited prior art patents.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Chart element mapping identifier' },
          { name: 'claimChartId', type: 'String', constraints: 'FK -> ClaimChart(id)', desc: 'Parent chart' },
          { name: 'claimElementId', type: 'String', constraints: 'FK -> ClaimElement(id)', desc: 'Claim element being mapped' },
          { name: 'priorArtText', type: 'String', constraints: 'Not Null', desc: 'Corresponding text from prior art' },
          { name: 'isInfringing', type: 'Boolean', constraints: 'Default false', desc: 'Flag indicating infringement match' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 5: Technical Drawings & Prototype Intelligence',
    description: 'Hardware prototypes, TRL ratings, patent drawings, sheet management, and reference numeral annotations.',
    tables: [
      {
        name: 'Prototype',
        purpose: 'Tracks physical and digital prototypes, Technology Readiness Levels (TRL), and bill of materials.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Prototype record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Prototype model name' },
          { name: 'trlLevel', type: 'Int', constraints: 'Default 3', desc: 'Technology Readiness Level (1-9)' },
          { name: 'billOfMaterials', type: 'Json', constraints: 'Nullable', desc: 'Hardware components and bill of materials' },
          { name: 'testedMetrics', type: 'Json', constraints: 'Nullable', desc: 'Experimental testing results' },
        ],
      },
      {
        name: 'DrawingFigure',
        purpose: 'Official patent figures, block diagrams, schematic illustrations, and flowcharts.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Figure identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'figureNumber', type: 'String', constraints: 'Not Null', desc: 'Figure label (FIG. 1, FIG. 2A)' },
          { name: 'caption', type: 'String', constraints: 'Not Null', desc: 'Formal statutory figure caption' },
          { name: 'imageUrl', type: 'String', constraints: 'Not Null', desc: 'Cloudinary CDN high-res image URL' },
          { name: 'sheetNumber', type: 'Int', constraints: 'Default 1', desc: 'Official drawing sheet number' },
        ],
      },
      {
        name: 'DrawingComponent',
        purpose: 'Numbered reference numeral callouts on drawings (e.g. 102: Microcontroller).',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Component callout identifier' },
          { name: 'figureId', type: 'String', constraints: 'FK -> DrawingFigure(id)', desc: 'Target figure' },
          { name: 'referenceNumber', type: 'String', constraints: 'Not Null', desc: 'Reference numeral (e.g. 102, 104)' },
          { name: 'componentName', type: 'String', constraints: 'Not Null', desc: 'Technical part name' },
          { name: 'description', type: 'String', constraints: 'Nullable', desc: 'Function in figure' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 6: Prior Art Search, Classification & AI Intelligence',
    description: 'Prior art citations, semantic similarity scores, IPC taxonomy classifications, and Gemini AI diagnostic runs.',
    tables: [
      {
        name: 'Patent',
        purpose: 'External prior art cache and patent database search results.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Patent cache identifier' },
          { name: 'patentNumber', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Publication number (US10234567B2)' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Published patent title' },
          { name: 'abstract', type: 'String', constraints: 'Nullable', desc: 'Published patent abstract' },
          { name: 'publicationDate', type: 'DateTime', constraints: 'Nullable', desc: 'Date of patent publication' },
        ],
      },
      {
        name: 'PatentReference',
        purpose: 'Curated prior art citations, relevance scores, and novelty comparisons.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Reference citation identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Citing project' },
          { name: 'patentId', type: 'String', constraints: 'FK -> Patent(id)', desc: 'Cited patent record' },
          { name: 'relevanceScore', type: 'Float', constraints: 'Default 0.0', desc: 'Relevance score (0.00-1.00)' },
          { name: 'citationType', type: 'String', constraints: "Default 'PRIOR_ART'", desc: 'Type (PRIOR_ART, CLOSEST_ART)' },
        ],
      },
      {
        name: 'IPCClassification',
        purpose: 'International Patent Classification (IPC) taxonomy definitions.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'IPC code identifier' },
          { name: 'code', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Official IPC symbol (G06F 16/00)' },
          { name: 'description', type: 'String', constraints: 'Not Null', desc: 'Hierarchy description and scope' },
        ],
      },
      {
        name: 'PatentProjectIPC',
        purpose: 'Many-to-many junction mapping between projects and IPC classifications.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Junction identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'ipcId', type: 'String', constraints: 'FK -> IPCClassification(id)', desc: 'Assigned IPC code' },
        ],
      },
      {
        name: 'AIAnalysis',
        purpose: 'Gemini AI diagnostic runs, novelty evaluations, and automated claim suggestions.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Analysis run identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'analysisType', type: 'String', constraints: 'Not Null', desc: 'Type (NOVELTY_SEARCH, CLAIM_DRAFTING)' },
          { name: 'output', type: 'Json', constraints: 'Not Null', desc: 'Structured AI diagnostic output payload' },
          { name: 'safetyDisclaimer', type: 'String', constraints: 'Default disclaimer', desc: 'AI safety disclaimer' },
          { name: 'createdAt', type: 'DateTime', constraints: 'Default now()', desc: 'Timestamp of AI generation' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 7: Patent Filing Management & Legal Entities',
    description: 'Official legal entities, applicants, inventors, statutory IPO forms (Form 1, 2, 3, 5), deadlines, and filing events.',
    tables: [
      {
        name: 'Applicant',
        purpose: 'Legal entities or individuals holding legal ownership of the patent rights.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Applicant record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'name', type: 'String', constraints: 'Not Null', desc: 'Legal entity or individual name' },
          { name: 'nationality', type: 'String', constraints: 'Not Null', desc: 'Nationality or country of incorporation' },
          { name: 'address', type: 'String', constraints: 'Not Null', desc: 'Official postal address' },
          { name: 'isSmallEntity', type: 'Boolean', constraints: 'Default true', desc: 'MSME / Educational discount status' },
        ],
      },
      {
        name: 'Inventor',
        purpose: 'Legal inventors contributing to the technical novelty of the patent application.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Inventor legal identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'fullName', type: 'String', constraints: 'Not Null', desc: 'Full legal name' },
          { name: 'nationality', type: 'String', constraints: 'Not Null', desc: 'Nationality' },
          { name: 'address', type: 'String', constraints: 'Not Null', desc: 'Residential address' },
          { name: 'contributionPercentage', type: 'Float', constraints: 'Default 100.0', desc: 'Contribution percentage split' },
        ],
      },
      {
        name: 'PatentForm',
        purpose: 'Generated Indian Patent Office statutory forms (Form 1, 2, 3, 5).',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Form record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'formType', type: 'String', constraints: 'Not Null', desc: 'Form code (FORM_1, FORM_2, FORM_3, FORM_5)' },
          { name: 'status', type: 'String', constraints: "Default 'DRAFT'", desc: 'Status (DRAFT, GENERATED, SIGNED, FILED)' },
          { name: 'formData', type: 'Json', constraints: 'Not Null', desc: 'Auto-populated statutory payload' },
          { name: 'generatedPdfUrl', type: 'String', constraints: 'Nullable', desc: 'Official generated PDF download URL' },
        ],
      },
      {
        name: 'Deadline',
        purpose: 'Statutory deadlines, First Examination Report (FER) timelines, and office actions.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Deadline record identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'title', type: 'String', constraints: 'Not Null', desc: 'Milestone title (e.g. FER Response)' },
          { name: 'dueDate', type: 'DateTime', constraints: 'Not Null', desc: 'Statutory cutoff date' },
          { name: 'isCompleted', type: 'Boolean', constraints: 'Default false', desc: 'Completion status' },
        ],
      },
      {
        name: 'FilingEvent',
        purpose: 'History of patent submission events, filing dates, and official docket milestones.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Filing event identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'eventType', type: 'String', constraints: 'Not Null', desc: 'Event type (APPLICATION_FILED, CBR_ISSUED)' },
          { name: 'docketNumber', type: 'String', constraints: 'Nullable', desc: 'Official IPO / USPTO application number' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 8: Expert Review & Quality Assurance',
    description: 'Formal academic Guide approvals, Patent Expert quality audits, structured rubrics, and feedback.',
    tables: [
      {
        name: 'ProjectReview',
        purpose: 'Formal peer reviews, Guide approvals, and Patent Expert audit reports.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Review ticket identifier' },
          { name: 'projectId', type: 'String', constraints: 'FK -> PatentProject(id)', desc: 'Associated project' },
          { name: 'reviewerId', type: 'String', constraints: 'FK -> User(id)', desc: 'Reviewer user account' },
          { name: 'stage', type: 'String', constraints: 'Not Null', desc: 'Stage reviewed (DRAFTING, CLAIMS, FILING)' },
          { name: 'status', type: 'String', constraints: "Default 'PENDING'", desc: 'Decision (PENDING, APPROVED, CHANGES_REQUESTED)' },
          { name: 'feedback', type: 'String', constraints: 'Not Null', desc: 'Qualitative critique and guidance' },
          { name: 'rating', type: 'Int', constraints: 'Nullable', desc: 'Rating score (1 to 5 stars)' },
          { name: 'checklistAnswers', type: 'Json', constraints: 'Nullable', desc: 'Structured compliance rubric responses' },
          { name: 'reviewedAt', type: 'DateTime', constraints: 'Nullable', desc: 'Timestamp of review decision' },
        ],
      },
    ],
  },
  {
    moduleName: 'Module 9: Subscriptions, Payments & Entitlements',
    description: 'Tiered SaaS subscription catalog, active institutional subscriptions, 14-day trials, Razorpay payments, feature quotas, and webhooks.',
    tables: [
      {
        name: 'SubscriptionPlan',
        purpose: 'Catalog of tiered subscription plans (Community, Scholar Pro, Campus Enterprise).',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Plan identifier' },
          { name: 'name', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Plan tier name' },
          { name: 'price', type: 'Float', constraints: 'Not Null', desc: 'Subscription price' },
          { name: 'billingCycle', type: 'String', constraints: "Default 'MONTHLY'", desc: 'Cycle (MONTHLY, ANNUAL)' },
        ],
      },
      {
        name: 'Subscription',
        purpose: 'Active institutional or user billing subscription instances.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Subscription record identifier' },
          { name: 'organizationId', type: 'String', constraints: 'FK -> Organization(id), Nullable', desc: 'Subscribed organization' },
          { name: 'planId', type: 'String', constraints: 'FK -> SubscriptionPlan(id)', desc: 'Associated plan' },
          { name: 'status', type: 'String', constraints: "Default 'ACTIVE'", desc: 'State (ACTIVE, PAST_DUE, CANCELED)' },
          { name: 'currentPeriodEnd', type: 'DateTime', constraints: 'Not Null', desc: 'Expiration / renewal date' },
        ],
      },
      {
        name: 'Trial',
        purpose: 'Tracks 14-day institutional trial periods and expiration trackers.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Trial record identifier' },
          { name: 'organizationId', type: 'String', constraints: 'UNIQUE, FK -> Organization(id)', desc: 'Target organization' },
          { name: 'startDate', type: 'DateTime', constraints: 'Default now()', desc: 'Trial inception date' },
          { name: 'endDate', type: 'DateTime', constraints: 'Not Null', desc: 'Trial expiration date' },
          { name: 'status', type: 'String', constraints: "Default 'ACTIVE'", desc: 'State (ACTIVE, EXPIRED, CONVERTED)' },
        ],
      },
      {
        name: 'Payment',
        purpose: 'Transaction receipts, payment gateway IDs, and invoices.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Payment transaction identifier' },
          { name: 'subscriptionId', type: 'String', constraints: 'FK -> Subscription(id)', desc: 'Parent subscription' },
          { name: 'amount', type: 'Float', constraints: 'Not Null', desc: 'Payment amount' },
          { name: 'currency', type: 'String', constraints: "Default 'INR'", desc: 'Currency code (INR, USD)' },
          { name: 'gatewayPaymentId', type: 'String', constraints: 'UNIQUE, Nullable', desc: 'Razorpay / Stripe payment ID' },
          { name: 'status', type: 'String', constraints: "Default 'PAID'", desc: 'State (PAID, FAILED, REFUNDED)' },
        ],
      },
      {
        name: 'Entitlement',
        purpose: 'Feature gate quotas (maximum projects, AI generation limits, storage limit).',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Entitlement identifier' },
          { name: 'organizationId', type: 'String', constraints: 'FK -> Organization(id)', desc: 'Target organization' },
          { name: 'featureKey', type: 'String', constraints: 'Not Null', desc: 'Feature quota key' },
          { name: 'quotaLimit', type: 'Int', constraints: 'Not Null', desc: 'Numerical limit value' },
        ],
      },
      {
        name: 'WebhookEvent',
        purpose: 'Idempotency tracking for payment gateway webhooks.',
        columns: [
          { name: 'id', type: 'String', constraints: 'PK, UUID', desc: 'Webhook event identifier' },
          { name: 'eventId', type: 'String', constraints: 'UNIQUE, Not Null', desc: 'Provider unique event ID' },
          { name: 'provider', type: 'String', constraints: 'Not Null', desc: 'Payment gateway provider (RAZORPAY)' },
          { name: 'status', type: 'String', constraints: "Default 'PROCESSED'", desc: 'Status (PENDING, PROCESSED)' },
        ],
      },
    ],
  },
];

// --- Helpers to Build DOCX Document ---
const PRIMARY_COLOR = '1E3A8A'; // Deep Navy
const HEADER_BG = '0F766E';    // Deep Teal
const BORDER_COLOR = 'CBD5E1'; // Slate 300
const ALT_BG = 'F8FAFC';       // Slate 50

function createHeaderCell(text, widthPercent) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: 'FFFFFF',
            font: 'Calibri',
            size: 20, // 10pt
          }),
        ],
      }),
    ],
  });
}

function createDataCell(text, widthPercent, isCode = false, isAlt = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: isAlt ? { type: ShadingType.CLEAR, fill: ALT_BG } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || '',
            font: isCode ? 'Consolas' : 'Calibri',
            size: 19, // 9.5pt
            bold: isCode,
            color: isCode ? '0F172A' : '334155',
          }),
        ],
      }),
    ],
  });
}

function buildDocxTable(columns) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell('Column Name', 25),
      createHeaderCell('Data Type', 18),
      createHeaderCell('Constraints / Keys', 25),
      createHeaderCell('Description', 32),
    ],
  });

  const dataRows = columns.map((col, idx) => {
    const isAlt = idx % 2 === 1;
    return new TableRow({
      children: [
        createDataCell(col.name, 25, true, isAlt),
        createDataCell(col.type, 18, false, isAlt),
        createDataCell(col.constraints, 25, false, isAlt),
        createDataCell(col.desc, 32, false, isAlt),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

async function generate() {
  console.log('Generating PatentHub AI Database Document (.docx)...');

  const children = [];

  // Document Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: 'PatentHub AI',
          bold: true,
          size: 48, // 24pt
          color: PRIMARY_COLOR,
          font: 'Calibri',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'Comprehensive Database Design & Relational Entity Dictionary (43 Tables)',
          bold: true,
          size: 28, // 14pt
          color: '475569',
          font: 'Calibri',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'This document provides the exhaustive relational database architecture for the PatentHub AI full-stack platform. It covers all 43 database tables (Prisma ORM models) mapped across 9 modular subsystems: Authentication, Organization Governance, Project Workspace, Patent Studio Drafting, Drawing Intelligence, Prior Art Analysis, Patent Filing, Expert Reviews, and SaaS Subscriptions.',
          size: 22,
          font: 'Calibri',
          color: '334155',
        }),
      ],
    })
  );

  // Master Summary Table
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 140 },
      children: [
        new TextRun({
          text: '1. Master Table of Database Entities',
          bold: true,
          size: 28,
          color: PRIMARY_COLOR,
          font: 'Calibri',
        }),
      ],
    })
  );

  const masterHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell('#', 8),
      createHeaderCell('Table / Entity', 26),
      createHeaderCell('Functional Module', 30),
      createHeaderCell('Primary Architectural Purpose', 36),
    ],
  });

  let counter = 1;
  const masterRows = [];
  modulesData.forEach((mod) => {
    mod.tables.forEach((tbl) => {
      const isAlt = counter % 2 === 0;
      masterRows.push(
        new TableRow({
          children: [
            createDataCell(String(counter++), 8, false, isAlt),
            createDataCell(tbl.name, 26, true, isAlt),
            createDataCell(mod.moduleName.split(':')[1].trim(), 30, false, isAlt),
            createDataCell(tbl.purpose, 36, false, isAlt),
          ],
        })
      );
    });
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [masterHeaderRow, ...masterRows],
    })
  );

  // Modular Schema Breakdown
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 140 },
      children: [
        new TextRun({
          text: '2. Detailed Entity Attributes & Schema Specifications',
          bold: true,
          size: 28,
          color: PRIMARY_COLOR,
          font: 'Calibri',
        }),
      ],
    })
  );

  modulesData.forEach((mod) => {
    // Module Heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 80 },
        children: [
          new TextRun({
            text: mod.moduleName,
            bold: true,
            size: 24, // 12pt
            color: '0F766E',
            font: 'Calibri',
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: mod.description,
            size: 21,
            italic: true,
            color: '64748B',
            font: 'Calibri',
          }),
        ],
      })
    );

    mod.tables.forEach((tbl) => {
      // Table Title
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({
              text: `Table: ${tbl.name}`,
              bold: true,
              size: 22,
              color: '1E293B',
              font: 'Calibri',
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `Purpose: ${tbl.purpose}`,
              size: 20,
              color: '475569',
              font: 'Calibri',
            }),
          ],
        })
      );

      children.push(buildDocxTable(tbl.columns));

      children.push(new Paragraph({ spacing: { after: 160 } }));
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const docxOutputPath = path.resolve(__dirname, '../PatentHub_AI_Database_Tables.docx');
  fs.writeFileSync(docxOutputPath, buffer);
  console.log('DOCX generated at:', docxOutputPath);

  // Also generate DATABASE_TABLES.md
  generateMarkdown();
}

function generateMarkdown() {
  let md = '# PatentHub AI — Database Design & Schema Dictionary\n\n';
  md += 'This document provides the exhaustive relational database architecture for **PatentHub AI**. It details all **43 database entities** (Prisma ORM models) grouped across 9 subsystems.\n\n';

  md += '## 1. Master Table of Database Entities (43 Tables)\n\n';
  md += '| # | Table / Entity Name | Functional Module | Primary Purpose |\n';
  md += '| :- | :--- | :--- | :--- |\n';

  let count = 1;
  modulesData.forEach((mod) => {
    mod.tables.forEach((tbl) => {
      md += `| ${count++} | **\`${tbl.name}\`** | ${mod.moduleName.split(':')[1].trim()} | ${tbl.purpose} |\n`;
    });
  });

  md += '\n---\n\n## 2. Detailed Schema Tables by Module\n\n';

  modulesData.forEach((mod) => {
    md += `### ${mod.moduleName}\n\n*${mod.description}*\n\n`;
    mod.tables.forEach((tbl) => {
      md += `#### Table: \`${tbl.name}\`\n\n**Purpose**: ${tbl.purpose}\n\n`;
      md += '| Column Name | Data Type | Constraints / Keys | Description |\n';
      md += '| :--- | :--- | :--- | :--- |\n';
      tbl.columns.forEach((col) => {
        md += `| \`${col.name}\` | ${col.type} | ${col.constraints} | ${col.desc} |\n`;
      });
      md += '\n';
    });
    md += '---\n\n';
  });

  const mdOutputPath = path.resolve(__dirname, '../DATABASE_TABLES.md');
  fs.writeFileSync(mdOutputPath, md, 'utf8');
  console.log('Markdown generated at:', mdOutputPath);
}

generate().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
