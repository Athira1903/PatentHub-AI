# TASK 7: Notifications, Activity Timeline & Task Assignment Pre-Implementation Audit

This document presents a comprehensive pre-implementation audit for **TASK 7: Notifications, Activity Timeline & Task Assignment** in the **PatentHub-AI** platform.

---

## 1. Current System Architecture

The **PatentHub-AI** platform has completed Tasks 1 through 6:
*   **Task 1 (Roles & Policy Engine):** Project-scoped permission policies (`ProjectPolicy`, `MembershipPolicy`, `DocumentPolicy`, `WorkflowPolicy`, `ReviewPolicy`, `PatentFormPolicy`).
*   **Task 2 (Membership & Invitations):** Project invitations, owner transfer rules, and transaction-wrapped membership mutations.
*   **Task 3 (AI Diagnostics & Gemini Integration):** Google Gemini (`gemini-1.5-flash`) specification drafting, similarity checks, and novelty evaluation.
*   **Task 4 (Patent Search & Prior Art):** USPTO PatentsView search API, offline fallback, and persistent `PatentReference` model.
*   **Task 5 (Filing Preparation & Readiness):** Persistent `PatentForm` and `ProjectReview` models, server-side PDF compiler (`PdfService.ts`), compliance auditor (`FilingReadinessService.ts`), and filing package exporter.
*   **Task 6 (Prototype & Technical Drawing Intelligence):** Persistent `Prototype`, `DrawingFigure`, and `DrawingComponent` models, Gemini Vision multi-modal analysis, and 2D figure sheet PDF generator.

---

## 2. Existing Functionality & Audit Findings

### 2.1 Database State (`server/prisma/schema.prisma`)
*   `ActivityLog` model exists with basic fields (`id`, `userId`, `projectId`, `action`, `createdAt`).
*   `Notification` model exists with basic fields (`id`, `userId`, `title`, `message`, `type`, `referenceId`, `isRead`, `createdAt`).
*   `Task` model exists with basic fields (`id`, `title`, `description`, `status`, `projectId`, `assignedToId`, `createdAt`, `updatedAt`).

