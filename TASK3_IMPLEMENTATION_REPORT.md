# TASK 3 IMPLEMENTATION REPORT: AI Diagnostics & Google Gemini Integration

This report documents the architecture, endpoints, security configurations, and validation rules implemented for **TASK 3**.

---

## 1. Gemini Architecture
*   **Decoupled Service Model:** All direct SDK integrations with `@google/generative-ai` are encapsulated inside [aiService.ts](file:///d:/PatentHub-AI/server/src/services/aiService.ts). Controllers only interact with this service layer.
*   **Structured Outputs:** Uses the `gemini-1.5-flash` model configured with `{ responseMimeType: "application/json" }` to guarantee structured JSON outputs matching the required schemas.
*   **Graceful fallback (No fake data):** If initialization checks find the default placeholder API key or if the API call fails/times out, the backend returns a clean `502 Bad Gateway` error instead of fabricating mock scores.

---

## 2. API Endpoints

### Innovation Suggestion Drafts (`POST /api/projects/:id/ai/innovation`)
*   **Request Body:** `{ action: "title" | "abstract" | "description" | "keywords" | "claims" }`
*   **Response:** `{ success: true, action, suggestion }`

### Similarity Check (`GET /api/projects/:id/ai/similarity`)
*   **Response:**
    ```json
    {
      "success": true,
      "score": 15,
      "similarityScore": 15,
      "riskLevel": "Low Risk",
      "matchingConcepts": ["Concept A", "Concept B"],
      "overlappingFeatures": ["Feature X"],
      "priorArtReferences": [],
      "matches": [],
      "explanation": "Brief overview...",
      "disclaimer": "AI-assisted conceptual comparison rather than a verified prior-art search."
    }
    ```
*   *Note: `priorArtReferences` and `matches` are returned as empty arrays `[]` to prevent fabricating patent identifiers.*

### Novelty Check (`GET /api/projects/:id/ai/novelty`)
*   **Response:**
    ```json
    {
      "success": true,
      "score": 85,
      "noveltyScore": 85,
      "assessment": "High",
      "strength": "High",
      "strongAreas": ["Unique Area A"],
      "weakAreas": ["Common Area B"],
      "recommendations": ["Recommendation C"],
      "explanation": "Brief summary...",
      "disclaimer": "AI-assisted preliminary assessment. This is not a legal opinion or a definitive patentability determination."
    }
    ```

### Drawing Components Annotation (`POST /api/projects/:id/ai/drawing`)
*   **Request Body:** `{ originalUrl: string }`
*   **Response:** `{ success: true, drawingMetadata: { figNum: "FIG. 1", components: [{ number: "102", label: "Component A" }] } }`

---

## 3. Authorization & Security
*   **Authentication Middleware:** Enforces that users must supply a valid JWT.
*   **Project Guard Middleware:** Enforces `ProjectPolicy.canViewProject` checking that the authenticated user is either the project owner, an assigned reviewer (Guide/Expert), or an admin. Access to arbitrary project IDs is denied (`403 Forbidden`).
*   **Server-Side Credentials:** `GEMINI_API_KEY` is loaded on the server and is never returned in API payloads.

---

## 4. Input & Response Validation
*   **Inputs:** Validates presence of title, abstract, and proposed solution before calling Gemini. Malformed payload blocks yield `400 Bad Request`.
*   **Responses:** Validates that Gemini score estimates are numeric (0–100) and that critical properties are correctly typed before replying.

---

## 5. Error Handling
*   Quota limits, network timeouts, or invalid keys yield a controlled `502 Bad Gateway` error rather than exposing raw Gemini errors.
*   The frontend captures the error and renders an explicit **"AI analysis unavailable"** message component.

---

## 6. Testing
*   Added 7 new integration tests in [policies.test.ts](file:///d:/PatentHub-AI/server/src/tests/policies.test.ts) covering success paths, missing projects, incomplete parameters, and mock service boundaries. All 39 tests pass successfully.

---

## 7. AI vs. Legal Disclaimer
*   AI analysis is an estimation tool. Responses display disclaimers confirming that results do not constitute legal determinations of patentability.
