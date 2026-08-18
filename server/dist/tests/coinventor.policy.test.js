"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const project_policy_1 = require("../policies/project/project.policy");
const claim_policy_1 = require("../policies/claim/claim.policy");
const document_policy_1 = require("../policies/document/document.policy");
const patent_form_policy_1 = require("../policies/forms/patent-form.policy");
const workflow_policy_1 = require("../policies/workflow/workflow.policy");
const review_policy_1 = require("../policies/review/review.policy");
const membership_policy_1 = require("../policies/project/membership.policy");
const invitation_policy_1 = require("../policies/invitation/invitation.policy");
console.log('--- STARTING CO-INVENTOR WORKSPACE POLICY & SECURITY TEST SUITE ---');
// Mock Users
const userOwner = { userId: 'owner_123', role: 'Inventor' };
const userCoInventorView = { userId: 'co_inv_view', role: 'CoInventor' };
const userCoInventorEdit = { userId: 'co_inv_edit', role: 'CoInventor' };
const userCoInventorSubmit = { userId: 'co_inv_submit', role: 'CoInventor' };
const userCoInventorB = { userId: 'co_inv_other', role: 'CoInventor' };
const userGuide = { userId: 'guide_456', role: 'Guide' };
const userExpert = { userId: 'expert_789', role: 'PatentExpert' };
const userAdmin = { userId: 'admin_000', role: 'Admin' };
// Mock Project A
const projectA = {
    id: 'proj_alpha',
    title: 'AI Smart Grid Controller',
    ownerId: 'owner_123',
    stage: 'DOCUMENTATION',
    documents: [
        { id: 'doc_1', name: 'Form 1 Application.pdf', category: 'FORMS' },
        { id: 'doc_2', name: 'Form 2 Complete Specification.pdf', category: 'FORMS' },
        { id: 'doc_3', name: 'Form 3 Statement.pdf', category: 'FORMS' },
        { id: 'doc_5', name: 'Form 5 Declaration.pdf', category: 'FORMS' },
    ],
    members: [
        { userId: 'co_inv_view', role: 'CO_INVENTOR', permissionLevel: 'VIEW' },
        { userId: 'co_inv_edit', role: 'CO_INVENTOR', permissionLevel: 'EDIT' },
        { userId: 'co_inv_submit', role: 'CO_INVENTOR', permissionLevel: 'SUBMIT' },
        { userId: 'guide_456', role: 'GUIDE', permissionLevel: 'SUBMIT' },
        { userId: 'expert_789', role: 'PATENT_EXPERT', permissionLevel: 'SUBMIT' },
    ],
};
// 1. PROJECT ISOLATION TESTS
console.log('[Test 1] Project Isolation & Access Restrictions:');
// Active member can view project
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(userCoInventorView, projectA), true, 'Co-inventor member should be able to view project');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(userCoInventorEdit, projectA), true, 'Co-inventor edit member should be able to view project');
// Non-member Co-Inventor B cannot view or access Project A
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(userCoInventorB, projectA), false, 'Non-member Co-inventor B MUST NOT access Project A');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canEditProject(userCoInventorB, projectA), false, 'Non-member Co-inventor B MUST NOT edit Project A');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(userCoInventorB, projectA), false, 'Non-member Co-inventor B MUST NOT delete Project A');
// Co-Inventors cannot delete or archive the project
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(userCoInventorView, projectA), false, 'Co-inventor VIEW cannot delete project');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(userCoInventorEdit, projectA), false, 'Co-inventor EDIT cannot delete project');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(userCoInventorSubmit, projectA), false, 'Co-inventor SUBMIT cannot delete project');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canArchiveProject(userCoInventorSubmit, projectA), false, 'Co-inventor cannot archive project');
// Owner & Admin can delete/archive
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(userOwner, projectA), true, 'Owner can delete project');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(userAdmin, projectA), true, 'Admin can delete project');
console.log('  ✓ Project isolation tests passed.');
// 2. PERMISSION LEVEL: VIEW ONLY TESTS
console.log('[Test 2] Permission Level: VIEW (Read-Only Enforcement):');
// Can view claims, elements, documents, forms, and tasks
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaims(userCoInventorView, projectA), true, 'VIEW permission can view claims');
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaimElements(userCoInventorView, projectA), true, 'VIEW permission can view claim elements');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canView(userCoInventorView, projectA), true, 'VIEW permission can view documents');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canDownload(userCoInventorView, projectA), true, 'VIEW permission can download documents');
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canView(userCoInventorView, projectA, 'Form 1'), true, 'VIEW permission can view Form 1');
// MUST NOT create, edit, or delete claims, documents, forms, or tasks
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim(userCoInventorView, projectA), false, 'VIEW permission MUST NOT create claims');
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canEditClaim(userCoInventorView, projectA), false, 'VIEW permission MUST NOT edit claims');
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canDeleteClaim(userCoInventorView, projectA), false, 'VIEW permission MUST NOT delete claims');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(userCoInventorView, projectA), false, 'VIEW permission MUST NOT upload documents');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canEdit(userCoInventorView, projectA), false, 'VIEW permission MUST NOT edit documents');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canDelete(userCoInventorView, projectA), false, 'VIEW permission MUST NOT delete documents');
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canCreate(userCoInventorView, projectA, 'Form 2'), false, 'VIEW permission MUST NOT create forms');
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canEdit(userCoInventorView, projectA, 'Form 2'), false, 'VIEW permission MUST NOT edit forms');
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canSubmit(userCoInventorView, projectA, 'Form 2'), false, 'VIEW permission MUST NOT submit forms');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canCreateTask(userCoInventorView, projectA), false, 'VIEW permission MUST NOT create tasks');
console.log('  ✓ Permission Level VIEW tests passed.');
// 3. PERMISSION LEVEL: EDIT TESTS
console.log('[Test 3] Permission Level: EDIT (Contribution & Authoring):');
// Can create/edit claims, upload documents, edit forms, create tasks
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim(userCoInventorEdit, projectA), true, 'EDIT permission can create claims');
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canEditClaim(userCoInventorEdit, projectA), true, 'EDIT permission can edit claims');
assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canDeleteClaim(userCoInventorEdit, projectA), true, 'EDIT permission can delete claims');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(userCoInventorEdit, projectA), true, 'EDIT permission can upload documents');
assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canEdit(userCoInventorEdit, projectA), true, 'EDIT permission can edit documents');
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canCreate(userCoInventorEdit, projectA, 'Form 2'), true, 'EDIT permission can draft Form 2');
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canEdit(userCoInventorEdit, projectA, 'Form 2'), true, 'EDIT permission can edit Form 2');
assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canCreateTask(userCoInventorEdit, projectA), true, 'EDIT permission can create tasks');
// EDIT MUST NOT submit forms or submit project for formal review
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canSubmit(userCoInventorEdit, projectA, 'Form 2'), false, 'EDIT permission MUST NOT submit Form 2 (Requires SUBMIT)');
console.log('  ✓ Permission Level EDIT tests passed.');
// 4. PERMISSION LEVEL: SUBMIT TESTS
console.log('[Test 4] Permission Level: SUBMIT (Milestone & Review Submissions):');
// SUBMIT can submit forms and submit project for guide review
assert_1.default.strictEqual(patent_form_policy_1.PatentFormPolicy.canSubmit(userCoInventorSubmit, projectA, 'Form 2'), true, 'SUBMIT permission can submit Form 2');
console.log('  ✓ Permission Level SUBMIT tests passed.');
// 5. WORKFLOW & STAGE TRANSITIONS
console.log('[Test 5] Workflow Stage Transitions & Anti-Self-Approval:');
// Async workflow checks
(async () => {
    const earlyStageMoveByEdit = await workflow_policy_1.WorkflowPolicy.canMoveToStage(userCoInventorEdit, projectA, 'FORMS_PREPARATION');
    assert_1.default.strictEqual(earlyStageMoveByEdit, true, 'EDIT co-inventor can progress to FORMS_PREPARATION');
    const formsPrepProject = { ...projectA, stage: 'FORMS_PREPARATION' };
    const guideReviewByView = await workflow_policy_1.WorkflowPolicy.canMoveToStage(userCoInventorView, formsPrepProject, 'GUIDE_REVIEW');
    assert_1.default.strictEqual(guideReviewByView, false, 'VIEW co-inventor cannot submit for GUIDE_REVIEW');
    const guideReviewByEdit = await workflow_policy_1.WorkflowPolicy.canMoveToStage(userCoInventorEdit, formsPrepProject, 'GUIDE_REVIEW');
    assert_1.default.strictEqual(guideReviewByEdit, false, 'EDIT co-inventor cannot submit for GUIDE_REVIEW without SUBMIT rights');
    const guideReviewBySubmit = await workflow_policy_1.WorkflowPolicy.canMoveToStage(userCoInventorSubmit, formsPrepProject, 'GUIDE_REVIEW');
    assert_1.default.strictEqual(guideReviewBySubmit, true, 'SUBMIT co-inventor CAN submit for GUIDE_REVIEW');
    // Co-Inventors & Owners CANNOT approve their own reviews or projects
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(userCoInventorSubmit, projectA), false, 'Co-inventor CANNOT approve own review');
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(userOwner, projectA), false, 'Owner CANNOT approve own review');
    // Guide Review approval requires GUIDE
    const guideReviewProject = { ...projectA, stage: 'GUIDE_REVIEW' };
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(userGuide, guideReviewProject), true, 'Guide CAN approve Guide Review with mandatory forms complete');
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(userCoInventorSubmit, guideReviewProject), false, 'Co-inventor CANNOT approve Guide Review');
    console.log('  ✓ Workflow & Anti-Self-Approval tests passed.');
    // 6. INVITATION & MEMBERSHIP POLICY TESTS
    console.log('[Test 6] Membership and Invitation Policies:');
    const mockInvitation = {
        id: 'inv_100',
        projectId: 'proj_alpha',
        receiverId: 'co_inv_view',
        senderId: 'owner_123',
        status: 'PENDING',
    };
    assert_1.default.strictEqual(invitation_policy_1.InvitationPolicy.canAccept(userCoInventorView, mockInvitation), true, 'Intended receiver can accept invitation');
    assert_1.default.strictEqual(invitation_policy_1.InvitationPolicy.canAccept(userCoInventorB, mockInvitation), false, 'Unrelated user CANNOT accept another user\'s invitation');
    assert_1.default.strictEqual(membership_policy_1.MembershipPolicy.canUpdatePermissionLevel(userOwner, projectA, 'co_inv_view'), true, 'Project owner can update co-inventor permission level');
    assert_1.default.strictEqual(membership_policy_1.MembershipPolicy.canUpdatePermissionLevel(userCoInventorEdit, projectA, 'co_inv_view'), false, 'Co-inventor CANNOT modify another member\'s permission level');
    assert_1.default.strictEqual(membership_policy_1.MembershipPolicy.canUpdatePermissionLevel(userCoInventorEdit, projectA, 'co_inv_edit'), false, 'Co-inventor CANNOT self-elevate permissions');
    console.log('  ✓ Membership & Invitation tests passed.');
    console.log('\n======================================================');
    console.log('🎉 ALL CO-INVENTOR WORKSPACE POLICY TESTS PASSED (100%)');
    console.log('======================================================\n');
})();
