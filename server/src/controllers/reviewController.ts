import { Response } from 'express';
import { ProjectRequest } from '../policies/middleware/policyGuard';
import { ReviewService } from '../services/reviewService';
import { FilingReadinessService } from '../services/filingReadinessService';
import { PdfService } from '../services/pdfService';

export const submitReview = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { reviewType, decision, comments, checklistSnapshot } = req.body;

    if (!reviewType || !decision) {
      res.status(400).json({ message: 'Review type and decision are required.' });
      return;
    }

    if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(decision)) {
      res.status(400).json({ message: `Invalid review decision: ${decision}. Must be APPROVED, REJECTED, or CHANGES_REQUESTED.` });
      return;
    }

    if (!['GUIDE_REVIEW', 'EXPERT_REVIEW'].includes(reviewType)) {
      res.status(400).json({ message: `Invalid reviewType: ${reviewType}. Must be GUIDE_REVIEW or EXPERT_REVIEW.` });
      return;
    }

    const review = await ReviewService.submitReviewDecision(projectId, req.user!, {
      reviewType,
      decision,
      comments,
      checklistSnapshot
    });

    res.status(201).json({ success: true, message: `Review decision "${decision}" logged successfully.`, review });
  } catch (error: any) {
    console.error('submitReview Error:', error);
    res.status(400).json({ message: error.message || 'Failed to submit review decision.' });
  }
};

export const getProjectReviews = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const reviews = await ReviewService.getProjectReviews(projectId);
    res.status(200).json({ success: true, reviews });
  } catch (error: any) {
    console.error('getProjectReviews Error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve project reviews.' });
  }
};

export const getFilingReadiness = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const readiness = await FilingReadinessService.getFilingReadiness(projectId);
    res.status(200).json({ success: true, readiness });
  } catch (error: any) {
    console.error('getFilingReadiness Error:', error);
    res.status(500).json({ message: error.message || 'Failed to evaluate filing readiness.' });
  }
};

export const generateReadinessReportPdf = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const readiness = await FilingReadinessService.getFilingReadiness(projectId);
    const document = await PdfService.generateReadinessReportPdf(projectId, readiness, req.user?.userId);
    res.status(201).json({ success: true, message: 'Readiness report PDF generated successfully.', document });
  } catch (error: any) {
    console.error('generateReadinessReportPdf Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate readiness report PDF.' });
  }
};

export const exportFilingPackage = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const document = await FilingReadinessService.exportFilingPackage(projectId, req.user!.userId);
    res.status(201).json({ success: true, message: 'Master filing package compiled successfully.', document });
  } catch (error: any) {
    console.error('exportFilingPackage Error:', error);
    if (error.blockingIssues) {
      res.status(400).json({
        message: error.message,
        blockingIssues: error.blockingIssues,
        readiness: error.readiness
      });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to export filing package.' });
  }
};
