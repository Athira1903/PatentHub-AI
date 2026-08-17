"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFilingPackage = exports.generateReadinessReportPdf = exports.getFilingReadiness = exports.getProjectReviews = exports.submitReview = void 0;
const reviewService_1 = require("../services/reviewService");
const filingReadinessService_1 = require("../services/filingReadinessService");
const pdfService_1 = require("../services/pdfService");
const submitReview = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { reviewType, decision, comments, checklistSnapshot } = req.body;
        if (!reviewType || !decision) {
            res.status(400).json({ message: 'Review type and decision are required.' });
            return;
        }
        const review = await reviewService_1.ReviewService.submitReviewDecision(projectId, req.user, {
            reviewType,
            decision,
            comments,
            checklistSnapshot
        });
        res.status(201).json({ success: true, message: `Review decision "${decision}" logged successfully.`, review });
    }
    catch (error) {
        console.error('submitReview Error:', error);
        res.status(400).json({ message: error.message || 'Failed to submit review decision.' });
    }
};
exports.submitReview = submitReview;
const getProjectReviews = async (req, res) => {
    try {
        const projectId = req.params.id;
        const reviews = await reviewService_1.ReviewService.getProjectReviews(projectId);
        res.status(200).json({ success: true, reviews });
    }
    catch (error) {
        console.error('getProjectReviews Error:', error);
        res.status(500).json({ message: error.message || 'Failed to retrieve project reviews.' });
    }
};
exports.getProjectReviews = getProjectReviews;
const getFilingReadiness = async (req, res) => {
    try {
        const projectId = req.params.id;
        const readiness = await filingReadinessService_1.FilingReadinessService.getFilingReadiness(projectId);
        res.status(200).json({ success: true, readiness });
    }
    catch (error) {
        console.error('getFilingReadiness Error:', error);
        res.status(500).json({ message: error.message || 'Failed to evaluate filing readiness.' });
    }
};
exports.getFilingReadiness = getFilingReadiness;
const generateReadinessReportPdf = async (req, res) => {
    try {
        const projectId = req.params.id;
        const readiness = await filingReadinessService_1.FilingReadinessService.getFilingReadiness(projectId);
        const document = await pdfService_1.PdfService.generateReadinessReportPdf(projectId, readiness, req.user?.userId);
        res.status(201).json({ success: true, message: 'Readiness report PDF generated successfully.', document });
    }
    catch (error) {
        console.error('generateReadinessReportPdf Error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate readiness report PDF.' });
    }
};
exports.generateReadinessReportPdf = generateReadinessReportPdf;
const exportFilingPackage = async (req, res) => {
    try {
        const projectId = req.params.id;
        const document = await filingReadinessService_1.FilingReadinessService.exportFilingPackage(projectId, req.user.userId);
        res.status(201).json({ success: true, message: 'Master filing package compiled successfully.', document });
    }
    catch (error) {
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
exports.exportFilingPackage = exportFilingPackage;
