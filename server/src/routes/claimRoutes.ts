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
router.post('/ai-generate', projectGuard(ClaimPolicy.canGenerateClaimProposal) as any, generateClaimProposal as any);
router.post('/validate-antecedents', projectGuard(ClaimPolicy.canValidateClaim) as any, validateClaimAntecedents as any);
router.post('/validate-proposal', projectGuard(ClaimPolicy.canValidateClaim) as any, validateClaimProposal as any);
router.post('/import-proposal', projectGuard(ClaimPolicy.canImportClaimProposal) as any, importClaimProposal as any);

// Form 2 Sync & Docket PDF Endpoints (Steps 9 & 10)
router.post('/sync-form2', projectGuard(ClaimPolicy.canSyncClaims) as any, syncClaimsToForm2 as any);
router.post('/docket-pdf', projectGuard(ClaimPolicy.canExportClaimsDocket) as any, generateClaimsDocketPdf as any);

// Preliminary FTO Claim Charts Endpoints (Step 6)
router.get('/charts', projectGuard(ClaimPolicy.canRunFtoAnalysis) as any, getProjectClaimCharts as any);
router.get('/charts/reference/:referenceId', projectGuard(ClaimPolicy.canRunFtoAnalysis) as any, getClaimChartByReference as any);
router.delete('/charts/:chartId', projectGuard(ClaimPolicy.canDeleteClaim) as any, deleteClaimChart as any);
router.post('/:claimId/chart/:referenceId', projectGuard(ClaimPolicy.canRunFtoAnalysis) as any, generateFtoClaimChart as any);

// Claim Elements & Drawing Component Link Endpoints (Step 3)
router.get('/:claimId/elements', projectGuard(ClaimPolicy.canViewClaimElements) as any, getClaimElements as any);
router.post('/:claimId/elements', projectGuard(ClaimPolicy.canCreateClaimElement) as any, createClaimElement as any);
router.put('/:claimId/elements/:elementId/component', projectGuard(ClaimPolicy.canLinkDrawingComponent) as any, linkClaimElementComponent as any);
router.delete('/:claimId/elements/:elementId/component', projectGuard(ClaimPolicy.canLinkDrawingComponent) as any, unlinkClaimElementComponent as any);
router.put('/:claimId/elements/:elementId', projectGuard(ClaimPolicy.canEditClaimElement) as any, updateClaimElement as any);
router.delete('/:claimId/elements/:elementId', projectGuard(ClaimPolicy.canDeleteClaimElement) as any, deleteClaimElement as any);

// Claims CRUD & Reordering Endpoints (Step 2)
router.get('/', projectGuard(ClaimPolicy.canViewClaims) as any, getProjectClaims as any);
router.post('/reorder', projectGuard(ClaimPolicy.canReorderClaims) as any, reorderClaims as any);
router.get('/:claimId', projectGuard(ClaimPolicy.canViewClaims) as any, getClaimById as any);
router.post('/', projectGuard(ClaimPolicy.canCreateClaim) as any, createClaim as any);
router.put('/:claimId', projectGuard(ClaimPolicy.canEditClaim) as any, updateClaim as any);
router.delete('/:claimId', projectGuard(ClaimPolicy.canDeleteClaim) as any, deleteClaim as any);

export default router;
