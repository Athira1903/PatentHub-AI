import assert from 'assert';
import { respondToInvitation, inviteMember } from '../controllers/collaborationController';
import { ProjectService } from '../services/projectService';
import { AuthenticationPolicy } from '../policies/auth/authentication.policy';
import { ProjectPolicy } from '../policies/project/project.policy';
import { MembershipPolicy } from '../policies/project/membership.policy';
import { DocumentPolicy } from '../policies/document/document.policy';
import { WorkflowPolicy } from '../policies/workflow/workflow.policy';
import { ReviewPolicy } from '../policies/review/review.policy';
import { PatentFormPolicy } from '../policies/forms/patent-form.policy';
import { InvitationPolicy } from '../policies/invitation/invitation.policy';
import { ReportPolicy } from '../policies/report/report.policy';
import { prisma } from '../config/db';

// Simple Test Runner framework
let passedTests = 0;
let failedTests = 0;
const testsQueue: Array<{ name: string; fn: () => any | Promise<any> }> = [];

function test(name: string, fn: () => any | Promise<any>) {
  testsQueue.push({ name, fn });
}

// ----------------------------------------------------
// 1. Authentication Tests
// ----------------------------------------------------
test('Authentication: Activated user can log in', async () => {
  const originalFindFirst = prisma.user.findFirst;
  (prisma.user as any).findFirst = async () => ({ id: 'u1', isActive: true });
  
  const canLogin = await AuthenticationPolicy.canLogin('activeUser');
  assert.strictEqual(canLogin, true);

  (prisma.user as any).findFirst = originalFindFirst;
});

test('Authentication: Unactivated/Suspended user denied login', async () => {
  const originalFindFirst = prisma.user.findFirst;
  (prisma.user as any).findFirst = async () => ({ id: 'u2', isActive: false });

  const canLogin = await AuthenticationPolicy.canLogin('inactiveUser');
  assert.strictEqual(canLogin, false);

  (prisma.user as any).findFirst = originalFindFirst;
});

// ----------------------------------------------------
// 2. Project Policy Tests
// ----------------------------------------------------
const mockOwner = { userId: 'user_owner', role: 'Inventor' };
const mockMember = { userId: 'user_member', role: 'Inventor' };
const mockNonMember = { userId: 'user_external', role: 'Inventor' };
const mockAdmin = { userId: 'user_admin', role: 'Admin' };

const mockProject = {
  id: 'p1',
  ownerId: 'user_owner',
  stage: 'IDEA',
  members: [
    { userId: 'user_owner', role: 'INVENTOR' },
    { userId: 'user_member', role: 'INVENTOR' }
  ],
  documents: []
};

test('Project: Owner can view, edit, delete, and archive project', () => {
  assert.strictEqual(ProjectPolicy.canViewProject(mockOwner, mockProject), true);
  assert.strictEqual(ProjectPolicy.canEditProject(mockOwner, mockProject), true);
  assert.strictEqual(ProjectPolicy.canDeleteProject(mockOwner, mockProject), true);
  assert.strictEqual(ProjectPolicy.canArchiveProject(mockOwner, mockProject), true);
});

test('Project: Member can view but not edit, delete, or archive project', () => {
  assert.strictEqual(ProjectPolicy.canViewProject(mockMember, mockProject), true);
  assert.strictEqual(ProjectPolicy.canEditProject(mockMember, mockProject), false);
  assert.strictEqual(ProjectPolicy.canDeleteProject(mockMember, mockProject), false);
  assert.strictEqual(ProjectPolicy.canArchiveProject(mockMember, mockProject), false);
});

test('Project: Non-member is denied view, edit, delete, and archive', () => {
  assert.strictEqual(ProjectPolicy.canViewProject(mockNonMember, mockProject), false);
  assert.strictEqual(ProjectPolicy.canEditProject(mockNonMember, mockProject), false);
  assert.strictEqual(ProjectPolicy.canDeleteProject(mockNonMember, mockProject), false);
  assert.strictEqual(ProjectPolicy.canArchiveProject(mockNonMember, mockProject), false);
});

