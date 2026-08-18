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
    const userRole = req.user?.role;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const summary = await AnalyticsService.getDashboardAnalytics(userId, userRole);
    res.status(200).json(summary);
  } catch (error: any) {
    console.error('[Get Dashboard Analytics Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch portfolio dashboard analytics.' });
  }
};

export const getCoInventorDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const data = await AnalyticsService.getCoInventorDashboardData(userId);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('[Get CoInventor Dashboard Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch Co-Inventor workspace data.' });
  }
};

export const getPatentExpertDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const data = await AnalyticsService.getPatentExpertDashboardData(userId);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('[Get Patent Expert Dashboard Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch Patent Expert intelligence workspace data.' });
  }
};

export const getGuideDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const data = await AnalyticsService.getGuideDashboardData(userId);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('[Get Guide Dashboard Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch Guide platform workspace data.' });
  }
};

export const getInventorDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const data = await AnalyticsService.getInventorDashboardData(userId);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('[Get Inventor Dashboard Error]', error);
    res.status(500).json({ message: error.message || 'Failed to fetch Inventor command center data.' });
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
