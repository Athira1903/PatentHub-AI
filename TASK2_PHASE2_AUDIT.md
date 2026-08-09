# Invitation Creation & Direct Membership Audit (TASK 2 - PHASE 2)

This document audits the flows and validation rules for **Invitation Creation** and **Direct Membership Addition** in **PatentHub-AI**.

---

## 1. Trace of Flows

### Flow A: Invitation Creation
1.  **Call:** Project Owner or Guide calls `POST /api/collaboration/invite`.
2.  **Middleware Check:** Route middleware calls `InvitationPolicy.canInvite` to check sender rights.
3.  **Controller Action:** `collaborationController.inviteMember` resolves the receiver user by username and writes an `Invitation` in `PENDING` state.
4.  **Notification:** Dispatches notification of type `INVITATION` to invitee.

### Flow B: Direct Membership Addition
1.  **Call:** Project Owner calls `POST /api/projects/:id/members`.
2.  **Middleware Check:** Route middleware calls `projectGuard(ProjectPolicy.canAssignGuide)`.
3.  **Controller Action:** `projectController.inviteMember` calls `ProjectService.inviteMemberByUsername`, which immediately writes a `ProjectMember` record.
4.  **Verification:** Direct addition bypasses the normal invitation/acceptance workflow entirely.

---

## 2. Audit Findings & Risks

### Authorization Checks:
*   **Invitation Creation:** Correctly checked in `InvitationPolicy.canInvite`. Only project Owner, GUIDE members, or system-wide Admins are authorized.
*   **Direct Membership:** Checked in `projectGuard(ProjectPolicy.canAssignGuide)`. Only project Owner or system-wide Admins can call this endpoint.

### Role Validation:
*   **Leak:** Currently, neither `inviteMember` (collaboration) nor `inviteMemberByUsername` (project service) validates if the requested role string is a valid `ProjectRole` enum value at runtime. If an invalid value is passed, Prisma will fail with a raw database exception (causing a 500 error instead of a 400 validation error).

### Duplicate Membership Risks:
*   Checked in both policy/service layers. However, trying to add a duplicate member returns a Prisma exception instead of a clean, structured validation warning at the API controller level.

### Self-Addition Risks:
*   An owner or member attempting to invite themselves is blocked in the policy (`invitee.id === user.userId`), but this is not explicitly validated at the service layer for direct additions.

### Global-Role Dependencies:
*   None remain. We successfully removed all global-role dependencies in Task 1. Project role selection is fully preserved and project-scoped.

### Active Invitation Duplication:
*   If an invitation for user X on project Y already exists with status `PENDING`, sending another invitation should return a validation error instead of creating spam duplicates in the database.

### Direct Membership Endpoint Status:
*   The endpoint `POST /api/projects/:id/members` exists to support direct collaborator additions (e.g. for rapid setup by owners). It does not conflict with the invitation flow as long as:
    1.  It is strictly restricted to Owner or Admin.
    2.  It enforces the same duplicate and role checks.
    3.  It is documented as an administrative shortcut rather than the normal external path.

---

## 3. Recommended Fixes

1.  **Validate Project Roles:** Ensure requested roles are matched against `Object.values(ProjectRole)` before database write attempts.
2.  **Harden Controllers:** Update both `collaborationController.inviteMember` and `ProjectService.inviteMemberByUsername` to check for:
    *   Self-addition/invitation.
    *   Existing active pending invitations.
    *   Existing project memberships.
3.  **Graceful Errors:** Return clear `400 Bad Request` responses on validation failures instead of raw 500 database exceptions.
4.  **No Prisma Migration Required:** The schema already contains the necessary enums and constraints. All improvements will be made in the application layer.
