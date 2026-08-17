import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteMember,
  archiveProject,
  getProjectActivity,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  createComment,
} from '../controllers/projectController';
import {
  generateInnovationAi,
  getSimilarityAnalysis,
  getNoveltyAssessment,
  generatePatentDrawing,
} from '../controllers/aiController';
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
  generateFormPdf
} from '../controllers/formController';
import {
  submitReview,
  getProjectReviews,
  getFilingReadiness,
  generateReadinessReportPdf,
  exportFilingPackage
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
  generateFigureSheetPdf
} from '../controllers/prototypeController';
import {
  getProjectAnalytics,
  getDashboardAnalytics,
  getCoInventorDashboard,
  generateComprehensiveReportPdf
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../policies/middleware/authorize';
import { projectGuard } from '../policies/middleware/policyGuard';
import { ProjectPolicy } from '../policies/project/project.policy';
import { ReviewPolicy } from '../policies/review/review.policy';
import { PatentReferencePolicy } from '../policies/project/patent-reference.policy';
import { PatentFormPolicy } from '../policies/forms/patent-form.policy';
import { ReportPolicy } from '../policies/report/report.policy';
import { DocumentPolicy } from '../policies/document/document.policy';
import claimRoutes from './claimRoutes';

const router = Router();

router.use(authenticateToken);

router.post('/', authorize((user) => ProjectPolicy.canCreateProject(user)) as any, createProject);
router.get('/', getProjects);
router.get('/analytics/dashboard', getDashboardAnalytics as any);
router.get('/analytics/coinventor', getCoInventorDashboard as any);
router.get('/:id', projectGuard(ProjectPolicy.canViewProject) as any, getProjectById);
router.put('/:id', projectGuard(ProjectPolicy.canEditProject) as any, updateProject);
router.put('/:id/archive', projectGuard(ProjectPolicy.canArchiveProject) as any, archiveProject);
router.delete('/:id', projectGuard(ProjectPolicy.canDeleteProject) as any, deleteProject);
router.post('/:id/members', projectGuard(ProjectPolicy.canAssignGuide) as any, inviteMember);

// Activity Audit Timeline Endpoint
router.get('/:id/activity', projectGuard(ProjectPolicy.canViewProject) as any, getProjectActivity as any);

// Analytics & Master Report Endpoints (Task 8)
router.get('/:id/analytics', projectGuard(ProjectPolicy.canViewProject) as any, getProjectAnalytics as any);
router.post('/:id/reports/comprehensive-pdf', projectGuard(ReportPolicy.canGenerateFinalReport) as any, generateComprehensiveReportPdf as any);

// Task Management Endpoints
router.get('/:id/tasks', projectGuard(ProjectPolicy.canViewProject) as any, getProjectTasks as any);
router.post('/:id/tasks', projectGuard(ProjectPolicy.canCreateTask) as any, createTask as any);
router.put('/:id/tasks/:taskId', projectGuard(ProjectPolicy.canUpdateTask) as any, updateTask as any);
router.delete('/:id/tasks/:taskId', projectGuard(ProjectPolicy.canDeleteTask) as any, deleteTask as any);

// Comments Endpoint
router.post('/:id/comments', projectGuard(ReviewPolicy.canComment) as any, createComment as any);

// Patent Search & Reference Management Endpoints
router.get('/:id/patents/search', projectGuard(PatentReferencePolicy.canSearch) as any, searchPatents as any);
router.get('/:id/patents/references', projectGuard(PatentReferencePolicy.canViewReferences) as any, getSavedReferences as any);
router.post('/:id/patents/references', projectGuard(PatentReferencePolicy.canSaveReference) as any, saveReference as any);
router.delete('/:id/patents/references/:refId', projectGuard(PatentReferencePolicy.canDeleteReference) as any, deleteReference as any);

// Patent Forms Endpoints (Task 5)
router.get('/:id/forms', projectGuard((u, p) => PatentFormPolicy.canView(u, p, 'Form 1')) as any, getProjectForms as any);
router.get('/:id/forms/:formId', projectGuard((u, p) => PatentFormPolicy.canView(u, p, 'Form 1')) as any, getFormById as any);
router.post('/:id/forms', projectGuard((u, p, req) => PatentFormPolicy.canCreate(u, p, req.body.formType || 'Form 1')) as any, saveForm as any);
router.post('/:id/forms/:formId/submit', projectGuard((u, p) => PatentFormPolicy.canSubmit(u, p, 'Form 1')) as any, submitForm as any);
router.post('/:id/forms/pdf', projectGuard((u, p, req) => PatentFormPolicy.canCreate(u, p, req.body.formType || 'Form 1')) as any, generateFormPdf as any);

// Formal Reviews & Filing Readiness Endpoints (Task 5)
router.get('/:id/reviews', projectGuard(ReviewPolicy.canReview) as any, getProjectReviews as any);
router.post('/:id/reviews', projectGuard(ReviewPolicy.canReview) as any, submitReview as any);
router.get('/:id/filing-readiness', projectGuard(ReportPolicy.canGenerateSummary) as any, getFilingReadiness as any);
router.post('/:id/readiness-report/pdf', projectGuard(ReportPolicy.canGenerateReadinessReport) as any, generateReadinessReportPdf as any);
router.post('/:id/filing-package', projectGuard(ReportPolicy.canGenerateFinalReport) as any, exportFilingPackage as any);

// Prototype & Technical Drawing Endpoints (Task 6)
router.get('/:id/prototypes', projectGuard(ProjectPolicy.canViewProject) as any, getPrototypes as any);
router.post('/:id/prototypes', projectGuard(DocumentPolicy.canUpload) as any, createPrototype as any);
router.get('/:id/prototypes/:prototypeId', projectGuard(ProjectPolicy.canViewProject) as any, getPrototypeById as any);
router.put('/:id/prototypes/:prototypeId', projectGuard(DocumentPolicy.canEdit) as any, updatePrototype as any);
router.delete('/:id/prototypes/:prototypeId', projectGuard(DocumentPolicy.canDelete) as any, deletePrototype as any);

router.get('/:id/figures', projectGuard(ProjectPolicy.canViewProject) as any, getFigures as any);
router.post('/:id/figures', projectGuard(DocumentPolicy.canUpload) as any, createFigure as any);
router.put('/:id/figures/:figureId', projectGuard(DocumentPolicy.canEdit) as any, updateFigure as any);
router.delete('/:id/figures/:figureId', projectGuard(DocumentPolicy.canDelete) as any, deleteFigure as any);

router.put('/:id/figures/:figureId/components', projectGuard(DocumentPolicy.canEdit) as any, updateFigureComponents as any);
router.post('/:id/figures/:figureId/ai-vision', projectGuard(DocumentPolicy.canEdit) as any, analyzeFigureImageVision as any);
router.post('/:id/figures/:figureId/render-sheet', projectGuard(DocumentPolicy.canUpload) as any, generateFigureSheetPdf as any);

// Simulated AI Innovation & Diagnostics endpoints
router.post('/:id/ai/innovation', projectGuard(ProjectPolicy.canViewProject) as any, generateInnovationAi as any);
router.get('/:id/ai/similarity', projectGuard(ProjectPolicy.canViewProject) as any, getSimilarityAnalysis as any);
router.get('/:id/ai/novelty', projectGuard(ProjectPolicy.canViewProject) as any, getNoveltyAssessment as any);
router.post('/:id/ai/drawing', projectGuard(ProjectPolicy.canViewProject) as any, generatePatentDrawing as any);

// Claims Engineering Endpoints (Task 9)
router.use('/:id/claims', claimRoutes);

export default router;
