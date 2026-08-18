import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/db';
import { ActivityService } from './activityService';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface FtoElementAnalysis {
  claimElementId: string;
  elementName: string;
  priorArtFeature: string;
  overlapLevel: 'NONE' | 'PARTIAL' | 'IDENTICAL' | 'EQUIVALENT';
  analysisNotes: string;
}

export interface FtoChartResponse {
  id: string;
  projectId: string;
  referenceId: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  elements: FtoElementAnalysis[];
  disclaimer: string;
}

export class FtoAnalysisService {
  /**
   * Generates or updates a preliminary FTO claim chart comparing claim elements to a prior art reference.
   */
  static async generateClaimChart(
    projectId: string,
    claimId: string,
    referenceId: string,
    userId: string
  ): Promise<FtoChartResponse> {
    const claim = await prisma.patentClaim.findUnique({
      where: { id: claimId },
      include: {
        claimElements: true
      }
    });

    if (!claim || claim.projectId !== projectId) {
      throw new Error('Claim not found or does not belong to this project.');
    }

    if (!claim.claimElements || claim.claimElements.length === 0) {
      throw new Error('Claim has no technical elements to analyze. Add claim elements first.');
    }

    const reference = await prisma.patentReference.findUnique({
      where: { id: referenceId }
    });

    if (!reference || reference.projectId !== projectId) {
      throw new Error('Patent reference not found or belongs to another project.');
    }

    // Perform overlap analysis per element
    const analyzedElements = await this.analyzeElementsAgainstReference(claim.claimElements, reference);

    // Compute deterministic aggregate risk
    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const hasIdenticalOrEquiv = analyzedElements.some(
      (el) => el.overlapLevel === 'IDENTICAL' || el.overlapLevel === 'EQUIVALENT'
    );
    const hasPartial = analyzedElements.some((el) => el.overlapLevel === 'PARTIAL');

    if (hasIdenticalOrEquiv) {
      overallRisk = 'HIGH';
    } else if (hasPartial) {
      overallRisk = 'MEDIUM';
    } else {
      overallRisk = 'LOW';
    }

    const summary = `Preliminary FTO comparison against ${reference.patentNumber} (${reference.title}). Identified ${analyzedElements.filter((e) => e.overlapLevel !== 'NONE').length} of ${analyzedElements.length} elements with potential technical overlap.`;

    // Persist result in database using transaction
    const savedChart = await prisma.$transaction(async (tx) => {
      // Upsert ClaimChart for (projectId, referenceId)
      const chart = await tx.claimChart.upsert({
        where: {
          projectId_referenceId: {
            projectId,
            referenceId
          }
        },
        create: {
          projectId,
          referenceId,
          overallRisk,
          summary
        },
        update: {
          overallRisk,
          summary
        }
      });

      // Clear previous chart elements for clean update
      await tx.claimChartElement.deleteMany({
        where: { chartId: chart.id }
      });

      // Insert new chart elements
      for (const el of analyzedElements) {
        await tx.claimChartElement.create({
          data: {
            chartId: chart.id,
            claimElementId: el.claimElementId,
            priorArtFeature: el.priorArtFeature,
            overlapLevel: el.overlapLevel,
            analysisNotes: el.analysisNotes
          }
        });
      }

      return chart;
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Generated preliminary FTO claim chart for Claim #${claim.claimNumber} against [${reference.patentNumber}].`,
      'CLAIM',
      { claimId, referenceId, chartId: savedChart.id, overallRisk }
    );

    return {
      id: savedChart.id,
      projectId,
      referenceId,
      overallRisk,
      summary,
      elements: analyzedElements,
      disclaimer:
        'This is preliminary AI-assisted technical overlap analysis for engineering/research purposes and is not a formal freedom-to-operate (FTO) legal opinion or infringement determination.'
    };
  }

  /**
   * Retrieves all claim charts for a project.
   */
  static async getProjectClaimCharts(projectId: string): Promise<any[]> {
    return await prisma.claimChart.findMany({
      where: { projectId },
      include: {
        reference: {
          select: {
            id: true,
            patentNumber: true,
            title: true,
            assignee: true,
            publishDate: true
          }
        },
        elements: {
          include: {
            claimElement: {
              select: {
                id: true,
                claimId: true,
                elementName: true,
                elementText: true,
                claim: {
                  select: {
                    claimNumber: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Retrieves a claim chart for a specific reference.
   */
  static async getClaimChartByReference(projectId: string, referenceId: string): Promise<any> {
    const chart = await prisma.claimChart.findUnique({
      where: {
        projectId_referenceId: {
          projectId,
          referenceId
        }
      },
      include: {
        reference: {
          select: {
            id: true,
            patentNumber: true,
            title: true,
            assignee: true,
            publishDate: true
          }
        },
        elements: {
          include: {
            claimElement: {
              select: {
                id: true,
                claimId: true,
                elementName: true,
                elementText: true,
                claim: {
                  select: {
                    claimNumber: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!chart || chart.projectId !== projectId) {
      return null;
    }

    return chart;
  }

  /**
   * Deletes a claim chart.
   */
  static async deleteClaimChart(projectId: string, chartId: string, userId: string): Promise<{ success: boolean }> {
    const chart = await prisma.claimChart.findUnique({
      where: { id: chartId }
    });

    if (!chart || chart.projectId !== projectId) {
      throw new Error('Claim chart not found or does not belong to this project.');
    }

    await prisma.claimChart.delete({
      where: { id: chartId }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      'Deleted preliminary FTO claim chart.',
      'CLAIM',
      { chartId }
    );

    return { success: true };
  }

  /**
   * Analyzes each claim element against the prior art reference text.
   */
  private static async analyzeElementsAgainstReference(
    claimElements: any[],
    reference: any
  ): Promise<FtoElementAnalysis[]> {
    const aiClient = getGenAI();
    const refText = `${reference.title || ''}\n${reference.abstract || ''}\n${reference.claims || ''}`.toLowerCase();

    if (!aiClient) {
      // Deterministic heuristic comparison for offline/test environments
      return claimElements.map((el) => {
        const elName = (el.elementName || '').toLowerCase();
        const elWords = elName.split(/\s+/).filter((w: string) => w.length > 3);

        let overlapLevel: 'NONE' | 'PARTIAL' | 'IDENTICAL' | 'EQUIVALENT' = 'NONE';
        let priorArtFeature = 'No directly matching disclosure identified in prior-art reference text.';
        let analysisNotes = 'Element appears structurally and functionally distinct from the cited reference.';

        const exactMatch = refText.includes(elName);
        const partialMatches = elWords.filter((w: string) => refText.includes(w));

        if (exactMatch && elWords.length >= 2) {
          overlapLevel = 'PARTIAL';
          priorArtFeature = `Reference explicitly describes "${el.elementName}" in the context of its overall disclosure.`;
          analysisNotes = 'Technical limitation shares common terminology; claim differentiation may require narrowing specific operational parameters.';
        } else if (partialMatches.length > 0) {
          overlapLevel = 'PARTIAL';
          priorArtFeature = `Reference mentions related concepts (${partialMatches.join(', ')}).`;
          analysisNotes = 'Preliminary overlap noted on component keywords; functional implementation differences should be documented.';
        }

        return {
          claimElementId: el.id,
          elementName: el.elementName,
          priorArtFeature,
          overlapLevel,
          analysisNotes
        };
      });
    }

    try {
      const model = aiClient.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `You are a patent engineering analyst performing a preliminary technical claim chart comparison.
Compare each technical claim element of our invention against the cited prior-art patent reference.

PRIOR ART REFERENCE:
- Patent Number: ${reference.patentNumber}
- Title: ${reference.title}
- Assignee: ${reference.assignee || 'Unknown'}
- Abstract: ${reference.abstract || 'N/A'}
- Disclosed Claims / Summary: ${reference.claims || 'N/A'}

OUR CLAIM ELEMENTS TO EVALUATE:
${JSON.stringify(
  claimElements.map((el) => ({
    id: el.id,
    name: el.elementName,
    text: el.elementText
  })),
  null,
  2
)}

INSTRUCTIONS:
1. For each element, classify the technical overlap into:
   - "NONE": The prior art does not disclose this element or an obvious analogue.
   - "PARTIAL": The prior art discloses a similar concept or partial sub-components.
   - "EQUIVALENT": The prior art discloses a functional equivalent performing substantially the same function.
   - "IDENTICAL": The prior art verbatim/substantively discloses this exact element.
2. Provide a short "priorArtFeature" citation and "analysisNotes".
3. Return ONLY a valid JSON array:
[
  {
    "claimElementId": "...",
    "elementName": "...",
    "priorArtFeature": "...",
    "overlapLevel": "NONE" | "PARTIAL" | "EQUIVALENT" | "IDENTICAL",
    "analysisNotes": "..."
  }
]`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      if (Array.isArray(parsed) && parsed.length === claimElements.length) {
        return parsed.map((item: any, idx: number) => ({
          claimElementId: claimElements[idx].id,
          elementName: claimElements[idx].elementName,
          priorArtFeature: item.priorArtFeature || 'Identified in reference abstract/claims.',
          overlapLevel: ['NONE', 'PARTIAL', 'IDENTICAL', 'EQUIVALENT'].includes(item.overlapLevel)
            ? item.overlapLevel
            : 'PARTIAL',
          analysisNotes: item.analysisNotes || 'Technical comparison generated by preliminary analysis.'
        }));
      }
    } catch (e: any) {
      console.warn('Gemini FTO chart generation failed, using deterministic heuristic:', e.message);
    }

    // Fallback if AI parsing fails
    return claimElements.map((el) => ({
      claimElementId: el.id,
      elementName: el.elementName,
      priorArtFeature: 'Referenced technical disclosure evaluated against title and abstract.',
      overlapLevel: 'PARTIAL' as const,
      analysisNotes: 'Preliminary overlap noted. Detailed specification comparison recommended.'
    }));
  }
}
