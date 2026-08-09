# Project Membership & Collaboration Audit

This document details the architectural audit of the project membership, invitation, and collaboration flows in **PatentHub-AI** (TASK 2).

---

## 1. Current Membership Creation Paths

There are two parallel paths through which a `ProjectMember` can be created:

### Path A: The Invitation Flow (Preferred)
1.  **Creation:** Project Owner (or GUIDE member) sends an invitation using `POST /api/collaboration/invite`.
2.  **State:** A pending `Invitation` record is created.
3.  **Acceptance:** The receiver accepts using `POST /api/collaboration/respond`.
4.  **Addition:** A `ProjectMember` record is created with the role copied from `Invitation.role`.

### Path B: Direct Member Addition (Alternative)
1.  **Creation:** Project Owner adds a user directly using `POST /api/projects/:id/members`.
2.  **Addition:** `projectController.inviteMember` is invoked and directly calls `ProjectService.inviteMemberByUsername`, which immediately writes a `ProjectMember` record without any intermediate invitation or acceptance flow.

---

## 2. Tracing Current Invitation Flow

### Invitation Creation Flow (`POST /api/collaboration/invite`):
1.  Verifies the logged-in user is authorized to invite (Owner, Guide, or Admin) using `InvitationPolicy.canInvite`.
2.  Verifies invitee exists, is not the inviter, is not already a member, and has no pending invitations.
3.  Creates a new `Invitation` record in status `PENDING`.
4.  Sends an `INVITATION` notification to the receiver.
5.  Logs the activity.

### Invitation Acceptance Flow (`POST /api/collaboration/respond`):
1.  Verifies user authentication.
2.  Fetches `Invitation` by ID.
3.  Changes `Invitation.status` to `ACCEPTED` or `REJECTED`.
4.  **If ACCEPTED:** Creates `ProjectMember` for the user, sends a notification back to the sender, and logs the activity.
    *   **Vulnerability:** This flow is **not transactional**. If creating `ProjectMember` fails, the invitation is already marked `ACCEPTED` and cannot be retried.

---

## 3. Risk and Validation Audit

### Duplicate Membership Risks:
*   **Database Level:** Safe. The database schema has a `@@unique([projectId, userId])` constraint on the `ProjectMember` table. This prevents duplicate rows.
*   **Application Level:** Vulnerable. If a duplicate membership is attempted, Prisma throws a raw database constraint error, causing a `500 Internal Server Error` instead of returning a user-friendly `400 Bad Request`.

### Duplicate Invitation Risks:
*   **Application Level:** Currently checked in `InvitationPolicy.canInvite` when creating a new invitation, but **not** checked in `respondToInvitation` or `inviteMemberByUsername` directly. We must ensure consistency across both controllers.

### Role Assignment Behavior:
*   The role from `Invitation.role` is successfully mapped to `ProjectMember.role`. The user's global platform role is completely independent.

### Organization vs. Project Membership Behavior:
*   There is no separate `Organization` model in `schema.prisma`. Organization is stored as text metadata (`institution` / `organization`) on `User` and `Profile`.
*   Project membership is entirely independent of any global organization checks. This matches the desired architecture.

### External-User Behavior:
*   Any registered system user (regardless of institution metadata) can be invited to any project. They are not automatically added to the inviter's organization/institution, preserving clean boundaries.

### Project-Owner Behavior:
*   Project ownership is stored as `ownerId` in the `PatentProject` model, representing a project-scoped property rather than a global role. This works correctly.

### Leave-Project / Member Removal Behavior:
*   Policy rules (`MembershipPolicy.canLeaveProject` and `MembershipPolicy.canRemoveMember`) are defined, but no API routes, controllers, or frontend elements are implemented to expose this functionality.

### Notification Behavior:
*   Notifications are created upon sending, accepting, and rejecting invitations. They function correctly.

### Authorization Problems:
*   We resolved global role leaks in Task 1, but we must make sure all new routes also use project roles.

### Existing Tests:
*   `policies.test.ts` verifies invitation authorization policies, but does not cover transactional safety, duplicate acceptance blocks, or multi-role acceptance scenarios.

---

## 4. Remediation Plan

### Exact Files That Need Modification:
1.  **[collaborationController.ts](file:///d:/PatentHub-AI/server/src/controllers/collaborationController.ts):** Wrap status updates and membership creation inside `prisma.$transaction`. Add validations to prevent responding to non-existent, already-responded, or mismatched invitations.
2.  **[projectService.ts](file:///d:/PatentHub-AI/server/src/services/projectService.ts):** Harden `inviteMemberByUsername` to validate roles, block self-addition, and handle duplicate memberships with descriptive error responses.
3.  **[policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts):** Add unit tests for transactional response handling, duplicate protection, and multi-role operations.

### Is a Prisma Database Migration Required?
*   **NO**. The database schema already enforces `@@unique([projectId, userId])` on `ProjectMember`. No database changes or migrations are needed.

---

## 5. Audit Classification

*   **A. SAFE AS-IS:**
    *   Database Schema unique constraints.
    *   Independent project-scoped ownership.
    *   Loose metadata-based organization boundaries.
*   **B. MUST FIX:**
    *   State inconsistency in invitation acceptance (missing transaction wrapper).
    *   Lack of duplicate membership verification inside the invitation acceptance handler (causes raw 500 error instead of 400 validation error).
    *   Role validation and self-addition checks inside the direct membership service method.
*   **C. OPTIONAL/FUTURE:**
    *   Implementing routes/controllers/UI for leaving a project or removing a project member (policies exist but are currently unused).
*   **D. DATABASE MIGRATION REQUIRED?**
    *   **NO**
