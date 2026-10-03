import { prisma } from '../config/db';

export interface ClassificationSuggestionResponse {
  primaryDomain: string;
  secondaryDomains: string[];
  suggestedStructure: 'PRODUCT' | 'PROCESS' | 'PRODUCT_AND_PROCESS';
  structureRationale: string;
  ipcCandidates: Array<{
    id: string;
    fullSymbol: string;
    title: string;
    section: string;
    subclass: string;
    description: string | null;
    confidence: number;
    rationale: string;
  }>;
  extractedKeywords: string[];
  disclaimer: string;
}

export class PatentClassificationService {
  /**
   * Analyzes an invention title and natural language description to suggest
   * technology domains, product vs process architecture, and IPC candidate symbols.
   */
  static async suggestClassification(
    title: string,
    description: string,
    projectId?: string,
    userId?: string
  ): Promise<ClassificationSuggestionResponse> {
    const combinedText = `${title} ${description}`.toLowerCase();
    const tokens = combinedText
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    // 1. Determine Product vs Process
    const processSignals = ['method', 'process', 'algorithm', 'technique', 'step', 'protocol', 'procedure', 'training', 'detection', 'optimizing', 'pipeline'];
    const productSignals = ['apparatus', 'device', 'bottle', 'container', 'cap', 'sensor', 'system', 'hardware', 'circuit', 'unit', 'machine', 'structure', 'mechanism'];

    let processMatches = 0;
    let productMatches = 0;

    for (const t of tokens) {
      if (processSignals.includes(t)) processMatches++;
      if (productSignals.includes(t)) productMatches++;
    }

    let suggestedStructure: 'PRODUCT' | 'PROCESS' | 'PRODUCT_AND_PROCESS' = 'PRODUCT';
    let structureRationale = 'Recites physical components, hardware elements, or consumer apparatus.';

    if (processMatches > 0 && productMatches > 0) {
      suggestedStructure = 'PRODUCT_AND_PROCESS';
      structureRationale = 'Includes both physical hardware/apparatus components and dedicated operating methods or processes.';
    } else if (processMatches > productMatches) {
      suggestedStructure = 'PROCESS';
      structureRationale = 'Discloses sequential algorithmic steps, data processing, or chemical/operational procedures.';
    }

    // 2. Query IPC classifications from database
    const allIPC = await prisma.iPCClassification.findMany();

    const scoredIPC = allIPC.map((ipc) => {
      const matchText = `${ipc.title} ${ipc.description || ''} ${ipc.keywords || ''} ${ipc.domain || ''}`.toLowerCase();
      let score = 0;
      const matchedWords: string[] = [];

      for (const token of tokens) {
        if (matchText.includes(token)) {
          score += 10;
          if (!matchedWords.includes(token)) matchedWords.push(token);
        }
      }

      // Domain booster
      if (ipc.domain && combinedText.includes(ipc.domain.toLowerCase())) {
        score += 25;
      }

      const confidence = Math.min(0.96, Math.max(0.45, Number((score / (tokens.length * 5 + 10)).toFixed(2))));

      return {
        id: ipc.id,
        fullSymbol: ipc.fullSymbol,
        title: ipc.title,
        section: ipc.section,
        subclass: ipc.subclass,
        description: ipc.description,
        confidence,
        score,
        matchedWords,
        domain: ipc.domain || 'General',
        rationale: matchedWords.length > 0
          ? `Matches technical terms: ${matchedWords.slice(0, 4).join(', ')}`
          : 'Relevant general technical classification candidate.',
      };
    });

    // Sort by score descending
    scoredIPC.sort((a, b) => b.score - a.score);
    const topCandidates = scoredIPC.slice(0, 4);

    // Determine domains
    const domainCounts: Record<string, number> = {};
    for (const item of scoredIPC.slice(0, 6)) {
      domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
    }

    const sortedDomains = Object.keys(domainCounts).sort((a, b) => domainCounts[b] - domainCounts[a]);
    const primaryDomain = sortedDomains[0] || 'IoT';
    const secondaryDomains = sortedDomains.slice(1, 3);

    // Extract notable keywords
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'using', 'are', 'was', 'our', 'what', 'does'];
    const extractedKeywords = Array.from(new Set(tokens.filter((t) => !stopWords.includes(t)))).slice(0, 8);

    const disclaimer =
      'AI-assisted classification recommendation — research indicator for examination search and drafting. Verify with official IPC classification indices.';

    // Store in AIAnalysis if projectId is provided
    if (projectId) {
      try {
        await prisma.aIAnalysis.create({
          data: {
            projectId,
            userId,
            analysisType: 'CLASSIFICATION_SUGGESTION',
            prompt: `Classification query for "${title}"`,
            model: 'rule-engine-ipc-v1',
            inputReference: { title, descriptionLength: description.length },
            output: {
              primaryDomain,
              secondaryDomains,
              suggestedStructure,
              topCandidates: topCandidates.map((c) => ({ symbol: c.fullSymbol, confidence: c.confidence })),
            },
            safetyDisclaimer: disclaimer,
          },
        });
      } catch (err) {
        console.warn('Could not persist AIAnalysis:', err);
      }
    }

    return {
      primaryDomain,
      secondaryDomains,
      suggestedStructure,
      structureRationale,
      ipcCandidates: topCandidates.map(({ score, matchedWords, ...rest }) => rest),
      extractedKeywords,
      disclaimer,
    };
  }
}
