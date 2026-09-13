import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  inviteMember,
  getProjectActivity,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  createComment,
} from '../controllers/projectController';
import {
  getDashboardAnalytics,
  getInventorDashboard,
  getCoInventorDashboard,
  getPatentExpertDashboard,
  getGuideDashboard,
  getProjectAnalytics,
  generateComprehensiveReportPdf,
} from '../controllers/analyticsController';
import {
  searchPatents,
  getSavedReferences,
  saveReference,
  deleteReference,
} from '../controllers/patentController';
import {
  getProjectForms,
  getFormById,
  saveForm,
  submitForm,
  generateFormPdf,
} from '../controllers/formController';
import {
  getProjectReviews,
  submitReview,
  getFilingReadiness,
  generateReadinessReportPdf,
  exportFilingPackage,
} from '../controllers/reviewController';
import {
  getPrototypes,
  createPrototype,
  getPrototypeById,
  updatePrototype,
  deletePrototype,
  getFigures,
  createFigure,
  updateFigure,
  deleteFigure,
  updateFigureComponents,
  analyzeFigureImageVision,
  generateFigureSheetPdf,
} from '../controllers/prototypeController';
import {
  generateInnovationAi,
  getSimilarityAnalysis,
  getNoveltyAssessment,
  generatePatentDrawing,
  chatProjectAssistant,
} from '../controllers/aiController';
import claimRoutes from './claimRoutes';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../policies/middleware/authorize';
import { projectGuard } from '../policies/middleware/policyGuard';
import { ProjectPolicy } from '../policies/project/project.policy';
import { PatentReferencePolicy } from '../policies/project/patent-reference.policy';
import { DocumentPolicy } from '../policies/document/document.policy';
import { ReviewPolicy } from '../policies/review/review.policy';
import { ReportPolicy } from '../policies/report/report.policy';
import { PatentFormPolicy } from '../policies/forms/patent-form.policy';

const router = Router();

router.use(authenticateToken);

router.post('/', authorize((user) => ProjectPolicy.canCreateProject(user)) as any, createProject);
router.get('/', getProjects);
router.get('/analytics/dashboard', getDashboardAnalytics as any);
router.get('/analytics/inventor', getInventorDashboard as any);
router.get('/analytics/coinventor', getCoInventorDashboard as any);
router.get('/analytics/expert', getPatentExpertDashboard as any);
router.get('/analytics/guide', getGuideDashboard as any);
router.get('/:id', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getProjectById);
router.put('/:id', projectGuard((u, p) => ProjectPolicy.canEditProject(u, p)) as any, updateProject);
router.put('/:id/archive', projectGuard((u, p) => ProjectPolicy.canArchiveProject(u, p)) as any, archiveProject);
router.delete('/:id', projectGuard((u, p) => ProjectPolicy.canDeleteProject(u, p)) as any, deleteProject);
router.post('/:id/members', projectGuard((u, p) => ProjectPolicy.canAssignGuide(u, p)) as any, inviteMember);

// Activity Audit Timeline Endpoint
router.get('/:id/activity', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getProjectActivity as any);

// Analytics & Master Report Endpoints (Task 8)
router.get('/:id/analytics', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getProjectAnalytics as any);
router.post('/:id/reports/comprehensive-pdf', projectGuard((u, p) => ReportPolicy.canGenerateFinalReport(u, p)) as any, generateComprehensiveReportPdf as any);

// Task Management Endpoints
router.get('/:id/tasks', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getProjectTasks as any);
router.post('/:id/tasks', projectGuard((u, p) => ProjectPolicy.canCreateTask(u, p)) as any, createTask as any);
router.put('/:id/tasks/:taskId', projectGuard((u, p) => ProjectPolicy.canUpdateTask(u, p)) as any, updateTask as any);
router.put('/:id/tasks/:taskId/status', projectGuard((u, p) => ProjectPolicy.canUpdateTask(u, p)) as any, updateTask as any);
router.delete('/:id/tasks/:taskId', projectGuard((u, p) => ProjectPolicy.canDeleteTask(u, p)) as any, deleteTask as any);

// Comments Endpoint
router.post('/:id/comments', projectGuard((u, p) => ReviewPolicy.canComment(u, p)) as any, createComment as any);

