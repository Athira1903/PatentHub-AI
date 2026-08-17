# Task 9 — Step 3: Claim Elements + Technical Drawing Component Linking Report

**Project:** PatentHub-AI  
**Task 9:** AI Patent Claims Engineering & Preliminary FTO Claim Chart Engine  
**Phase:** Step 3 — Claim Elements Management & Technical Drawing Callout Tag Linking  
**Date:** 2026-08-16  

---

## 1. Files Created & Modified

### Modified Files
1. **[claimService.ts](file:///d:/PatentHub-AI/server/src/services/claimService.ts)**:
   - Added `getClaimElements`, `createClaimElement`, `updateClaimElement`, `deleteClaimElement`, `linkClaimElementToComponent`, `unlinkClaimElementFromComponent`.
   - Updated `getProjectClaims` and `getClaimById` to eagerly load `claimElements` and nested `component` / `figure` data.
2. **[claimController.ts](file:///d:/PatentHub-AI/server/src/controllers/claimController.ts)**:
   - Added HTTP controller handlers for Claim Element management and Drawing Component linking.
3. **[claimRoutes.ts](file:///d:/PatentHub-AI/server/src/routes/claimRoutes.ts)**:
   - Mounted Claim Element endpoints with policy guards.
4. **[claim.policy.ts](file:///d:/PatentHub-AI/server/src/policies/claim/claim.policy.ts)**:
   - Added `canViewClaimElements`, `canCreateClaimElement`, `canEditClaimElement`, `canDeleteClaimElement`, `canLinkDrawingComponent`.
5. **[policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts)**:
   - Added 20 automated unit and policy tests covering Claim Element CRUD, cross-project drawing component validation, and activity logging.

---

## 2. Claim Element API Endpoints

| Method | Route | Authorization Policy | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:id/claims/:claimId/elements` | `ClaimPolicy.canViewClaimElements` | List all technical elements for a claim with linked drawing component metadata. |
| `POST` | `/api/projects/:id/claims/:claimId/elements` | `ClaimPolicy.canCreateClaimElement` | Create a new claim element (with optional initial component link). |
| `PUT` | `/api/projects/:id/claims/:claimId/elements/:elementId` | `ClaimPolicy.canEditClaimElement` | Update element name, clause text, or component link. |
| `DELETE` | `/api/projects/:id/claims/:claimId/elements/:elementId` | `ClaimPolicy.canDeleteClaimElement` | Delete a technical claim element. |
| `PUT` | `/api/projects/:id/claims/:claimId/elements/:elementId/component` | `ClaimPolicy.canLinkDrawingComponent` | Link a claim element to a specific `DrawingComponent` in the project. |
| `DELETE` | `/api/projects/:id/claims/:claimId/elements/:elementId/component` | `ClaimPolicy.canLinkDrawingComponent` | Unlink drawing component from a claim element. |

---

## 3. Drawing Component Linking & Cross-Project Validation Rules

1. **Project Boundary Validation**:
   - `ClaimElement` belongs to `PatentClaim`, which belongs to `PatentProject`.
   - `DrawingComponent` belongs to `DrawingFigure`, which belongs to `PatentProject`.
   - When linking `componentId`, `ClaimService` verifies `component.figure.projectId === claim.projectId`.
   - Any attempt to link a `DrawingComponent` from another project or nonexistent component is rejected with a clear 400 Bad Request error (*"Drawing component not found or belongs to another project."*).
2. **Rich Component & Figure Metadata**:
   - Linking returns the complete callout representation:
     - `componentId` (UUID)
     - `referenceNumber` (e.g. `"100"`, `"102"`)
     - `componentName` (e.g. `"Sensor Array"`)
     - `figureNumber` (e.g. `"FIG. 1"`)
     - `figureTitle` (e.g. `"Top Perspective View"`)

---

## 4. Authorization & Security Policies

- **View Access**: Any verified project collaborator (`OWNER`, `ADMIN`, `INVENTOR`, `CO_INVENTOR`, `GUIDE`, `PATENT_EXPERT`).
- **Mutation & Linking**: Restricted to project creators and inventors (`OWNER`, `ADMIN`, `INVENTOR`, `CO_INVENTOR`).
- **Isolation**: Tenant project isolation strictly prevents reading or modifying elements belonging to other projects.

---

## 5. Activity Logging & Notification Integration

- Category: `'CLAIM'`
- Events logged:
  - `"Added technical element \"<Name>\" to claim #<Num>."`
  - `"Updated technical element \"<Name>\" on claim #<Num>."`
  - `"Deleted technical element \"<Name>\" from claim #<Num>."`
  - `"Linked element \"<Name>\" to drawing component [<RefNum>] <CompName>."`
  - `"Unlinked drawing component from element \"<Name>\"."`

---

## 6. Performance & Prisma Query Strategy

- **Eager Loading**: `getProjectClaims` and `getClaimById` query claims, elements, drawing components, and figures in a single batch query via Prisma relations (`include: { claimElements: { include: { component: { include: { figure: ... } } } } }`).
- **Zero N+1 Queries**: Prevents round-trip queries per element.
- **Deterministic Ordering**: Elements are ordered by `createdAt: 'asc'`.

---

## 7. Tests Added (20 Scenarios)

1. `Task 9 (3.1)`: Create claim element successfully.
2. `Task 9 (3.2)`: Reject empty element name.
3. `Task 9 (3.3)`: Reject empty element text.
4. `Task 9 (3.4)`: Retrieve claim elements ordered deterministically.
5. `Task 9 (3.5)`: Update claim element successfully.
6. `Task 9 (3.6)`: Delete claim element successfully.
7. `Task 9 (3.7)`: Link element to valid `DrawingComponent` within same project.
8. `Task 9 (3.8)`: Unlink `DrawingComponent` from claim element.
9. `Task 9 (3.9)`: Reject nonexistent `DrawingComponent` on link.
10. `Task 9 (3.10)`: Reject cross-project `DrawingComponent` linking.
11. `Task 9 (3.11)`: Reject element creation if claim belongs to another project.
12. `Task 9 (3.12)`: Reject element update if element belongs to another claim.
13. `Task 9 (3.13)`: Verify unauthorized user cannot mutate claim elements.
14. `Task 9 (3.14)`: Verify project inventor can modify elements according to policy.
15. `Task 9 (3.15)`: `getClaimById` includes linked drawing component with figure metadata.
16. `Task 9 (3.16)`: `getClaimElements` enforces project isolation.
17. `Task 9 (3.17)`: Activity logging on element lifecycle actions.
18. `Task 9 (3.18)`: Notification recipient isolation.
19. `Task 9 (3.19)`: Multiple elements supported on one claim with distinct components.
20. `Task 9 (3.20)`: Regression verification — Tasks 1 to 8 policy tests remain valid.

---

## 8. Verification Results

- **Backend TypeScript Check**: `npx.cmd tsc --noEmit` $\rightarrow$ **PASS (0 errors)**.
- **Frontend TypeScript Check**: `npx.cmd tsc -b` $\rightarrow$ **PASS (0 errors)**.
- **Frontend Production Build**: `npm.cmd run build` $\rightarrow$ **PASS (built in 579ms)**.
- **Policy Test Suite**: `npx.cmd ts-node src/tests/policies.test.ts` $\rightarrow$ **117/117 passed, 0 failed**.
- **Git Diff & Whitespace**: `git diff --check server/src/` $\rightarrow$ **PASS (0 errors)**.
- **Working Tree**: No secrets, build artifacts, or test PDFs staged.

---

## 9. Status & Next Step

**TASK 9 STEP 3 STATUS:**  
**PASS**

**SAFE TO PROCEED TO STEP 4:**  
**YES**