### 2.2 Existing Endpoints & Logic
*   `collaborationController.ts` includes basic notification endpoints: `GET /api/collaboration/notifications` and `PUT /api/collaboration/notifications/:id/read`.
*   `projectController.ts` contains basic task endpoints: `POST /api/projects/:id/tasks`, `PUT /api/projects/:id/tasks/:taskId`, `DELETE /api/projects/:id/tasks/:taskId`.
*   **Identified Gaps for Task 7**:
    1.  **Activity Audit Timeline**: No dedicated `GET /api/projects/:id/activity` endpoint or structured metadata logging. Activity logs currently store plain text `action` without categorized event types (`DOCUMENT`, `PATENT`, `PROTOTYPE`, `REVIEW`, `WORKFLOW`, `FORM`, `TASK`).
    2.  **Notification System**: Missing `projectId` context on notifications, missing `metadata` JSON, missing `readAt` timestamp, missing `GET /api/notifications/unread-count`, and missing `PUT /api/notifications/read-all`.
    3.  **Task Management**: Tasks lack creator ID (`createdBy`), priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due dates (`dueDate`), completion timestamps (`completedAt`), and status options (`TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
    4.  **Automatic Event Integration**: Major workflow events (document upload, patent reference link/delete, AI analysis, prototype creation, vision analysis, review decision, filing readiness change) must automatically record structured activity logs and dispatch notifications to project members.

---

## 3. Task Boundary & Inventory Analysis

| Capability / Feature | Existing Status | Required Upgrade for Task 7 |
| :--- | :--- | :--- |
| **`ActivityLog` Model** | `PARTIAL` | Add `type`, `metadata` JSON, and `@@index([projectId, createdAt])`. |
| **`Notification` Model** | `PARTIAL` | Add `projectId`, `metadata` JSON, `readAt`, and `@@index([userId, isRead, createdAt])`. |
| **`Task` Model** | `PARTIAL` | Add `createdBy`, `priority`, `dueDate`, `completedAt`, and `@@index([projectId, status])`. |
| **`ActivityService`** | `MISSING` | Create `activityService.ts` for structured event logging & timeline retrieval. |
| **`NotificationService`** | `MISSING` | Create `notificationService.ts` for unified notification dispatch & inbox management. |
| **`TaskService` Upgrade** | `PARTIAL` | Upgrade task lifecycle management in `taskService.ts` / `projectService.ts`. |
| **Unread Notification Count API** | `MISSING` | Add `GET /api/notifications/unread-count`. |
| **Mark All Notifications Read API** | `MISSING` | Add `PUT /api/notifications/read-all`. |
| **Project Activity Timeline API** | `MISSING` | Add `GET /api/projects/:id/activity`. |
| **Event Triggers Integration** | `PARTIAL` | Wire automatic activity & notification triggers into all Task 1–6 service boundaries. |
| **Frontend Notification Bell & Inbox** | `PARTIAL` | Connect `NotificationsPage.tsx` and `DashboardLayout.tsx` badge to live unread count and mark-all-read. |
| **Frontend Project Activity Timeline** | `MISSING` | Add interactive timeline with category filter pills (`All`, `Documents`, `AI`, `Patents`, `Prototype`, `Reviews`, `Filing`, `Workflow`) in `ProjectDetailsPage.tsx`. |
| **Frontend Task Manager Upgrade** | `PARTIAL` | Upgrade `Collaboration` tab in `ProjectDetailsPage.tsx` with priority badges, assignee selector, due dates, and status filters. |

---

## 4. Database Extension Plan (`server/prisma/schema.prisma`)

Update existing models in `schema.prisma`:

```prisma
model ActivityLog {
  id        String         @id @default(uuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String?
  project   PatentProject? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  action    String
  type      String         @default("GENERAL") // DOCUMENT, PATENT, PROTOTYPE, REVIEW, WORKFLOW, FORM, TASK, GENERAL
  metadata  Json?
  createdAt DateTime       @default(now())

  @@index([projectId, createdAt])
}

model Notification {
  id          String         @id @default(uuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId   String?
  project     PatentProject? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  message     String         @db.Text
  type        String         @default("GENERAL") // INVITATION, TASK, REVIEW, DOCUMENT, PATENT, PROTOTYPE, WORKFLOW, GENERAL
  referenceId String?
  metadata    Json?
  isRead      Boolean        @default(false)
  readAt      DateTime?
  createdAt   DateTime       @default(now())

  @@index([userId, isRead, createdAt])
}

model Task {
  id          String        @id @default(uuid())
  title       String
  description String?       @db.Text
  status      String        @default("TODO") // TODO, IN_PROGRESS, COMPLETED, CANCELLED
  priority    String        @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  dueDate     DateTime?
  completedAt DateTime?
  projectId   String
  project     PatentProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy   String?
  assignedToId String?
  assignedTo   User?        @relation("TaskAssignee", fields: [assignedToId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([projectId, status])
  @@index([assignedToId])
}
```

---

## 5. API & Service Architecture

### 5.1 Activity Service (`server/src/services/activityService.ts`)
*   `logActivity(projectId, actorId, action, type, metadata)`: Logs structured project activity without storing secrets.
*   `getProjectActivityTimeline(projectId, filterType)`: Retrieves project audit events ordered by `createdAt desc`.

### 5.2 Notification Service (`server/src/services/notificationService.ts`)
*   `notifyUser(userId, projectId, title, message, type, referenceId, metadata)`: Creates single user notification.
*   `notifyProjectMembers(projectId, excludeUserId, title, message, type, referenceId, metadata)`: Dispatches notifications to all project members.
*   `getUserNotifications(userId)`: Lists user inbox items.
*   `getUnreadCount(userId)`: Returns total unread notifications for navbar badge.
*   `markNotificationRead(userId, notificationId)`: Marks single notification read with `readAt = new Date()`.
*   `markAllNotificationsRead(userId)`: Marks all user notifications read.

### 5.3 Task Service (`server/src/services/taskService.ts`)
*   `createTask(projectId, creatorId, data)`: Creates task with title, description, assignedToId, priority, dueDate.
*   `getProjectTasks(projectId, filterStatus)`: Retrieves project tasks.
*   `updateTask(projectId, taskId, data)`: Updates status, priority, description, assignedToId, or completedAt.
*   `deleteTask(projectId, taskId)`: Deletes task.

### 5.4 REST API Endpoints

#### Notifications
*   `GET /api/notifications` $\rightarrow$ User notification inbox.
*   `GET /api/notifications/unread-count` $\rightarrow$ Unread count for badge.
*   `PUT /api/notifications/:id/read` $\rightarrow$ Mark single notification read.
*   `PUT /api/notifications/read-all` $\rightarrow$ Mark all user notifications read.

#### Project Activity & Tasks
*   `GET /api/projects/:id/activity` $\rightarrow$ Project activity audit timeline.
*   `GET /api/projects/:id/tasks` $\rightarrow$ Project task list.
*   `POST /api/projects/:id/tasks` $\rightarrow$ Create project task.
*   `PUT /api/projects/:id/tasks/:taskId` $\rightarrow$ Update task.
*   `DELETE /api/projects/:id/tasks/:taskId` $\rightarrow$ Delete task.

---

## 6. Automatic Event Triggers Integration

Activity logging and notification dispatch will be integrated at service boundaries across Tasks 1–6:

1.  **Document Upload & Versioning (`documentController.ts`)**:
    *   Activity: `"Uploaded document [Name] (vX)"` (`DOCUMENT`).
    *   Notification: Sent to project owner and members.
2.  **Patent Reference Link & Delete (`patentController.ts` / `patentReferenceService.ts`)**:
    *   Activity: `"Linked patent reference USXXXXXXX"` (`PATENT`).
    *   Notification: Sent to project members.
3.  **Prototype & Figure Creation (`prototypeController.ts`)**:
    *   Activity: `"Created prototype record [Title]"` / `"Created FIG. X"` (`PROTOTYPE`).
    *   Notification: Sent to project members.
4.  **Gemini Vision & Figure Sheet PDF (`prototypeController.ts`)**:
    *   Activity: `"Ran Gemini Vision analysis on FIG. X"` / `"Generated Figure Sheet PDF"` (`PROTOTYPE`).
5.  **Review Request, Approval & Rejection (`reviewController.ts` / `reviewService.ts`)**:
    *   Activity: `"Submitted formal review decision [APPROVED/REJECTED]"` (`REVIEW`).
    *   Notification: Sent to inventor and project members.
6.  **Patent Forms & Filing Readiness (`formController.ts` / `reviewController.ts`)**:
    *   Activity: `"Saved Patent Form [Type]"` / `"Exported Filing Package"` (`FORM` / `FILING`).
    *   Notification: Sent to project team when readiness reaches 100%.

---

## 7. Security & Authorization

*   **Project Isolation**: Every activity query and task operation validates `projectId` matching under `projectGuard`.
*   **Notification Recipient Privacy**: `where: { userId }` strictly prevents users from viewing or marking other users' notifications.
*   **Zero Secrets**: Activity `metadata` JSON objects are sanitized to exclude API keys, tokens, passwords, or raw environment variables.
*   **Role Enforcement**: Task creation/deletion respects `ProjectPolicy.canCreateTask` / `canDeleteTask`.

---

## 8. Frontend Integration Architecture

1.  **Header / Navbar Notification Bell (`DashboardLayout.tsx`)**:
    *   Fetches `GET /api/notifications/unread-count`.
    *   Renders unread badge counter.
2.  **Notification Inbox Page (`NotificationsPage.tsx`)**:
    *   Renders list of notifications with "Mark All as Read" button (`PUT /api/notifications/read-all`).
3.  **Project Details Activity Audit Timeline (`ProjectDetailsPage.tsx`)**:
    *   Renders timeline feed under `Filing Timeline` or `Overview` with filter pills (`All`, `Documents`, `AI`, `Patents`, `Prototype`, `Reviews`, `Filing`, `Workflow`).
4.  **Project Task Manager (`ProjectDetailsPage.tsx`)**:
    *   Renders enhanced task list under `Collaboration` tab with priority badges (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), status selectors (`TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), due dates, and assignee select options.

---

## 9. Testing Strategy

Extend [policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts) with offline test suite covering:

1.  **Activity Log Creation & Categorization**: Test structured activity logging with types and metadata.
2.  **Project Activity Isolation**: Verify user from `Project B` cannot read `Project A` activity logs.
3.  **Notification Dispatch & Recipient Privacy**: Verify user only sees their own notifications.
4.  **Unread Count & Mark-All-Read**: Test inbox count decrement and mark-all-read mutations.
5.  **Task Lifecycle & Priority**: Test task creation with priority, due date, status updates, and completion timestamps.
6.  **Task Assignment Authorization**: Verify tasks cannot be assigned to non-project members.
7.  **Automatic Event Integration**: Verify review decisions and document uploads record activities and notify project members.

All tests execute 100% offline without network calls.

---

## 10. Dependency Analysis

*   **No New Packages Required!**
    *   Database: Prisma Client (already configured).
    *   Authentication: JWT middleware (already configured).
    *   Icons: `lucide-react` (already installed in `client`).

---

## 11. Exact Files Expected to Change

*   `server/prisma/schema.prisma`
*   `server/src/controllers/collaborationController.ts`
*   `server/src/controllers/projectController.ts`
*   `server/src/controllers/reviewController.ts`
*   `server/src/controllers/documentController.ts`
*   `server/src/controllers/patentController.ts`
*   `server/src/routes/collaborationRoutes.ts`
*   `server/src/routes/projectRoutes.ts`
*   `server/src/tests/policies.test.ts`
*   `client/src/pages/NotificationsPage.tsx`
*   `client/src/pages/ProjectDetailsPage.tsx`
*   `client/src/layouts/DashboardLayout.tsx`

---

## 12. Exact Files Expected to be Created

*   `server/src/services/activityService.ts`
*   `server/src/services/notificationService.ts`
*   `server/src/services/taskService.ts`
*   `TASK7_AUDIT.md`

---

## 13. Files That Must NOT Be Modified

*   `.env`
*   `server/src/config/db.ts`
*   `server/src/middleware/authMiddleware.ts`
*   Existing completed Task 1–6 policy files (`project.policy.ts`, `document.policy.ts`, `review.policy.ts`, `workflow.policy.ts`, `patent-form.policy.ts`, `patent-reference.policy.ts`).

---

## 14. Recommended Implementation Phases

1.  **Phase 1: Database Schema & Services**: Extend `ActivityLog`, `Notification`, and `Task` in `schema.prisma`; run `npx prisma generate`; build `activityService.ts`, `notificationService.ts`, and `taskService.ts`.
2.  **Phase 2: Controller & Route Endpoints**: Add notification unread count / mark-all-read endpoints in `collaborationController.ts` and project activity / task endpoints in `projectController.ts` / `projectRoutes.ts`.
3.  **Phase 3: Service Boundary Event Triggers**: Wire automatic activity logging & notification dispatch into review, document, patent, prototype, form, and readiness operations.
4.  **Phase 4: Frontend UI & Offline Test Suite**: Update `NotificationsPage.tsx`, `DashboardLayout.tsx`, and `ProjectDetailsPage.tsx` (Activity Timeline & Task Manager); extend `policies.test.ts`; verify clean builds.

---

TASK 7 STATUS: READY

### Concise Recommended Implementation Plan
The repository is **100% ready** for TASK 7. Proceed by applying schema updates to `ActivityLog`, `Notification`, and `Task` in `schema.prisma`, implementing `activityService.ts`, `notificationService.ts`, and `taskService.ts`, wiring event triggers into controllers, upgrading `NotificationsPage.tsx`, `DashboardLayout.tsx`, and `ProjectDetailsPage.tsx`, and adding unit tests to `policies.test.ts`.
