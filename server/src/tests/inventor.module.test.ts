import assert from 'assert';
import { ProjectPolicy } from '../policies/project/project.policy';
import { WorkflowPolicy } from '../policies/workflow/workflow.policy';
import { ReviewPolicy } from '../policies/review/review.policy';
import { MembershipPolicy } from '../policies/project/membership.policy';
import { InvitationPolicy } from '../policies/invitation/invitation.policy';
import { DocumentPolicy } from '../policies/document/document.policy';
import { PatentFormPolicy } from '../policies/forms/patent-form.policy';

console.log('======================================================');
console.log('--- STARTING INVENTOR MODULE AUDIT & POLICY TEST SUITE ---');
console.log('======================================================');

// Users
const inventorUser = { userId: 'inventor_101', role: 'Inventor', username: 'lead_inventor' };
const coInventorUser = { userId: 'coinventor_202', role: 'CoInventor', username: 'collaborator' };
const guideUser = { userId: 'guide_303', role: 'Guide', username: 'faculty_guide' };
const expertUser = { userId: 'expert_404', role: 'PatentExpert', username: 'patent_expert' };
const strangerUser = { userId: 'stranger_505', role: 'Inventor', username: 'unauthorized_user' };
const adminUser = { userId: 'admin_001', role: 'Admin', username: 'admin' };

// Mock Project
const project = {
  id: 'proj_patent_101',
  title: 'Next-Gen Solar Energy Storage Cell',
  ownerId: 'inventor_101',
  stage: 'DOCUMENTATION',
  members: [
    { userId: 'inventor_101', role: 'INVENTOR', permissionLevel: 'SUBMIT' },
    { userId: 'coinventor_202', role: 'CO_INVENTOR', permissionLevel: 'EDIT' },
    { userId: 'guide_303', role: 'GUIDE', permissionLevel: 'EDIT' },
    { userId: 'expert_404', role: 'PATENT_EXPERT', permissionLevel: 'EDIT' },
  ],
  documents: [
    { id: 'doc_1', name: 'Form 1 Application.pdf', category: 'FORMS' },
    { id: 'doc_2', name: 'Form 2 Complete Specs.pdf', category: 'FORMS' },
    { id: 'doc_3', name: 'Form 3 Statement.pdf', category: 'FORMS' },
    { id: 'doc_5', name: 'Form 5 Inventorship.pdf', category: 'FORMS' },
  ],
};

// 1. Project Creation & Access Isolation
console.log('\n[Test 1] Project Creation & Isolation:');
assert.strictEqual(ProjectPolicy.canCreateProject(inventorUser), true, 'Inventor should be able to create project');
assert.strictEqual(ProjectPolicy.canViewProject(inventorUser, project), true, 'Owner can view own project');
assert.strictEqual(ProjectPolicy.canViewProject(coInventorUser, project), true, 'Member can view project');
assert.strictEqual(ProjectPolicy.canViewProject(strangerUser, project), false, 'Stranger CANNOT view private project');
assert.strictEqual(ProjectPolicy.canEditProject(inventorUser, project), true, 'Owner can edit project');
assert.strictEqual(ProjectPolicy.canEditProject(coInventorUser, project), false, 'Collaborator cannot edit core project metadata directly');
assert.strictEqual(ProjectPolicy.canDeleteProject(inventorUser, project), true, 'Owner can delete project');
assert.strictEqual(ProjectPolicy.canDeleteProject(coInventorUser, project), false, 'Member cannot delete project');
console.log('  ✓ Project creation & access isolation passed.');

// 2. Member Management & Removal
console.log('\n[Test 2] Team & Member Removal Authorization:');
assert.strictEqual(MembershipPolicy.canRemoveMember(inventorUser, project, 'coinventor_202'), true, 'Owner can remove collaborator');
assert.strictEqual(MembershipPolicy.canRemoveMember(inventorUser, project, 'inventor_101'), false, 'Owner CANNOT remove himself');
assert.strictEqual(MembershipPolicy.canRemoveMember(coInventorUser, project, 'guide_303'), false, 'Collaborator cannot remove other members');
assert.strictEqual(MembershipPolicy.canRemoveMember(adminUser, project, 'coinventor_202'), true, 'Admin can remove members');
console.log('  ✓ Team membership and removal policy passed.');

// 3. Document Access & Security
console.log('\n[Test 3] Document Management & Download Authorization:');
assert.strictEqual(DocumentPolicy.canUpload(inventorUser, project), true, 'Owner can upload documents');
assert.strictEqual(DocumentPolicy.canUpload(coInventorUser, project), true, 'Editor can upload documents');
assert.strictEqual(DocumentPolicy.canUpload(strangerUser, project), false, 'Stranger CANNOT upload documents');
assert.strictEqual(DocumentPolicy.canDownload(inventorUser, project), true, 'Owner can download documents');
assert.strictEqual(DocumentPolicy.canDownload(coInventorUser, project), true, 'Member can download documents');
assert.strictEqual(DocumentPolicy.canDownload(strangerUser, project), false, 'Stranger CANNOT download documents');
console.log('  ✓ Document management & download policies passed.');

// 4. Review View Policy
console.log('\n[Test 4] Review Audit Visibility Policy:');
assert.strictEqual(ReviewPolicy.canViewReviews(inventorUser, project), true, 'Owner CAN view review audit history');
assert.strictEqual(ReviewPolicy.canViewReviews(coInventorUser, project), true, 'Collaborator CAN view review history');
assert.strictEqual(ReviewPolicy.canViewReviews(guideUser, project), true, 'Guide CAN view review history');
assert.strictEqual(ReviewPolicy.canViewReviews(expertUser, project), true, 'Expert CAN view review history');
assert.strictEqual(ReviewPolicy.canViewReviews(strangerUser, project), false, 'Stranger CANNOT view review history');
console.log('  ✓ Review audit visibility passed.');

