# TASK 6: Prototype & Technical Drawing Intelligence Pre-Implementation Audit

This document presents a comprehensive pre-implementation audit for **TASK 6: Prototype & Technical Drawing Intelligence** in the **PatentHub-AI** platform.

---

## 1. Current System Architecture

The **PatentHub-AI** platform has completed Tasks 1 through 5:
*   **Task 1 (Roles & Policy Engine):** Project-scoped permission policies (`ProjectPolicy`, `MembershipPolicy`, `DocumentPolicy`, `WorkflowPolicy`, `ReviewPolicy`, `PatentFormPolicy`).
*   **Task 2 (Membership & Invitations):** hardened project invitations, owner transfer rules, and transaction-wrapped membership mutations.
*   **Task 3 (AI Diagnostics & Gemini Integration):** Google Gemini (`gemini-1.5-flash`) integration for specification drafting, similarity checks, novelty evaluation, and basic drawing annotations.
*   **Task 4 (Patent Search & Prior Art):** USPTO PatentsView search API, offline `mockPatents.json` fallback, and `PatentReference` persistent model.
*   **Task 5 (Filing Preparation & Readiness):** Persistent `PatentForm` and `ProjectReview` models, server-side PDF compiler (`PdfService.ts`), 6-point compliance auditor (`FilingReadinessService.ts`), and consolidated filing package exporter.

---

## 2. Existing Prototype & Drawing Functionality

### 2.1 Database State
*   `ProjectStage` enum includes `PROTOTYPE`.
*   `Document` model supports prototype uploads using category strings (`PROTOTYPE_BLUEPRINT`, `PROTOTYPE_LOG`, `SUPPORTING`).
*   **Gap:** There are currently **no dedicated database models** for `Prototype`, `DrawingFigure`, or `DrawingComponent`. AI-generated drawing tags and figure metadata are currently unpersisted and lost on page reload.

### 2.2 Existing Backend APIs
*   `POST /api/projects/:id/ai/drawing` (`generatePatentDrawing` in `aiController.ts`): Invokes `AiService.generatePatentDrawingAnalysis()` using project title, innovation abstract, and proposed solution.
*   Returns JSON response containing figure number (`figNum`: `"FIG. 1"`), component tags (`components`: `[{ number: "102", label: "Component description" }]`), and placeholder image URLs (`originalUrl` / `patentDrawing`).

### 2.3 Existing AI Integration Capabilities
*   `AiService.generatePatentDrawingAnalysis()` sends a text prompt to Gemini (`gemini-1.5-flash`) requesting structured JSON component labels.
*   **Gap:** It currently does **NOT** accept binary image data for Gemini Vision analysis. Multi-modal vision capabilities exist in `@google/genai` but are not yet wired to process uploaded prototype photos or sketches.

### 2.4 Existing Storage Architecture
*   `documentController.ts` handles file uploads (`PDF`, `DOC`, `DOCX`, `PNG`, `JPG`, `JPEG`, `TXT` up to 20MB) using `multer` to `public/uploads/documents/`.
*   Saved files generate database `Document` records with clean internal URLs (`/uploads/documents/doc_...`).

### 2.5 Existing Frontend UI (`ProjectDetailsPage.tsx`)
*   `Prototype Module` tab renders prototype document lists, sketch upload inputs, preview canvases, and an AI Drawing trigger button (`triggerGenerateDrawing`).
*   **Gap:** Uses transient component array state (`drawingVersions`), Unsplash placeholder images, and does not persist figure annotations to PostgreSQL.

---

## 3. Task Boundary: Inventory & Gap Analysis

| Feature / Capability | Status | Action Required for Task 6 |
| :--- | :--- | :--- |
| **Project Authorization Guard** | `IMPLEMENTED` | Reuse `projectGuard` and `DocumentPolicy` / `ProjectPolicy`. |
| **File Storage Infrastructure** | `IMPLEMENTED` | Reuse `public/uploads/documents/` and `Document` storage system. |
| **Gemini Client Configuration** | `IMPLEMENTED` | Reuse `getGenAI()` in `AiService.ts`. |
| **`Prototype` Model** | `MISSING` | Create `Prototype` model in `schema.prisma`. |
| **`DrawingFigure` Model** | `MISSING` | Create `DrawingFigure` model in `schema.prisma`. |
| **`DrawingComponent` Model** | `MISSING` | Create `DrawingComponent` model in `schema.prisma`. |
| **Gemini Vision Image Analysis** | `MISSING` | Add `analyzePrototypeImageVision()` in `AiService.ts`. |
| **Server-Side Figure Sheet PDF Compilation** | `MISSING` | Add `generatePatentFigureSheetPdf()` in `PdfService.ts`. |
| **Prototype & Figure REST API** | `MISSING` | Create `prototypeService.ts`, `prototypeController.ts`, and register routes. |
| **Persisted Component Annotation UI** | `MISSING` | Upgrade `Prototype Module` tab in `ProjectDetailsPage.tsx` to read/write persistent figures and components. |

