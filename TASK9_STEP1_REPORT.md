# Task 9 — Step 1: Database Foundation Report

**Project:** PatentHub-AI  
**Task 9:** AI Patent Claims Engineering & Preliminary FTO Claim Chart Engine  
**Phase:** Step 1 — Database Foundation & Schema Persistence Layer  
**Date:** 2026-08-16  

---

## 1. Schema Changes & New Models

The following 4 models have been integrated into [schema.prisma](file:///d:/PatentHub-AI/server/prisma/schema.prisma):

```prisma
model PatentClaim {
  id              String         @id @default(uuid())
  projectId       String
  project         PatentProject  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  claimNumber     Int            // 1, 2, 3...
  claimType       String         // "INDEPENDENT", "DEPENDENT"
  dependsOnNumber Int?           // Nullable (e.g. 1 for Claim 2 depending on Claim 1)
  preamble        String         // e.g. "An automated system comprising:"
  body            String         @db.Text
  status          String         @default("DRAFT") // DRAFT, REVIEWED, APPROVED
  orderIndex      Int            @default(0)
  linkedFigures   String?        // Comma-separated figure references, e.g. "FIG. 1, FIG. 2"
  claimElements   ClaimElement[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([projectId, claimNumber])
  @@index([projectId, orderIndex])
}

model ClaimElement {
  id            String              @id @default(uuid())
  claimId       String
  claim         PatentClaim         @relation(fields: [claimId], references: [id], onDelete: Cascade)
  elementName   String              // e.g. "Sensor Array"
  elementText   String              @db.Text
  componentId   String?
  component     DrawingComponent?   @relation(fields: [componentId], references: [id], onDelete: SetNull)
  chartMappings ClaimChartElement[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([claimId])
}

model ClaimChart {
  id          String              @id @default(uuid())
  projectId   String
  project     PatentProject       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  referenceId String
  reference   PatentReference     @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  overallRisk String              @default("LOW") // LOW, MEDIUM, HIGH
  summary     String?             @db.Text
  elements    ClaimChartElement[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@unique([projectId, referenceId])
  @@index([projectId])
}

model ClaimChartElement {
  id              String       @id @default(uuid())
  chartId         String
  chart           ClaimChart   @relation(fields: [chartId], references: [id], onDelete: Cascade)
  claimElementId  String
  claimElement    ClaimElement @relation(fields: [claimElementId], references: [id], onDelete: Cascade)
  priorArtFeature String       @db.Text
  overlapLevel    String       @default("NONE") // "NONE", "PARTIAL", "IDENTICAL", "EQUIVALENT"
  analysisNotes   String?      @db.Text
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([chartId])
  @@index([claimElementId])
}
```

---

## 2. Relationships Added

| Source Model | Target Model | Relation Type | Cascade Rule | Purpose |
| :--- | :--- | :---: | :---: | :--- |
| `PatentProject` | `PatentClaim` | One-to-Many (`patentClaims`) | `Cascade` | Deleting a project removes all associated claims. |
| `PatentProject` | `ClaimChart` | One-to-Many (`claimCharts`) | `Cascade` | Deleting a project removes all claim charts. |
| `PatentReference` | `ClaimChart` | One-to-Many (`claimCharts`) | `Cascade` | Deleting a prior art reference removes its associated claim charts. |
| `PatentClaim` | `ClaimElement` | One-to-Many (`claimElements`) | `Cascade` | Deleting a claim removes its dissected elements. |
| `DrawingComponent` | `ClaimElement` | One-to-Many (`claimElements`) | `SetNull` | Deleting a drawing figure component clears the reference without deleting the claim element. |
| `ClaimChart` | `ClaimChartElement` | One-to-Many (`elements`) | `Cascade` | Deleting a chart purges element-by-element mappings. |
| `ClaimElement` | `ClaimChartElement` | One-to-Many (`chartMappings`) | `Cascade` | Deleting a claim element removes its chart comparison records. |

---

## 3. Constraints & Indexes

1. **Compound Unique Constraints**:
   - `@@unique([projectId, claimNumber])`: Enforces unique sequential claim numbers within a patent project.
   - `@@unique([projectId, referenceId])`: Prevents duplicate claim charts for the same project and cited prior art patent reference.
2. **Performance Indexes**:
   - `@@index([projectId, orderIndex])` on `PatentClaim`: Enables fast ordered tree retrieval.
   - `@@index([claimId])` on `ClaimElement`: Enables instant sub-clause lookups per claim.
   - `@@index([projectId])` on `ClaimChart`: Optimizes project-level chart queries.
   - `@@index([chartId])` and `@@index([claimElementId])` on `ClaimChartElement`: Ensures rapid mapping queries across matrix elements.

---

## 4. Authorization & Security Considerations

- **Project Scoping**: All claims and claim charts are strictly children of `PatentProject`. All access and mutations will be scoped via `projectId` and verified using `ProjectPolicy.canViewProject` / `ProjectPolicy.canEditProject`.
- **Collaborator Roles**: Only project owners, co-inventors, and assigned guides/experts will be granted claims drafting and review capabilities.
- **Data Integrity**: Dependency constraints ensure dependent claims can only reference antecedent claims within the exact same project workspace.

---

## 5. Tests Added

6 comprehensive database foundation tests added to `server/src/tests/policies.test.ts`:
1. `Task 9: PatentClaim model validates independent claim creation and project isolation`
2. `Task 9: PatentClaim enforces unique claim numbering per project`
3. `Task 9: Dependent claim correctly references antecedent claim and rejects invalid self-dependency`
4. `Task 9: ClaimElement ownership and linkage to DrawingComponent`
5. `Task 9: ClaimChart enforces unique project-reference constraint and isolates overlap mappings`
6. `Task 9: Cascade deletion ensures removing project or claim safely cleans child elements`

---

## 6. Test Results

- **Prisma Client Generation**: `✔ Generated Prisma Client (v6.19.3)`
- **Backend TypeScript Compilation**: `npx.cmd tsc --noEmit` $\rightarrow$ **PASS (0 errors)**
- **Frontend TypeScript Compilation**: `npx.cmd tsc -b` $\rightarrow$ **PASS (0 errors)**
- **Automated Policy Tests**:
```
==================================================
POLICY TESTS COMPLETED: 77 passed, 0 failed.
==================================================
```

---

## 7. Issues Discovered & Resolved

- **Windows DLL File Lock**: Background process locking `query_engine-windows.dll.node` was safely unlocked, temporary files cleared, and `npx.cmd prisma generate` executed successfully.
- **Git Status Cleanliness**: Generated test PDFs from test execution were safely cleaned.

---

## 8. Readiness Verdict

> **STEP 1 IS 100% COMPLETE, FULLY VERIFIED, AND SAFE TO PROCEED TO STEP 2.**
