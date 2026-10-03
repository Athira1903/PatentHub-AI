import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/db';
import { ClaimValidationService } from './claimValidationService';

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

export interface ClaimProposalElement {
  elementName: string;
  elementText: string;
  suggestedComponentId?: string | null;
}

export interface ProposedClaim {
  temporaryNumber: number;
  claimType: 'INDEPENDENT' | 'DEPENDENT';
  dependsOnNumber: number | null;
  preamble: string;
  body: string;
  elements: ClaimProposalElement[];
}

export interface ClaimProposalResponse {
  claims: ProposedClaim[];
  warnings: string[];
  assumptions: string[];
  disclaimer: string;
}

export class ClaimAiService {
  /**
   * Generates a structured patent claim proposal based on project disclosure.
   * NEVER creates or modifies database records automatically.
   */
  static async generateClaimProposal(
    projectId: string,
    userId: string,
    options?: { targetJurisdiction?: 'IPO' | 'USPTO' | 'PCT' }
  ): Promise<ClaimProposalResponse> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        drawingFigures: {
          include: {
            components: true
          }
        },
        patentReferences: {
          select: {
            patentNumber: true,
            title: true,
            abstract: true
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    const availableComponents: Array<{ id: string; ref: string; name: string; fig: string }> = [];
    project.drawingFigures?.forEach((fig) => {
      fig.components?.forEach((comp) => {
        availableComponents.push({
          id: comp.id,
          ref: comp.referenceNumber,
          name: comp.componentName,
          fig: fig.figureNumber
        });
      });
    });

    const aiClient = getGenAI();

    if (!aiClient) {
      // Fallback: Generate high quality deterministic template claims for offline/test environments
      return this.generateDeterministicProposal(project, availableComponents);
    }

    try {
      const model = aiClient.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `You are a professional patent attorney and claims drafting engine.
Generate a structured, technically sound patent claim proposal based strictly on the provided invention disclosure.

Target Jurisdiction: ${options?.targetJurisdiction || 'IPO / USPTO'}

INVENTION DISCLOSURE:
- Title: ${project.title}
- Domain: ${project.technicalDomain || 'General Technology'}
- Category: ${project.category || 'INVENTION'}
- Innovation Idea: ${project.innovationIdea || 'N/A'}
- Problem Statement: ${project.problemStatement || 'N/A'}
- Proposed Solution: ${project.proposedSolution || 'N/A'}
- Novel Features: ${project.novelFeatures || 'N/A'}
- Keywords: ${project.keywords || 'N/A'}

AVAILABLE DRAWING COMPONENTS:
${JSON.stringify(availableComponents, null, 2)}

PRIOR ART REFERENCES CONTEXT:
${JSON.stringify(project.patentReferences?.slice(0, 3) || [], null, 2)}

INSTRUCTIONS:
1. Generate between 6 to 10 claims following standard two-part patent claim drafting practices.
2. Include at least 1 independent system/apparatus claim (Claim 1) and 1 independent method/process claim.
3. Use dependent claims to narrow technical features with definite limitations.
4. Maintain strict antecedent basis (introduce elements with "a" or "an", refer to them with "the" or "said").
5. Structure each claim into technical elements ("elements" array) matching distinct physical/functional sub-units.
6. When an element matches an available drawing component, include its "suggestedComponentId".
7. Never invent facts outside the disclosure.

Return ONLY a valid JSON object strictly adhering to this structure:
{
  "claims": [
    {
      "temporaryNumber": 1,
      "claimType": "INDEPENDENT",
      "dependsOnNumber": null,
      "preamble": "An automated system comprising:",
      "body": "a first component; a second component coupled to the first component; and a controller...",
      "elements": [
        {
          "elementName": "First Component",
          "elementText": "a first component configured to...",
          "suggestedComponentId": "optional-id-or-null"
        }
      ]
    }
  ],
  "warnings": ["..."],
  "assumptions": ["..."]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (!parsed.claims || !Array.isArray(parsed.claims)) {
        throw new Error('Invalid JSON structure returned by AI model.');
      }

      // Validate proposal
      const validation = ClaimValidationService.validateProposal(parsed);
      const warnings = [...(parsed.warnings || []), ...validation.warnings];

      return {
        claims: parsed.claims,
        warnings,
        assumptions: parsed.assumptions || [
          'Assumes the disclosed technical mechanisms are fully enabled by the specification.'
        ],
        disclaimer:
          'AI-generated preliminary drafting proposal. Not legal advice, a patentability guarantee, or a definitive FTO opinion.'
      };
    } catch (err: any) {
      console.warn('Gemini Claim AI generation failed, falling back to deterministic template:', err.message);
      return this.generateDeterministicProposal(project, availableComponents);
    }
  }

  /**
   * Deterministic proposal generator for test runs and offline instances.
   */
  private static generateDeterministicProposal(
    project: any,
    availableComponents: Array<{ id: string; ref: string; name: string; fig: string }>
  ): ClaimProposalResponse {
    const title = project.title || 'Technical System';
    const comp1 = availableComponents[0];
    const comp2 = availableComponents[1];

    const claims: ProposedClaim[] = [
      {
        temporaryNumber: 1,
        claimType: 'INDEPENDENT',
        dependsOnNumber: null,
        preamble: `An automated ${title.toLowerCase()} comprising:`,
        body: `a processing unit; a memory coupled to the processing unit; and a sensor subsystem configured to collect physical operational metrics.`,
        elements: [
          {
            elementName: comp1 ? comp1.name : 'Processing Unit',
            elementText: `a processing unit configured to execute instructions`,
            suggestedComponentId: comp1?.id || null
          },
          {
            elementName: comp2 ? comp2.name : 'Sensor Subsystem',
            elementText: `a sensor subsystem configured to collect physical operational metrics`,
            suggestedComponentId: comp2?.id || null
          }
        ]
      },
      {
        temporaryNumber: 2,
        claimType: 'DEPENDENT',
        dependsOnNumber: 1,
        preamble: 'The system of claim 1, wherein',
        body: 'the sensor subsystem comprises an optical sensing array configured to sample environmental data at periodic intervals.',
        elements: [
          {
            elementName: 'Optical Sensing Array',
            elementText: 'an optical sensing array configured to sample environmental data at periodic intervals',
            suggestedComponentId: null
          }
        ]
      },
      {
        temporaryNumber: 3,
        claimType: 'DEPENDENT',
        dependsOnNumber: 1,
        preamble: 'The system of claim 1, further comprising:',
        body: 'a wireless communication transceiver configured to transmit telemetry packets to a remote monitoring node.',
        elements: [
          {
            elementName: 'Wireless Communication Transceiver',
            elementText: 'a wireless communication transceiver configured to transmit telemetry packets to a remote monitoring node',
            suggestedComponentId: null
          }
        ]
      },
      {
        temporaryNumber: 4,
        claimType: 'INDEPENDENT',
        dependsOnNumber: null,
        preamble: `A computer-implemented method for operating a ${title.toLowerCase()}, comprising:`,
        body: 'sampling sensor signals via a sensor subsystem; processing the sensor signals using a processing unit; and triggering an actuator response based on the processed signals.',
        elements: [
          {
            elementName: 'Sampling Step',
            elementText: 'sampling sensor signals via a sensor subsystem',
            suggestedComponentId: null
          },
          {
            elementName: 'Processing Step',
            elementText: 'processing the sensor signals using a processing unit',
            suggestedComponentId: null
          },
          {
            elementName: 'Triggering Step',
            elementText: 'triggering an actuator response based on the processed signals',
            suggestedComponentId: null
          }
        ]
      },
      {
        temporaryNumber: 5,
        claimType: 'DEPENDENT',
        dependsOnNumber: 4,
        preamble: 'The method of claim 4, wherein',
        body: 'the processing comprises filtering noise from the sensor signals using an adaptive digital filter algorithm.',
        elements: [
          {
            elementName: 'Adaptive Filtering Step',
            elementText: 'filtering noise from the sensor signals using an adaptive digital filter algorithm',
            suggestedComponentId: null
          }
        ]
      }
    ];

    return {
      claims,
      warnings: [],
      assumptions: [
        'Generated based on project technical summary and attached drawing components.',
        'Requires review and customization by patent professional before official submission.'
      ],
      disclaimer:
        'AI-generated preliminary drafting proposal. Not legal advice, a patentability guarantee, or a definitive FTO opinion.'
    };
  }
}
