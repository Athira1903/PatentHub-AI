"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
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
class AiService {
    /**
     * Generates text content suggestions for patent sections (Title, Abstract, Description, Keywords, Claims)
     */
    static async generateInnovationSuggestions(title, category, domain, innovationIdea, proposedSolution, action) {
        const genAIClient = getGenAI();
        const model = genAIClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are an expert patent drafting assistant. Suggest content for a patent draft based on the following project:
Title: ${title}
Category: ${category}
Domain: ${domain}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Action requested: Suggest the "${action}" (must be one of: "title", "abstract", "description", "keywords", or "claims").
Return ONLY the generated content appropriate for this section in clean, professional markdown format. Do not add conversational intro/outro text.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) {
            throw new Error('Received empty response from Gemini model.');
        }
        return text.trim();
    }
    /**
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
        const genAIClient = getGenAI();
        const model = genAIClient.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
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

Analyze the project relative only to these verified prior art references. Do NOT invent, hallucinate, or reference any other patent numbers or titles.

Return a JSON object matching this schema:
{
  "score": number (0 to 100 representing overall similarity percentage matching these references),
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk",
  "matchingConcepts": string[] (concepts in common with these references),
  "overlappingFeatures": string[] (features overlapping with these references),
  "matches": Array of objects:
    [
      {
        "patentId": string (MUST EXACTLY match the "Patent Number" of one of the provided references, e.g. "US11048956B2"),
        "title": string (MUST EXACTLY match the title of that reference),
        "similarityPercent": number (0 to 100 percentage similarity to this specific patent),
        "drawbackOverlap": string (description of how this project overlaps or differs from the patent's drawbacks/specifications),
        "url": string (MUST EXACTLY match the URL of that reference)
      }
    ],
  "explanation": string (analysis of technical and conceptual similarities to the references),
  "disclaimer": "AI-assisted conceptual comparison based on user-saved references."
}

Ensure the "matches" array contains analysis only for the provided references.`;
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
        const riskLevel = parsed.riskLevel;
        if (!['Low Risk', 'Medium Risk', 'High Risk'].includes(riskLevel)) {
            throw new Error('Invalid riskLevel returned from Gemini.');
        }
        const matches = Array.isArray(parsed.matches) ? parsed.matches.map((m) => ({
            patentId: typeof m.patentId === 'string' ? m.patentId : '',
            title: typeof m.title === 'string' ? m.title : '',
            similarityPercent: typeof m.similarityPercent === 'number' ? m.similarityPercent : 0,
            drawbackOverlap: typeof m.drawbackOverlap === 'string' ? m.drawbackOverlap : '',
            url: typeof m.url === 'string' ? m.url : ''
        })) : [];
        return {
            score,
            similarityScore: score,
            riskLevel: riskLevel,
            matchingConcepts: Array.isArray(parsed.matchingConcepts) ? parsed.matchingConcepts : [],
            overlappingFeatures: Array.isArray(parsed.overlappingFeatures) ? parsed.overlappingFeatures : [],
            matches,
            priorArtReferences: matches,
            explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
            disclaimer: 'AI-assisted conceptual comparison based on user-saved references.'
        };
    }
    /**
     * Performs an AI-assisted novelty evaluation of the invention.
     */
    static async analyzeNovelty(title, category, domain, innovationIdea, proposedSolution, verifiedReferences) {
        if (!verifiedReferences || verifiedReferences.length === 0) {
            return {
                score: 0,
                noveltyScore: 0,
                assessment: 'High',
                strength: 'High',
                strongAreas: [],
                weakAreas: [],
                recommendations: [],
                explanation: 'No verified prior-art references have been saved to this project yet. Please search and save prior-art references under the Expert Audit tab before running this diagnostic check.',
                disclaimer: 'AI-assisted preliminary assessment based on user-saved references.'
            };
        }
        const genAIClient = getGenAI();
        const model = genAIClient.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
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
    }
    /**
     * Generates drawing figure labels and component metadata.
     */
    static async generatePatentDrawingAnalysis(title, innovationIdea, proposedSolution) {
        const genAIClient = getGenAI();
        const model = genAIClient.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
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
        const genAIClient = getGenAI();
        const model = genAIClient.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });
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
    }
}
exports.AiService = AiService;
