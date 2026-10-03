"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const analyticsController_1 = require("../controllers/analyticsController");
const patentController_1 = require("../controllers/patentController");
const formController_1 = require("../controllers/formController");
const reviewController_1 = require("../controllers/reviewController");
const prototypeController_1 = require("../controllers/prototypeController");
const aiController_1 = require("../controllers/aiController");
const claimRoutes_1 = __importDefault(require("./claimRoutes"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorize_1 = require("../policies/middleware/authorize");
const policyGuard_1 = require("../policies/middleware/policyGuard");
const project_policy_1 = require("../policies/project/project.policy");
const patent_reference_policy_1 = require("../policies/project/patent-reference.policy");
const document_policy_1 = require("../policies/document/document.policy");
const review_policy_1 = require("../policies/review/review.policy");
const report_policy_1 = require("../policies/report/report.policy");
const patent_form_policy_1 = require("../policies/forms/patent-form.policy");
const specification_policy_1 = require("../policies/specification/specification.policy");
const specificationController_1 = require("../controllers/specificationController");
const entitlementMiddleware_1 = require("../middleware/entitlementMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.post('/', (0, authorize_1.authorize)((user) => project_policy_1.ProjectPolicy.canCreateProject(user)), projectController_1.createProject);
router.get('/', projectController_1.getProjects);
router.get('/analytics/dashboard', analyticsController_1.getDashboardAnalytics);
router.get('/analytics/inventor', analyticsController_1.getInventorDashboard);
router.get('/analytics/coinventor', analyticsController_1.getCoInventorDashboard);
router.get('/analytics/expert', analyticsController_1.getPatentExpertDashboard);
router.get('/analytics/guide', analyticsController_1.getGuideDashboard);
router.get('/:id', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), projectController_1.getProjectById);
router.put('/:id', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canEditProject(u, p)), projectController_1.updateProject);
router.put('/:id/archive', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canArchiveProject(u, p)), projectController_1.archiveProject);
router.delete('/:id', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canDeleteProject(u, p)), projectController_1.deleteProject);
router.post('/:id/members', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canAssignGuide(u, p)), projectController_1.inviteMember);
// Activity Audit Timeline Endpoint
router.get('/:id/activity', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), projectController_1.getProjectActivity);
// Analytics & Master Report Endpoints (Task 8)
router.get('/:id/analytics', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), analyticsController_1.getProjectAnalytics);
router.post('/:id/reports/comprehensive-pdf', (0, policyGuard_1.projectGuard)((u, p) => report_policy_1.ReportPolicy.canGenerateFinalReport(u, p)), analyticsController_1.generateComprehensiveReportPdf);
// Task Management Endpoints
router.get('/:id/tasks', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), projectController_1.getProjectTasks);
router.post('/:id/tasks', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canCreateTask(u, p)), projectController_1.createTask);
router.put('/:id/tasks/:taskId', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canUpdateTask(u, p)), projectController_1.updateTask);
router.put('/:id/tasks/:taskId/status', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canUpdateTask(u, p)), projectController_1.updateTask);
router.delete('/:id/tasks/:taskId', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canDeleteTask(u, p)), projectController_1.deleteTask);
// Comments Endpoint
router.post('/:id/comments', (0, policyGuard_1.projectGuard)((u, p) => review_policy_1.ReviewPolicy.canComment(u, p)), projectController_1.createComment);
// Patent Search & Reference Management Endpoints
router.get('/:id/patents/search', (0, policyGuard_1.projectGuard)((u, p) => patent_reference_policy_1.PatentReferencePolicy.canSearch(u, p)), patentController_1.searchPatents);
router.get('/:id/patents/references', (0, policyGuard_1.projectGuard)((u, p) => patent_reference_policy_1.PatentReferencePolicy.canViewReferences(u, p)), patentController_1.getSavedReferences);
router.post('/:id/patents/references', (0, policyGuard_1.projectGuard)((u, p) => patent_reference_policy_1.PatentReferencePolicy.canSaveReference(u, p)), patentController_1.saveReference);
router.delete('/:id/patents/references/:refId', (0, policyGuard_1.projectGuard)((u, p) => patent_reference_policy_1.PatentReferencePolicy.canDeleteReference(u, p)), patentController_1.deleteReference);
// Patent Forms Endpoints (Task 5)
router.get('/:id/forms', (0, policyGuard_1.projectGuard)((u, p) => patent_form_policy_1.PatentFormPolicy.canView(u, p, 'Form 1')), formController_1.getProjectForms);
router.get('/:id/forms/:formId', (0, policyGuard_1.projectGuard)((u, p) => patent_form_policy_1.PatentFormPolicy.canView(u, p, 'Form 1')), formController_1.getFormById);
router.post('/:id/forms', (0, policyGuard_1.projectGuard)((u, p, req) => patent_form_policy_1.PatentFormPolicy.canCreate(u, p, req.body.formType || 'Form 1')), formController_1.saveForm);
router.post('/:id/forms/:formId/submit', (0, policyGuard_1.projectGuard)((u, p) => patent_form_policy_1.PatentFormPolicy.canSubmit(u, p, 'Form 1')), formController_1.submitForm);
router.post('/:id/forms/pdf', (0, policyGuard_1.projectGuard)((u, p, req) => patent_form_policy_1.PatentFormPolicy.canCreate(u, p, req.body.formType || 'Form 1')), formController_1.generateFormPdf);
// Formal Reviews & Filing Readiness Endpoints (Task 5)
router.get('/:id/reviews', (0, policyGuard_1.projectGuard)((u, p) => review_policy_1.ReviewPolicy.canViewReviews(u, p)), reviewController_1.getProjectReviews);
router.post('/:id/reviews', (0, policyGuard_1.projectGuard)((u, p) => review_policy_1.ReviewPolicy.canReview(u, p)), reviewController_1.submitReview);
router.get('/:id/filing-readiness', (0, policyGuard_1.projectGuard)((u, p) => report_policy_1.ReportPolicy.canGenerateSummary(u, p)), reviewController_1.getFilingReadiness);
router.post('/:id/readiness-report/pdf', (0, policyGuard_1.projectGuard)((u, p) => report_policy_1.ReportPolicy.canGenerateReadinessReport(u, p)), reviewController_1.generateReadinessReportPdf);
router.post('/:id/filing-package', (0, policyGuard_1.projectGuard)((u, p) => report_policy_1.ReportPolicy.canGenerateFinalReport(u, p)), (0, entitlementMiddleware_1.requireEntitlement)('EXPORT_FILING_PACKAGE'), reviewController_1.exportFilingPackage);
// Prototype & Technical Drawing Endpoints (Task 6)
router.get('/:id/prototypes', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), prototypeController_1.getPrototypes);
router.post('/:id/prototypes', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canUpload(u, p)), prototypeController_1.createPrototype);
router.get('/:id/prototypes/:prototypeId', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), prototypeController_1.getPrototypeById);
router.put('/:id/prototypes/:prototypeId', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canEdit(u, p)), prototypeController_1.updatePrototype);
router.delete('/:id/prototypes/:prototypeId', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canDelete(u, p)), prototypeController_1.deletePrototype);
router.get('/:id/figures', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), prototypeController_1.getFigures);
router.post('/:id/figures', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canUpload(u, p)), prototypeController_1.createFigure);
router.put('/:id/figures/:figureId', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canEdit(u, p)), prototypeController_1.updateFigure);
router.delete('/:id/figures/:figureId', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canDelete(u, p)), prototypeController_1.deleteFigure);
router.put('/:id/figures/:figureId/components', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canEdit(u, p)), prototypeController_1.updateFigureComponents);
router.post('/:id/figures/:figureId/ai-vision', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canEdit(u, p)), prototypeController_1.analyzeFigureImageVision);
router.post('/:id/figures/:figureId/render-sheet', (0, policyGuard_1.projectGuard)((u, p) => document_policy_1.DocumentPolicy.canUpload(u, p)), prototypeController_1.generateFigureSheetPdf);
// Simulated AI Innovation & Diagnostics endpoints
router.post('/:id/ai/innovation', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), (0, entitlementMiddleware_1.requireEntitlement)('AI_INNOVATION_ANALYSIS'), aiController_1.generateInnovationAi);
router.get('/:id/ai/similarity', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), aiController_1.getSimilarityAnalysis);
router.get('/:id/ai/novelty', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), aiController_1.getNoveltyAssessment);
router.post('/:id/ai/novelty', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), aiController_1.getNoveltyAssessment);
router.post('/:id/ai/drawing', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), (0, entitlementMiddleware_1.requireEntitlement)('PATENT_DRAWING_GENERATION'), aiController_1.generatePatentDrawing);
router.post('/:id/ai/assistant', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), aiController_1.chatProjectAssistant);
// Claims Engineering Endpoints (Task 9)
router.use('/:id/claims', claimRoutes_1.default);
// Smart Next-Action & Indian Filing Readiness Engine
const patentEngineController_1 = require("../controllers/patentEngineController");
router.post('/classification/suggest', patentEngineController_1.suggestClassification);
router.get('/ipc/search', patentEngineController_1.searchIPC);
router.post('/ai/claim-suggestion', patentEngineController_1.runClaimSuggestion);
router.get('/next-action/primary', patentEngineController_1.getUserPrimaryNextAction);
router.get('/:id/next-action', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.getNextAction);
router.get('/:id/filing-assessment', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.getFilingAssessment);
router.get('/:id/deadlines', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.getDeadlines);
router.post('/:id/filing-events', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canEditProject(u, p)), patentEngineController_1.recordFilingEvent);
// Specification Studio & Versioning
router.get('/:id/specification', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canView(u, p)), specificationController_1.SpecificationController.getSpecification);
router.put('/:id/specification', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canEdit(u, p)), specificationController_1.SpecificationController.updateSpecification);
router.post('/:id/specification/versions', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canCreateVersion(u, p)), specificationController_1.SpecificationController.createVersion);
router.get('/:id/specification/versions', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canView(u, p)), specificationController_1.SpecificationController.getVersions);
router.get('/:id/specification/versions/:versionId', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canView(u, p)), specificationController_1.SpecificationController.getVersionById);
router.post('/:id/specification/versions/:versionId/restore', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canRestoreVersion(u, p)), specificationController_1.SpecificationController.restoreVersion);
router.post('/:id/specification/restore/:versionId', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canRestoreVersion(u, p)), specificationController_1.SpecificationController.restoreVersion);
router.get('/:id/specification/compare/:versionA/:versionB', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canView(u, p)), specificationController_1.SpecificationController.compareVersions);
router.post('/:id/specification/sync-form2', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canSyncForm2(u, p)), specificationController_1.SpecificationController.syncWithForm2);
router.post('/:id/specification/pdf', (0, policyGuard_1.projectGuard)((u, p) => specification_policy_1.SpecificationPolicy.canView(u, p)), specificationController_1.SpecificationController.exportPdf);
router.get('/:id/applicants', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.getApplicants);
router.post('/:id/applicants', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canEditProject(u, p)), patentEngineController_1.addApplicant);
router.delete('/:id/applicants/:applicantId', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canEditProject(u, p)), patentEngineController_1.deleteApplicant);
router.get('/:id/inventors', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.getInventors);
router.post('/:id/inventors', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canEditProject(u, p)), patentEngineController_1.addInventor);
router.delete('/:id/inventors/:inventorId', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canEditProject(u, p)), patentEngineController_1.deleteInventor);
router.post('/:id/ai/innovation-analysis', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.runInnovationAnalysis);
router.post('/:id/ai/claim-suggestion', (0, policyGuard_1.projectGuard)((u, p) => project_policy_1.ProjectPolicy.canViewProject(u, p)), patentEngineController_1.runClaimSuggestion);
exports.default = router;
