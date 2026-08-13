import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AnalyticsService } from '../services/analyticsService';
import { PdfService } from '../services/pdfService';

export const getProjectAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const projectId = req.params.id as string;
    if (!projectId) {
      res.status(400).json({ message: 'Project ID is required.' });
      return;
    }

    const summary = await AnalyticsService.getProjectAnalytics(projectId, userId);
    res.status(200).json(summary);
  } catch (error: any) {
    console.error('[Get Project Analytics Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch project analytics.' });
  }
};

export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const summary = await AnalyticsService.getDashboardAnalytics(userId);
    res.status(200).json(summary);
  } catch (error: any) {
    console.error('[Get Dashboard Analytics Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch portfolio dashboard analytics.' });
  }
};

export const generateComprehensiveReportPdf = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const projectId = req.params.id as string;
    if (!projectId) {
      res.status(400).json({ message: 'Project ID is required.' });
      return;
    }

    const document = await PdfService.generateComprehensivePatentReportPdf(projectId, userId);
    res.status(201).json({
      message: 'Master Patent Intelligence Report PDF generated successfully.',
      document,
      fileUrl: document.fileUrl
    });
  } catch (error: any) {
    console.error('[Generate Master Report PDF Error]', error);
    res.status(500).json({ message: error.message || 'Failed to generate Master Patent Intelligence Report PDF.' });
  }
};
