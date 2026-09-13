"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const review_policy_1 = require("../policies/review/review.policy");
const workflow_policy_1 = require("../policies/workflow/workflow.policy");
console.log('========================================================');
console.log('--- REVIEWS MODULE COMPREHENSIVE POLICY & UNIT TESTS ---');
console.log('========================================================\n');
// 1. Setup Mock Users and Projects
const mockInventor = { userId: 'user_inv_1', role: 'Inventor', fullName: 'Athira Biju', username: 'athira' };
const mockCoInventor = { userId: 'user_co_2', role: 'CoInventor', fullName: 'Dev Partner', username: 'partner' };
const mockAssignedGuide = { userId: 'user_guide_3', role: 'Guide', fullName: 'Dr. Faculty Guide', username: 'dr_guide' };
const mockUnrelatedGuide = { userId: 'user_guide_4', role: 'Guide', fullName: 'Dr. Other Guide', username: 'other_guide' };
const mockAssignedExpert = { userId: 'user_expert_5', role: 'PatentExpert', fullName: 'Attorney Expert', username: 'attorney' };
const mockUnrelatedExpert = { userId: 'user_expert_6', role: 'PatentExpert', fullName: 'External Expert', username: 'ext_expert' };
const mockStranger = { userId: 'user_stranger_7', role: 'Inventor', fullName: 'Stranger', username: 'stranger' };
const mockAdmin = { userId: 'user_admin_8', role: 'Admin', fullName: 'System Admin', username: 'admin' };
const testProject = {
    id: 'proj_review_test_101',
    title: 'Autonomous Solar Drone',
    ownerId: 'user_inv_1',
    stage: 'GUIDE_REVIEW',
    members: [
        { userId: 'user_inv_1', role: 'INVENTOR', permissionLevel: 'SUBMIT' },
        { userId: 'user_co_2', role: 'CO_INVENTOR', permissionLevel: 'EDIT' },
        { userId: 'user_guide_3', role: 'GUIDE', permissionLevel: 'EDIT' },
        { userId: 'user_expert_5', role: 'PATENT_EXPERT', permissionLevel: 'EDIT' },
    ],
    documents: [
        { id: 'doc_1', name: 'Form 1 Application.pdf', category: 'FORMS' },
        { id: 'doc_2', name: 'Form 2 Complete Specs.pdf', category: 'FORMS' },
        { id: 'doc_3', name: 'Form 3 Statement.pdf', category: 'FORMS' },
        { id: 'doc_5', name: 'Form 5 Inventorship.pdf', category: 'FORMS' },
    ],
    projectReviews: [],
    comments: [],
};
// Test 1: Inventor can view reviews for own project
console.log('[Test 1] Inventor can view reviews for own project:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canViewReviews(mockInventor, testProject), true);
console.log('  ✓ PASS');
// Test 2: Co-inventor can view reviews for authorized project
console.log('[Test 2] Co-inventor can view reviews:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canViewReviews(mockCoInventor, testProject), true);
console.log('  ✓ PASS');
// Test 3: Non-member cannot access private project reviews
console.log('[Test 3] Non-member cannot access private project reviews:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canViewReviews(mockStranger, testProject), false);
console.log('  ✓ PASS');
// Test 4: Guide can review assigned project
console.log('[Test 4] Assigned Guide can review project in GUIDE_REVIEW:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(mockAssignedGuide, testProject), true);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockAssignedGuide, testProject), true);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReject(mockAssignedGuide, testProject), true);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canRequestChanges(mockAssignedGuide, testProject), true);
console.log('  ✓ PASS');
// Test 5: Guide cannot review unrelated project
console.log('[Test 5] Unrelated Guide CANNOT review or approve project:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(mockUnrelatedGuide, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockUnrelatedGuide, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReject(mockUnrelatedGuide, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canViewReviews(mockUnrelatedGuide, testProject), false);
console.log('  ✓ PASS');
// Test 6: Patent Expert can review authorized expert-review project
console.log('[Test 6] Assigned Patent Expert can review in PATENT_EXPERT_REVIEW:');
const expertStageProject = { ...testProject, stage: 'PATENT_EXPERT_REVIEW' };
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(mockAssignedExpert, expertStageProject), true);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockAssignedExpert, expertStageProject), true);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReject(mockAssignedExpert, expertStageProject), true);
console.log('  ✓ PASS');
// Test 6b: Unrelated Patent Expert cannot review
console.log('[Test 6b] Unrelated Patent Expert CANNOT review or approve project:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(mockUnrelatedExpert, expertStageProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockUnrelatedExpert, expertStageProject), false);
console.log('  ✓ PASS');
// Test 7: Anti-self-approval: Inventor CANNOT approve own review
console.log('[Test 7] Anti-Self-Approval: Inventor cannot approve own review:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockInventor, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockInventor, expertStageProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReject(mockInventor, testProject), false);
console.log('  ✓ PASS');
// Test 8: Co-inventor cannot approve review
console.log('[Test 8] Co-inventor cannot approve review:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockCoInventor, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReject(mockCoInventor, testProject), false);
console.log('  ✓ PASS');
// Test 9: Unauthenticated user receives false for all policies
console.log('[Test 9] Unauthenticated user is denied:');
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(null, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(null, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReject(null, testProject), false);
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canViewReviews(null, testProject), false);
console.log('  ✓ PASS');
// Test 10: Mandatory forms requirement for approval
console.log('[Test 10] Guide cannot approve if mandatory forms are incomplete:');
const incompleteFormsProject = { ...testProject, documents: [] };
assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockAssignedGuide, incompleteFormsProject), false);
console.log('  ✓ PASS');
// Test 11: Workflow stage transitions
console.log('[Test 11] Workflow transitions for reviews:');
// Guide approval advances to PATENT_EXPERT_REVIEW
assert_1.default.strictEqual(workflow_policy_1.WorkflowPolicy.isStageTransitionValid('GUIDE_REVIEW', 'PATENT_EXPERT_REVIEW'), true);
// Expert approval advances to FILING_READY
assert_1.default.strictEqual(workflow_policy_1.WorkflowPolicy.isStageTransitionValid('PATENT_EXPERT_REVIEW', 'FILING_READY'), true);
// Changes requested sends back to DOCUMENTATION
assert_1.default.strictEqual(workflow_policy_1.WorkflowPolicy.isStageTransitionValid('GUIDE_REVIEW', 'DOCUMENTATION'), true);
assert_1.default.strictEqual(workflow_policy_1.WorkflowPolicy.isStageTransitionValid('PATENT_EXPERT_REVIEW', 'DOCUMENTATION'), true);
// Resubmission from DOCUMENTATION to GUIDE_REVIEW
assert_1.default.strictEqual(workflow_policy_1.WorkflowPolicy.isStageTransitionValid('DOCUMENTATION', 'GUIDE_REVIEW'), true);
// Invalid jump directly to FILED
assert_1.default.strictEqual(workflow_policy_1.WorkflowPolicy.isStageTransitionValid('GUIDE_REVIEW', 'FILED'), false);
console.log('  ✓ PASS');
// Test 12: Resubmission permissions
console.log('[Test 12] Resubmission permission:');
// Project owner can resubmit from DOCUMENTATION to GUIDE_REVIEW
const docProject = { ...testProject, stage: 'DOCUMENTATION' };
workflow_policy_1.WorkflowPolicy.canMoveToStage(mockInventor, docProject, 'GUIDE_REVIEW').then((canMove) => {
    assert_1.default.strictEqual(canMove, true);
    console.log('  ✓ PASS: Inventor can resubmit to GUIDE_REVIEW');
});
// Stranger cannot resubmit
workflow_policy_1.WorkflowPolicy.canMoveToStage(mockStranger, docProject, 'GUIDE_REVIEW').then((canMove) => {
    assert_1.default.strictEqual(canMove, false);
    console.log('  ✓ PASS: Stranger cannot resubmit');
});
console.log('\n========================================================');
console.log('🎉 ALL REVIEWS MODULE TESTS PASSED (100%)');
console.log('========================================================\n');