// Patent Search & Reference Management Endpoints
router.get('/:id/patents/search', projectGuard((u, p) => PatentReferencePolicy.canSearch(u, p)) as any, searchPatents as any);
router.get('/:id/patents/references', projectGuard((u, p) => PatentReferencePolicy.canViewReferences(u, p)) as any, getSavedReferences as any);
router.post('/:id/patents/references', projectGuard((u, p) => PatentReferencePolicy.canSaveReference(u, p)) as any, saveReference as any);
router.delete('/:id/patents/references/:refId', projectGuard((u, p) => PatentReferencePolicy.canDeleteReference(u, p)) as any, deleteReference as any);

// Patent Forms Endpoints (Task 5)
router.get('/:id/forms', projectGuard((u, p) => PatentFormPolicy.canView(u, p, 'Form 1')) as any, getProjectForms as any);
router.get('/:id/forms/:formId', projectGuard((u, p) => PatentFormPolicy.canView(u, p, 'Form 1')) as any, getFormById as any);
router.post('/:id/forms', projectGuard((u, p, req) => PatentFormPolicy.canCreate(u, p, req.body.formType || 'Form 1')) as any, saveForm as any);
router.post('/:id/forms/:formId/submit', projectGuard((u, p) => PatentFormPolicy.canSubmit(u, p, 'Form 1')) as any, submitForm as any);
router.post('/:id/forms/pdf', projectGuard((u, p, req) => PatentFormPolicy.canCreate(u, p, req.body.formType || 'Form 1')) as any, generateFormPdf as any);

// Formal Reviews & Filing Readiness Endpoints (Task 5)
router.get('/:id/reviews', projectGuard((u, p) => ReviewPolicy.canViewReviews(u, p)) as any, getProjectReviews as any);
router.post('/:id/reviews', projectGuard((u, p) => ReviewPolicy.canReview(u, p)) as any, submitReview as any);
router.get('/:id/filing-readiness', projectGuard((u, p) => ReportPolicy.canGenerateSummary(u, p)) as any, getFilingReadiness as any);
router.post('/:id/readiness-report/pdf', projectGuard((u, p) => ReportPolicy.canGenerateReadinessReport(u, p)) as any, generateReadinessReportPdf as any);
router.post('/:id/filing-package', projectGuard((u, p) => ReportPolicy.canGenerateFinalReport(u, p)) as any, exportFilingPackage as any);

// Prototype & Technical Drawing Endpoints (Task 6)
router.get('/:id/prototypes', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getPrototypes as any);
router.post('/:id/prototypes', projectGuard((u, p) => DocumentPolicy.canUpload(u, p)) as any, createPrototype as any);
router.get('/:id/prototypes/:prototypeId', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getPrototypeById as any);
router.put('/:id/prototypes/:prototypeId', projectGuard((u, p) => DocumentPolicy.canEdit(u, p)) as any, updatePrototype as any);
router.delete('/:id/prototypes/:prototypeId', projectGuard((u, p) => DocumentPolicy.canDelete(u, p)) as any, deletePrototype as any);

router.get('/:id/figures', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getFigures as any);
router.post('/:id/figures', projectGuard((u, p) => DocumentPolicy.canUpload(u, p)) as any, createFigure as any);
router.put('/:id/figures/:figureId', projectGuard((u, p) => DocumentPolicy.canEdit(u, p)) as any, updateFigure as any);
router.delete('/:id/figures/:figureId', projectGuard((u, p) => DocumentPolicy.canDelete(u, p)) as any, deleteFigure as any);

router.put('/:id/figures/:figureId/components', projectGuard((u, p) => DocumentPolicy.canEdit(u, p)) as any, updateFigureComponents as any);
router.post('/:id/figures/:figureId/ai-vision', projectGuard((u, p) => DocumentPolicy.canEdit(u, p)) as any, analyzeFigureImageVision as any);
router.post('/:id/figures/:figureId/render-sheet', projectGuard((u, p) => DocumentPolicy.canUpload(u, p)) as any, generateFigureSheetPdf as any);

// Simulated AI Innovation & Diagnostics endpoints
router.post('/:id/ai/innovation', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, generateInnovationAi as any);
router.get('/:id/ai/similarity', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getSimilarityAnalysis as any);
router.get('/:id/ai/novelty', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getNoveltyAssessment as any);
router.post('/:id/ai/novelty', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, getNoveltyAssessment as any);
router.post('/:id/ai/drawing', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, generatePatentDrawing as any);
router.post('/:id/ai/assistant', projectGuard((u, p) => ProjectPolicy.canViewProject(u, p)) as any, chatProjectAssistant as any);

// Claims Engineering Endpoints (Task 9)
router.use('/:id/claims', claimRoutes);

export default router;
