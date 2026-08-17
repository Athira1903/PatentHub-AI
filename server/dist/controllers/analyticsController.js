"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateComprehensiveReportPdf = exports.getCoInventorDashboard = exports.getDashboardAnalytics = exports.getProjectAnalytics = void 0;
const analyticsService_1 = require("../services/analyticsService");
const pdfService_1 = require("../services/pdfService");
const getProjectAnalytics = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const projectId = req.params.id;
        if (!projectId) {
            res.status(400).json({ message: 'Project ID is required.' });
            return;
        }
        const summary = await analyticsService_1.AnalyticsService.getProjectAnalytics(projectId, userId);
        res.status(200).json(summary);
    }
    catch (error) {
        console.error('[Get Project Analytics Error]', error);
        res.status(500).json({ message: error.message || 'Failed to fetch project analytics.' });
    }
};
exports.getProjectAnalytics = getProjectAnalytics;
const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const summary = await analyticsService_1.AnalyticsService.getDashboardAnalytics(userId, userRole);
        res.status(200).json(summary);
    }
    catch (error) {
        console.error('[Get Dashboard Analytics Error]', error);
        res.status(500).json({ message: error.message || 'Failed to fetch portfolio dashboard analytics.' });
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
const getCoInventorDashboard = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const data = await analyticsService_1.AnalyticsService.getCoInventorDashboardData(userId);
        res.status(200).json(data);
    }
    catch (error) {
        console.error('[Get CoInventor Dashboard Error]', error);
        res.status(500).json({ message: error.message || 'Failed to fetch Co-Inventor workspace data.' });
    }
};
exports.getCoInventorDashboard = getCoInventorDashboard;
const generateComprehensiveReportPdf = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const projectId = req.params.id;
        if (!projectId) {
            res.status(400).json({ message: 'Project ID is required.' });
            return;
        }
        const document = await pdfService_1.PdfService.generateComprehensivePatentReportPdf(projectId, userId);
        res.status(201).json({
            message: 'Master Patent Intelligence Report PDF generated successfully.',
            document,
            fileUrl: document.fileUrl
        });
    }
    catch (error) {
        console.error('[Generate Master Report PDF Error]', error);
        res.status(500).json({ message: error.message || 'Failed to generate Master Patent Intelligence Report PDF.' });
    }
};
exports.generateComprehensiveReportPdf = generateComprehensiveReportPdf;
