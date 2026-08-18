import assert from 'assert';
import { ProjectPolicy } from '../policies/project/project.policy';
import { ClaimPolicy } from '../policies/claim/claim.policy';
import { DocumentPolicy } from '../policies/document/document.policy';
import { PatentFormPolicy } from '../policies/forms/patent-form.policy';
import { WorkflowPolicy } from '../policies/workflow/workflow.policy';
import { ReviewPolicy } from '../policies/review/review.policy';
import { MembershipPolicy } from '../policies/project/membership.policy';
import { InvitationPolicy } from '../policies/invitation/invitation.policy';

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
assert.strictEqual(ProjectPolicy.canViewProject(userCoInventorView, projectA), true, 'Co-inventor member should be able to view project');
assert.strictEqual(ProjectPolicy.canViewProject(userCoInventorEdit, projectA), true, 'Co-inventor edit member should be able to view project');

// Non-member Co-Inventor B cannot view or access Project A
assert.strictEqual(ProjectPolicy.canViewProject(userCoInventorB, projectA), false, 'Non-member Co-inventor B MUST NOT access Project A');
assert.strictEqual(ProjectPolicy.canEditProject(userCoInventorB, projectA), false, 'Non-member Co-inventor B MUST NOT edit Project A');
assert.strictEqual(ProjectPolicy.canDeleteProject(userCoInventorB, projectA), false, 'Non-member Co-inventor B MUST NOT delete Project A');

// Co-Inventors cannot delete or archive the project
assert.strictEqual(ProjectPolicy.canDeleteProject(userCoInventorView, projectA), false, 'Co-inventor VIEW cannot delete project');
assert.strictEqual(ProjectPolicy.canDeleteProject(userCoInventorEdit, projectA), false, 'Co-inventor EDIT cannot delete project');
assert.strictEqual(ProjectPolicy.canDeleteProject(userCoInventorSubmit, projectA), false, 'Co-inventor SUBMIT cannot delete project');
assert.strictEqual(ProjectPolicy.canArchiveProject(userCoInventorSubmit, projectA), false, 'Co-inventor cannot archive project');

// Owner & Admin can delete/archive
assert.strictEqual(ProjectPolicy.canDeleteProject(userOwner, projectA), true, 'Owner can delete project');
assert.strictEqual(ProjectPolicy.canDeleteProject(userAdmin, projectA), true, 'Admin can delete project');
console.log('  ✓ Project isolation tests passed.');

// 2. PERMISSION LEVEL: VIEW ONLY TESTS
console.log('[Test 2] Permission Level: VIEW (Read-Only Enforcement):');

// Can view claims, elements, documents, forms, and tasks
assert.strictEqual(ClaimPolicy.canViewClaims(userCoInventorView, projectA), true, 'VIEW permission can view claims');
assert.strictEqual(ClaimPolicy.canViewClaimElements(userCoInventorView, projectA), true, 'VIEW permission can view claim elements');
assert.strictEqual(DocumentPolicy.canView(userCoInventorView, projectA), true, 'VIEW permission can view documents');
assert.strictEqual(DocumentPolicy.canDownload(userCoInventorView, projectA), true, 'VIEW permission can download documents');
assert.strictEqual(PatentFormPolicy.canView(userCoInventorView, projectA, 'Form 1'), true, 'VIEW permission can view Form 1');

// MUST NOT create, edit, or delete claims, documents, forms, or tasks
assert.strictEqual(ClaimPolicy.canCreateClaim(userCoInventorView, projectA), false, 'VIEW permission MUST NOT create claims');
assert.strictEqual(ClaimPolicy.canEditClaim(userCoInventorView, projectA), false, 'VIEW permission MUST NOT edit claims');
assert.strictEqual(ClaimPolicy.canDeleteClaim(userCoInventorView, projectA), false, 'VIEW permission MUST NOT delete claims');
assert.strictEqual(DocumentPolicy.canUpload(userCoInventorView, projectA), false, 'VIEW permission MUST NOT upload documents');
assert.strictEqual(DocumentPolicy.canEdit(userCoInventorView, projectA), false, 'VIEW permission MUST NOT edit documents');
assert.strictEqual(DocumentPolicy.canDelete(userCoInventorView, projectA), false, 'VIEW permission MUST NOT delete documents');
assert.strictEqual(PatentFormPolicy.canCreate(userCoInventorView, projectA, 'Form 2'), false, 'VIEW permission MUST NOT create forms');
assert.strictEqual(PatentFormPolicy.canEdit(userCoInventorView, projectA, 'Form 2'), false, 'VIEW permission MUST NOT edit forms');
assert.strictEqual(PatentFormPolicy.canSubmit(userCoInventorView, projectA, 'Form 2'), false, 'VIEW permission MUST NOT submit forms');
assert.strictEqual(ProjectPolicy.canCreateTask(userCoInventorView, projectA), false, 'VIEW permission MUST NOT create tasks');
console.log('  ✓ Permission Level VIEW tests passed.');

// 3. PERMISSION LEVEL: EDIT TESTS
console.log('[Test 3] Permission Level: EDIT (Contribution & Authoring):');

