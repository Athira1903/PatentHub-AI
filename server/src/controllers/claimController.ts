import { Request, Response } from 'express';
import { ClaimService } from '../services/claimService';
import { ClaimAiService } from '../services/claimAiService';
import { ClaimValidationService } from '../services/claimValidationService';
import { FtoAnalysisService } from '../services/ftoAnalysisService';
import { PdfService } from '../services/pdfService';

export const getProjectClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claims = await ClaimService.getProjectClaims(projectId);
    res.status(200).json({ success: true, count: claims.length, claims });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch project claims.' });
  }
};

export const getClaimById = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const claim = await ClaimService.getClaimById(projectId, claimId);
    res.status(200).json({ success: true, claim });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to fetch claim.' });
  }
};

export const createClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const {
      claimNumber,
      claimType,
      dependsOnNumber,
      preamble,
      body,
      status,
      linkedFigures,
      orderIndex
    } = req.body;

    const claim = await ClaimService.createClaim(projectId, userId, {
      claimNumber,
      claimType,
      dependsOnNumber,
      preamble,
      body,
      status,
      linkedFigures,
      orderIndex
    });

    res.status(201).json({ success: true, message: 'Patent claim created successfully.', claim });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create claim.' });
  }
};

export const updateClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const {
      claimNumber,
      claimType,
      dependsOnNumber,
      preamble,
      body,
      status,
      linkedFigures,
      orderIndex
    } = req.body;

    const claim = await ClaimService.updateClaim(projectId, userId, claimId, {
      claimNumber,
      claimType,
      dependsOnNumber,
      preamble,
      body,
      status,
      linkedFigures,
      orderIndex
    });

    res.status(200).json({ success: true, message: 'Patent claim updated successfully.', claim });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to update claim.' });
  }
};

export const deleteClaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const result = await ClaimService.deleteClaim(projectId, userId, claimId);
    res.status(200).json({ message: 'Patent claim deleted successfully.', ...result });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to delete claim.' });
  }
};

export const reorderClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { orderedClaimIds } = req.body;
    const claims = await ClaimService.reorderClaims(projectId, userId, orderedClaimIds);

    res.status(200).json({ success: true, message: 'Claims reordered successfully.', claims });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to reorder claims.' });
  }
};

// =========================================================================
// CLAIM ELEMENT CONTROLLERS
// =========================================================================

export const getClaimElements = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const elements = await ClaimService.getClaimElements(projectId, claimId);
    res.status(200).json({ success: true, count: elements.length, elements });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to fetch claim elements.' });
  }
};

export const createClaimElement = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { elementName, elementText, componentId } = req.body;
    const element = await ClaimService.createClaimElement(projectId, claimId, userId, {
      elementName,
      elementText,
      componentId
    });

    res.status(201).json({ success: true, message: 'Claim element created successfully.', element });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to create claim element.' });
  }
};

export const updateClaimElement = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const elementId = req.params.elementId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { elementName, elementText, componentId } = req.body;
    const element = await ClaimService.updateClaimElement(projectId, claimId, elementId, userId, {
      elementName,
      elementText,
      componentId
    });

    res.status(200).json({ success: true, message: 'Claim element updated successfully.', element });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to update claim element.' });
  }
};

export const deleteClaimElement = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const elementId = req.params.elementId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const result = await ClaimService.deleteClaimElement(projectId, claimId, elementId, userId);
    res.status(200).json({ message: 'Claim element deleted successfully.', ...result });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to delete claim element.' });
  }
};

export const linkClaimElementComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const elementId = req.params.elementId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { componentId } = req.body;
    const element = await ClaimService.linkClaimElementToComponent(
      projectId,
      claimId,
      elementId,
      userId,
      componentId
    );

    res.status(200).json({ success: true, message: 'Claim element linked to drawing component successfully.', element });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to link drawing component.' });
  }
};

export const unlinkClaimElementComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const elementId = req.params.elementId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const element = await ClaimService.unlinkClaimElementFromComponent(
      projectId,
      claimId,
      elementId,
      userId
    );

    res.status(200).json({ success: true, message: 'Drawing component unlinked from claim element successfully.', element });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to unlink drawing component.' });
  }
};

// =========================================================================
// AI GENERATION & VALIDATION CONTROLLERS (STEP 4 & 5)
// =========================================================================

export const generateClaimProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { targetJurisdiction } = req.body;
    const proposal = await ClaimAiService.generateClaimProposal(projectId, userId, { targetJurisdiction });

    res.status(200).json({ success: true, ...proposal });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to generate AI claim proposal.' });
  }
};

export const validateClaimAntecedents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { preamble, body } = req.body;
    const result = ClaimValidationService.validateAntecedents({ preamble, body });
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to validate antecedents.' });
  }
};

export const validateClaimProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposal } = req.body;
    const result = ClaimValidationService.validateProposal(proposal);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to validate claim proposal.' });
  }
};

export const importClaimProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { proposal } = req.body;
    const createdClaims = await ClaimValidationService.importProposal(projectId, userId, proposal);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdClaims.length} claims into project.`,
      claims: createdClaims
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to import claim proposal.' });
  }
};

// =========================================================================
// PRELIMINARY FTO CLAIM CHART CONTROLLERS (STEP 6)
// =========================================================================

export const generateFtoClaimChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const claimId = req.params.claimId as string;
    const referenceId = req.params.referenceId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const chart = await FtoAnalysisService.generateClaimChart(projectId, claimId, referenceId, userId);
    res.status(200).json({ success: true, message: 'Preliminary FTO claim chart generated successfully.', chart });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to generate preliminary FTO claim chart.' });
  }
};

export const getProjectClaimCharts = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const charts = await FtoAnalysisService.getProjectClaimCharts(projectId);
    res.status(200).json({ success: true, count: charts.length, charts });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch claim charts.' });
  }
};

export const getClaimChartByReference = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const referenceId = req.params.referenceId as string;
    const chart = await FtoAnalysisService.getClaimChartByReference(projectId, referenceId);
    if (!chart) {
      res.status(404).json({ message: 'No claim chart found for this reference.' });
      return;
    }
    res.status(200).json({ success: true, chart });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch claim chart.' });
  }
};

export const deleteClaimChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const chartId = req.params.chartId as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const result = await FtoAnalysisService.deleteClaimChart(projectId, chartId, userId);
    res.status(200).json({ message: 'Claim chart deleted successfully.', ...result });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to delete claim chart.' });
  }
};

// =========================================================================
// FORM 2 SYNC & DOCKET PDF CONTROLLERS (STEP 9 & 10)
// =========================================================================

export const syncClaimsToForm2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const result = await ClaimService.syncClaimsToForm2(projectId, userId);
    res.status(200).json({
      message: `Synchronized ${result.claimsCount} claims to Form 2 successfully.`,
      ...result
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to sync claims to Form 2.' });
  }
};

export const generateClaimsDocketPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const document = await PdfService.generateClaimsDocketPdf(projectId, userId);
    res.status(201).json({
      success: true,
      message: 'Claims Docket PDF generated successfully.',
      document
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to generate Claims Docket PDF.' });
  }
};
