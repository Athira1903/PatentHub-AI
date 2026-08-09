# Policy-Based Authorization Architecture

This document describes the Policy-Based Authorization Architecture implemented in the PatentHub AI backend. This design separates business rules and access control checks from Express routing and business services, creating a clean, central, and enterprise-grade security layer.

---

## 1. Request Flow Overview

Every API request follows a strict path from the client to the database response, passing through authentication, resource pre-fetching, and policy validation:

```
[Client Request]
       │
       ▼
[Express Router]
       │
       ▼
[authenticateToken]  <-- Authenticates JWT, attaches `req.user`
       │
       ▼
[policyGuard / authorize] <-- Fetches resource (e.g. project) and calls Policy
       │
       ├─► (Deny: 403 Forbidden / 401 Unauthorized)
       ▼
[Express Controller]  <-- Receives pre-fetched resource, executes thin handler
       │
       ▼
[Domain Service]      <-- Executes core business logic
       │
       ▼
[Prisma / Database]   <-- Saves or retrieves records
```

---

## 2. Middlewares

Access control is enforced at the route level via two generic middlewares located in `server/src/policies/middleware/`:

### `authorize.ts`
A generic middleware creator. It accepts a callback function that maps `(user, req)` to a boolean validation.
- **Usage Example:**
  ```typescript
  router.get('/list', authorize((user) => AuthenticationPolicy.isAdmin(user)), listUsers);
  ```

### `policyGuard.ts`
A context-aware middleware creator specifically designed for resource-based routes (e.g., `/projects/:id`).
- It automatically pre-fetches the `PatentProject` (including its members, documents, comments, tasks, and owner) from the database using parameters, body, or query IDs.
- It executes the policy evaluator with `(user, project, req)`.
- If access is approved, it attaches the loaded project to `req.project`, eliminating duplicate database queries in downstream controllers.
- **Usage Example:**
  ```typescript
  router.get('/:id', projectGuard(ProjectPolicy.canViewProject), getProjectById);
  ```

---

## 3. Centralized Policies

All policies contain only pure business rules and are located in `server/src/policies/`:

| Policy Class | File Path | Responsibilities |
|---|---|---|
| `AuthenticationPolicy` | `auth/AuthenticationPolicy.ts` | Login eligibility, email verification, OTP validity, password resets, account activation, system access checks, and Admin verification. |
| `ProjectPolicy` | `project/ProjectPolicy.ts` | Rules for creating, viewing, editing, deleting, and archiving patent projects, and task management. |
| `WorkflowPolicy` | `workflow/WorkflowPolicy.ts` | Enforces patent stage progression sequences without skipping stages, and maps stage transition permissions to project roles. |
| `DocumentPolicy` | `document/DocumentPolicy.ts` | Upload, download, deletion, and version replacement controls based on team member roles. |
| `PatentFormPolicy` | `forms/PatentFormPolicy.ts` | Validates dependencies between Forms (e.g., Form 2 requires Form 1) and checks mandatory forms for approval. |
| `ReviewPolicy` | `review/ReviewPolicy.ts` | Rules for Guide and Expert reviews, observations, approvals, and rejections. Restricts inventors from self-approval. |
| `InvitationPolicy` | `invitation/InvitationPolicy.ts` | Restricts invitations to Owner, Guide, or Admin. Checks duplicate invites, memberships, and platform role compatibility. |
| `NotificationPolicy` | `notification/NotificationPolicy.ts` | Rules controlling whether notification generation should trigger for specific users (filters out self-notifications). |
| `ReportPolicy` | `report/ReportPolicy.ts` | Prevents report generation unless all prerequisite stages, documents, and form approvals are complete. |
| `ProfilePolicy` | `profile/ProfilePolicy.ts` | Manages permissions for profile views, updates, and profile photo operations. |

---

## 4. How to Add New Policies

To extend the system with new policies, follow these steps:

### Step 1: Create a Policy Class
Create a new file in a relevant subfolder under `server/src/policies/` (e.g., `server/src/policies/task/TaskPolicy.ts`). Implement your rules as static methods:

```typescript
export class TaskPolicy {
  static canAssignTask(user: any, project: any): boolean {
    // Only Project Owners or Admins can assign tasks
    return project.ownerId === user.userId || user.role === 'Admin';
  }
}
```

### Step 2: Guard Routes Using Middlewares
Import your policy and guard the route in the appropriate Express Router using `authorize` or `projectGuard`:

```typescript
import { projectGuard } from '../policies/middleware/policyGuard';
import { TaskPolicy } from '../policies/task/TaskPolicy';

router.put('/:id/tasks/:taskId/assign', projectGuard(TaskPolicy.canAssignTask), assignTask);
```

### Step 3: Handle in Controller
In your controller, read the preloaded resource directly from the request object:

```typescript
export const assignTask = async (req: any, res: Response) => {
  // The project is already loaded and verified!
  const project = req.project; 
  // Perform business service operations...
};
```