---

## 4. Database Extension Plan (`server/prisma/schema.prisma`)

Add three models and extend `PatentProject` and `Document`:

```prisma
// 1. Prototype Model
model Prototype {
  id           String          @id @default(uuid())
  projectId    String
  project      PatentProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title        String
  description  String?         @db.Text
  status       String          @default("DRAFT") // DRAFT, TESTING, COMPLETED
  version      Int             @default(1)
  figures      DrawingFigure[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

// 2. Drawing Figure Model (IPO/USPTO Figure Sheet)
model DrawingFigure {
  id               String             @id @default(uuid())
  prototypeId      String?
  prototype        Prototype?         @relation(fields: [prototypeId], references: [id], onDelete: Cascade)
  projectId        String
  project          PatentProject      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  figNumber        String             // "FIG. 1", "FIG. 2"
  title            String             // e.g. "Perspective Assembly View"
  description      String?            @db.Text
  originalImageUrl String?
  schematicUrl     String?
  documentId       String?            @unique
  document         Document?          @relation(fields: [documentId], references: [id], onDelete: SetNull)
  components       DrawingComponent[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@unique([projectId, figNumber])
}

// 3. Drawing Component Tag Model
model DrawingComponent {
  id          String        @id @default(uuid())
  figureId    String
  figure      DrawingFigure @relation(fields: [figureId], references: [id], onDelete: Cascade)
  tagNumber   String        // "100", "102", "104"
  label       String        // "Sensor Array"
  description String?       @db.Text
  xRatio      Float?        // Normalized X coordinate (0.0 to 1.0)
  yRatio      Float?        // Normalized Y coordinate (0.0 to 1.0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// 4. Relations to PatentProject and Document
model PatentProject {
  ...
  prototypes     Prototype[]
  drawingFigures DrawingFigure[]
}

model Document {
  ...
  drawingFigure  DrawingFigure?
}
```

---

## 5. API & Service Architecture

### 5.1 New Prototype & Figure Service (`server/src/services/prototypeService.ts`)
*   `createPrototype(projectId, title, description, status)`
*   `getProjectPrototypes(projectId)`
*   `createDrawingFigure(projectId, prototypeId, figNumber, title, originalImageUrl)`
*   `getDrawingFigures(projectId)`
*   `updateDrawingComponentTags(projectId, figureId, componentsArray)`
*   `deleteDrawingFigure(projectId, figureId)`

### 5.2 Gemini Vision Multi-Modal AI Analysis (`server/src/services/aiService.ts`)
*   Add `analyzePrototypeImageVision(imageBuffer, mimeType, projectContext)`:
    *   Sends image buffer as `inlineData` to `gemini-1.5-flash`.
    *   Requests structured JSON extracting component reference tags (`100`, `102`), visual component names, assembly descriptions, and spatial positioning hints.
    *   Includes graceful fallback if image is missing or API quota is exceeded.

### 5.3 Server-Side Patent Drawing Sheet PDF Compiler (`server/src/services/pdfService.ts`)
*   Add `generatePatentFigureSheetPdf(projectId, figureId)`:
    *   Uses `jspdf` to render an official IPO/USPTO 2D Drawing Sheet (A4 format, border margins, header `"FIG. 1 - [TITLE]"`, schematic bounding layout, component reference numbers `100`, `102`, and bottom reference legend table).
    *   Saves compiled PDF to `public/uploads/documents/` and registers a `Document` record in PostgreSQL.

### 5.4 REST API Endpoints (`server/src/controllers/prototypeController.ts`)
*   `GET    /api/projects/:id/prototypes` (Protected by `ProjectPolicy.canViewProject`)
*   `POST   /api/projects/:id/prototypes` (Protected by `DocumentPolicy.canUpload`)
*   `GET    /api/projects/:id/figures` (Protected by `ProjectPolicy.canViewProject`)
*   `POST   /api/projects/:id/figures` (Protected by `DocumentPolicy.canUpload`)
*   `PUT    /api/projects/:id/figures/:figId/components` (Protected by `DocumentPolicy.canEdit`)
*   `POST   /api/projects/:id/figures/:figId/ai-vision` (Protected by `DocumentPolicy.canEdit`)
*   `POST   /api/projects/:id/figures/:figId/render-sheet` (Protected by `DocumentPolicy.canUpload`)

