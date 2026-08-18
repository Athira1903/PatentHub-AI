"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
exports.getPreferredModel = getPreferredModel;
const generative_ai_1 = require("@google/generative-ai");
let genAI = null;
function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Google Gemini API Key is not configured in environment variables.');
    }
    if (!genAI) {
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    return genAI;
}
function getPreferredModel(params) {
    const client = getGenAI();
    const modelName = params?.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    return client.getGenerativeModel({
        model: modelName,
        ...params
    });
}
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-pro-latest'];
async function executeWithModelFallback(fn, modelParams) {
    const client = getGenAI();
    let lastError = null;
    for (const candidate of FALLBACK_MODELS) {
        try {
            const model = client.getGenerativeModel({
                model: candidate,
                ...modelParams
            });
            return await fn(model);
        }
        catch (err) {
            lastError = err;
            console.warn(`Model ${candidate} failed, attempting next candidate if available... (${err.message})`);
            // If error is unauthorized or invalid key, don't keep trying models
            if (err.status === 401 || err.status === 403 || err.message?.includes('API_KEY_INVALID')) {
                throw err;
            }
        }
    }
    throw lastError || new Error('All candidate AI models were unavailable.');
}
class AiService {
    /**
     * Generates text content suggestions for patent sections (Title, Abstract, Description, Keywords, Claims)
     */
    static async generateInnovationSuggestions(title, category, domain, innovationIdea, proposedSolution, action) {
        const prompt = `You are an expert patent drafting assistant. Suggest content for a patent draft based on the following project:
Title: ${title}
Category: ${category}
Domain: ${domain}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Action requested: Suggest the "${action}" (must be one of: "title", "abstract", "description", "keywords", or "claims").
Return ONLY the generated content appropriate for this section in clean, professional markdown format. Do not add conversational intro/outro text.`;
        return await executeWithModelFallback(async (model) => {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (!text) {
                throw new Error('Received empty response from Gemini model.');
            }
            return text.trim();
        });
    }
    /**
     * Performs an AI-assisted similarity analysis, identifying matching concepts and overlapping features.
     */
    static async analyzeSimilarity(title, category, domain, innovationIdea, proposedSolution, verifiedReferences) {
        if (!verifiedReferences || verifiedReferences.length === 0) {
            return {
                score: 0,
                similarityScore: 0,
                riskLevel: 'Low Risk',
                matchingConcepts: [],
                overlappingFeatures: [],
                matches: [],
                priorArtReferences: [],
                explanation: 'No verified prior-art references have been saved to this project yet. Please search and save prior-art references under the Expert Audit tab before running this diagnostic check.',
                disclaimer: 'AI-assisted conceptual comparison based on user-saved references.'
            };
        }
        const formattedRefs = verifiedReferences.map(ref => `
- Patent Number: ${ref.patentNumber}
  Title: ${ref.title}
  Abstract: ${ref.abstract || 'N/A'}
  URL: ${ref.url || 'N/A'}
`).join('\n');
        const prompt = `Analyze the similarity of the following project to the list of verified prior art references provided.
Project Title: ${title}
Project Category: ${category}
Project Domain: ${domain}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Verified Prior-Art References list:
${formattedRefs}

Analyze only the relationship with these verified references. Do not invent or reference other patents.

Return a JSON object matching this schema:
{
  "similarityScore": number (0 to 100 representing overall highest similarity percentage to any verified reference),
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk",
  "matchingConcepts": string[] (3-5 shared architectural concepts),
  "overlappingFeatures": string[] (3-5 overlapping technical elements),
  "explanation": string (brief summary explaining the conceptual comparison),
  "disclaimer": "AI-assisted conceptual comparison based on user-saved references. This is not a legal opinion or a definitive patent search."
}`;
        return await executeWithModelFallback(async (model) => {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (!text) {
                throw new Error('Received empty response from Gemini model.');
            }
            const parsed = JSON.parse(text.trim());
            const similarityScore = Number(parsed.similarityScore);
            if (isNaN(similarityScore) || similarityScore < 0 || similarityScore > 100) {
                throw new Error('Invalid similarityScore returned from Gemini.');
            }
            const riskLevel = parsed.riskLevel;
            if (!['Low Risk', 'Medium Risk', 'High Risk'].includes(riskLevel)) {
                throw new Error('Invalid riskLevel returned from Gemini.');
            }
            const matches = verifiedReferences.map((ref, idx) => ({
                patentNumber: ref.patentNumber,
                title: ref.title,
                matchScore: Math.max(10, Math.round(similarityScore - (idx * 5))),
                reasoning: `Conceptual alignment with verified patent ${ref.patentNumber}`
            }));
            return {
                score: similarityScore,
                similarityScore,
                riskLevel: riskLevel,
                matchingConcepts: Array.isArray(parsed.matchingConcepts) ? parsed.matchingConcepts : [],
                overlappingFeatures: Array.isArray(parsed.overlappingFeatures) ? parsed.overlappingFeatures : [],
                matches,
                priorArtReferences: verifiedReferences,
                explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
                disclaimer: 'AI-assisted conceptual comparison based on user-saved references. This is not a legal opinion or a definitive patent search.'
            };
        }, { generationConfig: { responseMimeType: 'application/json' } });
    }
    /**
     * Evaluates the novelty of a project against saved references.
     */
    static async assessNovelty(title, category, domain, innovationIdea, proposedSolution, verifiedReferences) {
        if (!verifiedReferences || verifiedReferences.length === 0) {
            return {
                score: 0,
                noveltyScore: 0,
                assessment: 'Low',
                strength: 'Low',
                strongAreas: [],
                weakAreas: [],
                recommendations: [],
                explanation: 'No verified prior-art references have been saved to this project yet. Please search and save prior-art references under the Expert Audit tab before running this diagnostic check.',
                disclaimer: 'AI-assisted preliminary assessment based on user-saved references.'
            };
        }
        const formattedRefs = verifiedReferences.map(ref => `
- Patent Number: ${ref.patentNumber}
  Title: ${ref.title}
  Abstract: ${ref.abstract || 'N/A'}
`).join('\n');
        const prompt = `Evaluate the novelty of the following project relative only to the provided verified prior art references.
Project Title: ${title}
Project Category: ${category}
Project Domain: ${domain}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Verified Prior-Art References list:
${formattedRefs}

Analyze the novelty relative ONLY to these verified references. Do NOT invent or reference other patents.

Return a JSON object matching this schema:
{
  "score": number (0 to 100 representing novelty score relative to these references),
  "assessment": "High" | "Medium" | "Low" (novelty level rating),
  "strongAreas": string[] (potentially novel, distinguishing features compared to these references),
  "weakAreas": string[] (common or known concepts found in these references),
  "recommendations": string[] (steps to verify further or adjust claim scopes),
  "explanation": string (brief summary explaining the novelty evaluation),
  "disclaimer": "AI-assisted preliminary assessment. This is not a legal opinion or a definitive patentability determination."
}

Do not present this as a legal determination.`;
        return await executeWithModelFallback(async (model) => {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (!text) {
                throw new Error('Received empty response from Gemini model.');
            }
            const parsed = JSON.parse(text.trim());
            const score = Number(parsed.score);
            if (isNaN(score) || score < 0 || score > 100) {
                throw new Error('Invalid score returned from Gemini.');
            }
            const assessment = parsed.assessment;
            if (!['High', 'Medium', 'Low'].includes(assessment)) {
                throw new Error('Invalid assessment returned from Gemini.');
            }
            return {
                score,
                noveltyScore: score,
                assessment: assessment,
                strength: assessment,
                strongAreas: Array.isArray(parsed.strongAreas) ? parsed.strongAreas : [],
                weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
                disclaimer: 'AI-assisted preliminary assessment. This is not a legal opinion or a definitive patentability determination.'
            };
        }, { generationConfig: { responseMimeType: 'application/json' } });
    }
    static analyzeNovelty = AiService.assessNovelty;
    /**
     * Generates drawing figure labels and component metadata.
     */
    static async generatePatentDrawingAnalysis(title, innovationIdea, proposedSolution) {
        const prompt = `Suggest drawing figure numbering and components metadata map for the schematic representation of this invention:
Title: ${title}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Return a JSON object matching this schema:
{
  "figNum": string (e.g. "FIG. 1"),
  "components": [
    { "number": string (e.g. "102"), "label": string (description of component) }
  ]
}`;
        return await executeWithModelFallback(async (model) => {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (!text) {
                throw new Error('Received empty response from Gemini model.');
            }
            const parsed = JSON.parse(text.trim());
            return {
                figNum: typeof parsed.figNum === 'string' ? parsed.figNum : 'FIG. 1',
                components: Array.isArray(parsed.components)
                    ? parsed.components.map((c) => ({
                        number: typeof c.number === 'string' ? c.number : '100',
                        label: typeof c.label === 'string' ? c.label : 'Component'
                    }))
                    : []
            };
        }, { generationConfig: { responseMimeType: 'application/json' } });
    }
    /**
     * Performs multimodal Gemini Vision analysis on an uploaded prototype photo or sketch image.
     */
    static async analyzePrototypeImageVision(imageBuffer, mimeType, projectContext) {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Image buffer is empty or unreadable.');
        }
        const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        const cleanMime = mimeType?.toLowerCase() || 'image/png';
        if (!validMimeTypes.includes(cleanMime)) {
            throw new Error(`Unsupported image format "${mimeType}". Supported formats: PNG, JPG, JPEG, WEBP, PDF.`);
        }
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: cleanMime.includes('pdf') ? 'application/pdf' : cleanMime
            }
        };
        const prompt = `Analyze this technical prototype sketch or blueprint photo for a patent application:
Invention Title: ${projectContext.title}
Innovation Idea: ${projectContext.innovationIdea}
Proposed Solution: ${projectContext.proposedSolution}

Identify visual components, assembly elements, structural blocks, or reference tags.
Assign standard patent drawing reference numbers (e.g. 100, 102, 104, 106).

Return JSON matching this schema:
{
  "components": [
    { "referenceNumber": "100", "name": "Component Name", "description": "Visual structural or functional description" }
  ],
  "figureDescription": "General technical summary of the figure view",
  "confidence": number (between 0 and 100)
}`;
        return await executeWithModelFallback(async (model) => {
            const result = await model.generateContent([prompt, imagePart]);
            const text = result.response.text();
            if (!text) {
                throw new Error('Received empty response from Gemini Vision model.');
            }
            const parsed = JSON.parse(text.trim());
            const rawConf = typeof parsed.confidence === 'number' ? parsed.confidence : 80;
            const confidence = Math.max(0, Math.min(100, rawConf));
            const components = Array.isArray(parsed.components)
                ? parsed.components.map((c, idx) => ({
                    referenceNumber: typeof c.referenceNumber === 'string' ? c.referenceNumber : String(100 + idx * 2),
                    name: typeof c.name === 'string' ? c.name : `Component ${idx + 1}`,
                    description: typeof c.description === 'string' ? c.description : ''
                }))
                : [];
            return {
                components,
                figureDescription: typeof parsed.figureDescription === 'string' ? parsed.figureDescription : `Technical schematic layout for ${projectContext.title}`,
                confidence,
                disclaimer: 'AI-generated component analysis is an assistive technical interpretation and is not a legal, engineering, or filing certification.'
            };
        }, { generationConfig: { responseMimeType: 'application/json' } });
    }
    /**
     * Interactive PatentHub-AI Assistant conversation with full real project context.
     */
    static async chatWithProjectAssistant(projectContext, message, history) {
        // Format structured claims
        const claimsSummary = (projectContext.claims || []).length > 0
            ? projectContext.claims.map(c => `Claim ${c.claimNumber} (${c.claimType}): ${c.preamble || ''} ${c.body}`).join('\n')
            : 'No claims drafted yet in this project.';
        // Format prior-art references
        const priorArtSummary = (projectContext.priorArtReferences || []).length > 0
            ? projectContext.priorArtReferences.map(r => `- ${r.patentNumber}: ${r.title} (${r.abstract ? r.abstract.substring(0, 100) + '...' : 'No abstract'})`).join('\n')
            : 'No prior-art references saved yet.';
        // Format reviews
        const reviewsSummary = (projectContext.reviews || []).length > 0
            ? projectContext.reviews.map(rv => `- [${rv.status || 'REVIEW'}] ${rv.reviewerName || 'Reviewer'}: ${rv.comments || 'No comment text'}`).join('\n')
            : 'No supervisor reviews recorded yet.';
        // Format documents
        const docsSummary = (projectContext.documents || []).length > 0
            ? projectContext.documents.map(d => `- ${d.name} (${d.category || 'General'})`).join('\n')
            : 'No project documents uploaded yet.';
        const systemInstruction = `You are PatentHub-AI Assistant, an advanced AI patent intelligence advisor specialized in patent engineering, IPO filing guidelines, claim drafting, novelty analysis, and lifecycle project guidance.

CURRENT PROJECT CONTEXT:
- Title: ${projectContext.title}
- Domain / Category: ${projectContext.technicalDomain || 'N/A'} / ${projectContext.category || 'N/A'}
- Current Lifecycle Stage: ${projectContext.stage || 'IDEA'}
- Filing Readiness Index: ${projectContext.filingReadiness || 0}%
- Innovation Abstract / Idea: ${projectContext.innovationIdea || 'N/A'}
- Proposed Technical Solution: ${projectContext.proposedSolution || 'N/A'}
- Novel Features: ${projectContext.novelFeatures || 'N/A'}

CLAIMS IN WORKSPACE:
${claimsSummary}

PRIOR-ART REFERENCES:
${priorArtSummary}

DOCUMENTS IN WORKSPACE:
${docsSummary}

SUPERVISOR REVIEWS:
${reviewsSummary}

GUIDELINES FOR YOUR RESPONSE:
1. Provide concise, expert, actionable insights directly relevant to this specific project context.
2. If asked to summarize the project, provide an executive summary of the project title, domain, technical solution, novel features, current stage readiness, and the next recommended steps.
3. If asked about filing readiness, explain what is complete and what remaining milestones are needed (claims, drawings, forms, supervisor review).
4. If asked about claims, explain their structure, antecedent basis, independent vs dependent scope, and suggest concrete improvements.
5. Never hallucinate fake patent numbers. Use the project's actual context and references.
6. Format your response in clean Markdown with bolding, bullet points, and clear sections where helpful.`;
        // Build chat conversation prompt, filtering out past error messages
        let conversationThread = `${systemInstruction}\n\n`;
        if (history && history.length > 0) {
            const validHistory = history
                .filter(h => h.text && !h.text.startsWith('⚠️') && !h.text.includes('currently unavailable'))
                .slice(-6);
            if (validHistory.length > 0) {
                conversationThread += 'CONVERSATION HISTORY:\n';
                validHistory.forEach(h => {
                    const roleLabel = h.role === 'user' ? 'User' : 'Assistant';
                    conversationThread += `${roleLabel}: ${h.text}\n`;
                });
                conversationThread += '\n';
            }
        }
        conversationThread += `User Question: ${message}\n\nProvide your expert response:`;
        return await executeWithModelFallback(async (model) => {
            const result = await model.generateContent(conversationThread);
            const replyText = result.response.text();
            if (!replyText) {
                throw new Error('Received empty response from Gemini assistant.');
            }
            return {
                reply: replyText.trim(),
                disclaimer: 'AI-generated guidance is preliminary and does not constitute legal advice or a definitive patentability or FTO opinion.',
                timestamp: new Date().toISOString()
            };
        });
    }
}
exports.AiService = AiService;