test('Project: Admin can bypass checks and manage project', () => {
  assert.strictEqual(ProjectPolicy.canViewProject(mockAdmin, mockProject), true);
  assert.strictEqual(ProjectPolicy.canEditProject(mockAdmin, mockProject), true);
  assert.strictEqual(ProjectPolicy.canDeleteProject(mockAdmin, mockProject), true);
  assert.strictEqual(ProjectPolicy.canArchiveProject(mockAdmin, mockProject), true);
});

// ----------------------------------------------------
// 3. Document Policy Tests
// ----------------------------------------------------
test('Document: Editor (Inventor/CoInventor member) can upload and edit', () => {
  assert.strictEqual(DocumentPolicy.canUpload(mockOwner, mockProject), true);
  assert.strictEqual(DocumentPolicy.canUpload(mockMember, mockProject), true);
  assert.strictEqual(DocumentPolicy.canEdit(mockMember, mockProject), true);
});

test('Document: Viewer / non-editor cannot upload or edit', () => {
  const mockViewerProject = {
    ...mockProject,
    members: [{ userId: 'user_member', role: 'VIEWER' }] // Viewer role
  };
  assert.strictEqual(DocumentPolicy.canUpload(mockMember, mockViewerProject), false);
  assert.strictEqual(DocumentPolicy.canEdit(mockMember, mockViewerProject), false);
});

test('Document: Non-member cannot view or upload documents', () => {
  assert.strictEqual(DocumentPolicy.canView(mockNonMember, mockProject), false);
  assert.strictEqual(DocumentPolicy.canUpload(mockNonMember, mockProject), false);
});

// ----------------------------------------------------
// 4. Review Policy Tests
// ----------------------------------------------------
const mockGuideUser = { userId: 'user_guide', role: 'Guide' };
const mockExpertUser = { userId: 'user_expert', role: 'PatentExpert' };

const mockGuideProject = {
  ...mockProject,
  stage: 'GUIDE_REVIEW',
  members: [
    { userId: 'user_owner', role: 'INVENTOR' },
    { userId: 'user_guide', role: 'GUIDE' }
  ],
  documents: [
    { name: 'Form 1.pdf' },
    { name: 'Form 2.pdf' },
    { name: 'Form 3.pdf' },
    { name: 'Form 5.pdf' }
  ]
};

test('Review: Assigned Guide can review and approve (when forms complete)', () => {
  assert.strictEqual(ReviewPolicy.canReview(mockGuideUser, mockGuideProject), true);
  assert.strictEqual(ReviewPolicy.canApprove(mockGuideUser, mockGuideProject), true);
});

test('Review: Inventor cannot approve own review', () => {
  assert.strictEqual(ReviewPolicy.canApprove(mockOwner, mockGuideProject), false);
});

test('Review: Guide cannot approve if mandatory forms are missing', () => {
  const incompleteProject = { ...mockGuideProject, documents: [] };
  assert.strictEqual(ReviewPolicy.canApprove(mockGuideUser, incompleteProject), false);
});

test('Review: Global Guide who is NOT a project member CANNOT review or approve', () => {
  const nonMemberGuide = { userId: 'different_guide', role: 'Guide' };
  assert.strictEqual(ReviewPolicy.canReview(nonMemberGuide, mockGuideProject), false);
  assert.strictEqual(ReviewPolicy.canApprove(nonMemberGuide, mockGuideProject), false);
});

