"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const claimController_1 = require("../controllers/claimController");
const policyGuard_1 = require("../policies/middleware/policyGuard");
const claim_policy_1 = require("../policies/claim/claim.policy");
const router = (0, express_1.Router)({ mergeParams: true });
// AI Claims Proposal & Validation Endpoints (Steps 4 & 5)
router.post('/ai-generate', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canGenerateClaimProposal), claimController_1.generateClaimProposal);
router.post('/validate-antecedents', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canValidateClaim), claimController_1.validateClaimAntecedents);
router.post('/validate-proposal', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canValidateClaim), claimController_1.validateClaimProposal);
router.post('/import-proposal', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canImportClaimProposal), claimController_1.importClaimProposal);
// Form 2 Sync & Docket PDF Endpoints (Steps 9 & 10)
router.post('/sync-form2', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canSyncClaims), claimController_1.syncClaimsToForm2);
router.post('/docket-pdf', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canExportClaimsDocket), claimController_1.generateClaimsDocketPdf);
// Preliminary FTO Claim Charts Endpoints (Step 6)
router.get('/charts', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canRunFtoAnalysis), claimController_1.getProjectClaimCharts);
router.get('/charts/reference/:referenceId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canRunFtoAnalysis), claimController_1.getClaimChartByReference);
router.delete('/charts/:chartId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canDeleteClaim), claimController_1.deleteClaimChart);
router.post('/:claimId/chart/:referenceId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canRunFtoAnalysis), claimController_1.generateFtoClaimChart);
// Claim Elements & Drawing Component Link Endpoints (Step 3)
router.get('/:claimId/elements', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canViewClaimElements), claimController_1.getClaimElements);
router.post('/:claimId/elements', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canCreateClaimElement), claimController_1.createClaimElement);
router.put('/:claimId/elements/:elementId/component', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canLinkDrawingComponent), claimController_1.linkClaimElementComponent);
router.delete('/:claimId/elements/:elementId/component', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canLinkDrawingComponent), claimController_1.unlinkClaimElementComponent);
router.put('/:claimId/elements/:elementId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canEditClaimElement), claimController_1.updateClaimElement);
router.delete('/:claimId/elements/:elementId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canDeleteClaimElement), claimController_1.deleteClaimElement);
// Claims CRUD & Reordering Endpoints (Step 2)
router.get('/', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canViewClaims), claimController_1.getProjectClaims);
router.post('/reorder', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canReorderClaims), claimController_1.reorderClaims);
router.get('/:claimId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canViewClaims), claimController_1.getClaimById);
router.post('/', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canCreateClaim), claimController_1.createClaim);
router.put('/:claimId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canEditClaim), claimController_1.updateClaim);
router.delete('/:claimId', (0, policyGuard_1.projectGuard)(claim_policy_1.ClaimPolicy.canDeleteClaim), claimController_1.deleteClaim);
exports.default = router;
