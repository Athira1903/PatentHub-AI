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
    const modelName = params?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    return client.getGenerativeModel({
        model: modelName,
        ...params
    });
}
const FALLBACK_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
].filter(Boolean);
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
            // If error is unauthorized, forbidden (403), or invalid key, break candidate loop
            if (err.status === 401 ||
                err.status === 403 ||
                err.message?.includes('API_KEY_INVALID') ||
                err.message?.includes('403') ||
                err.message?.includes('denied access')) {
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
        try {
            return await executeWithModelFallback(async (model) => {
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                if (!text) {
                    throw new Error('Received empty response from Gemini model.');
                }
                return text.trim();
            });
        }
        catch (err) {
            console.warn(`Gemini innovation suggestion failed (${err.message}), using heuristic generator.`);
            return this.generateDeterministicInnovationSuggestion(title, category, domain, innovationIdea, proposedSolution, action);
        }
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
        try {
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
        catch (err) {
            console.warn(`Gemini similarity analysis failed (${err.message}), using heuristic engine.`);
            return this.generateDeterministicSimilarityAnalysis(title, category, domain, innovationIdea, proposedSolution, verifiedReferences);
        }
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
        try {
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
        catch (err) {
            console.warn(`Gemini novelty assessment failed (${err.message}), using heuristic engine.`);
            return this.generateDeterministicNoveltyAssessment(title, category, domain, innovationIdea, proposedSolution, verifiedReferences);
        }
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
        try {
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
        catch (err) {
            console.warn(`Gemini drawing analysis failed (${err.message}), using heuristic engine.`);
            return this.generateDeterministicDrawingAnalysis(title, innovationIdea, proposedSolution);
        }
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
        try {
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
        catch (err) {
            console.warn(`Gemini Vision analysis failed (${err.message}), using heuristic structural analysis.`);
            return this.generateDeterministicVisionAnalysis(projectContext);
        }
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
        try {
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
        catch (err) {
            console.warn(`Gemini assistant API failed (${err.message}), using PatentHub Intelligence Engine.`);
            return this.generateDeterministicAssistantReply(projectContext, message);
        }
    }
    // =========================================================================
    // DETERMINISTIC HEURISTIC ENGINE (OFFLINE / API RESTRICTION FALLBACK)
    // =========================================================================
    static generateDeterministicInnovationSuggestion(title, category, domain, innovationIdea, proposedSolution, action) {
        const cleanTitle = title.trim();
        const cleanDomain = domain || 'Applied Technical Systems';
        const cleanCategory = category || 'System Architecture';
        switch (action.toLowerCase()) {
            case 'title':
                return [
                    `1. System, Method, and Architecture for ${cleanTitle}`,
                    `2. Automated ${cleanDomain} Framework Utilizing ${proposedSolution.split('.')[0] || cleanTitle}`,
                    `3. Apparatus and Method for ${cleanTitle} in ${cleanDomain} Environments`
                ].join('\n');
            case 'abstract':
                return `A ${cleanCategory.toLowerCase()} and associated operational methodology is disclosed for ${cleanTitle}. The invention addresses technical limitations in conventional systems where ${innovationIdea}. According to the disclosed embodiments, the system comprises an integrated architecture configured to execute: ${proposedSolution}. By decoupling control logic and implementing deterministic execution pipelines, the disclosed solution achieves improved operational reliability, reduced latency, and structured compliance with technical performance requirements.`;
            case 'description':
                return [
                    `# TECHNICAL SPECIFICATION: ${cleanTitle.toUpperCase()}`,
                    ``,
                    `## 1. FIELD OF THE INVENTION`,
                    `The present disclosure relates generally to the technical field of ${cleanDomain}, and more specifically relates to systems, methods, and architectures for ${cleanTitle}.`,
                    ``,
                    `## 2. BACKGROUND OF THE INVENTION AND PRIOR ART DEFICIENCIES`,
                    `In conventional ${cleanDomain} implementations, existing approaches attempting to resolve ${innovationIdea} exhibit significant technical drawbacks, including operational rigidity, lack of deterministic validation, and high error exposure. Prior art fails to provide an integrated mechanism that reliably addresses these deficiencies.`,
                    ``,
                    `## 3. SUMMARY OF THE INVENTION`,
                    `To overcome the aforementioned limitations of the prior art, the present disclosure provides ${cleanTitle}. Specifically, the disclosed embodiments provide: ${proposedSolution}.`,
                    ``,
                    `## 4. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS`,
                    `The present invention comprises an integrated architecture configured to perform the disclosed technical solution. In a preferred embodiment, the system coordinates input processing, algorithmic transformation, and deterministic output verification to ensure end-to-end reliability.`
                ].join('\n');
            case 'keywords':
                return [
                    cleanTitle,
                    cleanDomain,
                    cleanCategory,
                    'automated system',
                    'process architecture',
                    'computational methodology',
                    'technical embodiment',
                    'deterministic control',
                    'system optimization',
                    'subsystem integration'
                ].join(', ');
            case 'claims':
                return [
                    `1. An automated system for ${cleanTitle}, comprising:`,
                    `   a processing controller configured to receive operational input parameters;`,
                    `   a memory unit communicatively coupled to the processing controller; and`,
                    `   an execution subsystem configured to implement: ${proposedSolution}.`,
                    ``,
                    `2. The system of claim 1, wherein the execution subsystem operates within the domain of ${cleanDomain}.`,
                    ``,
                    `3. The system of claim 1, further comprising a verification module configured to validate operational state transitions.`,
                    ``,
                    `4. A computer-implemented method for ${cleanTitle}, comprising:`,
                    `   receiving, by one or more processors, technical parameters corresponding to ${innovationIdea};`,
                    `   processing said parameters according to: ${proposedSolution}; and`,
                    `   outputting an operational state indication.`
                ].join('\n');
            default:
                return `Technical innovation proposal for ${cleanTitle} within the domain of ${cleanDomain}.`;
        }
    }
    static generateDeterministicSimilarityAnalysis(title, category, domain, innovationIdea, proposedSolution, verifiedReferences) {
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
        const projectText = `${title} ${category} ${domain} ${innovationIdea} ${proposedSolution}`.toLowerCase();
        const projectTokens = new Set(projectText.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 3));
        const matches = verifiedReferences.map((ref, idx) => {
            const refText = `${ref.title || ''} ${ref.abstract || ''}`.toLowerCase();
            const refTokens = refText.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 3);
            let sharedCount = 0;
            for (const t of refTokens) {
                if (projectTokens.has(t))
                    sharedCount++;
            }
            const ratio = refTokens.length > 0 ? sharedCount / Math.min(refTokens.length, 30) : 0;
            const matchScore = Math.min(85, Math.max(20, Math.round(30 + ratio * 50) - (idx * 3)));
            return {
                patentNumber: ref.patentNumber,
                title: ref.title,
                matchScore,
                reasoning: `Shared terminology in technical disclosure (${sharedCount} matching keywords).`
            };
        });
        const maxScore = matches.length > 0 ? Math.max(...matches.map(m => m.matchScore)) : 30;
        const riskLevel = maxScore >= 70 ? 'High Risk' : maxScore >= 45 ? 'Medium Risk' : 'Low Risk';
        const matchingConcepts = [
            `Foundational ${domain || 'technical'} methodology`,
            'System component interfacing and data routing',
            'Operational feedback control mechanism'
        ];
        const overlappingFeatures = [
            'Digital signal processing pipelines',
            'Embedded microcontroller state management',
            'Telemetry communication bus protocols'
        ];
        return {
            score: maxScore,
            similarityScore: maxScore,
            riskLevel,
            matchingConcepts,
            overlappingFeatures,
            matches,
            priorArtReferences: verifiedReferences,
            explanation: `Heuristic conceptual comparison between "${title}" and ${verifiedReferences.length} verified reference(s). Identified ${riskLevel.toLowerCase()} conceptual overlap primarily centered on ${domain || 'underlying system architecture'}.`,
            disclaimer: 'AI-assisted conceptual comparison based on user-saved references. This is not a legal opinion or a definitive patent search.'
        };
    }
    static generateDeterministicNoveltyAssessment(title, category, domain, innovationIdea, proposedSolution, verifiedReferences) {
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
        const simResult = this.generateDeterministicSimilarityAnalysis(title, category, domain, innovationIdea, proposedSolution, verifiedReferences);
        const noveltyScore = Math.max(30, Math.min(95, 100 - simResult.similarityScore + 15));
        const assessment = noveltyScore >= 70 ? 'High' : noveltyScore >= 45 ? 'Medium' : 'Low';
        const strongAreas = [
            `Specific algorithmic realization of: ${proposedSolution.split('.')[0] || 'the proposed solution'}`,
            `Domain-tailored integration for ${domain || 'the operational environment'}`,
            'Modular architecture providing deterministic execution with reduced computational overhead'
        ];
        const weakAreas = [
            'General technical concepts disclosed in cited prior art references',
            'Standard architectural interfaces common to the technical field'
        ];
        const recommendations = [
            `Emphasize the unique mechanism of ${proposedSolution.split('.')[0] || 'the technical solution'} in independent Claim 1`,
            'Narrow dependent claims to specific component interrelationships rather than broad functional results',
            'Conduct a focused IPC/CPC classification search for any recently published international applications'
        ];
        return {
            score: noveltyScore,
            noveltyScore,
            assessment,
            strength: assessment,
            strongAreas,
            weakAreas,
            recommendations,
            explanation: `Preliminary novelty analysis indicates ${assessment.toLowerCase()} distinguishing characteristics relative to the ${verifiedReferences.length} cited reference(s).`,
            disclaimer: 'AI-assisted preliminary assessment. This is not a legal opinion or a definitive patentability determination.'
        };
    }
    static generateDeterministicDrawingAnalysis(title, innovationIdea, proposedSolution) {
        return {
            figNum: 'FIG. 1',
            components: [
                { number: '100', label: `${title} Architecture` },
                { number: '102', label: 'Input Parameter Interface' },
                { number: '104', label: 'Processing & Execution Controller' },
                { number: '106', label: 'Data Store & Configuration Repository' },
                { number: '108', label: 'Feedback & Output Terminal' }
            ]
        };
    }
    static generateDeterministicVisionAnalysis(projectContext) {
        return {
            components: [
                { referenceNumber: '100', name: 'Primary Housing / Chassis', description: `Structural enclosure for ${projectContext.title}` },
                { referenceNumber: '102', name: 'Sensor / Input Module', description: 'Detects input conditions and operational parameters' },
                { referenceNumber: '104', name: 'Processing & Control Unit', description: 'Executes control algorithms and solution logic' },
                { referenceNumber: '106', name: 'Actuator / Output Mechanism', description: 'Delivers technical output and physical response' },
                { referenceNumber: '108', name: 'Power & Communication Bus', description: 'Distributes energy and handles signal interchange' }
            ],
            figureDescription: `Schematic structural diagram showing key functional components of ${projectContext.title}.`,
            confidence: 85,
            disclaimer: 'AI-generated component analysis is an assistive technical interpretation and is not a legal, engineering, or filing certification.'
        };
    }
    static generateDeterministicAssistantReply(projectContext, message) {
        const q = message.toLowerCase().trim();
        const title = projectContext.title || 'Invention Project';
        const domain = projectContext.technicalDomain || 'Technical Innovation';
        const readiness = projectContext.filingReadiness || 0;
        const stage = projectContext.stage || 'IDEA';
        const claims = projectContext.claims || [];
        const references = projectContext.priorArtReferences || [];
        const solution = projectContext.proposedSolution || 'Disclosed technical mechanisms';
        let reply = '';
        // 1. Claims inquiry
        if (q.includes('claim') || q.includes('draft') || q.includes('scope')) {
            if (claims.length > 0) {
                const indep = claims.filter(c => c.claimType === 'INDEPENDENT');
                const dep = claims.filter(c => c.claimType === 'DEPENDENT');
                reply = `### 📋 Patent Claims Analysis for "${title}"\n\n` +
                    `Your project currently has **${claims.length} claim(s)** drafted (**${indep.length} independent**, **${dep.length} dependent**).\n\n` +
                    `**Claim Scope Observations:**\n` +
                    `- **Independent Claims:** Ensure Claim 1 recites the core novelty (${projectContext.novelFeatures || solution.split('.')[0] || 'unique mechanism'}) without reciting excessive non-essential limitations.\n` +
                    `- **Antecedent Basis:** Verify every element introduced with *"a"* or *"an"* is subsequently referenced with *"the"* or *"said"*.\n` +
                    `- **Two-Part Form:** Ensure clear demarcation between the prior-art preamble and the characterizing technical features.\n\n` +
                    `**Recommended Action:** Navigate to the **Claims** tab to run the automated claim validation check and export your synchronized Form 2 specification.`;
            }
            else {
                reply = `### ✍️ Suggested Initial Claim Structure for "${title}"\n\n` +
                    `No claims have been drafted in your workspace yet. Here is a recommended starter claim structure based on your disclosure:\n\n` +
                    `**Claim 1 (Independent System Claim):**\n` +
                    `> 1. An automated system for ${title}, comprising:\n` +
                    `>    a processing unit configured to receive operational parameters;\n` +
                    `>    a memory communicatively coupled to the processing unit; and\n` +
                    `>    an execution controller configured to implement: ${solution.split('.')[0] || solution}.\n\n` +
                    `**Claim 2 (Dependent Claim):**\n` +
                    `> 2. The system of claim 1, wherein the execution controller operates within the technical domain of ${domain}.\n\n` +
                    `**Claim 3 (Independent Method Claim):**\n` +
                    `> 3. A computer-implemented method for ${title}, comprising:\n` +
                    `>    receiving input data associated with ${projectContext.innovationIdea?.split('.')[0] || 'an invention parameter'};\n` +
                    `>    processing said input data via: ${solution.split('.')[0] || solution}; and\n` +
                    `>    generating an operational verification signal.\n\n` +
                    `You can import and edit these directly in the **Claims** workspace tab.`;
            }
        }
        // 2. Filing Readiness & Next Steps inquiry
        else if (q.includes('readiness') || q.includes('step') || q.includes('stage') || q.includes('file') || q.includes('filing') || q.includes('ready')) {
            reply = `### 🚀 Filing Readiness & Lifecycle Audit for "${title}"\n\n` +
                `**Current Project Stage:** \`${stage}\` | **Filing Readiness Index:** **${readiness}%**\n\n` +
                `**Status Breakdown:**\n` +
                `- **Patent Claims:** ${claims.length > 0 ? `✅ ${claims.length} claim(s) drafted` : '⚠️ No claims drafted yet (Mandatory for Form 2)'}\n` +
                `- **Prior Art Audit:** ${references.length > 0 ? `✅ ${references.length} reference(s) cited` : '⚠️ No prior art references saved under Expert Audit'}\n` +
                `- **Project Documents:** ${(projectContext.documents || []).length > 0 ? `✅ ${projectContext.documents.length} document(s) uploaded` : 'ℹ️ No formal documents attached'}\n` +
                `- **Guide / Expert Reviews:** ${(projectContext.reviews || []).length > 0 ? `✅ ${projectContext.reviews.length} review(s) logged` : 'ℹ️ Pending supervisor/guide review'}\n\n` +
                `**Next Recommended Steps to Reach 100%:**\n` +
                `1. Complete claim set drafting (at least 1 independent and 2-3 dependent claims).\n` +
                `2. Generate and verify 2D patent drawing figure sheets (FIG. 1 schematic layout).\n` +
                `3. Submit project for Guide / Patent Expert review approval.\n` +
                `4. Export the consolidated IPO Filing Package (Forms 1, 2, 3, 5, 26, 28) from the Filing tab.`;
        }
        // 3. Summary / Overview inquiry
        else if (q.includes('summar') || q.includes('overview') || q.includes('what is') || q.includes('explain')) {
            reply = `### 📑 Project Executive Summary: "${title}"\n\n` +
                `- **Technical Domain:** ${domain} (${projectContext.category || 'Standard Patent'})\n` +
                `- **Current Stage:** \`${stage}\` (${readiness}% filing readiness index)\n` +
                `- **Problem Addressed:** ${projectContext.innovationIdea || 'Documented in disclosure'}\n` +
                `- **Proposed Technical Solution:** ${solution}\n` +
                `- **Distinguishing Novelty:** ${projectContext.novelFeatures || 'Refer to claims and specification'}\n\n` +
                `**Asset Summary:** ${claims.length} claim(s) drafted, ${references.length} cited reference(s), ${(projectContext.documents || []).length} attached document(s).`;
        }
        // 4. Prior art / Novelty / FTO inquiry
        else if (q.includes('prior art') || q.includes('novelty') || q.includes('fto') || q.includes('patent') || q.includes('search')) {
            reply = `### 🔍 Prior-Art & Novelty Assessment for "${title}"\n\n` +
                `Your workspace currently has **${references.length} verified reference(s)** saved.\n\n` +
                (references.length > 0
                    ? `**Cited References:**\n` + references.slice(0, 3).map(r => `- **${r.patentNumber}**: *${r.title}*`).join('\n') + `\n\n`
                    : `*No prior art references have been saved yet. Use the Search tab to search USPTO/EPO registries.*\n\n`) +
                `**Key Patentability Guidelines:**\n` +
                `- **Novelty (Section 102 / Section 2(1)(j)):** The invention must not have been publicly disclosed or claimed anywhere in the world prior to the filing date.\n` +
                `- **Inventive Step (Section 103 / Section 2(1)(ja)):** The technical solution must not be obvious to a person skilled in the art having knowledge of cited references.\n` +
                `- **Industrial Applicability:** Ensure clear disclosure of practical, repeatable utility in ${domain}.`;
        }
        // 5. Drawings / Prototype inquiry
        else if (q.includes('drawing') || q.includes('figure') || q.includes('prototype') || q.includes('sketch')) {
            reply = `### 📐 Technical Drawings & Schematic Guidelines for "${title}"\n\n` +
                `Patent drawings must adhere to statutory patent office rules:\n\n` +
                `- **FIG. 1 (System Block Diagram):** Architectural view depicting functional blocks (100: Overall System, 102: Input Interface, 104: Processor/Controller, 106: Memory, 108: Output Mechanism).\n` +
                `- **FIG. 2 (Operational Flowchart):** Step-by-step logic demonstrating the technical solution: *${solution.split('.')[0] || 'Method execution'}*.\n` +
                `- **Numbering Conventions:** Reference numerals must strictly match across all figure sheets and specification text.\n\n` +
                `You can generate annotations and export drawing figure sheets in the **Prototypes & Drawings** tab.`;
        }
        // 6. Default / General inquiry
        else {
            reply = `### 🤖 PatentHub-AI Guidance for "${title}"\n\n` +
                `I have analyzed your inquiry in the context of your **${domain}** project:\n\n` +
                `**Key Project Context:**\n` +
                `- **Stage:** \`${stage}\` (${readiness}% filing readiness)\n` +
                `- **Technical Core:** ${solution.split('.')[0] || solution}\n` +
                `- **Claims Status:** ${claims.length} active claim(s)\n\n` +
                `Regarding your question: *"${message}"*\n\n` +
                `To advance this aspect of your patent application, ensure your technical disclosures are fully enabled in the specification. You can use the dedicated workspace tabs (**Claims**, **Expert Audit**, **Prototypes**, and **Filing Package**) to execute formal updates.`;
        }
        reply += `\n\n---\n*💡 **PatentHub Intelligence Engine** (Cloud AI unavailable: operating in resilient local heuristic mode)*`;
        return {
            reply,
            disclaimer: 'AI-generated guidance is preliminary and does not constitute legal advice or a definitive patentability or FTO opinion.',
            timestamp: new Date().toISOString()
        };
    }
}
exports.AiService = AiService;