// 5. Workflow Transitions & Resubmission
console.log('\n[Test 5] Workflow Progression, Review & Resubmission:');

// Normal forward progression
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('IDEA', 'LITERATURE_REVIEW'), true, 'IDEA -> LITERATURE_REVIEW');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('LITERATURE_REVIEW', 'PROTOTYPE'), true, 'LITERATURE_REVIEW -> PROTOTYPE');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('PROTOTYPE', 'DOCUMENTATION'), true, 'PROTOTYPE -> DOCUMENTATION');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('DOCUMENTATION', 'FORMS_PREPARATION'), true, 'DOCUMENTATION -> FORMS_PREPARATION');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('FORMS_PREPARATION', 'GUIDE_REVIEW'), true, 'FORMS_PREPARATION -> GUIDE_REVIEW');

// Direct submission / resubmission from DOCUMENTATION or FORMS_PREPARATION to GUIDE_REVIEW
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('DOCUMENTATION', 'GUIDE_REVIEW'), true, 'DOCUMENTATION -> GUIDE_REVIEW (Resubmission)');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('FORMS_PREPARATION', 'GUIDE_REVIEW'), true, 'FORMS_PREPARATION -> GUIDE_REVIEW (Submission)');

// Changes requested sent back to DOCUMENTATION
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('GUIDE_REVIEW', 'DOCUMENTATION'), true, 'GUIDE_REVIEW -> DOCUMENTATION (Changes Requested)');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('PATENT_EXPERT_REVIEW', 'DOCUMENTATION'), true, 'PATENT_EXPERT_REVIEW -> DOCUMENTATION (Changes Requested)');

// Invalid jumps
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('IDEA', 'FILING_READY'), false, 'Cannot skip from IDEA directly to FILING_READY');
assert.strictEqual(WorkflowPolicy.isStageTransitionValid('IDEA', 'GUIDE_REVIEW'), false, 'Cannot skip from IDEA directly to GUIDE_REVIEW');
console.log('  ✓ Workflow stage transition rules passed.');

// 6. Anti-Self-Approval & Review Execution
console.log('\n[Test 6] Review Decision Execution & Anti-Self-Approval:');

const projectInGuideReview = { ...project, stage: 'GUIDE_REVIEW' };
const projectInExpertReview = { ...project, stage: 'PATENT_EXPERT_REVIEW' };

// Anti-Self-Approval: Inventor CANNOT approve own review
assert.strictEqual(ReviewPolicy.canApprove(inventorUser, projectInGuideReview), false, 'Inventor CANNOT approve own Guide Review');
assert.strictEqual(ReviewPolicy.canApprove(inventorUser, projectInExpertReview), false, 'Inventor CANNOT approve own Expert Review');
assert.strictEqual(ReviewPolicy.canReject(inventorUser, projectInGuideReview), false, 'Inventor CANNOT reject own review');

// Guide review permissions
assert.strictEqual(ReviewPolicy.canReview(guideUser, projectInGuideReview), true, 'Guide can review in GUIDE_REVIEW');
assert.strictEqual(ReviewPolicy.canApprove(guideUser, projectInGuideReview), true, 'Guide can approve when mandatory forms exist');
assert.strictEqual(ReviewPolicy.canReject(guideUser, projectInGuideReview), true, 'Guide can request revisions');

// Patent Expert review permissions
assert.strictEqual(ReviewPolicy.canReview(expertUser, projectInExpertReview), true, 'Expert can review in PATENT_EXPERT_REVIEW');
assert.strictEqual(ReviewPolicy.canApprove(expertUser, projectInExpertReview), true, 'Expert can approve when mandatory forms exist');
assert.strictEqual(ReviewPolicy.canReject(expertUser, projectInExpertReview), true, 'Expert can request revisions');

// Form dependencies
assert.strictEqual(PatentFormPolicy.areMandatoryFormsComplete(project), true, 'Mandatory forms 1, 2, 3, 5 complete');
const incompleteProject = { ...project, documents: [] };
assert.strictEqual(PatentFormPolicy.areMandatoryFormsComplete(incompleteProject), false, 'Fails when forms are missing');
assert.strictEqual(ReviewPolicy.canApprove(guideUser, incompleteProject), false, 'Guide CANNOT approve when mandatory forms are incomplete');

console.log('  ✓ Anti-self-approval and review validation passed.');

// 7. Invitation System Lifecycle
console.log('\n[Test 7] Invitation Lifecycle:');
const pendingInvite = {
  id: 'inv_101',
  projectId: project.id,
  senderId: inventorUser.userId,
  receiverId: coInventorUser.userId,
  status: 'PENDING',
};

assert.strictEqual(InvitationPolicy.canAccept(coInventorUser, pendingInvite), true, 'Invited user can accept');
assert.strictEqual(InvitationPolicy.canAccept(strangerUser, pendingInvite), false, 'Wrong user CANNOT accept invitation');
assert.strictEqual(InvitationPolicy.canAccept(inventorUser, pendingInvite), false, 'Sender cannot accept own invite');
console.log('  ✓ Invitation security passed.');

console.log('\n======================================================');
console.log('🎉 ALL INVENTOR MODULE AUDIT TESTS PASSED (100%)');
console.log('======================================================\n');
