# TASK 4 Implementation Report: Real Patent Search & Prior-Art Intelligence

This report details the implementation of **TASK 4: Real Patent Search & Prior-Art Intelligence** for the **PatentHub-AI** platform.

---

## 1. System Architecture

The Task 4 implementation introduces a dual-mode Patent Search and Verified Reference Management subsystem:

```
[ Frontend: ProjectDetailsPage (Expert Audit Tab) ]
                   │
         REST API Requests (JWT Auth)
                   │
[ Express Router: projectRoutes.ts + Policy Guard ]
                   │
  ┌────────────────┴────────────────┐
  ▼                                 ▼
[ Patent Controller ]       [ AI Controller ]
  │                                 │
  ├─► PatentSearchService           ├─► Query saved PatentReference DB records
  │     ├─► USPTO PatentsView API   │
  │     └─► Local mockPatents.json  └─► AiService (Google Gemini AI)
  │                                       (Strict groundings on verified refs)
  └─► PatentReferenceService
        └─► PostgreSQL (Prisma PatentReference)
```

---

## 2. USPTO PatentsView API Integration

*   **Endpoint Target:** `https://api.patentsview.org/patents/query`
*   **Authentication:** `X-Api-Key` loaded securely via server environment variable `PATENTSVIEW_API_KEY`.
*   **Search Parameters:** Constructs structured `_or` queries searching `patent_title`, `patent_abstract`, and `patent_number`.
*   **Timeout & Safety:** Wrapped with an 8-second `AbortController` timeout to prevent hanging connections.
*   **Field Mapping:** Extracts `patent_number`, `patent_title`, `patent_abstract`, `patent_date`, `patent_firstnamed_inventor_name`, `patent_firstnamed_assignee_name`, formatting URLs as `https://patents.google.com/patent/US{patent_number}`.
*   **Source Identifier:** All results returned from live API are explicitly tagged with `source: 'USPTO'`.

---

## 3. Mock Patent Registry Fallback

*   **Storage Location:** `server/src/data/mockPatents.json` (and `server/src/config/mockPatents.json`).
*   **Activation Triggers:**
    1.  Absence or placeholder value of `PATENTSVIEW_API_KEY` in environment variables.
    2.  Live USPTO API authentication failures (HTTP 401/403).
    3.  Live USPTO API rate limits (HTTP 429) or server errors (HTTP 500/502).
    4.  Network timeouts or connection refused events.
    5.  Offline execution during automated test suite runs.
*   **Data Integrity:** Standard mock patent records contain realistic titles, abstracts, claims, inventors, and assignees, with all items explicitly tagged with `source: 'MOCK'`.

---

## 4. PatentReference Persistence

*   **Database Schema:** Implemented using Prisma's `PatentReference` model tied to `PatentProject`:
    ```prisma
    model PatentReference {
      id             String        @id @default(uuid())
      projectId      String
      project        PatentProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
      patentNumber   String
      title          String
      abstract       String?       @db.Text
      claims         String?       @db.Text
      url            String?
      inventors      String?
      assignee       String?
      publishDate    DateTime?
      source         String        @default("USPTO")
      createdAt      DateTime      @default(now())
      updatedAt      DateTime      @updatedAt

      @@unique([projectId, patentNumber])
    }
    ```
*   **Duplicate Prevention:** Composite unique constraint `@@unique([projectId, patentNumber])` prevents saving identical reference numbers under the same project.
*   **Metadata Integrity:** Preserves exact original metadata from search results. Gemini AI outputs are **never** written to `PatentReference`.

---

## 5. Authorization & Permission Model

Access control uses the project-scoped authorization policy `PatentReferencePolicy.ts` and middleware `projectGuard`:

| Endpoint / Action | Method | Policy Enforcement | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `GET /projects/:id/patents/search` | Search Registries | `PatentReferencePolicy.canSearch` | `OWNER`, `ADMIN`, `EDITOR`, `VIEWER` |
| `GET /projects/:id/patents/references` | List References | `PatentReferencePolicy.canViewReferences` | `OWNER`, `ADMIN`, `EDITOR`, `VIEWER` |
| `POST /projects/:id/patents/references` | Link Reference | `PatentReferencePolicy.canSaveReference` | `OWNER`, `ADMIN`, `EDITOR` |
| `DELETE /projects/:id/patents/references/:refId` | Delete Reference | `PatentReferencePolicy.canDeleteReference` | `OWNER`, `ADMIN`, `EDITOR` |
| `GET /projects/:id/ai/similarity`, `/novelty` | Run AI Analysis | `PatentReferencePolicy.canRunAiAnalysis` | `OWNER`, `ADMIN`, `EDITOR`, `VIEWER` |

---

## 6. Gemini AI Grounding & Anti-Hallucination

*   **Reference-Grounded Prompts:** `aiController.ts` fetches saved `PatentReference` records from PostgreSQL before calling `AiService`.
*   **Prompt Safeguards:** Gemini is instructed:
    > *"Analyze the project relative ONLY to these verified prior art references. Do NOT invent, hallucinate, or reference any other patent numbers or titles."*
*   **Zero References Handling:** If 0 references are linked to the project, `AiService` returns score `0` with a clear explanation advising the user to save prior art references before running analysis.
*   **Mandatory Disclaimers:** All AI diagnostic outputs include explicit legal disclaimers stating that the report is an AI-assisted conceptual evaluation, not a legal opinion.

---

## 7. Frontend Interface Integration

*   **Location:** [ProjectDetailsPage.tsx](file:///d:/PatentHub-AI/client/src/pages/ProjectDetailsPage.tsx) under the `Expert Audit` tab.
*   **Registry Search Explorer:** Search input box, live spinner loading states, source badges (`USPTO` vs `MOCK`), and `Link Reference` action buttons.
*   **Saved Project References:** Container rendering linked project references with direct external links to Google Patents / USPTO and `Delete` action triggers for authorized editors.
*   **Visual Separation:**
    *   **Verified Patent Records:** Highlighted with green `[Verified USPTO Patent]` or amber `[Mock / Offline Data]` badges.
    *   **AI Diagnostics:** Rendered in indigo/purple card layouts with sparkle icons `[AI Evaluation]` and legal disclaimers.

---

## 8. Error Handling & Security

*   **API Credentials Security:** `PATENTSVIEW_API_KEY` and `GEMINI_API_KEY` remain strictly server-side and are never sent to the client.
*   **Graceful Error Responses:** External connection timeouts, quota limits, or invalid queries return clean HTTP status codes (400, 403, 404, 502) without stack traces.
*   **Server-Side Access Validation:** All project permissions are verified server-side via `projectGuard`.

---

## 9. Automated Testing Suite

Comprehensive offline integration tests added to [policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts):

*   ✅ `Patent Policy: Role permissions for Search, View, Save, Delete, and AI Analysis`
*   ✅ `Patent Search Service: Performs mock search fallback cleanly`
*   ✅ `Patent Controller: Empty query returns 400 Bad Request`
*   ✅ `Patent Reference Service: Saves reference and prevents duplicates`
*   ✅ `Patent Reference Service: Enforces project isolation on deletion`
*   ✅ `AI Service: analyzeSimilarity handles project with 0 references cleanly`

**Test Suite Execution Result:** `POLICY TESTS COMPLETED: 45 passed, 0 failed.`

---

## 10. Limitations

*   **Patent Scope:** Default PatentsView searches focus on US granted patents and published applications. Global patents (EPO/WIPO) are represented in mock datasets.
*   **Full Claims Parsing:** Searches evaluate title and abstract text; detailed claim parsing relies on saved reference text supplied during linking.
