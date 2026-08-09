# TASK 3 AUDIT: AI Diagnostics & Google Gemini Integration

This audit evaluates the current state of **PatentHub-AI** and outlines the technical scope, proposed endpoints, and testing strategies for **TASK 3**.

---

## 1. Current System Status
The system has completed **Task 1** (Project-Scoped Roles & Policy Architecture) and **Task 2** (Hardened Membership & Invitation lifecycle). Authentication, CRUD operations, collaboration workflows, and security gates are type-safe and fully verified.

---

## 2. Completed Features
*   **Authentication & OTP Verification:** User registration, activation, login, and JWT payload mappings.
*   **Project Workspace CRUD:** Creation, updates, archive, and deletion of projects.
*   **Staged Workflows:** 9-stage sequence from `IDEA` to `FILED`.
*   **Functional Policies:** Decentralized policy modules guarding files, reviews, workflows, reports, and invitations.
*   **Membership & Invitations:** Transactional status updates, receiver validations, and duplicate membership blocks.

---

## 3. Partially Implemented Features
*   **AI Workspace & Diagnostics:** The UI is fully implemented on the frontend. The backend endpoints exist but return purely static, mocked JSON strings.
*   **Patent Forms Preparation:** Fully client-side wizard executing `jsPDF` downloads. No database model, service, or API endpoints exist to persist forms.

---

## 4. Existing Backend APIs
*   `POST /api/projects/:id/ai/innovation` $\rightarrow$ Suggested draft stubs.
*   `GET /api/projects/:id/ai/similarity` $\rightarrow$ Static similar patent stubs.
*   `GET /api/projects/:id/ai/novelty` $\rightarrow$ Static novelty check list.
*   `POST /api/projects/:id/ai/drawing` $\rightarrow$ Diagram block label stubs.

---

## 5. Existing Frontend Modules
*   **`ProjectDetailsPage.tsx`:** Contains the **AI Workspace** tab which runs checking buttons, displays drawing diagrams component maps, novelty charts, and features a chat panel that triggers API calls to the similarity, novelty, and innovation endpoints.

---

## 6. Existing Database Models
*   `User`, `Profile`, `Role`, `PatentProject`, `ProjectMember`, `Invitation`, `Document`, `Task`, `Comment`, `Notification`, `ActivityLog`.
*   *(Note: The `Patent` model is defined in schema but is currently unused).*

---

## 7. Existing AI/External Service Infrastructure
*   The npm packages `@google/genai` and `@google/generative-ai` are already listed in `package.json`.
*   The placeholder key `GEMINI_API_KEY` is already present in `server/.env`.

---

## 8. Current Project Workflow
Stages: `IDEA` $\rightarrow$ `LITERATURE_REVIEW` $\rightarrow$ `PROTOTYPE` $\dots \rightarrow$ `GUIDE_REVIEW` $\rightarrow$ `PATENT_EXPERT_REVIEW` $\rightarrow$ `FILING_READY` $\rightarrow$ `FILED`.

---

## 9. Candidate Next Features

### Candidate A: Real AI Diagnostics and Gemini Integration (Recommended)
*   **Existing support:** Fully integrated UI and backend routing stubs are already in place.
*   **Required backend work:** Refactor `aiController.ts` and write `aiService.ts` to call Gemini API.
*   **Required frontend work:** None (uses the fully built-out active frontend tab).
*   **Required database work:** None.
*   **Dependencies:** Gemini API Key configured in `.env`.
*   **Estimated complexity:** Low-Medium.
*   **Risk:** Low.
*   **Relationship to architecture:** Completely preserves all project-scoped policy protections.

### Candidate B: Persisted Patent Forms Database Storage
*   **Existing support:** Client-side UI template exists, but has no backend save endpoints.
*   **Required backend work:** Add CRUD controllers, routes, and services for IPO Forms.
*   **Required frontend work:** Sync forms checklist state to database.
*   **Required database work:** Add `PatentForm` model and execute a database migration.
*   **Estimated complexity:** High.
*   **Risk:** Medium (requires database migrations and data schema changes).

---

## 10. Recommended TASK 3
*   **Feature Name:** **Real AI Diagnostics and Google Gemini Integration**
*   **Rationale:** The frontend UI is already fully operational and calling the backend AI stubs. Connecting these stubs to real Google Gemini models transforms the simulated AI feature into a functional, high-value tool immediately, without database migration risks.

---

## 11. TASK 3 Scope
*   **IN SCOPE:**
    *   Querying Gemini models to generate actual suggestions for Title, Abstract, Description, and Keywords.
    *   Querying Gemini to perform a mock patent search analysis and return structured novelty scores, weak areas, and claim recommendations.
    *   Processing drawing image files to generate schematic component labels and summaries.
    *   Graceful fallback to mock data if the API key is not configured or rates are exceeded.
*   **OUT OF SCOPE:**
    *   Setting up an active vector database or crawling external live databases (USPTO/WIPO) in real-time.

---

## 12. Proposed Modules
*   **`server/src/services/aiService.ts`:** Handles calling Gemini models with custom prompts.

---

## 13. Proposed API Endpoints
*   Enhance existing `/api/projects/:id/ai/innovation`, `/api/projects/:id/ai/similarity`, `/api/projects/:id/ai/novelty`, and `/api/projects/:id/ai/drawing` to return dynamically compiled generative data.

---

## 14. Proposed Frontend Components
*   None required (uses the existing tab views).

---

## 15. Proposed Tests
*   Add mock tests in `policies.test.ts` to ensure controllers handle API calls and fallbacks.

---

## 16. Security Considerations
*   Secure Gemini API keys against exposures.
*   Strictly check project-scoped view rights (`ProjectPolicy.canViewProject`) before processing AI commands.

---

## 17. Integration With Project-Scoped Roles
*   Ensure that only authorized project members (checked via membership policies) can invoke AI requests.

---

## 18. Risks
*   Model rate limiting or execution timeouts.
*   Invalid API key causing server errors. (Resolved via graceful fallback configuration).

---

## 19. Implementation Phases
1.  **Phase 1:** Implement `aiService.ts` and initialize Gemini client.
2.  **Phase 2:** Refactor `aiController.ts` handlers to use generative prompts.
3.  **Phase 3:** Write and run verification tests.

---

## 20. Acceptance Criteria
*   Backend compiler and tests pass with 0 errors.
*   Dynamic generative responses are returned by AI endpoints when a valid Gemini key is supplied.