---

## 6. Security & Authorization

*   **Project Isolation:** Every prototype, figure, and component tag operation requires `projectId` matching and is guarded by `projectGuard`.
*   **Role Enforcement:** `DocumentPolicy.canUpload` / `canEdit` ensures only project owners, editors (`INVENTOR`, `CO_INVENTOR`), or admins can create or update prototype figures and component tags. Viewers cannot modify figures.
*   **Upload Security:** Accepts image files (`.png`, `.jpg`, `.jpeg`) up to 20MB. Image buffers sent to Gemini Vision are processed in memory without executing shell commands or exposing OS paths.

---

## 7. Frontend Integration Architecture

In [ProjectDetailsPage.tsx](file:///d:/PatentHub-AI/client/src/pages/ProjectDetailsPage.tsx) under `Prototype Module`:

1.  **Persisted Figures Gallery**: Renders active `DrawingFigure` records saved in PostgreSQL instead of transient UI state.
2.  **Interactive Component Tag Editor**: Lists component tags (`100`, `102`, `104`) with edit/add/delete inputs.
3.  **AI Vision Diagnostic Button**: Triggers `POST /figures/:figId/ai-vision` to extract real visual component tags from uploaded sketch images via Gemini Vision.
4.  **Download Official Drawing Sheet**: Triggers server-side PDF generation for IPO/USPTO compliant 2D figure sheets.

---

## 8. Testing Strategy

Extend [policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts) with offline unit/integration test cases:

1.  **Prototype & Figure Creation**: Create prototype records and verify project isolation.
2.  **Role Authorization**: Verify viewers cannot create figures or edit component tags.
3.  **Component Tag Persistence**: Save and retrieve structured `DrawingComponent` tags.
4.  **Gemini Vision AI Fallback**: Test Vision AI analysis returns fallback component tags when offline or Gemini is unavailable.
5.  **Server-Side Figure Sheet Compiler**: Test PDF generator compiles 2D figure sheet and registers `Document` record.

All tests run 100% offline without live network calls.

---

## 9. Dependency Analysis

*   **No New Dependencies Required!**
    *   Database: Prisma Client (already configured).
    *   AI Vision: `@google/genai` (already installed, supports multi-modal `inlineData`).
    *   PDF Generation: `jspdf` (already installed in `server`).
    *   File Uploads: `multer` (already configured).

---

## 10. Exact Files Expected to Change

*   `server/prisma/schema.prisma`
*   `server/src/services/aiService.ts`
*   `server/src/services/pdfService.ts`
*   `server/src/routes/projectRoutes.ts`
*   `server/src/tests/policies.test.ts`
*   `client/src/pages/ProjectDetailsPage.tsx`

---

## 11. Exact Files Expected to be Created

*   `server/src/services/prototypeService.ts`
*   `server/src/controllers/prototypeController.ts`
*   `TASK6_AUDIT.md`

---

## 12. Risks & Limitations

*   **Gemini Vision Image Format Handling**: Gemini Vision requires clean base64 image strings (`image/png` or `image/jpeg`). Buffer conversions must handle missing or invalid image mime-types gracefully.
*   **2D Figure Sheet Layout**: Generated PDF figure sheets draw vector reference lines and callout tags programmatically. Complex component lists will auto-paginate onto additional figure pages.

---

## 13. Recommended Implementation Phases

1.  **Phase 1: Database Schema & Prototype Models**: Add `Prototype`, `DrawingFigure`, `DrawingComponent` models to `schema.prisma`; run `npx prisma generate`.
2.  **Phase 2: Backend Prototype Service & Controllers**: Implement `prototypeService.ts`, `prototypeController.ts`, and wire routes in `projectRoutes.ts` guarded by `projectGuard`.
3.  **Phase 3: Gemini Vision AI & PDF Figure Sheet Compiler**: Add `analyzePrototypeImageVision()` in `aiService.ts` and `generatePatentFigureSheetPdf()` in `pdfService.ts`.
4.  **Phase 4: Frontend UI Integration & Offline Test Suite**: Update `ProjectDetailsPage.tsx` prototype module; add unit/integration tests to `policies.test.ts`; execute clean builds.

---

TASK 6 STATUS: READY

### Concise Recommended Implementation Plan
The repository is **100% ready** for TASK 6. Proceed by applying the 3 database models (`Prototype`, `DrawingFigure`, `DrawingComponent`), implementing `prototypeService.ts` and `prototypeController.ts`, extending `aiService.ts` with Gemini Vision image analysis, adding figure sheet PDF generation to `pdfService.ts`, updating `ProjectDetailsPage.tsx`, and adding offline verification tests to `policies.test.ts`.