// Can create/edit claims, upload documents, edit forms, create tasks
assert.strictEqual(ClaimPolicy.canCreateClaim(userCoInventorEdit, projectA), true, 'EDIT permission can create claims');
assert.strictEqual(ClaimPolicy.canEditClaim(userCoInventorEdit, projectA), true, 'EDIT permission can edit claims');
assert.strictEqual(ClaimPolicy.canDeleteClaim(userCoInventorEdit, projectA), true, 'EDIT permission can delete claims');
assert.strictEqual(DocumentPolicy.canUpload(userCoInventorEdit, projectA), true, 'EDIT permission can upload documents');
assert.strictEqual(DocumentPolicy.canEdit(userCoInventorEdit, projectA), true, 'EDIT permission can edit documents');
assert.strictEqual(PatentFormPolicy.canCreate(userCoInventorEdit, projectA, 'Form 2'), true, 'EDIT permission can draft Form 2');
assert.strictEqual(PatentFormPolicy.canEdit(userCoInventorEdit, projectA, 'Form 2'), true, 'EDIT permission can edit Form 2');
assert.strictEqual(ProjectPolicy.canCreateTask(userCoInventorEdit, projectA), true, 'EDIT permission can create tasks');

// EDIT MUST NOT submit forms or submit project for formal review
assert.strictEqual(PatentFormPolicy.canSubmit(userCoInventorEdit, projectA, 'Form 2'), false, 'EDIT permission MUST NOT submit Form 2 (Requires SUBMIT)');
console.log('  ✓ Permission Level EDIT tests passed.');

// 4. PERMISSION LEVEL: SUBMIT TESTS
console.log('[Test 4] Permission Level: SUBMIT (Milestone & Review Submissions):');

// SUBMIT can submit forms and submit project for guide review
assert.strictEqual(PatentFormPolicy.canSubmit(userCoInventorSubmit, projectA, 'Form 2'), true, 'SUBMIT permission can submit Form 2');
console.log('  ✓ Permission Level SUBMIT tests passed.');

// 5. WORKFLOW & STAGE TRANSITIONS
console.log('[Test 5] Workflow Stage Transitions & Anti-Self-Approval:');

// Async workflow checks
(async () => {
  const earlyStageMoveByEdit = await WorkflowPolicy.canMoveToStage(userCoInventorEdit, projectA, 'FORMS_PREPARATION');
  assert.strictEqual(earlyStageMoveByEdit, true, 'EDIT co-inventor can progress to FORMS_PREPARATION');

  const formsPrepProject = { ...projectA, stage: 'FORMS_PREPARATION' as const };

  const guideReviewByView = await WorkflowPolicy.canMoveToStage(userCoInventorView, formsPrepProject, 'GUIDE_REVIEW');
  assert.strictEqual(guideReviewByView, false, 'VIEW co-inventor cannot submit for GUIDE_REVIEW');

  const guideReviewByEdit = await WorkflowPolicy.canMoveToStage(userCoInventorEdit, formsPrepProject, 'GUIDE_REVIEW');
  assert.strictEqual(guideReviewByEdit, false, 'EDIT co-inventor cannot submit for GUIDE_REVIEW without SUBMIT rights');

  const guideReviewBySubmit = await WorkflowPolicy.canMoveToStage(userCoInventorSubmit, formsPrepProject, 'GUIDE_REVIEW');
  assert.strictEqual(guideReviewBySubmit, true, 'SUBMIT co-inventor CAN submit for GUIDE_REVIEW');

  // Co-Inventors & Owners CANNOT approve their own reviews or projects
  assert.strictEqual(ReviewPolicy.canApprove(userCoInventorSubmit, projectA), false, 'Co-inventor CANNOT approve own review');
  assert.strictEqual(ReviewPolicy.canApprove(userOwner, projectA), false, 'Owner CANNOT approve own review');

  // Guide Review approval requires GUIDE
  const guideReviewProject = { ...projectA, stage: 'GUIDE_REVIEW' };
  assert.strictEqual(ReviewPolicy.canApprove(userGuide, guideReviewProject), true, 'Guide CAN approve Guide Review with mandatory forms complete');
  assert.strictEqual(ReviewPolicy.canApprove(userCoInventorSubmit, guideReviewProject), false, 'Co-inventor CANNOT approve Guide Review');

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

  assert.strictEqual(InvitationPolicy.canAccept(userCoInventorView, mockInvitation), true, 'Intended receiver can accept invitation');
  assert.strictEqual(InvitationPolicy.canAccept(userCoInventorB, mockInvitation), false, 'Unrelated user CANNOT accept another user\'s invitation');

  assert.strictEqual(MembershipPolicy.canUpdatePermissionLevel(userOwner, projectA, 'co_inv_view'), true, 'Project owner can update co-inventor permission level');
  assert.strictEqual(MembershipPolicy.canUpdatePermissionLevel(userCoInventorEdit, projectA, 'co_inv_view'), false, 'Co-inventor CANNOT modify another member\'s permission level');
  assert.strictEqual(MembershipPolicy.canUpdatePermissionLevel(userCoInventorEdit, projectA, 'co_inv_edit'), false, 'Co-inventor CANNOT self-elevate permissions');

  console.log('  ✓ Membership & Invitation tests passed.');
  console.log('\n======================================================');
  console.log('🎉 ALL CO-INVENTOR WORKSPACE POLICY TESTS PASSED (100%)');
  console.log('======================================================\n');
})();
