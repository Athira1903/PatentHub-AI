# Task 9 — Step 2: Claim CRUD + Dependency Validation Report

**Project:** PatentHub-AI  
**Task 9:** AI Patent Claims Engineering & Preliminary FTO Claim Chart Engine  
**Phase:** Step 2 — Claim CRUD & Hierarchical Dependency Graph Validation  
**Date:** 2026-08-16  

---

## 1. Files Created & Modified

### Created Files
1. **[claimService.ts](file:///d:/PatentHub-AI/server/src/services/claimService.ts)**:
   - Full CRUD service implementation for patent claims.
   - Directed acyclic graph (DAG) cycle detection engine (`hasDependencyCycle`).
   - Project-scoped uniqueness validation, dependency resolution, safe deletion checks, and transactional reordering.
2. **[claimController.ts](file:///d:/PatentHub-AI/server/src/controllers/claimController.ts)**:
   - Express controller handlers with parameter validation and structured HTTP responses.
3. **[claimRoutes.ts](file:///d:/PatentHub-AI/server/src/routes/claimRoutes.ts)**:
   - Route definitions mounted with project policy guards.
4. **[claim.policy.ts](file:///d:/PatentHub-AI/server/src/policies/claim/claim.policy.ts)**:
   - Role-based authorization policies (`canViewClaims`, `canCreateClaim`, `canEditClaim`, `canDeleteClaim`, `canReorderClaims`).

### Modified Files
1. **[projectRoutes.ts](file:///d:/PatentHub-AI/server/src/routes/projectRoutes.ts)**:
   - Mounted `claimRoutes` under `/:id/claims`.
2. **[policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts)**:
   - Added 20 automated unit and policy tests covering Claim CRUD, dependency hierarchy, cycle detection, reordering, and authorization.

---

## 2. API Endpoints Implemented

| Method | Route | Authorization Policy | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:id/claims` | `ClaimPolicy.canViewClaims` | Retrieve all claims for a project ordered by `orderIndex` asc, `claimNumber` asc. |
| `GET` | `/api/projects/:id/claims/:claimId` | `ClaimPolicy.canViewClaims` | Retrieve a specific claim with its attached claim elements and drawing tags. |
| `POST` | `/api/projects/:id/claims` | `ClaimPolicy.canCreateClaim` | Create an independent or dependent claim with dependency validation. |
| `PUT` | `/api/projects/:id/claims/:claimId` | `ClaimPolicy.canEditClaim` | Update an existing claim while preserving its unique ID and preventing invalid dependencies. |
| `DELETE` | `/api/projects/:id/claims/:claimId` | `ClaimPolicy.canDeleteClaim` | Safely delete a claim (rejects if child dependent claims exist). |
| `POST` | `/api/projects/:id/claims/reorder` | `ClaimPolicy.canReorderClaims` | Transactionally reorder claim positions by `orderIndex` without altering `claimNumber`. |

---

## 3. Claim Validation Rules

1. **Independent Claims**:
   - `claimType === 'INDEPENDENT'`
   - `dependsOnNumber` must be `null` (rejects if provided).
2. **Dependent Claims**:
   - `claimType === 'DEPENDENT'`
   - `dependsOnNumber` must be a positive integer referencing an existing claim within the same project.
   - Self-dependency (`dependsOnNumber === claimNumber`) is rejected.
   - Forward dependencies or non-existent parent claims are rejected.
3. **Claim Number Uniqueness**:
   - `claimNumber` must be a positive integer ($> 0$).
   - Must be unique per project.
   - Supports non-sequential numbering (e.g. 10, 25, 42) to accommodate realistic draft iterations.
4. **Body Content**:
   - `body` cannot be empty. Text fields are trimmed.

---

## 4. Dependency Graph & Cycle Detection Behavior

- Implemented in `ClaimService.hasDependencyCycle`:
  - Models claim dependencies as a functional directed graph ($V, E$) where each dependent claim has at most one outgoing parent pointer.
  - Detects immediate self-loops ($1 \rightarrow 1$), direct cycles ($1 \rightarrow 2 \rightarrow 1$), and multi-level indirect cycles ($1 \rightarrow 2 \rightarrow 3 \rightarrow 1$).
  - Validates hypothetical graph before persisting any claim creation or update.

---

## 5. Deletion & Reordering Behavior

- **Safe Deletion (Option A)**:
  - Deletion is permitted if no other claims depend on the target claim.
  - If dependent claims exist, deletion is rejected with a clear error listing dependent claim numbers (e.g., *"Cannot delete claim 1 because other claims (2, 3) depend on it. Remove or reassign dependencies first."*).
  - Deletion cascades cleanly to remove child `ClaimElement` records.
- **Reordering**:
  - `reorderClaims` validates that all provided IDs belong to the current project, contains no duplicates, and includes all project claims.
  - Executes a database transaction updating `orderIndex` values $(0, 1, 2, \dots)$.
  - `claimNumber` values remain strictly preserved.

---

## 6. Authorization & Role Isolation

- **View Access**: Any authorized project member (`OWNER`, `ADMIN`, `INVENTOR`, `CO_INVENTOR`, `GUIDE`, `PATENT_EXPERT`).
- **Mutation Access**: Restricted to `OWNER`, `ADMIN`, `INVENTOR`, `CO_INVENTOR`.
- **Project Boundary**: All queries verify `projectId` ownership. Accessing or referencing claims across tenant project boundaries is rejected.

---

## 7. Tests Added (20 Scenarios)

1. `Task 9 (2.1)`: Create independent claim successfully.
2. `Task 9 (2.2)`: Create dependent claim referencing valid parent.
3. `Task 9 (2.3)`: Reject dependent claim without `dependsOnNumber`.
4. `Task 9 (2.4)`: Reject independent claim with `dependsOnNumber`.
5. `Task 9 (2.5)`: Reject self-dependency on creation.
6. `Task 9 (2.6)`: Reject nonexistent parent dependency.
7. `Task 9 (2.7)`: Reject cross-project parent dependency (tenant isolation).
8. `Task 9 (2.8)`: Reject dependency cycle during creation.
9. `Task 9 (2.9)`: Allow multi-level dependency tree.
10. `Task 9 (2.10)`: Allow non-sequential claim numbers.
11. `Task 9 (2.11)`: Reject duplicate claim number within project.
12. `Task 9 (2.12)`: Update claim while preserving claim ID.
13. `Task 9 (2.13)`: Reject update that introduces a dependency cycle.
14. `Task 9 (2.14)`: Delete claim successfully when no dependents exist.
15. `Task 9 (2.15)`: Reject deletion when dependent claims exist.
16. `Task 9 (2.16)`: Reorder claims successfully and preserve claim numbers.
17. `Task 9 (2.17)`: Reject duplicate IDs in reorder request.
18. `Task 9 (2.18)`: Reject foreign-project claim IDs during reorder.
19. `Task 9 (2.19)`: Enforce project isolation in `getClaimById`.
20. `Task 9 (2.20)`: Verify role authorization (inventor can edit, guide can view, outsider rejected).

---

## 8. Verification Results

- **Backend TypeScript Check**: `npx.cmd tsc --noEmit` $\rightarrow$ **PASS (0 errors)**.
- **Frontend TypeScript Check**: `npx.cmd tsc -b` $\rightarrow$ **PASS (0 errors)**.
- **Frontend Production Build**: `npm.cmd run build` $\rightarrow$ **PASS (built in 983ms)**.
- **Policy Test Suite**: `npx.cmd ts-node src/tests/policies.test.ts` $\rightarrow$ **97/97 passed, 0 failed**.
- **Git Diff & Formatting**: `git diff --check server/src/` $\rightarrow$ **PASS (0 whitespace errors)**.

---

## 9. Status & Next Step

**TASK 9 STEP 2 STATUS:**  
**PASS**

**SAFE TO PROCEED TO STEP 3:**  
**YES**