test('Review: Global Inventor (Student) who IS a project GUIDE member CAN review and approve', () => {
  const inventorAsGuideUser = { userId: 'student_guide', role: 'Inventor' };
  const projectWithStudentGuide = {
    ...mockGuideProject,
    members: [
      { userId: 'user_owner', role: 'INVENTOR' },
      { userId: 'student_guide', role: 'GUIDE' }
    ]
  };
  assert.strictEqual(ReviewPolicy.canReview(inventorAsGuideUser, projectWithStudentGuide), true);
  assert.strictEqual(ReviewPolicy.canApprove(inventorAsGuideUser, projectWithStudentGuide), true);
});

// ----------------------------------------------------
// 5. Workflow Policy Tests
// ----------------------------------------------------
test('Workflow: Valid stage transition succeeds', () => {
  const ok = WorkflowPolicy.isStageTransitionValid('IDEA', 'LITERATURE_REVIEW');
  assert.strictEqual(ok, true);
});

test('Workflow: Invalid stage transition (skipping stages) denied', () => {
  const ok = WorkflowPolicy.isStageTransitionValid('IDEA', 'PROTOTYPE');
  assert.strictEqual(ok, false);
});

test('Workflow: Rejection transition to DOCUMENTATION is allowed', () => {
  const ok1 = WorkflowPolicy.isStageTransitionValid('GUIDE_REVIEW', 'DOCUMENTATION');
  const ok2 = WorkflowPolicy.isStageTransitionValid('PATENT_EXPERT_REVIEW', 'DOCUMENTATION');
  assert.strictEqual(ok1, true);
  assert.strictEqual(ok2, true);
});

// ----------------------------------------------------
// 6. Invitation Policy Tests
// ----------------------------------------------------
test('Invitation: Authorized owner can invite compatible role', async () => {
  const originalFindUnique = prisma.user.findUnique;
  const originalProjectMemberFind = prisma.projectMember.findUnique;
  const originalInvitationFind = prisma.invitation.findFirst;

  // Mock invitee exists with Inventor role
  (prisma.user as any).findUnique = async () => ({ id: 'u_invitee', username: 'guest_user', role: { name: 'Inventor' } });
  (prisma.projectMember as any).findUnique = async () => null;
  (prisma.invitation as any).findFirst = async () => null;

  const allowed = await InvitationPolicy.canInvite(mockOwner, mockProject, 'guest_user', 'CO_INVENTOR');
  assert.strictEqual(allowed, true);

  (prisma.user as any).findUnique = originalFindUnique;
  (prisma.projectMember as any).findUnique = originalProjectMemberFind;
  (prisma.invitation as any).findFirst = originalInvitationFind;
});

test('Invitation: User registered globally as Inventor can be invited as a GUIDE (project-scoped multi-role)', async () => {
  const originalFindUnique = prisma.user.findUnique;
  const originalProjectMemberFind = prisma.projectMember.findUnique;
  const originalInvitationFind = prisma.invitation.findFirst;

  // Mock invitee exists with Inventor role
  (prisma.user as any).findUnique = async () => ({ id: 'u_invitee', username: 'guest_user', role: { name: 'Inventor' } });
  (prisma.projectMember as any).findUnique = async () => null;
  (prisma.invitation as any).findFirst = async () => null;

  // Invite as GUIDE
  const allowed = await InvitationPolicy.canInvite(mockOwner, mockProject, 'guest_user', 'GUIDE');
  assert.strictEqual(allowed, true);

  (prisma.user as any).findUnique = originalFindUnique;
  (prisma.projectMember as any).findUnique = originalProjectMemberFind;
  (prisma.invitation as any).findFirst = originalInvitationFind;
});

// ----------------------------------------------------
// 7. Report Policy Tests
// ----------------------------------------------------
test('Report: Incomplete project cannot generate readiness report', () => {
  // Missing documents and forms
  assert.strictEqual(ReportPolicy.canGenerateReadinessReport(mockOwner, mockProject), false);
});

