import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Google Gemini API Key is not configured in environment variables.');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export class AiService {
  /**
   * Generates text content suggestions for patent sections (Title, Abstract, Description, Keywords, Claims)
   */
  static async generateInnovationSuggestions(
    title: string,
    category: string,
    domain: string,
    innovationIdea: string,
    proposedSolution: string,
    action: string
  ): Promise<string> {
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
   * Performs an AI-assisted similarity analysis, identifying matching concepts and overlapping features.
   * Returns empty priorArtReferences list per repository safety rules since no database search is active.
   */
  static async analyzeSimilarity(
    title: string,
    category: string,
    domain: string,
    innovationIdea: string,
    proposedSolution: string
  ): Promise<{
    score: number;
    riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
    matchingConcepts: string[];
    overlappingFeatures: string[];
    priorArtReferences: any[];
    explanation: string;
    disclaimer: string;
  }> {
    const genAIClient = getGenAI();
    const model = genAIClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Analyze the similarity of the following invention to prior art:
Title: ${title}
Category: ${category}
Domain: ${domain}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Return a JSON object matching this schema:
{
  "score": number (0 to 100 representing similarity percentage),
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk",
  "matchingConcepts": string[] (concepts in common with standard systems),
  "overlappingFeatures": string[] (features overlapping with existing methods),
  "explanation": string (analysis of technical and conceptual similarities),
  "disclaimer": "AI-assisted conceptual comparison rather than a verified prior-art search."
}

NOTE: Since verified patent database integration is not active, the field "priorArtReferences" must be returned as an empty array []. Do not invent any patents.`;

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

    return {
      score,
      riskLevel: riskLevel as any,
      matchingConcepts: Array.isArray(parsed.matchingConcepts) ? parsed.matchingConcepts : [],
      overlappingFeatures: Array.isArray(parsed.overlappingFeatures) ? parsed.overlappingFeatures : [],
      priorArtReferences: [],
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
      disclaimer: 'AI-assisted conceptual comparison rather than a verified prior-art search.'
    };
  }

  /**
   * Performs an AI-assisted novelty evaluation of the invention.
   */
  static async analyzeNovelty(
    title: string,
    category: string,
    domain: string,
    innovationIdea: string,
    proposedSolution: string
  ): Promise<{
    score: number;
    assessment: 'High' | 'Medium' | 'Low';
    strongAreas: string[];
    weakAreas: string[];
    recommendations: string[];
    explanation: string;
    disclaimer: string;
  }> {
    const genAIClient = getGenAI();
    const model = genAIClient.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Evaluate the novelty of the following invention:
Title: ${title}
Category: ${category}
Domain: ${domain}
Innovation Idea: ${innovationIdea}
Proposed Solution: ${proposedSolution}

Return a JSON object matching this schema:
{
  "score": number (0 to 100 representing novelty score),
  "assessment": "High" | "Medium" | "Low",
  "strongAreas": string[] (potentially novel, distinguishing features),
  "weakAreas": string[] (common or known concepts),
  "recommendations": string[] (next steps to verify prior-art or adjust scope),
  "explanation": string (brief summary explaining the novelty strength and potential patentability paths),
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
      assessment: assessment as any,
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
  static async generatePatentDrawingAnalysis(
    title: string,
    innovationIdea: string,
    proposedSolution: string
  ): Promise<{
    figNum: string;
    components: Array<{ number: string; label: string }>;
  }> {
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
        ? parsed.components.map((c: any) => ({
            number: typeof c.number === 'string' ? c.number : '100',
            label: typeof c.label === 'string' ? c.label : 'Component'
          }))
        : []
    };
  }
}
