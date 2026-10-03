import { Router } from 'express';
import {
  getProjectClaims,
  getClaimById,
  createClaim,
  updateClaim,
  deleteClaim,
  reorderClaims,
  getClaimElements,
  createClaimElement,
  updateClaimElement,
  deleteClaimElement,
  linkClaimElementComponent,
  unlinkClaimElementComponent,
  generateClaimProposal,
  validateClaimAntecedents,
  validateClaimProposal,
  importClaimProposal,
  generateFtoClaimChart,
  getProjectClaimCharts,
  getClaimChartByReference,
  deleteClaimChart,
  syncClaimsToForm2,
  generateClaimsDocketPdf
} from '../controllers/claimController';
import { projectGuard } from '../policies/middleware/policyGuard';
import { ClaimPolicy } from '../policies/claim/claim.policy';

const router = Router({ mergeParams: true });

// AI Claims Proposal & Validation Endpoints (Steps 4 & 5)
router.post('/ai-generate', projectGuard((u, p) => ClaimPolicy.canGenerateClaimProposal(u, p)) as any, generateClaimProposal as any);
router.post('/validate-antecedents', projectGuard((u, p) => ClaimPolicy.canValidateClaim(u, p)) as any, validateClaimAntecedents as any);
router.post('/validate-proposal', projectGuard((u, p) => ClaimPolicy.canValidateClaim(u, p)) as any, validateClaimProposal as any);
router.post('/import-proposal', projectGuard((u, p) => ClaimPolicy.canImportClaimProposal(u, p)) as any, importClaimProposal as any);

// Form 2 Sync & Docket PDF Endpoints (Steps 9 & 10)
router.post('/sync-form2', projectGuard((u, p) => ClaimPolicy.canSyncClaims(u, p)) as any, syncClaimsToForm2 as any);
router.post('/docket-pdf', projectGuard((u, p) => ClaimPolicy.canExportClaimsDocket(u, p)) as any, generateClaimsDocketPdf as any);

// Preliminary FTO Claim Charts Endpoints (Step 6)
router.get('/charts', projectGuard((u, p) => ClaimPolicy.canRunFtoAnalysis(u, p)) as any, getProjectClaimCharts as any);
router.get('/charts/reference/:referenceId', projectGuard((u, p) => ClaimPolicy.canRunFtoAnalysis(u, p)) as any, getClaimChartByReference as any);
router.delete('/charts/:chartId', projectGuard((u, p) => ClaimPolicy.canDeleteClaimChart(u, p)) as any, deleteClaimChart as any);
router.post('/:claimId/chart/:referenceId', projectGuard((u, p) => ClaimPolicy.canRunFtoAnalysis(u, p)) as any, generateFtoClaimChart as any);

// Claim Elements & Drawing Component Link Endpoints (Step 3)
router.get('/:claimId/elements', projectGuard((u, p) => ClaimPolicy.canViewClaimElements(u, p)) as any, getClaimElements as any);
router.post('/:claimId/elements', projectGuard((u, p) => ClaimPolicy.canCreateClaimElement(u, p)) as any, createClaimElement as any);
router.put('/:claimId/elements/:elementId/component', projectGuard((u, p) => ClaimPolicy.canLinkDrawingComponent(u, p)) as any, linkClaimElementComponent as any);
router.delete('/:claimId/elements/:elementId/component', projectGuard((u, p) => ClaimPolicy.canLinkDrawingComponent(u, p)) as any, unlinkClaimElementComponent as any);
router.put('/:claimId/elements/:elementId', projectGuard((u, p) => ClaimPolicy.canEditClaimElement(u, p)) as any, updateClaimElement as any);
router.delete('/:claimId/elements/:elementId', projectGuard((u, p) => ClaimPolicy.canDeleteClaimElement(u, p)) as any, deleteClaimElement as any);

// Claims CRUD & Reordering Endpoints (Step 2)
router.get('/', projectGuard((u, p) => ClaimPolicy.canViewClaims(u, p)) as any, getProjectClaims as any);
router.post('/reorder', projectGuard((u, p) => ClaimPolicy.canReorderClaims(u, p)) as any, reorderClaims as any);
router.get('/:claimId', projectGuard((u, p) => ClaimPolicy.canViewClaims(u, p)) as any, getClaimById as any);
router.post('/', projectGuard((u, p) => ClaimPolicy.canCreateClaim(u, p)) as any, createClaim as any);
router.put('/:claimId', projectGuard((u, p) => ClaimPolicy.canEditClaim(u, p)) as any, updateClaim as any);
router.delete('/:claimId', projectGuard((u, p) => ClaimPolicy.canDeleteClaim(u, p)) as any, deleteClaim as any);

export default router;