test('Report: Completed project can generate readiness report', () => {
  const completedProject = {
    ...mockProject,
    stage: 'DOCUMENTATION',
    documents: [
      { name: 'Form 1' },
      { name: 'Form 2' },
      { name: 'Form 3' },
      { name: 'Form 5' },
      { name: 'Form 26' }
    ]
  };
  assert.strictEqual(ReportPolicy.canGenerateReadinessReport(mockOwner, completedProject), true);
});

// ----------------------------------------------------
// 8. Invitation Acceptance Controller Hardening Tests
// ----------------------------------------------------
test('Controller: respondToInvitation rejects with 403 on receiver mismatch', async () => {
  const mockReq = {
    user: { userId: 'wrong_user' },
    body: { invitationId: 'invite_1', status: 'ACCEPTED' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUnique = prisma.invitation.findUnique;
  (prisma.invitation as any).findUnique = async () => ({
    id: 'invite_1',
    receiverId: 'correct_user',
    status: 'PENDING',
    project: { id: 'p1' }
  });

  await respondToInvitation(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 403);
  assert.strictEqual((responseData as any).message.includes('Access denied'), true);

  (prisma.invitation as any).findUnique = originalFindUnique;
});

test('Controller: respondToInvitation rejects with 404 if project no longer exists', async () => {
  const mockReq = {
    user: { userId: 'correct_user' },
    body: { invitationId: 'invite_1', status: 'ACCEPTED' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUnique = prisma.invitation.findUnique;
  (prisma.invitation as any).findUnique = async () => ({
    id: 'invite_1',
    receiverId: 'correct_user',
    status: 'PENDING',
    project: null
  });

  await respondToInvitation(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 404);
  assert.strictEqual((responseData as any).message.includes('no longer exists'), true);

  (prisma.invitation as any).findUnique = originalFindUnique;
});

test('Controller: respondToInvitation rejects with 400 if user already a project member', async () => {
  const mockReq = {
    user: { userId: 'correct_user' },
    body: { invitationId: 'invite_1', status: 'ACCEPTED' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUnique = prisma.invitation.findUnique;
  const originalMemberFindUnique = prisma.projectMember.findUnique;

  (prisma.invitation as any).findUnique = async () => ({
    id: 'invite_1',
    projectId: 'p1',
    receiverId: 'correct_user',
    status: 'PENDING',
    project: { id: 'p1' }
  });

  (prisma.projectMember as any).findUnique = async () => ({ id: 'pm_1', projectId: 'p1', userId: 'correct_user' });

  await respondToInvitation(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 400);
  assert.strictEqual((responseData as any).message.includes('already a member'), true);

  (prisma.invitation as any).findUnique = originalFindUnique;
  (prisma.projectMember as any).findUnique = originalMemberFindUnique;
});

test('Controller: respondToInvitation successfully accepts and writes within a transaction', async () => {
  const mockReq = {
    user: { userId: 'correct_user' },
    body: { invitationId: 'invite_1', status: 'ACCEPTED' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUnique = prisma.invitation.findUnique;
  const originalMemberFindUnique = prisma.projectMember.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalUpdate = prisma.invitation.update;
  const originalCreateMember = prisma.projectMember.create;
  const originalCreateNotification = prisma.notification.create;
  const originalCreateActivity = prisma.activityLog.create;

  let invitationUpdated = false;
  let memberCreated = false;
  let notificationsDispatched = false;

  (prisma.invitation as any).findUnique = async () => ({
    id: 'invite_1',
    receiverId: 'correct_user',
    senderId: 'sender_1',
    role: 'GUIDE',
    status: 'PENDING',
    project: { id: 'p1', title: 'Test Project' },
    receiver: { fullName: 'Recipient Name' }
  });

  (prisma.projectMember as any).findUnique = async () => null;

  (prisma as any).$transaction = async (callback: any) => {
    return callback(prisma);
  };

  (prisma.invitation as any).update = async (args: any) => {
    invitationUpdated = true;
    assert.strictEqual(args.data.status, 'ACCEPTED');
    return {};
  };

  (prisma.projectMember as any).create = async (args: any) => {
    memberCreated = true;
    assert.strictEqual(args.data.role, 'GUIDE');
    return {};
  };

  (prisma.notification as any).create = async () => {
    notificationsDispatched = true;
    return {};
  };

  (prisma.activityLog as any).create = async () => {
    return {};
  };

  await respondToInvitation(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 200);
  assert.strictEqual(invitationUpdated, true);
  assert.strictEqual(memberCreated, true);
  assert.strictEqual(notificationsDispatched, true);

  (prisma.invitation as any).findUnique = originalFindUnique;
  (prisma.projectMember as any).findUnique = originalMemberFindUnique;
  (prisma as any).$transaction = originalTransaction;
  (prisma.invitation as any).update = originalUpdate;
  (prisma.projectMember as any).create = originalCreateMember;
  (prisma.notification as any).create = originalCreateNotification;
  (prisma.activityLog as any).create = originalCreateActivity;
});

// ----------------------------------------------------
// 9. Invitation Creation & Direct Membership Hardening Tests (Phase 2)
// ----------------------------------------------------
test('Controller: inviteMember rejects invalid ProjectRole', async () => {
  const mockReq = {
    user: { userId: 'sender_1' },
    body: { projectId: 'p1', username: 'receiver_1', role: 'INVALID_ROLE' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  await inviteMember(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 400);
  assert.strictEqual((responseData as any).message.includes('Invalid project role'), true);
});

test('Controller: inviteMember rejects self-invitation', async () => {
  const mockReq = {
    user: { userId: 'sender_1' },
    body: { projectId: 'p1', username: 'sender_user', role: 'GUIDE' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUniqueProject = prisma.patentProject.findUnique;
  const originalFindUniqueUser = prisma.user.findUnique;

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1' });
  (prisma.user as any).findUnique = async (args: any) => {
    if (args.where.username === 'sender_user') {
      return { id: 'sender_1', username: 'sender_user' };
    }
    return null;
  };

  await inviteMember(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 400);
  assert.strictEqual((responseData as any).message.includes('cannot invite yourself'), true);

  (prisma.patentProject as any).findUnique = originalFindUniqueProject;
  (prisma.user as any).findUnique = originalFindUniqueUser;
});

test('Controller: inviteMember rejects if user already a project member', async () => {
  const mockReq = {
    user: { userId: 'sender_1' },
    body: { projectId: 'p1', username: 'receiver_user', role: 'GUIDE' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUniqueProject = prisma.patentProject.findUnique;
  const originalFindUniqueUser = prisma.user.findUnique;
  const originalMemberFindUnique = prisma.projectMember.findUnique;

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1' });
  (prisma.user as any).findUnique = async (args: any) => {
    if (args.where.username === 'receiver_user') {
      return { id: 'receiver_1', username: 'receiver_user' };
    }
    if (args.where.id === 'sender_1') {
      return { id: 'sender_1', username: 'sender_user' };
    }
    return null;
  };
  (prisma.projectMember as any).findUnique = async () => ({ id: 'pm_1' });

  await inviteMember(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 400);
  assert.strictEqual((responseData as any).message.includes('already a member'), true);

  (prisma.patentProject as any).findUnique = originalFindUniqueProject;
  (prisma.user as any).findUnique = originalFindUniqueUser;
  (prisma.projectMember as any).findUnique = originalMemberFindUnique;
});

test('Controller: inviteMember rejects if active invitation already exists', async () => {
  const mockReq = {
    user: { userId: 'sender_1' },
    body: { projectId: 'p1', username: 'receiver_user', role: 'GUIDE' }
  };
  let statusSet = 500;
  let responseData = {};
  const mockRes = {
    status: (code: number) => { statusSet = code; return mockRes; },
    json: (data: any) => { responseData = data; }
  };

  const originalFindUniqueProject = prisma.patentProject.findUnique;
  const originalFindUniqueUser = prisma.user.findUnique;
  const originalMemberFindUnique = prisma.projectMember.findUnique;
  const originalInvitationFindFirst = prisma.invitation.findFirst;

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1' });
  (prisma.user as any).findUnique = async (args: any) => {
    if (args.where.username === 'receiver_user') {
      return { id: 'receiver_1', username: 'receiver_user' };
    }
    if (args.where.id === 'sender_1') {
      return { id: 'sender_1', username: 'sender_user' };
    }
    return null;
  };
  (prisma.projectMember as any).findUnique = async () => null;
  (prisma.invitation as any).findFirst = async () => ({ id: 'inv_existing', status: 'PENDING' });

  await inviteMember(mockReq as any, mockRes as any);

  assert.strictEqual(statusSet, 400);
  assert.strictEqual((responseData as any).message.includes('pending invitation has already been sent'), true);

  (prisma.patentProject as any).findUnique = originalFindUniqueProject;
  (prisma.user as any).findUnique = originalFindUniqueUser;
  (prisma.projectMember as any).findUnique = originalMemberFindUnique;
  (prisma.invitation as any).findFirst = originalInvitationFindFirst;
});

test('Service: inviteMemberByUsername rejects invalid ProjectRole', async () => {
  await assert.rejects(
    async () => {
      await ProjectService.inviteMemberByUsername('p1', 'sender_1', 'receiver_user', 'INVALID_ROLE' as any);
    },
    /Invalid project role/
  );
});

test('Service: inviteMemberByUsername rejects self-addition', async () => {
  const originalFindUniqueProject = prisma.patentProject.findUnique;
  const originalFindUniqueUser = prisma.user.findUnique;

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1', ownerId: 'sender_1' });
  (prisma.user as any).findUnique = async () => ({ id: 'sender_1', username: 'sender_user' });

  await assert.rejects(
    async () => {
      await ProjectService.inviteMemberByUsername('p1', 'sender_1', 'sender_user', 'GUIDE');
    },
    /cannot add yourself/
  );

  (prisma.patentProject as any).findUnique = originalFindUniqueProject;
  (prisma.user as any).findUnique = originalFindUniqueUser;
});

test('Service: inviteMemberByUsername rejects if active invitation exists', async () => {
  const originalFindUniqueProject = prisma.patentProject.findUnique;
  const originalFindUniqueUser = prisma.user.findUnique;
  const originalMemberFindUnique = prisma.projectMember.findUnique;
  const originalInvitationFindFirst = prisma.invitation.findFirst;

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1', ownerId: 'sender_1' });
  (prisma.user as any).findUnique = async () => ({ id: 'receiver_1', username: 'receiver_user' });
  (prisma.projectMember as any).findUnique = async () => null;
  (prisma.invitation as any).findFirst = async () => ({ id: 'inv_existing', status: 'PENDING' });

  await assert.rejects(
    async () => {
      await ProjectService.inviteMemberByUsername('p1', 'sender_1', 'receiver_user', 'GUIDE');
    },
    /pending invitation has already been sent/
  );

  (prisma.patentProject as any).findUnique = originalFindUniqueProject;
  (prisma.user as any).findUnique = originalFindUniqueUser;
  (prisma.projectMember as any).findUnique = originalMemberFindUnique;
  (prisma.invitation as any).findFirst = originalInvitationFindFirst;
});

// Summary reporting and sequential execution
async function runAllTests() {
  for (const t of testsQueue) {
    try {
      const res = t.fn();
      if (res instanceof Promise) {
        await res;
      }
      console.log(`✅ [PASS] ${t.name}`);
      passedTests++;
    } catch (err) {
      console.error(`❌ [FAIL] ${t.name}`);
      console.error(err);
      failedTests++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`POLICY TESTS COMPLETED: ${passedTests} passed, ${failedTests} failed.`);
  console.log(`==================================================\n`);
  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

setTimeout(runAllTests, 500);
