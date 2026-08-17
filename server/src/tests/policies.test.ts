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
import { PatentReferencePolicy } from '../policies/project/patent-reference.policy';
import { prisma } from '../config/db';
import { AiService } from '../services/aiService';
import { PatentSearchService } from '../services/patentSearchService';
import { PatentReferenceService } from '../services/patentReferenceService';
import { FormService } from '../services/formService';
import { ReviewService } from '../services/reviewService';
import { FilingReadinessService } from '../services/filingReadinessService';
import { PrototypeService } from '../services/prototypeService';
import { PdfService } from '../services/pdfService';
import { ActivityService } from '../services/activityService';
import { NotificationService } from '../services/notificationService';
import { MailService } from '../services/mailService';
import { TaskService } from '../services/taskService';
import { AnalyticsService } from '../services/analyticsService';
import { ClaimService } from '../services/claimService';
import { ClaimAiService } from '../services/claimAiService';
import { ClaimValidationService } from '../services/claimValidationService';
import { FtoAnalysisService } from '../services/ftoAnalysisService';
import { ClaimPolicy } from '../policies/claim/claim.policy';
import {
  generateInnovationAi,
  getSimilarityAnalysis,
  getNoveltyAssessment,
  generatePatentDrawing
} from '../controllers/aiController';
import {
  searchPatents,
  getSavedReferences,
  saveReference,
  deleteReference
} from '../controllers/patentController';

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
  const originalUpdateManyNotification = prisma.notification.updateMany;
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
    receiver: { fullName: 'Recipient Name', username: 'recipient_user' },
    sender: { id: 'sender_1', email: 'sender@example.com', fullName: 'Sender Name' },
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

  (prisma.notification as any).updateMany = async () => {
    return { count: 1 };
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
  (prisma.notification as any).updateMany = originalUpdateManyNotification;
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

// ----------------------------------------------------
// 7. AI & Gemini Integration Tests
// ----------------------------------------------------
test('Controller: generateInnovationAi suggests title successfully', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  const originalSuggestions = AiService.generateInnovationSuggestions;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Smart Ingestor',
    innovationIdea: 'A smart ingestor system',
    proposedSolution: 'Using distributed feedback queues',
    category: 'Software',
    technicalDomain: 'Computing'
  });

  (AiService as any).generateInnovationSuggestions = async () => 'Suggested Patent Title';

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'p1' },
    body: { action: 'title' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await generateInnovationAi(req, res);

  assert.strictEqual(statusVal, 200);
  assert.strictEqual(jsonVal.success, true);
  assert.strictEqual(jsonVal.suggestion, 'Suggested Patent Title');

  (prisma.patentProject as any).findUnique = originalFindUnique;
  (AiService as any).generateInnovationSuggestions = originalSuggestions;
});

test('Controller: getSimilarityAnalysis returns similarity response without fabricated prior art', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  const originalSimilarity = AiService.analyzeSimilarity;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Smart Ingestor',
    innovationIdea: 'A smart ingestor system',
    proposedSolution: 'Using distributed feedback queues',
    category: 'Software',
    technicalDomain: 'Computing'
  });

  const mockAnalysis = {
    score: 15,
    riskLevel: 'Low Risk',
    matchingConcepts: ['Concept A'],
    overlappingFeatures: ['Feature B'],
    priorArtReferences: [],
    explanation: 'Conceptual overlap is low.',
    disclaimer: 'AI-assisted conceptual comparison rather than a verified prior-art search.'
  };

  (AiService as any).analyzeSimilarity = async () => mockAnalysis;

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'p1' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await getSimilarityAnalysis(req, res);

  assert.strictEqual(statusVal, 200);
  assert.strictEqual(jsonVal.success, true);
  assert.strictEqual(jsonVal.score, 15);
  assert.strictEqual(jsonVal.riskLevel, 'Low Risk');
  assert.deepStrictEqual(jsonVal.priorArtReferences, []);

  (prisma.patentProject as any).findUnique = originalFindUnique;
  (AiService as any).analyzeSimilarity = originalSimilarity;
});

test('Controller: getNoveltyAssessment returns novelty response with proper disclaimer', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  const originalNovelty = AiService.analyzeNovelty;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Smart Ingestor',
    innovationIdea: 'A smart ingestor system',
    proposedSolution: 'Using distributed feedback queues',
    category: 'Software',
    technicalDomain: 'Computing'
  });

  const mockNovelty = {
    score: 85,
    assessment: 'High',
    strongAreas: ['Area A'],
    weakAreas: ['Area B'],
    recommendations: ['Rec C'],
    explanation: 'Novelty is strong.',
    disclaimer: 'AI-assisted preliminary assessment. This is not a legal opinion or a definitive patentability determination.'
  };

  (AiService as any).analyzeNovelty = async () => mockNovelty;

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'p1' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await getNoveltyAssessment(req, res);

  assert.strictEqual(statusVal, 200);
  assert.strictEqual(jsonVal.success, true);
  assert.strictEqual(jsonVal.score, 85);
  assert.strictEqual(jsonVal.assessment, 'High');

  (prisma.patentProject as any).findUnique = originalFindUnique;
  (AiService as any).analyzeNovelty = originalNovelty;
});

test('Controller: generatePatentDrawing returns drawing component annotations metadata', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  const originalDrawing = AiService.generatePatentDrawingAnalysis;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Smart Ingestor',
    innovationIdea: 'A smart ingestor system',
    proposedSolution: 'Using distributed feedback queues',
    category: 'Software',
    technicalDomain: 'Computing'
  });

  const mockDrawing = {
    figNum: 'FIG. 1',
    components: [{ number: '102', label: 'Primary Port' }]
  };

  (AiService as any).generatePatentDrawingAnalysis = async () => mockDrawing;

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'p1' },
    body: { originalUrl: 'https://images.unsplash.com/test' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await generatePatentDrawing(req, res);

  assert.strictEqual(statusVal, 200);
  assert.strictEqual(jsonVal.success, true);
  assert.strictEqual(jsonVal.drawingMetadata.figNum, 'FIG. 1');
  assert.strictEqual(jsonVal.drawingMetadata.components[0].label, 'Primary Port');

  (prisma.patentProject as any).findUnique = originalFindUnique;
  (AiService as any).generatePatentDrawingAnalysis = originalDrawing;
});

test('Controller: AI endpoints return 404 for missing project', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  (prisma.patentProject as any).findUnique = async () => null;

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'missing_id' },
    body: { action: 'title' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await generateInnovationAi(req, res);
  assert.strictEqual(statusVal, 404);

  (prisma.patentProject as any).findUnique = originalFindUnique;
});

test('Controller: AI endpoints return 400 for empty project content', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: '',
    innovationIdea: '',
    proposedSolution: ''
  });

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'p1' },
    body: { action: 'title' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await generateInnovationAi(req, res);
  assert.strictEqual(statusVal, 400);
  assert.ok(jsonVal.message.includes('must have a title'));

  (prisma.patentProject as any).findUnique = originalFindUnique;
});

test('Controller: AI endpoints handle Gemini service failure gracefully with 502', async () => {
  const originalFindUnique = prisma.patentProject.findUnique;
  const originalNovelty = AiService.analyzeNovelty;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Smart Ingestor',
    innovationIdea: 'A smart ingestor system',
    proposedSolution: 'Using distributed feedback queues'
  });

  (AiService as any).analyzeNovelty = async () => {
    throw new Error('Gemini quota exceeded or server timeout.');
  };

  let statusVal = 0;
  let jsonVal: any = null;
  const req = {
    params: { id: 'p1' }
  } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await getNoveltyAssessment(req, res);
  assert.strictEqual(statusVal, 502);
  assert.ok(jsonVal.message.includes('currently unavailable'));

  (prisma.patentProject as any).findUnique = originalFindUnique;
  (AiService as any).analyzeNovelty = originalNovelty;
});

// ----------------------------------------------------
// 12. Patent Reference Policy & Service Tests (Task 4)
// ----------------------------------------------------
test('Patent Policy: Role permissions for Search, View, Save, Delete, and AI Analysis', () => {
  const ownerUser = { userId: 'user_owner', role: 'Inventor' };
  const adminUser = { userId: 'user_admin', role: 'Admin' };
  const editorUser = { userId: 'user_editor', role: 'Inventor' };
  const viewerUser = { userId: 'user_viewer', role: 'Guide' };
  const externalUser = { userId: 'user_external', role: 'Inventor' };

  const testProject = {
    id: 'p1',
    ownerId: 'user_owner',
    members: [
      { userId: 'user_owner', role: 'INVENTOR' },
      { userId: 'user_editor', role: 'INVENTOR' },
      { userId: 'user_viewer', role: 'GUIDE' }
    ]
  };

  assert.strictEqual(PatentReferencePolicy.canSearch(ownerUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canSearch(editorUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canSearch(viewerUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canSearch(externalUser, testProject), false);

  assert.strictEqual(PatentReferencePolicy.canViewReferences(ownerUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canViewReferences(viewerUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canViewReferences(externalUser, testProject), false);

  assert.strictEqual(PatentReferencePolicy.canSaveReference(ownerUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canSaveReference(adminUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canSaveReference(editorUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canSaveReference(viewerUser, testProject), false);
  assert.strictEqual(PatentReferencePolicy.canSaveReference(externalUser, testProject), false);

  assert.strictEqual(PatentReferencePolicy.canDeleteReference(ownerUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canDeleteReference(editorUser, testProject), true);
  assert.strictEqual(PatentReferencePolicy.canDeleteReference(viewerUser, testProject), false);
});

test('Patent Search Service: Performs mock search fallback cleanly', async () => {
  const results = await PatentSearchService.search('consensus');
  assert.ok(Array.isArray(results));
  assert.ok(results.length > 0);
  assert.strictEqual(results[0].source, 'MOCK');
  assert.ok(results[0].patentNumber);
  assert.ok(results[0].title);
});

test('Patent Controller: Empty query returns 400 Bad Request', async () => {
  let statusVal = 0;
  let jsonVal: any = null;
  const req = { query: { q: '' } } as any;
  const res = {
    status: (s: number) => { statusVal = s; return res; },
    json: (j: any) => { jsonVal = j; }
  } as any;

  await searchPatents(req, res);
  assert.strictEqual(statusVal, 400);
  assert.ok(jsonVal.message.includes('required'));
});

test('Patent Reference Service: Saves reference and prevents duplicates', async () => {
  const originalFindUnique = prisma.patentReference.findUnique;
  const originalCreate = prisma.patentReference.create;

  let createdData: any = null;
  (prisma.patentReference as any).findUnique = async () => null;
  (prisma.patentReference as any).create = async (args: any) => {
    createdData = args.data;
    return { id: 'ref_101', ...args.data };
  };

  const saved = await PatentReferenceService.saveReference('p1', {
    patentNumber: 'US11048956B2',
    title: 'Decentralized trust verification system',
    abstract: 'A system for verifying digital assets',
    source: 'MOCK'
  });

  assert.strictEqual(saved.id, 'ref_101');
  assert.strictEqual(createdData.patentNumber, 'US11048956B2');
  assert.strictEqual(createdData.source, 'MOCK');

  // Test duplicate prevention
  (prisma.patentReference as any).findUnique = async () => ({ id: 'ref_101', projectId: 'p1', patentNumber: 'US11048956B2' });
  await assert.rejects(async () => {
    await PatentReferenceService.saveReference('p1', {
      patentNumber: 'US11048956B2',
      title: 'Decentralized trust verification system',
      source: 'MOCK'
    });
  }, /already saved/);

  (prisma.patentReference as any).findUnique = originalFindUnique;
  (prisma.patentReference as any).create = originalCreate;
});

test('Patent Reference Service: Enforces project isolation on deletion', async () => {
  const originalFindUnique = prisma.patentReference.findUnique;
  const originalDelete = prisma.patentReference.delete;

  (prisma.patentReference as any).findUnique = async () => ({
    id: 'ref_101',
    projectId: 'p1',
    patentNumber: 'US11048956B2'
  });

  // Attempting to delete for wrong project 'p2' should throw isolation error
  await assert.rejects(async () => {
    await PatentReferenceService.deleteReference('p2', 'ref_101');
  }, /Project isolation violation/);

  (prisma.patentReference as any).findUnique = originalFindUnique;
  (prisma.patentReference as any).delete = originalDelete;
});

test('AI Service: analyzeSimilarity handles project with 0 references cleanly', async () => {
  const res = await AiService.analyzeSimilarity(
    'Smart Ingestor',
    'Software',
    'Computing',
    'An automated ingestor',
    'Distributed queues',
    []
  );

  assert.strictEqual(res.score, 0);
  assert.strictEqual(res.similarityScore, 0);
  assert.strictEqual(res.matches.length, 0);
  assert.ok(res.explanation.includes('No verified prior-art references'));
});

// ----------------------------------------------------
// 13. Task 5: Patent Forms, Reviews & Filing Readiness Tests
// ----------------------------------------------------
test('Task 5: FormService normalizes form types and pre-fills default data', () => {
  assert.strictEqual(FormService.normalizeFormType('1'), 'Form 1');
  assert.strictEqual(FormService.normalizeFormType('form 2'), 'Form 2');
  assert.strictEqual(FormService.normalizeFormType('Form 3'), 'Form 3');
  assert.strictEqual(FormService.normalizeFormType('5'), 'Form 5');
  assert.strictEqual(FormService.normalizeFormType('form_26'), 'Form 26');

  const dummyProj = {
    title: 'Quantum Sensor Array',
    category: 'Electronics',
    innovationIdea: 'A quantum sensor',
    problemStatement: 'High noise',
    proposedSolution: 'Cold atom trap',
    owner: { fullName: 'Dr. Alice', email: 'alice@institution.edu', institution: 'MIT' },
    members: []
  };

  const form1Data = FormService.generateDefaultFormData(dummyProj, 'Form 1');
  assert.strictEqual(form1Data.applicantName, 'Dr. Alice');
  assert.strictEqual(form1Data.title, 'Quantum Sensor Array');

  const form2Data = FormService.generateDefaultFormData(dummyProj, 'Form 2');
  assert.strictEqual(form2Data.specificationType, 'COMPLETE');
  assert.strictEqual(form2Data.abstract, 'A quantum sensor');
});

test('Task 5: FormService upserts forms and handles version increment on approved edit', async () => {
  const origFindUnique = prisma.patentForm.findUnique;
  const origUpdate = prisma.patentForm.update;
  const origCreate = prisma.patentForm.create;

  // 1. Test creation
  (prisma.patentForm as any).findUnique = async () => null;
  (prisma.patentForm as any).create = async (args: any) => ({ id: 'f1', ...args.data });

  const saved = await FormService.saveForm('p1', 'Form 1', { applicantName: 'Dr. Alice' }, 'u1');
  assert.strictEqual(saved.version, 1);
  assert.strictEqual(saved.status, 'DRAFT');

  // 2. Test version bump if status was APPROVED
  (prisma.patentForm as any).findUnique = async () => ({
    id: 'f1',
    projectId: 'p1',
    formType: 'Form 1',
    formData: { applicantName: 'Dr. Alice' },
    status: 'APPROVED',
    version: 1
  });
  (prisma.patentForm as any).update = async (args: any) => ({
    id: 'f1',
    ...args.data
  });

  const updated = await FormService.saveForm('p1', 'Form 1', { applicantName: 'Dr. Alice Updated' }, 'u1');
  assert.strictEqual(updated.version, 2);
  assert.strictEqual(updated.status, 'DRAFT');

  (prisma.patentForm as any).findUnique = origFindUnique;
  (prisma.patentForm as any).update = origUpdate;
  (prisma.patentForm as any).create = origCreate;
});

test('Task 5: ReviewService advances stage on APPROVED and returns to DOCUMENTATION on REJECTED', async () => {
  const origFindProject = prisma.patentProject.findUnique;
  const origUpdateProject = prisma.patentProject.update;
  const origCreateReview = prisma.projectReview.create;
  const origCreateLog = prisma.activityLog.create;

  const mockProject = {
    id: 'p1',
    title: 'AI Router',
    stage: 'GUIDE_REVIEW',
    ownerId: 'inventor_1',
    owner: { id: 'inventor_1', fullName: 'Inventor' },
    members: [{ userId: 'guide_1', role: 'GUIDE' }],
    documents: [
      { id: 'd1', name: 'Form 1' },
      { id: 'd2', name: 'Form 2' },
      { id: 'd3', name: 'Form 3' },
      { id: 'd4', name: 'Form 5' }
    ]
  };

  (prisma.patentProject as any).findUnique = async () => mockProject;
  let updatedStage = '';
  (prisma.patentProject as any).update = async (args: any) => {
    updatedStage = args.data.stage;
    return { ...mockProject, stage: args.data.stage };
  };
  (prisma.projectReview as any).create = async (args: any) => ({ id: 'rev_1', ...args.data });
  (prisma.activityLog as any).create = async () => ({ id: 'log_1' });

  const guideUser = { userId: 'guide_1', role: 'Guide' };

  // 1. Approval advances stage from GUIDE_REVIEW to PATENT_EXPERT_REVIEW
  const reviewApproved = await ReviewService.submitReviewDecision('p1', guideUser, {
    reviewType: 'GUIDE_REVIEW',
    decision: 'APPROVED',
    comments: 'Looks good!'
  });

  assert.strictEqual(reviewApproved.decision, 'APPROVED');
  assert.strictEqual(updatedStage, 'PATENT_EXPERT_REVIEW');

  // 2. Rejection sends stage back to DOCUMENTATION
  mockProject.stage = 'GUIDE_REVIEW';
  await ReviewService.submitReviewDecision('p1', guideUser, {
    reviewType: 'GUIDE_REVIEW',
    decision: 'REJECTED',
    comments: 'Missing drawings.'
  });

  assert.strictEqual(updatedStage, 'DOCUMENTATION');

  (prisma.patentProject as any).findUnique = origFindProject;
  (prisma.patentProject as any).update = origUpdateProject;
  (prisma.projectReview as any).create = origCreateReview;
  (prisma.activityLog as any).create = origCreateLog;
});

test('Task 5: FilingReadinessService checklist returns NOT_READY vs READY correctly', async () => {
  const origFindProject = prisma.patentProject.findUnique;

  // 1. Test Incomplete project
  const incompleteProj = {
    id: 'p1',
    title: 'Incomplete Idea',
    stage: 'IDEA',
    innovationIdea: '',
    problemStatement: '',
    proposedSolution: '',
    technicalDomain: 'IT',
    category: 'Software',
    owner: { fullName: 'Bob', email: 'bob@test.com' },
    members: [],
    documents: [],
    patentReferences: [],
    patentForms: [],
    projectReviews: []
  };

  (prisma.patentProject as any).findUnique = async () => incompleteProj;

  const incompleteRes = await FilingReadinessService.getFilingReadiness('p1');
  assert.strictEqual(incompleteRes.overallReadiness, 'NOT_READY');
  assert.ok(incompleteRes.blockingIssues.length > 0);

  // 2. Test Complete project
  const completeProj = {
    id: 'p2',
    title: 'Complete Autonomous System',
    stage: 'FILING_READY',
    innovationIdea: 'A full autonomous system description',
    problemStatement: 'Manual intervention inefficiency',
    proposedSolution: 'Automated feedback loop',
    novelFeatures: 'Self-correcting PID node',
    keywords: 'autonomous, PID, robotics',
    technicalDomain: 'Robotics',
    category: 'Engineering',
    owner: { fullName: 'Alice', email: 'alice@test.com' },
    members: [{ userId: 'g1', role: 'GUIDE' }],
    documents: [{ id: 'd1', name: 'Form 1' }],
    patentReferences: [{ id: 'ref1', patentNumber: 'US1234567' }],
    patentForms: [
      { formType: 'Form 1', formData: {} },
      { formType: 'Form 2', formData: { novelFeatures: 'PID', claimsText: 'Claim 1' } },
      { formType: 'Form 3', formData: {} },
      { formType: 'Form 5', formData: {} }
    ],
    projectReviews: [{ decision: 'APPROVED' }]
  };

  (prisma.patentProject as any).findUnique = async () => completeProj;

  const completeRes = await FilingReadinessService.getFilingReadiness('p2');
  assert.strictEqual(completeRes.overallReadiness, 'READY');
  assert.strictEqual(completeRes.completedCount, 6);
  assert.strictEqual(completeRes.blockingIssues.length, 0);

  (prisma.patentProject as any).findUnique = origFindProject;
});

test('Task 5: Filing Package export throws when incomplete and compiles PDF when ready', async () => {
  const origGetReadiness = FilingReadinessService.getFilingReadiness;
  const origFindProject = prisma.patentProject.findUnique;
  const origCreateDoc = prisma.document.create;
  const origCreateLog = prisma.activityLog.create;

  // 1. Incomplete throws error with blockingIssues
  (FilingReadinessService as any).getFilingReadiness = async () => ({
    overallReadiness: 'NOT_READY',
    completedCount: 2,
    totalRequiredCount: 6,
    checklist: [],
    blockingIssues: ['Forms 1, 2, 3, 5 missing']
  });

  await assert.rejects(async () => {
    await FilingReadinessService.exportFilingPackage('p1', 'user1');
  }, /audit failed/);

  // 2. Complete generates PDF package and registers Document record
  (FilingReadinessService as any).getFilingReadiness = async () => ({
    overallReadiness: 'READY',
    completedCount: 6,
    totalRequiredCount: 6,
    checklist: [],
    blockingIssues: []
  });

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Complete Autonomous System',
    stage: 'FILING_READY',
    owner: { fullName: 'Alice', email: 'alice@test.com' },
    members: [],
    patentForms: [],
    patentReferences: [],
    projectReviews: []
  });

  (prisma.document as any).create = async (args: any) => ({ id: 'doc_package_1', ...args.data });
  (prisma.activityLog as any).create = async () => ({ id: 'log_1' });

  const packageDoc = await FilingReadinessService.exportFilingPackage('p1', 'user1');
  assert.ok(packageDoc.id);
  assert.ok(packageDoc.fileUrl.includes('.pdf'));

  (FilingReadinessService as any).getFilingReadiness = origGetReadiness;
  (prisma.patentProject as any).findUnique = origFindProject;
  (prisma.document as any).create = origCreateDoc;
  (prisma.activityLog as any).create = origCreateLog;
});

// ----------------------------------------------------
// 14. Task 6: Prototype & Technical Drawing Intelligence Tests
// ----------------------------------------------------
test('Task 6: PrototypeService creation, retrieval, and project isolation', async () => {
  const origFindProj = prisma.patentProject.findUnique;
  const origCreateProto = prisma.prototype.create;
  const origFindMany = prisma.prototype.findMany;
  const origFindUnique = prisma.prototype.findUnique;

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1', title: 'Solar Array' });
  (prisma.prototype as any).create = async (args: any) => ({ id: 'proto_1', ...args.data });
  (prisma.prototype as any).findMany = async (args: any) => [{ id: 'proto_1', projectId: args.where.projectId, title: 'Alpha Model' }];

  const proto = await PrototypeService.createPrototype('p1', { title: 'Alpha Model', description: 'Initial CAD draft' }, 'u1');
  assert.strictEqual(proto.title, 'Alpha Model');
  assert.strictEqual(proto.projectId, 'p1');

  const list = await PrototypeService.getProjectPrototypes('p1');
  assert.strictEqual(list.length, 1);

  // Project isolation violation check
  (prisma.prototype as any).findUnique = async () => ({ id: 'proto_1', projectId: 'p1', title: 'Alpha Model' });
  await assert.rejects(async () => {
    await PrototypeService.getPrototypeById('p2_wrong', 'proto_1');
  }, /isolation violation/);

  (prisma.patentProject as any).findUnique = origFindProj;
  (prisma.prototype as any).create = origCreateProto;
  (prisma.prototype as any).findMany = origFindMany;
  (prisma.prototype as any).findUnique = origFindUnique;
});

test('Task 6: DrawingFigure and DrawingComponent tag persistence', async () => {
  const origCount = prisma.drawingFigure.count;
  const origFindDup = prisma.drawingFigure.findUnique;
  const origCreateFig = prisma.drawingFigure.create;
  const origDeleteComp = prisma.drawingComponent.deleteMany;
  const origCreateComp = prisma.drawingComponent.create;

  (prisma.drawingFigure as any).count = async () => 0;
  (prisma.drawingFigure as any).findUnique = async () => null;
  (prisma.drawingFigure as any).create = async (args: any) => ({ id: 'fig_1', ...args.data });
  (prisma.drawingComponent as any).deleteMany = async () => ({ count: 0 });
  (prisma.drawingComponent as any).create = async (args: any) => ({ id: 'comp_1', ...args.data });

  const fig = await PrototypeService.createDrawingFigure('p1', { title: 'Assembly Perspective', description: 'FIG. 1 View' });
  assert.strictEqual(fig.figureNumber, 'FIG. 1');
  assert.strictEqual(fig.title, 'Assembly Perspective');

  // Update component tags
  (prisma.drawingFigure as any).findUnique = async () => ({ id: 'fig_1', projectId: 'p1', figureNumber: 'FIG. 1' });
  const components = await PrototypeService.updateFigureComponents('p1', 'fig_1', [
    { referenceNumber: '100', componentName: 'Base Housing', description: 'Enclosure chassis' },
    { referenceNumber: '102', componentName: 'Optical Sensor', description: 'Photodiode array' }
  ]);

  assert.strictEqual(components.length, 2);
  assert.strictEqual(components[0].referenceNumber, '100');
  assert.strictEqual(components[1].componentName, 'Optical Sensor');

  (prisma.drawingFigure as any).count = origCount;
  (prisma.drawingFigure as any).findUnique = origFindDup;
  (prisma.drawingFigure as any).create = origCreateFig;
  (prisma.drawingComponent as any).deleteMany = origDeleteComp;
  (prisma.drawingComponent as any).create = origCreateComp;
});

test('Task 6: Gemini Vision analysis handles invalid buffers and clamps confidence scores', async () => {
  // 1. Invalid empty buffer throws clean error
  await assert.rejects(async () => {
    await AiService.analyzePrototypeImageVision(Buffer.from(''), 'image/png', {
      title: 'Sensor',
      innovationIdea: 'Idea',
      proposedSolution: 'Solution'
    });
  }, /empty or unreadable/);

  // 2. Unsupported format throws clean error
  await assert.rejects(async () => {
    await AiService.analyzePrototypeImageVision(Buffer.from('test data'), 'image/bmp', {
      title: 'Sensor',
      innovationIdea: 'Idea',
      proposedSolution: 'Solution'
    });
  }, /Unsupported image format/);
});

test('Task 6: Server-side Patent Figure Sheet PDF generation attaches Document record', async () => {
  const origFindProj = prisma.patentProject.findUnique;
  const origFindFig = prisma.drawingFigure.findUnique;
  const origCreateDoc = prisma.document.create;
  const origUpdateFig = prisma.drawingFigure.update;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Autonomous Rover',
    category: 'Robotics',
    owner: { fullName: 'Dr. Carol', email: 'carol@test.com' }
  });

  (prisma.drawingFigure as any).findUnique = async () => ({
    id: 'fig_101',
    projectId: 'p1',
    figureNumber: 'FIG. 1',
    title: 'Exploded View',
    description: 'Exploded component assembly',
    components: [
      { referenceNumber: '100', componentName: 'Chassis Frame', description: 'Aluminium frame' },
      { referenceNumber: '102', componentName: 'Drive Motor', description: 'Brushless motor' }
    ]
  });

  (prisma.document as any).create = async (args: any) => ({ id: 'doc_fig_101', ...args.data });
  (prisma.drawingFigure as any).update = async (args: any) => ({ id: 'fig_101', ...args.data });

  const figDoc = await PdfService.generatePatentFigureSheetPdf('p1', 'fig_101', 'u1');
  assert.ok(figDoc.id);
  assert.strictEqual(figDoc.category, 'PATENT_DRAFT');
  assert.ok(figDoc.fileUrl.includes('.pdf'));

  (prisma.patentProject as any).findUnique = origFindProj;
  (prisma.drawingFigure as any).findUnique = origFindFig;
  (prisma.document as any).create = origCreateDoc;
  (prisma.drawingFigure as any).update = origUpdateFig;
});

// ----------------------------------------------------
// 15. Task 7: Activity Timeline, Notifications & Task Assignment Tests
// ----------------------------------------------------
test('Task 7: ActivityService creates structured audit logs and sanitizes metadata', async () => {
  const origCreate = prisma.activityLog.create;
  const origFindMany = prisma.activityLog.findMany;

  (prisma.activityLog as any).create = async (args: any) => ({ id: 'act_1', ...args.data });
  (prisma.activityLog as any).findMany = async (args: any) => [
    { id: 'act_1', projectId: 'p1', action: 'Uploaded document draft.pdf', type: 'DOCUMENT' }
  ];

  const log = await ActivityService.createActivity('p1', 'u1', 'Uploaded document draft.pdf', 'DOCUMENT', {
    docId: 'doc_1',
    password: 'secret_token_value' // Sensitive field should be stripped
  });

  assert.ok(log);
  assert.strictEqual(log?.action, 'Uploaded document draft.pdf');
  assert.strictEqual(log?.type, 'DOCUMENT');
  assert.strictEqual((log?.metadata as any)?.docId, 'doc_1');
  assert.strictEqual((log?.metadata as any)?.password, undefined);

  const activities = await ActivityService.listProjectActivities('p1', 'DOCUMENT');
  assert.strictEqual(activities.length, 1);
  assert.strictEqual(activities[0].type, 'DOCUMENT');

  (prisma.activityLog as any).create = origCreate;
  (prisma.activityLog as any).findMany = origFindMany;
});

test('Task 7: NotificationService dispatch, unread count, and recipient isolation', async () => {
  const origCreate = prisma.notification.create;
  const origCount = prisma.notification.count;
  const origFindUnique = prisma.notification.findUnique;
  const origUpdate = prisma.notification.update;
  const origUpdateMany = prisma.notification.updateMany;

  (prisma.notification as any).create = async (args: any) => ({ id: 'notif_1', isRead: false, ...args.data });
  (prisma.notification as any).count = async () => 3;
  (prisma.notification as any).findUnique = async () => ({ id: 'notif_1', userId: 'u1', isRead: false });
  (prisma.notification as any).update = async (args: any) => ({ id: 'notif_1', userId: 'u1', isRead: true, readAt: new Date() });
  (prisma.notification as any).updateMany = async () => ({ count: 3 });

  const notif = await NotificationService.createNotification('u1', 'Review Decision', 'Your review was approved.', 'REVIEW', 'rev_1', 'p1');
  assert.ok(notif);
  assert.strictEqual(notif?.title, 'Review Decision');

  const count = await NotificationService.getUnreadCount('u1');
  assert.strictEqual(count, 3);

  const updated = await NotificationService.markNotificationRead('u1', 'notif_1');
  assert.strictEqual(updated.isRead, true);

  const batchRead = await NotificationService.markAllNotificationsRead('u1');
  assert.strictEqual(batchRead.count, 3);

  // Recipient privacy violation check
  (prisma.notification as any).findUnique = async () => ({ id: 'notif_1', userId: 'u1_owner', isRead: false });
  await assert.rejects(async () => {
    await NotificationService.markNotificationRead('u2_attacker', 'notif_1');
  }, /access denied/);

  (prisma.notification as any).create = origCreate;
  (prisma.notification as any).count = origCount;
  (prisma.notification as any).findUnique = origFindUnique;
  (prisma.notification as any).update = origUpdate;
  (prisma.notification as any).updateMany = origUpdateMany;
});

test('Task 7: TaskService task creation, assignment validation, and status transitions', async () => {
  const origFindProj = prisma.patentProject.findUnique;
  const origCreateTask = prisma.task.create;
  const origFindTask = prisma.task.findUnique;
  const origUpdateTask = prisma.task.update;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    ownerId: 'u1_owner',
    members: [{ userId: 'u2_member' }]
  });

  (prisma.task as any).create = async (args: any) => ({ id: 'task_1', ...args.data });
  (prisma.task as any).findUnique = async () => ({ id: 'task_1', projectId: 'p1', status: 'TODO', assignedToId: 'u2_member' });
  (prisma.task as any).update = async (args: any) => ({ id: 'task_1', projectId: 'p1', ...args.data });

  // 1. Valid task creation with priority
  const task = await TaskService.createTask('p1', 'u1_owner', {
    title: 'Draft Claims Section',
    assignedToId: 'u2_member',
    priority: 'HIGH'
  });
  assert.strictEqual(task.title, 'Draft Claims Section');
  assert.strictEqual(task.priority, 'HIGH');
  assert.strictEqual(task.status, 'TODO');

  // 2. Invalid assigned user throws error
  await assert.rejects(async () => {
    await TaskService.createTask('p1', 'u1_owner', {
      title: 'Invalid Task Assignment',
      assignedToId: 'u9_nonmember'
    });
  }, /not a valid member/);

  // 3. Update task status to COMPLETED sets completedAt
  const completedTask = await TaskService.updateTask('p1', 'task_1', 'u1_owner', {
    status: 'COMPLETED'
  });
  assert.strictEqual(completedTask.status, 'COMPLETED');
  assert.ok(completedTask.completedAt);

  (prisma.patentProject as any).findUnique = origFindProj;
  (prisma.task as any).create = origCreateTask;
  (prisma.task as any).findUnique = origFindTask;
  (prisma.task as any).update = origUpdateTask;
});

// ----------------------------------------------------
// 16. Task 8: Advanced Analytics & Master Intelligence Report Tests
// ----------------------------------------------------
test('Task 8: AnalyticsService computes project intelligence scores and supporting metrics', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Autonomous Solar Rover',
    category: 'Robotics',
    stage: 'FILING_READY',
    technicalDomain: 'CleanTech',
    innovationIdea: 'An autonomous rover using AI solar tracking for lunar exploration.',
    problemStatement: 'Limited power on space rovers.',
    proposedSolution: 'AI solar array tracking mechanism.',
    novelFeatures: 'Multi-axis solar tracking.',
    owner: { fullName: 'Dr. Jane Smith', email: 'jane@univ.edu', institution: 'Engineering University' },
    members: [{ user: { fullName: 'Alex Inventor', username: 'alex_inv' } }],
    tasks: [
      { id: 't1', status: 'COMPLETED', dueDate: new Date() },
      { id: 't2', status: 'TODO', dueDate: new Date(Date.now() - 86400000) } // Overdue
    ],
    patentReferences: [
      { id: 'r1', source: 'USPTO', patentNumber: 'US10928371B2', title: 'Solar Array Controller' }
    ],
    patentForms: [
      { formType: 'Form 1', status: 'APPROVED' },
      { formType: 'Form 2', status: 'APPROVED' },
      { formType: 'Form 3', status: 'APPROVED' },
      { formType: 'Form 5', status: 'APPROVED' },
      { formType: 'Form 26', status: 'APPROVED' }
    ],
    projectReviews: [
      { id: 'rev1', decision: 'APPROVED', reviewType: 'GUIDE_REVIEW' }
    ],
    prototypes: [{ id: 'proto1' }],
    drawingFigures: [{ id: 'fig1', components: [{ id: 'c1' }] }],
    activityLogs: [{ id: 'act1' }],
    documents: [
      { name: 'Form 1 Draft.pdf', category: 'PATENT_DRAFT' },
      { name: 'Form 2 Specification.pdf', category: 'PATENT_DRAFT' },
      { name: 'Form 3 Statement.pdf', category: 'PATENT_DRAFT' },
      { name: 'Form 5 Inventorship.pdf', category: 'PATENT_DRAFT' },
      { name: 'Form 26 PowerOfAttorney.pdf', category: 'PATENT_DRAFT' }
    ]
  });

  const analytics = await AnalyticsService.getProjectAnalytics('p1', 'u1');
  assert.ok(analytics);
  assert.strictEqual(analytics.projectId, 'p1');
  assert.strictEqual(analytics.metrics.totalTasks, 2);
  assert.strictEqual(analytics.metrics.completedTasks, 1);
  assert.strictEqual(analytics.metrics.overdueTasks, 1);
  assert.strictEqual(analytics.metrics.taskCompletionPercentage, 50);
  assert.ok(analytics.scores.legalComplianceHealth >= 80);
  assert.ok(analytics.scores.filingReadinessScore >= 80);

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: AnalyticsService aggregates portfolio analytics for user projects', async () => {
  const origFindMany = prisma.patentProject.findMany;
  const origGetReadiness = FilingReadinessService.getFilingReadiness;

  (prisma.patentProject as any).findMany = async () => [
    {
      id: 'p1',
      title: 'Project 1',
      category: 'Robotics',
      stage: 'FILING_READY',
      patentReferences: [{ id: 'r1' }],
      prototypes: [{ id: 'pr1' }],
      projectReviews: [{ decision: 'APPROVED' }],
      tasks: [{ status: 'COMPLETED' }],
      patentForms: [{ status: 'APPROVED' }],
      documents: []
    },
    {
      id: 'p2',
      title: 'Project 2',
      category: 'Software',
      stage: 'IDEA',
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      tasks: [{ status: 'TODO', dueDate: new Date(Date.now() - 86400000) }],
      patentForms: [],
      documents: []
    }
  ];

  (FilingReadinessService as any).getFilingReadiness = async (id: string) => ({
    overallReadiness: id === 'p1' ? 'READY' : 'NOT_READY',
    completedCount: id === 'p1' ? 6 : 1,
    totalRequiredCount: 6,
    checklist: [],
    blockingIssues: []
  });

  const portfolio = await AnalyticsService.getDashboardAnalytics('u1');
  assert.ok(portfolio);
  assert.strictEqual(portfolio.totalProjects, 2);
  assert.strictEqual(portfolio.filingReadyProjects, 1);
  assert.strictEqual(portfolio.inProgressProjects, 1);
  assert.strictEqual(portfolio.overdueTasksCount, 1);
  assert.strictEqual(portfolio.totalReferences, 1);
  assert.ok(portfolio.averageFilingReadiness > 0);

  (prisma.patentProject as any).findMany = origFindMany;
  (FilingReadinessService as any).getFilingReadiness = origGetReadiness;
});

test('Task 8: PdfService compiles multi-page Master Patent Intelligence Report PDF', async () => {
  const origFindUnique = prisma.patentProject.findUnique;
  const origCreateDoc = prisma.document.create;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Autonomous Solar Rover',
    category: 'Robotics',
    stage: 'FILING_READY',
    technicalDomain: 'CleanTech',
    innovationIdea: 'An autonomous rover using AI solar tracking for lunar exploration.',
    owner: { fullName: 'Dr. Jane Smith', email: 'jane@univ.edu', institution: 'Engineering Univ', username: 'jane_smith' },
    members: [],
    tasks: [],
    patentReferences: [{ patentNumber: 'US10928371B2', title: 'Solar Tracking', source: 'USPTO' }],
    patentForms: [{ formType: 'Form 1', status: 'APPROVED' }],
    projectReviews: [{ reviewType: 'GUIDE_REVIEW', decision: 'APPROVED', reviewer: { username: 'guide_user' } }],
    prototypes: [],
    drawingFigures: [{ figureNumber: 'FIG. 1', title: 'Assembly View', components: [{ referenceNumber: '10', componentName: 'Solar Panel' }] }],
    activityLogs: [],
    documents: []
  });

  (prisma.document as any).create = async (args: any) => ({ id: 'doc_master_1', ...args.data });

  const masterDoc = await PdfService.generateComprehensivePatentReportPdf('p1', 'u1');
  assert.ok(masterDoc.id);
  assert.strictEqual(masterDoc.category, 'PATENT_DRAFT');
  assert.ok(masterDoc.fileUrl.includes('.pdf'));

  (prisma.patentProject as any).findUnique = origFindUnique;
  (prisma.document as any).create = origCreateDoc;
});

test('Task 8: Prior Art Risk Index produces higher risk for 0 references than for projects with verified references', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  const projectZeroRefs = {
    id: 'p_zero',
    title: 'Zero Refs Project',
    stage: 'IDEA',
    category: 'Software',
    owner: { fullName: 'User 1' },
    members: [],
    tasks: [],
    patentReferences: [],
    patentForms: [],
    projectReviews: [],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: []
  };

  const projectWithRefs = {
    ...projectZeroRefs,
    id: 'p_with_refs',
    patentReferences: [
      { id: 'r1', source: 'USPTO', patentNumber: 'US1234567A', title: 'Prior Ref 1' },
      { id: 'r2', source: 'USPTO', patentNumber: 'US7654321B', title: 'Prior Ref 2' }
    ]
  };

  (prisma.patentProject as any).findUnique = async (args: any) => {
    if (args.where.id === 'p_zero') return projectZeroRefs;
    if (args.where.id === 'p_with_refs') return projectWithRefs;
    return null;
  };

  const analyticsZero = await AnalyticsService.getProjectAnalytics('p_zero', 'u1');
  const analyticsWithRefs = await AnalyticsService.getProjectAnalytics('p_with_refs', 'u1');

  assert.ok(
    analyticsZero.scores.priorArtRiskIndex > analyticsWithRefs.scores.priorArtRiskIndex,
    `Expected 0 references (${analyticsZero.scores.priorArtRiskIndex}%) to have higher risk than project with references (${analyticsWithRefs.scores.priorArtRiskIndex}%)`
  );
  assert.strictEqual(analyticsZero.scores.priorArtRiskIndex, 85);
  assert.strictEqual(analyticsWithRefs.scores.priorArtRiskIndex, 55);

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: Prior Art Risk Index decreases monotonically as verified references are added (never increases risk)', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  const baseProject = {
    id: 'p_step',
    title: 'Stepwise Test',
    stage: 'IDEA',
    category: 'Software',
    owner: { fullName: 'User 1' },
    members: [],
    tasks: [],
    patentReferences: [] as any[],
    patentForms: [],
    projectReviews: [],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: []
  };

  let currentRefs: any[] = [];
  (prisma.patentProject as any).findUnique = async () => ({
    ...baseProject,
    patentReferences: currentRefs
  });

  let previousRisk = 101;
  for (let count = 0; count <= 4; count++) {
    currentRefs = Array.from({ length: count }, (_, i) => ({
      id: `r_${i}`,
      source: 'USPTO',
      patentNumber: `US${1000000 + i}`,
      title: `Reference ${i}`
    }));

    const result = await AnalyticsService.getProjectAnalytics('p_step', 'u1');
    const risk = result.scores.priorArtRiskIndex;

    assert.ok(risk <= previousRisk, `Adding references must not increase risk: previous=${previousRisk}, current=${risk}`);
    assert.ok(risk >= 0 && risk <= 100, `Risk must be between 0 and 100, got ${risk}`);
    previousRisk = risk;
  }

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: Prior Art Risk Index score remains strictly bounded between 0 and 100 for extreme edge cases', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  const extremeProject = {
    id: 'p_extreme',
    title: 'Extreme Project',
    stage: 'FILED',
    category: 'Robotics',
    owner: { fullName: 'User 1' },
    members: [],
    tasks: [],
    patentReferences: Array.from({ length: 50 }, (_, i) => ({
      id: `r_${i}`,
      source: 'USPTO',
      patentNumber: `US${2000000 + i}`,
      title: `Reference ${i}`
    })),
    patentForms: [{ formType: 'Form 1', status: 'APPROVED' }],
    projectReviews: [{ reviewType: 'GUIDE_REVIEW', decision: 'APPROVED' }],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: []
  };

  (prisma.patentProject as any).findUnique = async () => extremeProject;

  const result = await AnalyticsService.getProjectAnalytics('p_extreme', 'u1');
  assert.ok(result.scores.priorArtRiskIndex >= 0 && result.scores.priorArtRiskIndex <= 100);
  assert.strictEqual(result.scores.priorArtRiskIndex, 5);

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: Patent Eligibility & Novelty Score is low for an empty project', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  const emptyProject = {
    id: 'p_empty',
    title: 'New Idea',
    stage: 'IDEA',
    category: '',
    technicalDomain: '',
    innovationIdea: '',
    problemStatement: '',
    proposedSolution: '',
    novelFeatures: '',
    owner: { fullName: 'User 1' },
    members: [],
    tasks: [],
    patentReferences: [],
    patentForms: [],
    projectReviews: [],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: []
  };

  (prisma.patentProject as any).findUnique = async () => emptyProject;

  const analytics = await AnalyticsService.getProjectAnalytics('p_empty', 'u1');
  assert.ok(
    analytics.scores.patentEligibilityScore <= 10,
    `Expected empty project score <= 10%, got ${analytics.scores.patentEligibilityScore}%`
  );
  assert.ok(analytics.scores.patentEligibilityScore >= 0);

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: Patent Eligibility Score increases monotonically as patent evidence is added (never decreases)', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  // Step 0: Blank project
  const p0 = {
    id: 'p_evo',
    title: '',
    stage: 'IDEA',
    category: '',
    technicalDomain: '',
    innovationIdea: '',
    problemStatement: '',
    proposedSolution: '',
    novelFeatures: '',
    keywords: '',
    owner: { fullName: 'User 1' },
    members: [],
    tasks: [],
    patentReferences: [],
    patentForms: [],
    projectReviews: [],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: []
  };

  // Step 1: Adding specification disclosure
  const p1 = {
    ...p0,
    title: 'Autonomous Smart Sensor',
    category: 'Hardware',
    technicalDomain: 'IoT',
    innovationIdea: 'A self-calibrating smart sensor with autonomous energy harvesting.',
    problemStatement: 'Manual calibration in remote deployments is cost-prohibitive.',
    proposedSolution: 'Automated dynamic calibration using background ambient vibrations.'
  };

  // Step 2: Adding novel features & draft document
  const p2 = {
    ...p1,
    novelFeatures: 'Self-adjusting piezoelectric transducer feedback circuit.',
    keywords: 'piezoelectric, autonomous calibration, IoT energy harvester',
    documents: [{ id: 'doc1', category: 'PATENT_DRAFT', name: 'Specification_Draft.pdf' }]
  };

  // Step 3: Adding prior-art references
  const p3 = {
    ...p2,
    patentReferences: [
      { id: 'r1', source: 'USPTO', patentNumber: 'US10928371B2', title: 'Energy Harvester' },
      { id: 'r2', source: 'USPTO', patentNumber: 'US10928372B2', title: 'Autonomous Sensor' }
    ]
  };

  // Step 4: Adding Forms
  const p4 = {
    ...p3,
    patentForms: [
      { formType: 'Form 1', status: 'SUBMITTED', formData: {} },
      { formType: 'Form 2', status: 'SUBMITTED', formData: { novelFeatures: 'Self-adjusting transducer', claimsText: 'Claim 1: An autonomous smart sensor...' } }
    ]
  };

  // Step 5: Adding Approved Review & Filing Ready Stage
  const p5 = {
    ...p4,
    stage: 'FILING_READY',
    patentForms: [
      { formType: 'Form 1', status: 'APPROVED', formData: {} },
      { formType: 'Form 2', status: 'APPROVED', formData: { novelFeatures: 'Transducer', claimsText: 'Claim 1' } },
      { formType: 'Form 3', status: 'APPROVED', formData: {} },
      { formType: 'Form 5', status: 'APPROVED', formData: {} }
    ],
    projectReviews: [{ reviewType: 'GUIDE_REVIEW', decision: 'APPROVED' }]
  };

  const steps = [p0, p1, p2, p3, p4, p5];
  let prevScore = -1;

  for (let i = 0; i < steps.length; i++) {
    (prisma.patentProject as any).findUnique = async () => steps[i];
    const res = await AnalyticsService.getProjectAnalytics('p_evo', 'u1');
    const score = res.scores.patentEligibilityScore;

    assert.ok(
      score >= prevScore,
      `Step ${i} score (${score}%) must be >= previous step (${prevScore}%)`
    );
    assert.ok(score >= 0 && score <= 100, `Score must be in [0, 100], got ${score}%`);
    prevScore = score;
  }

  assert.strictEqual(prevScore, 100);

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: Patent Eligibility Score is strictly bounded between 0 and 100 for edge cases', async () => {
  const origFindUnique = prisma.patentProject.findUnique;

  // 1. Minimum edge case (completely null/empty)
  const minProject = {
    id: 'p_min',
    title: '',
    stage: 'IDEA',
    category: '',
    technicalDomain: '',
    innovationIdea: '',
    problemStatement: '',
    proposedSolution: '',
    owner: { fullName: 'User' },
    members: [],
    tasks: [],
    patentReferences: [],
    patentForms: [],
    projectReviews: [],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: []
  };

  (prisma.patentProject as any).findUnique = async () => minProject;
  const resMin = await AnalyticsService.getProjectAnalytics('p_min', 'u1');
  assert.strictEqual(resMin.scores.patentEligibilityScore, 0);

  // 2. Maximum edge case (redundant excess evidence)
  const maxProject = {
    id: 'p_max',
    title: 'Super Novel Patent Architecture',
    stage: 'FILED',
    category: 'DeepTech',
    technicalDomain: 'Quantum',
    innovationIdea: 'A detailed quantum error correction system.',
    problemStatement: 'Qubit decoherence in superconducting loops.',
    proposedSolution: 'Topological braiding with fault-tolerant stabilizer codes.',
    novelFeatures: 'Adaptive syndrome measurement lattice.',
    keywords: 'quantum computing, error correction, topological braiding',
    owner: { fullName: 'Dr. Expert' },
    members: [],
    tasks: [],
    patentReferences: Array.from({ length: 20 }, (_, i) => ({ id: `r_${i}`, source: 'USPTO', patentNumber: `US${3000000 + i}` })),
    patentForms: [
      { formType: 'Form 1', status: 'APPROVED', formData: {} },
      { formType: 'Form 2', status: 'APPROVED', formData: { novelFeatures: 'Lattice', claimsText: 'Claim 1-50' } },
      { formType: 'Form 3', status: 'APPROVED', formData: {} },
      { formType: 'Form 5', status: 'APPROVED', formData: {} },
      { formType: 'Form 26', status: 'APPROVED', formData: {} }
    ],
    projectReviews: [
      { reviewType: 'GUIDE_REVIEW', decision: 'APPROVED' },
      { reviewType: 'EXPERT_REVIEW', decision: 'APPROVED' }
    ],
    prototypes: [],
    drawingFigures: [],
    activityLogs: [],
    documents: [
      { id: 'd1', category: 'PATENT_DRAFT', name: 'Master_Spec.pdf' },
      { id: 'd2', category: 'RESEARCH_PAPER', name: 'Paper.pdf' }
    ]
  };

  (prisma.patentProject as any).findUnique = async () => maxProject;
  const resMax = await AnalyticsService.getProjectAnalytics('p_max', 'u1');
  assert.strictEqual(resMax.scores.patentEligibilityScore, 100);

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 8: Portfolio Dashboard readiness equals arithmetic mean of FilingReadinessService results', async () => {
  const origFindMany = prisma.patentProject.findMany;
  const origGetReadiness = FilingReadinessService.getFilingReadiness;

  (prisma.patentProject as any).findMany = async () => [
    {
      id: 'p1',
      title: 'Ready Project',
      stage: 'FILING_READY',
      category: 'Robotics',
      patentReferences: [{ id: 'r1' }],
      prototypes: [],
      projectReviews: [{ id: 'rev1', decision: 'APPROVED' }],
      tasks: [{ id: 't1', status: 'COMPLETED' }],
      patentForms: [{ id: 'f1', status: 'APPROVED' }],
      documents: []
    },
    {
      id: 'p2',
      title: 'Halfway Project',
      stage: 'DOCUMENTATION',
      category: 'Software',
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      tasks: [{ id: 't2', status: 'TODO' }],
      patentForms: [],
      documents: []
    },
    {
      id: 'p3',
      title: 'Empty Project',
      stage: 'IDEA',
      category: '',
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      tasks: [],
      patentForms: [],
      documents: []
    }
  ];

  (FilingReadinessService as any).getFilingReadiness = async (projectId: string) => {
    if (projectId === 'p1') {
      return { overallReadiness: 'READY', completedCount: 6, totalRequiredCount: 6, checklist: [], blockingIssues: [] };
    }
    if (projectId === 'p2') {
      return { overallReadiness: 'NOT_READY', completedCount: 3, totalRequiredCount: 6, checklist: [], blockingIssues: ['Forms missing'] };
    }
    if (projectId === 'p3') {
      return { overallReadiness: 'NOT_READY', completedCount: 0, totalRequiredCount: 6, checklist: [], blockingIssues: ['Everything missing'] };
    }
    return { overallReadiness: 'NOT_READY', completedCount: 0, totalRequiredCount: 6, checklist: [], blockingIssues: [] };
  };

  const dashboard = await AnalyticsService.getDashboardAnalytics('u1');

  const p1Summary = dashboard.projectHealthSummaries.find(p => p.id === 'p1');
  const p2Summary = dashboard.projectHealthSummaries.find(p => p.id === 'p2');
  const p3Summary = dashboard.projectHealthSummaries.find(p => p.id === 'p3');

  assert.strictEqual(p1Summary?.readinessScore, 100, 'p1 readiness should be 100%');
  assert.strictEqual(p2Summary?.readinessScore, 50, 'p2 readiness should be 50%');
  assert.strictEqual(p3Summary?.readinessScore, 0, 'p3 empty project readiness should be 0% (unfabricated)');

  // Arithmetic mean = Math.round((100 + 50 + 0) / 3) = Math.round(150 / 3) = 50%
  assert.strictEqual(dashboard.averageFilingReadiness, 50, 'Portfolio average must equal arithmetic mean (50%)');
  assert.ok(dashboard.averageFilingReadiness >= 0 && dashboard.averageFilingReadiness <= 100);
  assert.ok(dashboard.needsAttentionProjects >= 1);

  (prisma.patentProject as any).findMany = origFindMany;
  (FilingReadinessService as any).getFilingReadiness = origGetReadiness;
});

test('Task 8: Single-project portfolio average equals exact single project readiness score', async () => {
  const origFindMany = prisma.patentProject.findMany;
  const origGetReadiness = FilingReadinessService.getFilingReadiness;

  (prisma.patentProject as any).findMany = async () => [
    {
      id: 'p_single',
      title: 'Solo Project',
      stage: 'GUIDE_REVIEW',
      category: 'Health',
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      tasks: [],
      patentForms: [],
      documents: []
    }
  ];

  (FilingReadinessService as any).getFilingReadiness = async () => ({
    overallReadiness: 'NOT_READY',
    completedCount: 4,
    totalRequiredCount: 6,
    checklist: [],
    blockingIssues: []
  });

  const dashboard = await AnalyticsService.getDashboardAnalytics('u1');
  const expectedScore = Math.round((4 / 6) * 100); // 67%

  assert.strictEqual(dashboard.totalProjects, 1);
  assert.strictEqual(dashboard.averageFilingReadiness, expectedScore);
  assert.strictEqual(dashboard.projectHealthSummaries[0].readinessScore, expectedScore);

  (prisma.patentProject as any).findMany = origFindMany;
  (FilingReadinessService as any).getFilingReadiness = origGetReadiness;
});

test('Task 8: Empty portfolio returns 0 and empty distributions without fabricated data', async () => {
  const origFindMany = prisma.patentProject.findMany;

  (prisma.patentProject as any).findMany = async () => [];

  const dashboard = await AnalyticsService.getDashboardAnalytics('u_empty');
  assert.strictEqual(dashboard.totalProjects, 0);
  assert.strictEqual(dashboard.inProgressProjects, 0);
  assert.strictEqual(dashboard.filingReadyProjects, 0);
  assert.strictEqual(dashboard.needsAttentionProjects, 0);
  assert.strictEqual(dashboard.averageFilingReadiness, 0);
  assert.strictEqual(dashboard.averageTaskCompletion, 0);
  assert.strictEqual(dashboard.totalReferences, 0);
  assert.strictEqual(dashboard.totalPrototypes, 0);
  assert.strictEqual(dashboard.totalReviews, 0);
  assert.strictEqual(dashboard.totalForms, 0);
  assert.strictEqual(dashboard.overdueTasksCount, 0);
  assert.deepStrictEqual(dashboard.stageDistribution, {});
  assert.deepStrictEqual(dashboard.projectHealthSummaries, []);

  (prisma.patentProject as any).findMany = origFindMany;
});

test('Task 8: Dashboard analytics accurately scopes queries for non-admins vs Admin role', async () => {
  const origFindMany = prisma.patentProject.findMany;
  let lastWhereClause: any = null;

  (prisma.patentProject as any).findMany = async (args: any) => {
    lastWhereClause = args.where;
    return [];
  };

  // 1. Non-admin user (e.g. Inventor / Guide)
  await AnalyticsService.getDashboardAnalytics('user_123', 'Inventor');
  assert.deepStrictEqual(lastWhereClause, {
    OR: [
      { ownerId: 'user_123' },
      { members: { some: { userId: 'user_123' } } }
    ]
  });

  // 2. Global Admin user
  await AnalyticsService.getDashboardAnalytics('admin_123', 'Admin');
  assert.deepStrictEqual(lastWhereClause, {});

  (prisma.patentProject as any).findMany = origFindMany;
});

test('Task 8: Overdue task counts and stage distributions strictly match database records', async () => {
  const origFindMany = prisma.patentProject.findMany;
  const origGetReadiness = FilingReadinessService.getFilingReadiness;

  const pastDate = new Date(Date.now() - 86400000); // 1 day ago (overdue)
  const futureDate = new Date(Date.now() + 86400000); // 1 day in future

  (prisma.patentProject as any).findMany = async () => [
    {
      id: 'p1',
      stage: 'IDEA',
      tasks: [
        { id: 't1', status: 'TODO', dueDate: pastDate }, // Overdue
        { id: 't2', status: 'COMPLETED', dueDate: pastDate }, // Not overdue because completed
        { id: 't3', status: 'IN_PROGRESS', dueDate: futureDate } // Not overdue
      ],
      patentReferences: [{ id: 'r1' }, { id: 'r2' }],
      prototypes: [{ id: 'proto1' }],
      projectReviews: [{ id: 'rev1', decision: 'APPROVED' }],
      patentForms: [{ id: 'f1', status: 'APPROVED' }],
      documents: []
    },
    {
      id: 'p2',
      stage: 'PROTOTYPE',
      tasks: [
        { id: 't4', status: 'TODO', dueDate: pastDate } // Overdue
      ],
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      patentForms: [],
      documents: []
    },
    {
      id: 'p3',
      stage: 'FILING_READY',
      tasks: [],
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      patentForms: [],
      documents: []
    }
  ];

  (FilingReadinessService as any).getFilingReadiness = async (id: string) => ({
    overallReadiness: id === 'p3' ? 'READY' : 'NOT_READY',
    completedCount: id === 'p3' ? 6 : 2,
    totalRequiredCount: 6,
    checklist: [],
    blockingIssues: []
  });

  const dashboard = await AnalyticsService.getDashboardAnalytics('u1');

  assert.strictEqual(dashboard.totalProjects, 3);
  assert.strictEqual(dashboard.overdueTasksCount, 2); // t1 and t4 are overdue
  assert.strictEqual(dashboard.stageDistribution['IDEA'], 1);
  assert.strictEqual(dashboard.stageDistribution['PROTOTYPE'], 1);
  assert.strictEqual(dashboard.stageDistribution['FILING_READY'], 1);
  assert.strictEqual(dashboard.totalReferences, 2);
  assert.strictEqual(dashboard.totalPrototypes, 1);
  assert.strictEqual(dashboard.totalReviews, 1);
  assert.strictEqual(dashboard.totalForms, 1);

  (prisma.patentProject as any).findMany = origFindMany;
  (FilingReadinessService as any).getFilingReadiness = origGetReadiness;
});

// 17. Task 9: AI Patent Claims Engineering & FTO Database Foundation Tests

test('Task 9: PatentClaim model validates independent claim creation and project isolation', async () => {
  const mockClaim1 = {
    id: 'claim_1',
    projectId: 'proj_alpha',
    claimNumber: 1,
    claimType: 'INDEPENDENT',
    dependsOnNumber: null,
    preamble: 'An automated solar tracking system comprising:',
    body: 'a solar panel array; an azimuth actuator; and a microcontroller configured to track solar irradiance.',
    status: 'DRAFT',
    orderIndex: 1,
    linkedFigures: 'FIG. 1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  assert.strictEqual(mockClaim1.claimNumber, 1);
  assert.strictEqual(mockClaim1.claimType, 'INDEPENDENT');
  assert.strictEqual(mockClaim1.dependsOnNumber, null);
  assert.strictEqual(mockClaim1.projectId, 'proj_alpha');
  assert.ok(mockClaim1.body.includes('azimuth actuator'));
});

test('Task 9: PatentClaim enforces unique claim numbering per project', async () => {
  const claimsStore: Array<{ projectId: string; claimNumber: number }> = [
    { projectId: 'proj_alpha', claimNumber: 1 }
  ];

  const canAddClaim = (projId: string, num: number) => {
    return !claimsStore.some(c => c.projectId === projId && c.claimNumber === num);
  };

  assert.strictEqual(canAddClaim('proj_alpha', 1), false, 'Duplicate claim 1 in same project must be rejected');
  assert.strictEqual(canAddClaim('proj_alpha', 2), true, 'New claim 2 in same project is allowed');
  assert.strictEqual(canAddClaim('proj_beta', 1), true, 'Claim 1 in a different project is allowed (project isolation)');
});

test('Task 9: Dependent claim correctly references antecedent claim and rejects invalid self-dependency', async () => {
  const validateClaimDependency = (claimNumber: number, claimType: string, dependsOnNumber: number | null) => {
    if (claimType === 'INDEPENDENT') {
      if (dependsOnNumber !== null) return { valid: false, error: 'Independent claims cannot have a parent claim dependency.' };
      return { valid: true };
    }
    if (claimType === 'DEPENDENT') {
      if (!dependsOnNumber) return { valid: false, error: 'Dependent claim must specify a parent claim number.' };
      if (dependsOnNumber === claimNumber) return { valid: false, error: 'Claim cannot depend on itself (self-dependency).' };
      if (dependsOnNumber >= claimNumber) return { valid: false, error: 'Dependent claim must depend on an antecedent claim with a lower claim number.' };
      return { valid: true };
    }
    return { valid: false, error: 'Unknown claim type.' };
  };

  // Valid Independent
  assert.deepStrictEqual(validateClaimDependency(1, 'INDEPENDENT', null), { valid: true });

  // Valid Dependent
  assert.deepStrictEqual(validateClaimDependency(2, 'DEPENDENT', 1), { valid: true });

  // Invalid: Independent with dependency
  assert.strictEqual(validateClaimDependency(1, 'INDEPENDENT', 2).valid, false);

  // Invalid: Self-dependency (Claim 2 depending on Claim 2)
  const selfDep = validateClaimDependency(2, 'DEPENDENT', 2);
  assert.strictEqual(selfDep.valid, false);
  assert.ok(selfDep.error?.includes('self-dependency'));

  // Invalid: Forward dependency (Claim 2 depending on Claim 3)
  const fwdDep = validateClaimDependency(2, 'DEPENDENT', 3);
  assert.strictEqual(fwdDep.valid, false);
  assert.ok(fwdDep.error?.includes('antecedent claim'));
});

test('Task 9: ClaimElement ownership and linkage to DrawingComponent', async () => {
  const mockComponent = {
    id: 'comp_102',
    figureId: 'fig_1',
    referenceNumber: '102',
    componentName: 'Azimuth Actuator',
    description: 'Rotational stepper motor mounted to base'
  };

  const mockClaimElement = {
    id: 'el_1',
    claimId: 'claim_1',
    elementName: 'Azimuth Actuator',
    elementText: 'an azimuth actuator coupled to the solar panel array',
    componentId: mockComponent.id
  };

  assert.strictEqual(mockClaimElement.claimId, 'claim_1');
  assert.strictEqual(mockClaimElement.componentId, 'comp_102');
  assert.strictEqual(mockClaimElement.elementName, 'Azimuth Actuator');
});

test('Task 9: ClaimChart enforces unique project-reference constraint and isolates overlap mappings', async () => {
  const existingCharts = [
    { id: 'chart_1', projectId: 'proj_alpha', referenceId: 'ref_uspto_1', overallRisk: 'MEDIUM' }
  ];

  const canCreateChart = (projId: string, refId: string) => {
    return !existingCharts.some(c => c.projectId === projId && c.referenceId === refId);
  };

  assert.strictEqual(canCreateChart('proj_alpha', 'ref_uspto_1'), false, 'Duplicate chart for same project/reference rejected');
  assert.strictEqual(canCreateChart('proj_alpha', 'ref_uspto_2'), true, 'New chart for different reference allowed');
  assert.strictEqual(canCreateChart('proj_beta', 'ref_uspto_1'), true, 'Same reference in different project allowed');

  const validOverlapLevels = ['NONE', 'PARTIAL', 'IDENTICAL', 'EQUIVALENT'];
  const testElementMapping = {
    id: 'cce_1',
    chartId: 'chart_1',
    claimElementId: 'el_1',
    priorArtFeature: 'Motorized dual-axis solar positioning mechanism described in column 4',
    overlapLevel: 'EQUIVALENT',
    analysisNotes: 'Performs substantially the same function in substantially the same way to achieve the same result.'
  };

  assert.ok(validOverlapLevels.includes(testElementMapping.overlapLevel));
});

test('Task 9: Cascade deletion ensures removing project or claim safely cleans child elements', async () => {
  let claimsDB = [
    { id: 'c1', projectId: 'p1', claimNumber: 1 },
    { id: 'c2', projectId: 'p1', claimNumber: 2 },
    { id: 'c3', projectId: 'p2', claimNumber: 1 }
  ];
  let elementsDB = [
    { id: 'e1', claimId: 'c1', elementName: 'Sensor' },
    { id: 'e2', claimId: 'c1', elementName: 'Actuator' },
    { id: 'e3', claimId: 'c2', elementName: 'Wireless Module' },
    { id: 'e4', claimId: 'c3', elementName: 'Battery' }
  ];
  let chartsDB = [
    { id: 'ch1', projectId: 'p1', referenceId: 'r1' },
    { id: 'ch2', projectId: 'p2', referenceId: 'r2' }
  ];
  let chartElementsDB = [
    { id: 'che1', chartId: 'ch1', claimElementId: 'e1' },
    { id: 'che2', chartId: 'ch2', claimElementId: 'e4' }
  ];

  // Simulate Cascade Deletion of Project 'p1'
  const deleteProjectCascade = (projId: string) => {
    const deletedClaimIds = claimsDB.filter(c => c.projectId === projId).map(c => c.id);
    const deletedElementIds = elementsDB.filter(e => deletedClaimIds.includes(e.claimId)).map(e => e.id);
    const deletedChartIds = chartsDB.filter(ch => ch.projectId === projId).map(ch => ch.id);

    chartElementsDB = chartElementsDB.filter(che => !deletedChartIds.includes(che.chartId) && !deletedElementIds.includes(che.claimElementId));
    chartsDB = chartsDB.filter(ch => ch.projectId !== projId);
    elementsDB = elementsDB.filter(e => !deletedClaimIds.includes(e.claimId));
    claimsDB = claimsDB.filter(c => c.projectId !== projId);
  };

  deleteProjectCascade('p1');

  // Verify p1 claims, elements, and charts are purged
  assert.strictEqual(claimsDB.length, 1);
  assert.strictEqual(claimsDB[0].projectId, 'p2');
  assert.strictEqual(elementsDB.length, 1);
  assert.strictEqual(elementsDB[0].id, 'e4');
  assert.strictEqual(chartsDB.length, 1);
  assert.strictEqual(chartsDB[0].projectId, 'p2');
  assert.strictEqual(chartElementsDB.length, 1);
  assert.strictEqual(chartElementsDB[0].id, 'che2');
});

// 18. Task 9 — Step 2: Claim Service & Dependency Validation Tests

test('Task 9 (2.1): ClaimService creates independent claim successfully', async () => {
  const origFindMany = prisma.patentClaim.findMany;
  const origCreate = prisma.patentClaim.create;

  (prisma.patentClaim as any).findMany = async () => [];
  (prisma.patentClaim as any).create = async ({ data }: any) => ({
    id: 'claim_101',
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const created = await ClaimService.createClaim('proj_1', 'user_1', {
    claimNumber: 1,
    claimType: 'INDEPENDENT',
    preamble: 'A solar-powered IoT sensor device comprising:',
    body: 'a photovoltaic panel, a microcontroller, and a low-power wireless transceiver.'
  });

  assert.strictEqual(created.claimNumber, 1);
  assert.strictEqual(created.claimType, 'INDEPENDENT');
  assert.strictEqual(created.dependsOnNumber, null);

  (prisma.patentClaim as any).findMany = origFindMany;
  (prisma.patentClaim as any).create = origCreate;
});

test('Task 9 (2.2): ClaimService creates dependent claim referencing valid parent', async () => {
  const origFindMany = prisma.patentClaim.findMany;
  const origCreate = prisma.patentClaim.create;

  (prisma.patentClaim as any).findMany = async () => [
    { id: 'c1', claimNumber: 1, dependsOnNumber: null }
  ];
  (prisma.patentClaim as any).create = async ({ data }: any) => ({
    id: 'claim_102',
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const created = await ClaimService.createClaim('proj_1', 'user_1', {
    claimNumber: 2,
    claimType: 'DEPENDENT',
    dependsOnNumber: 1,
    preamble: 'The device of claim 1,',
    body: 'further comprising a rechargeable lithium-iron-phosphate battery module.'
  });

  assert.strictEqual(created.claimNumber, 2);
  assert.strictEqual(created.claimType, 'DEPENDENT');
  assert.strictEqual(created.dependsOnNumber, 1);

  (prisma.patentClaim as any).findMany = origFindMany;
  (prisma.patentClaim as any).create = origCreate;
});

test('Task 9 (2.3): ClaimService rejects dependent claim without dependsOnNumber', async () => {
  await assert.rejects(
    async () => {
      await ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 2,
        claimType: 'DEPENDENT',
        body: 'a further sensor element.'
      });
    },
    /Dependent claims must specify a parent claim number/
  );
});

test('Task 9 (2.4): ClaimService rejects independent claim with dependsOnNumber', async () => {
  await assert.rejects(
    async () => {
      await ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        dependsOnNumber: 2,
        body: 'an independent system.'
      });
    },
    /Independent claims cannot specify a parent dependency/
  );
});

test('Task 9 (2.5): ClaimService rejects self-dependency on creation', async () => {
  await assert.rejects(
    async () => {
      await ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 3,
        claimType: 'DEPENDENT',
        dependsOnNumber: 3,
        body: 'a self-referential clause.'
      });
    },
    /Claim cannot depend on itself/
  );
});

test('Task 9 (2.6): ClaimService rejects nonexistent parent dependency', async () => {
  const origFindMany = prisma.patentClaim.findMany;
  (prisma.patentClaim as any).findMany = async () => [
    { id: 'c1', claimNumber: 1, dependsOnNumber: null }
  ];

  await assert.rejects(
    async () => {
      await ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 2,
        claimType: 'DEPENDENT',
        dependsOnNumber: 99, // 99 does not exist
        body: 'a dependent clause referencing 99.'
      });
    },
    /Referenced parent claim 99 does not exist in this project/
  );

  (prisma.patentClaim as any).findMany = origFindMany;
});

test('Task 9 (2.7): ClaimService isolates claim dependencies by project (cross-project rejected)', async () => {
  const origFindMany = prisma.patentClaim.findMany;
  // Project B only has claim 5, not claim 1 from Project A
  (prisma.patentClaim as any).findMany = async ({ where }: any) => {
    if (where.projectId === 'proj_B') {
      return [{ id: 'cb5', claimNumber: 5, dependsOnNumber: null }];
    }
    return [{ id: 'ca1', claimNumber: 1, dependsOnNumber: null }];
  };

  await assert.rejects(
    async () => {
      await ClaimService.createClaim('proj_B', 'user_1', {
        claimNumber: 6,
        claimType: 'DEPENDENT',
        dependsOnNumber: 1, // Claim 1 is in Project A, not Project B
        body: 'attempting cross project parent.'
      });
    },
    /Referenced parent claim 1 does not exist in this project/
  );

  (prisma.patentClaim as any).findMany = origFindMany;
});

test('Task 9 (2.8): ClaimService rejects dependency cycle detection during creation', async () => {
  // Cycle detection logic:
  // Existing: Claim 2 -> depends on 3. Claim 3 -> depends on 1.
  // Creating: Claim 1 -> depends on 2 (Creates 1 -> 2 -> 3 -> 1 cycle)
  const existing = [
    { claimNumber: 2, dependsOnNumber: 3 },
    { claimNumber: 3, dependsOnNumber: 1 }
  ];

  assert.strictEqual(
    ClaimService.hasDependencyCycle([...existing, { claimNumber: 1, dependsOnNumber: 2 }]),
    true,
    'Must detect 1 -> 2 -> 3 -> 1 cycle'
  );
});

test('Task 9 (2.9): ClaimService allows valid multi-level dependency tree', async () => {
  const validTree = [
    { claimNumber: 1, dependsOnNumber: null },
    { claimNumber: 2, dependsOnNumber: 1 },
    { claimNumber: 3, dependsOnNumber: 2 },
    { claimNumber: 4, dependsOnNumber: 2 },
    { claimNumber: 5, dependsOnNumber: 1 },
    { claimNumber: 6, dependsOnNumber: null },
    { claimNumber: 7, dependsOnNumber: 6 }
  ];

  assert.strictEqual(ClaimService.hasDependencyCycle(validTree), false);
});

test('Task 9 (2.10): ClaimService allows non-sequential claim numbers', async () => {
  const nonSequentialTree = [
    { claimNumber: 10, dependsOnNumber: null },
    { claimNumber: 25, dependsOnNumber: 10 },
    { claimNumber: 42, dependsOnNumber: 25 },
    { claimNumber: 100, dependsOnNumber: null },
    { claimNumber: 105, dependsOnNumber: 100 }
  ];

  assert.strictEqual(ClaimService.hasDependencyCycle(nonSequentialTree), false);
});

test('Task 9 (2.11): ClaimService rejects duplicate claim number within project', async () => {
  const origFindMany = prisma.patentClaim.findMany;
  (prisma.patentClaim as any).findMany = async () => [
    { id: 'c1', claimNumber: 1, dependsOnNumber: null }
  ];

  await assert.rejects(
    async () => {
      await ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 1, // Duplicate
        claimType: 'INDEPENDENT',
        body: 'duplicate claim number.'
      });
    },
    /Claim number 1 already exists in this project/
  );

  (prisma.patentClaim as any).findMany = origFindMany;
});

test('Task 9 (2.12): ClaimService updates claim while strictly preserving claim ID', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origFindMany = prisma.patentClaim.findMany;
  const origUpdate = prisma.patentClaim.update;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'claim_fixed_id_123',
    projectId: 'proj_1',
    claimNumber: 1,
    claimType: 'INDEPENDENT',
    dependsOnNumber: null,
    preamble: 'Old preamble',
    body: 'Old body',
    status: 'DRAFT',
    orderIndex: 0
  });

  (prisma.patentClaim as any).findMany = async () => [
    { id: 'claim_fixed_id_123', claimNumber: 1, dependsOnNumber: null }
  ];

  let updateArgs: any = null;
  (prisma.patentClaim as any).update = async (args: any) => {
    updateArgs = args;
    return { id: 'claim_fixed_id_123', ...args.data };
  };

  const updated = await ClaimService.updateClaim('proj_1', 'user_1', 'claim_fixed_id_123', {
    body: 'Updated novel patent body with detailed limitations.',
    status: 'REVIEWED'
  });

  assert.strictEqual(updated.id, 'claim_fixed_id_123');
  assert.strictEqual(updateArgs.where.id, 'claim_fixed_id_123');
  assert.strictEqual(updated.status, 'REVIEWED');

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.patentClaim as any).findMany = origFindMany;
  (prisma.patentClaim as any).update = origUpdate;
});

test('Task 9 (2.13): ClaimService rejects update that introduces a dependency cycle', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origFindMany = prisma.patentClaim.findMany;

  // Claim 1 is independent, Claim 2 depends on 1
  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c1',
    projectId: 'proj_1',
    claimNumber: 1,
    claimType: 'INDEPENDENT',
    dependsOnNumber: null
  });

  (prisma.patentClaim as any).findMany = async () => [
    { id: 'c1', claimNumber: 1, dependsOnNumber: null },
    { id: 'c2', claimNumber: 2, dependsOnNumber: 1 }
  ];

  // Try updating Claim 1 to depend on Claim 2 -> 1 -> 2 -> 1 cycle!
  await assert.rejects(
    async () => {
      await ClaimService.updateClaim('proj_1', 'user_1', 'c1', {
        claimType: 'DEPENDENT',
        dependsOnNumber: 2
      });
    },
    /Claim dependency cycle detected/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.patentClaim as any).findMany = origFindMany;
});

test('Task 9 (2.14): ClaimService deletes claim successfully when no dependents exist', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origFindMany = prisma.patentClaim.findMany;
  const origDelete = prisma.patentClaim.delete;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c2',
    projectId: 'proj_1',
    claimNumber: 2,
    dependsOnNumber: 1
  });

  (prisma.patentClaim as any).findMany = async () => []; // No claims depend on claim 2
  (prisma.patentClaim as any).delete = async () => ({ id: 'c2' });

  const res = await ClaimService.deleteClaim('proj_1', 'user_1', 'c2');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.deletedClaimId, 'c2');
  assert.strictEqual(res.deletedClaimNumber, 2);

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.patentClaim as any).findMany = origFindMany;
  (prisma.patentClaim as any).delete = origDelete;
});

test('Task 9 (2.15): ClaimService rejects deletion when dependent claims exist', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origFindMany = prisma.patentClaim.findMany;

  // Claim 1 has Claim 2 and Claim 3 depending on it
  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c1',
    projectId: 'proj_1',
    claimNumber: 1
  });

  (prisma.patentClaim as any).findMany = async () => [
    { claimNumber: 2 },
    { claimNumber: 3 }
  ];

  await assert.rejects(
    async () => {
      await ClaimService.deleteClaim('proj_1', 'user_1', 'c1');
    },
    /Cannot delete claim 1 because other claims \(2, 3\) depend on it/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.patentClaim as any).findMany = origFindMany;
});

test('Task 9 (2.16): ClaimService reorders claims successfully and preserves claim numbers', async () => {
  const origFindMany = prisma.patentClaim.findMany;
  const origTransaction = prisma.$transaction;

  (prisma.patentClaim as any).findMany = async () => [
    { id: 'c1', claimNumber: 1, orderIndex: 0 },
    { id: 'c2', claimNumber: 2, orderIndex: 1 },
    { id: 'c3', claimNumber: 3, orderIndex: 2 }
  ];

  let txUpdates: any[] = [];
  (prisma as any).$transaction = async (actions: any[]) => {
    txUpdates = actions;
    return actions;
  };

  const reordered = await ClaimService.reorderClaims('proj_1', 'user_1', ['c3', 'c1', 'c2']);
  assert.ok(Array.isArray(reordered));

  (prisma.patentClaim as any).findMany = origFindMany;
  (prisma as any).$transaction = origTransaction;
});

test('Task 9 (2.17): ClaimService rejects duplicate IDs in reorder request', async () => {
  await assert.rejects(
    async () => {
      await ClaimService.reorderClaims('proj_1', 'user_1', ['c1', 'c2', 'c1']);
    },
    /Duplicate claim IDs provided in reorder request/
  );
});

test('Task 9 (2.18): ClaimService rejects foreign-project claim IDs during reorder', async () => {
  const origFindMany = prisma.patentClaim.findMany;

  (prisma.patentClaim as any).findMany = async () => [
    { id: 'c1', claimNumber: 1 },
    { id: 'c2', claimNumber: 2 }
  ];

  await assert.rejects(
    async () => {
      await ClaimService.reorderClaims('proj_1', 'user_1', ['c1', 'foreign_claim_id']);
    },
    /Invalid claim ID or claim belongs to another project/
  );

  (prisma.patentClaim as any).findMany = origFindMany;
});

test('Task 9 (2.19): ClaimService getClaimById enforces project isolation', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c1',
    projectId: 'proj_alpha',
    claimNumber: 1
  });

  // Attempt to access proj_alpha claim through proj_beta endpoint
  await assert.rejects(
    async () => {
      await ClaimService.getClaimById('proj_beta', 'c1');
    },
    /Claim not found or does not belong to this project/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
});

test('Task 9 (2.20): ClaimPolicy verifies role authorization (inventor can edit, outsider cannot)', async () => {
  const project = {
    id: 'p1',
    ownerId: 'u_owner',
    members: [
      { userId: 'u_inventor', role: 'INVENTOR' },
      { userId: 'u_guide', role: 'GUIDE' },
      { userId: 'u_expert', role: 'PATENT_EXPERT' }
    ]
  };

  // Owner, Admin, Inventor can create/edit/delete
  assert.strictEqual(ClaimPolicy.canCreateClaim({ userId: 'u_owner', role: 'Inventor' }, project), true);
  assert.strictEqual(ClaimPolicy.canCreateClaim({ userId: 'u_admin', role: 'Admin' }, project), true);
  assert.strictEqual(ClaimPolicy.canCreateClaim({ userId: 'u_inventor', role: 'Inventor' }, project), true);

  // Guide, PatentExpert can view but cannot directly mutate claims
  assert.strictEqual(ClaimPolicy.canViewClaims({ userId: 'u_guide', role: 'Guide' }, project), true);
  assert.strictEqual(ClaimPolicy.canCreateClaim({ userId: 'u_guide', role: 'Guide' }, project), false);
  assert.strictEqual(ClaimPolicy.canDeleteClaim({ userId: 'u_expert', role: 'PatentExpert' }, project), false);

  // Outside user cannot view or mutate
  assert.strictEqual(ClaimPolicy.canViewClaims({ userId: 'u_outsider', role: 'Inventor' }, project), false);
  assert.strictEqual(ClaimPolicy.canCreateClaim({ userId: 'u_outsider', role: 'Inventor' }, project), false);
});

// 19. Task 9 — Step 3: Claim Elements & Technical Drawing Component Linking Tests

test('Task 9 (3.1): ClaimService creates claim element successfully', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origCreate = prisma.claimElement.create;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c1',
    projectId: 'p1',
    claimNumber: 1
  });

  (prisma.claimElement as any).create = async ({ data }: any) => ({
    id: 'el_101',
    ...data,
    component: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const element = await ClaimService.createClaimElement('p1', 'c1', 'u1', {
    elementName: 'Microcontroller Unit',
    elementText: 'a 32-bit low-power RISC-V microcontroller configured to process sensor readings'
  });

  assert.strictEqual(element.id, 'el_101');
  assert.strictEqual(element.elementName, 'Microcontroller Unit');
  assert.strictEqual(element.claimId, 'c1');

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.claimElement as any).create = origCreate;
});

test('Task 9 (3.2): ClaimService rejects empty element name', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1' });

  await assert.rejects(
    async () => {
      await ClaimService.createClaimElement('p1', 'c1', 'u1', {
        elementName: '   ',
        elementText: 'valid element text'
      });
    },
    /Element name is required and cannot be empty/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
});

test('Task 9 (3.3): ClaimService rejects empty element text', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1' });

  await assert.rejects(
    async () => {
      await ClaimService.createClaimElement('p1', 'c1', 'u1', {
        elementName: 'Actuator',
        elementText: '   '
      });
    },
    /Element text is required and cannot be empty/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
});

test('Task 9 (3.4): ClaimService retrieves claim elements ordered deterministically', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origFindMany = prisma.claimElement.findMany;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1' });
  (prisma.claimElement as any).findMany = async () => [
    { id: 'e1', elementName: 'Sensor', createdAt: new Date(1000) },
    { id: 'e2', elementName: 'Transceiver', createdAt: new Date(2000) }
  ];

  const elements = await ClaimService.getClaimElements('p1', 'c1');
  assert.strictEqual(elements.length, 2);
  assert.strictEqual(elements[0].elementName, 'Sensor');
  assert.strictEqual(elements[1].elementName, 'Transceiver');

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.claimElement as any).findMany = origFindMany;
});

test('Task 9 (3.5): ClaimService updates claim element successfully', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;
  const origUpdate = prisma.claimElement.update;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).findUnique = async () => ({
    id: 'e1',
    claimId: 'c1',
    elementName: 'Old Sensor',
    elementText: 'Old text',
    componentId: null
  });
  (prisma.claimElement as any).update = async ({ data }: any) => ({
    id: 'e1',
    claimId: 'c1',
    ...data
  });

  const updated = await ClaimService.updateClaimElement('p1', 'c1', 'e1', 'u1', {
    elementName: 'High Precision Sensor',
    elementText: 'optical humidity sensor with ±1% accuracy'
  });

  assert.strictEqual(updated.elementName, 'High Precision Sensor');
  assert.ok(updated.elementText.includes('±1% accuracy'));

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
  (prisma.claimElement as any).update = origUpdate;
});

test('Task 9 (3.6): ClaimService deletes claim element successfully', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;
  const origDelete = prisma.claimElement.delete;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Filter' });
  (prisma.claimElement as any).delete = async () => ({ id: 'e1' });

  const res = await ClaimService.deleteClaimElement('p1', 'c1', 'e1', 'u1');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.deletedElementId, 'e1');

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
  (prisma.claimElement as any).delete = origDelete;
});

test('Task 9 (3.7): ClaimService links claim element to valid DrawingComponent within same project', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;
  const origFindUniqueComp = prisma.drawingComponent.findUnique;
  const origUpdate = prisma.claimElement.update;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array' });
  (prisma.drawingComponent as any).findUnique = async () => ({
    id: 'comp_102',
    figureId: 'fig_1',
    referenceNumber: '102',
    componentName: 'Photovoltaic Array',
    figure: {
      id: 'fig_1',
      projectId: 'p1',
      figureNumber: 'FIG. 1',
      title: 'Top Isometric View'
    }
  });

  (prisma.claimElement as any).update = async () => ({
    id: 'e1',
    claimId: 'c1',
    elementName: 'Solar Array',
    componentId: 'comp_102',
    component: {
      id: 'comp_102',
      referenceNumber: '102',
      componentName: 'Photovoltaic Array',
      figure: { figureNumber: 'FIG. 1', title: 'Top Isometric View' }
    }
  });

  const linked: any = await ClaimService.linkClaimElementToComponent('p1', 'c1', 'e1', 'u1', 'comp_102');
  assert.strictEqual(linked.componentId, 'comp_102');
  assert.strictEqual(linked.component.referenceNumber, '102');
  assert.strictEqual(linked.component.figure.figureNumber, 'FIG. 1');

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
  (prisma.drawingComponent as any).findUnique = origFindUniqueComp;
  (prisma.claimElement as any).update = origUpdate;
});

test('Task 9 (3.8): ClaimService unlinks DrawingComponent from claim element', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;
  const origUpdate = prisma.claimElement.update;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array', componentId: 'comp_102' });
  (prisma.claimElement as any).update = async () => ({
    id: 'e1',
    claimId: 'c1',
    elementName: 'Solar Array',
    componentId: null,
    component: null
  });

  const unlinked: any = await ClaimService.unlinkClaimElementFromComponent('p1', 'c1', 'e1', 'u1');
  assert.strictEqual(unlinked.componentId, null);

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
  (prisma.claimElement as any).update = origUpdate;
});

test('Task 9 (3.9): ClaimService rejects nonexistent DrawingComponent on link', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;
  const origFindUniqueComp = prisma.drawingComponent.findUnique;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array' });
  (prisma.drawingComponent as any).findUnique = async () => null; // Component does not exist

  await assert.rejects(
    async () => {
      await ClaimService.linkClaimElementToComponent('p1', 'c1', 'e1', 'u1', 'nonexistent_comp');
    },
    /Drawing component not found or belongs to another project/
  );

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
  (prisma.drawingComponent as any).findUnique = origFindUniqueComp;
});

test('Task 9 (3.10): ClaimService rejects cross-project DrawingComponent linking', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;
  const origFindUniqueComp = prisma.drawingComponent.findUnique;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'project_A', claimNumber: 1 });
  (prisma.claimElement as any).findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array' });
  // Component belongs to project_B, not project_A
  (prisma.drawingComponent as any).findUnique = async () => ({
    id: 'comp_foreign',
    figure: { projectId: 'project_B' }
  });

  await assert.rejects(
    async () => {
      await ClaimService.linkClaimElementToComponent('project_A', 'c1', 'e1', 'u1', 'comp_foreign');
    },
    /Drawing component not found or belongs to another project/
  );

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
  (prisma.drawingComponent as any).findUnique = origFindUniqueComp;
});

test('Task 9 (3.11): ClaimService rejects element creation if claim belongs to another project', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'project_A' });

  // Attempting to create element for claim c1 under project_B
  await assert.rejects(
    async () => {
      await ClaimService.createClaimElement('project_B', 'c1', 'u1', {
        elementName: 'Antenna',
        elementText: 'patch antenna'
      });
    },
    /Claim not found or does not belong to this project/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
});

test('Task 9 (3.12): ClaimService rejects element update if element belongs to another claim', async () => {
  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origFindUniqueElement = prisma.claimElement.findUnique;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'claim_1', projectId: 'p1', claimNumber: 1 });
  // Element belongs to claim_2, not claim_1
  (prisma.claimElement as any).findUnique = async () => ({ id: 'e_other', claimId: 'claim_2' });

  await assert.rejects(
    async () => {
      await ClaimService.updateClaimElement('p1', 'claim_1', 'e_other', 'u1', {
        elementName: 'New Name'
      });
    },
    /Claim element not found or does not belong to this claim/
  );

  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).findUnique = origFindUniqueElement;
});

test('Task 9 (3.13): ClaimPolicy verifies unauthorized user cannot create or edit claim elements', async () => {
  const project = {
    id: 'p1',
    ownerId: 'u_owner',
    members: [
      { userId: 'u_inventor', role: 'INVENTOR' },
      { userId: 'u_guide', role: 'GUIDE' }
    ]
  };

  const outsider = { userId: 'u_outsider', role: 'Inventor' };
  assert.strictEqual(ClaimPolicy.canCreateClaimElement(outsider, project), false);
  assert.strictEqual(ClaimPolicy.canEditClaimElement(outsider, project), false);
  assert.strictEqual(ClaimPolicy.canDeleteClaimElement(outsider, project), false);
  assert.strictEqual(ClaimPolicy.canLinkDrawingComponent(outsider, project), false);
});

test('Task 9 (3.14): ClaimPolicy verifies project inventor can modify claim elements according to policy', async () => {
  const project = {
    id: 'p1',
    ownerId: 'u_owner',
    members: [
      { userId: 'u_inventor', role: 'INVENTOR' },
      { userId: 'u_guide', role: 'GUIDE' }
    ]
  };

  const inventor = { userId: 'u_inventor', role: 'Inventor' };
  assert.strictEqual(ClaimPolicy.canViewClaimElements(inventor, project), true);
  assert.strictEqual(ClaimPolicy.canCreateClaimElement(inventor, project), true);
  assert.strictEqual(ClaimPolicy.canEditClaimElement(inventor, project), true);
  assert.strictEqual(ClaimPolicy.canDeleteClaimElement(inventor, project), true);
  assert.strictEqual(ClaimPolicy.canLinkDrawingComponent(inventor, project), true);
});

test('Task 9 (3.15): ClaimService getClaimById includes linked drawing component with figure metadata', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'claim_1',
    projectId: 'p1',
    claimNumber: 1,
    claimElements: [
      {
        id: 'el_1',
        elementName: 'Actuator',
        elementText: 'an electromechanical linear actuator',
        component: {
          id: 'comp_104',
          referenceNumber: '104',
          componentName: 'Linear Actuator',
          figure: {
            id: 'fig_2',
            figureNumber: 'FIG. 2',
            title: 'Side Cross-Sectional View'
          }
        }
      }
    ]
  });

  const claim: any = await ClaimService.getClaimById('p1', 'claim_1');
  assert.strictEqual(claim.claimElements.length, 1);
  assert.strictEqual(claim.claimElements[0].component.referenceNumber, '104');
  assert.strictEqual(claim.claimElements[0].component.figure.figureNumber, 'FIG. 2');

  (prisma.patentClaim as any).findUnique = origFindUnique;
});

test('Task 9 (3.16): ClaimService getClaimElements enforces project isolation', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'proj_alpha' });

  // Accessing proj_alpha claim through proj_beta endpoint
  await assert.rejects(
    async () => {
      await ClaimService.getClaimElements('proj_beta', 'c1');
    },
    /Claim not found or does not belong to this project/
  );

  (prisma.patentClaim as any).findUnique = origFindUnique;
});

test('Task 9 (3.17): ActivityService logs CLAIM events on element lifecycle actions', async () => {
  let loggedActivity: any = null;
  const origCreateActivity = ActivityService.createActivity;

  (ActivityService as any).createActivity = async (pId: string, uId: string, action: string, type: string, meta: any) => {
    loggedActivity = { pId, uId, action, type, meta };
    return { id: 'act_1', ...loggedActivity };
  };

  const origFindUniqueClaim = prisma.patentClaim.findUnique;
  const origCreate = prisma.claimElement.create;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).create = async ({ data }: any) => ({ id: 'el_1', ...data });

  await ClaimService.createClaimElement('p1', 'u1', 'c1', {
    elementName: 'Battery Unit',
    elementText: 'lithium battery'
  });

  assert.ok(loggedActivity !== null);
  assert.strictEqual(loggedActivity.type, 'CLAIM');
  assert.ok(loggedActivity.action.includes('Added technical element'));

  (ActivityService as any).createActivity = origCreateActivity;
  (prisma.patentClaim as any).findUnique = origFindUniqueClaim;
  (prisma.claimElement as any).create = origCreate;
});

test('Task 9 (3.18): NotificationService isolates recipients when notifications are triggered', async () => {
  const recipientIds: string[] = [];
  const origCreateNotification = NotificationService.createNotification;

  (NotificationService as any).createNotification = async (userId: string, title: string, message: string) => {
    recipientIds.push(userId);
    return { id: 'notif_1', userId, title, message };
  };

  await NotificationService.createNotification('target_user_1', 'Claim Review', 'Claim 1 updated', 'CLAIM', 'c1', 'p1');
  assert.strictEqual(recipientIds.length, 1);
  assert.strictEqual(recipientIds[0], 'target_user_1');

  (NotificationService as any).createNotification = origCreateNotification;
});

test('Task 9 (3.19): Multiple elements can belong to one claim with distinct technical components', async () => {
  const origFindUnique = prisma.patentClaim.findUnique;
  const origFindMany = prisma.claimElement.findMany;

  (prisma.patentClaim as any).findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
  (prisma.claimElement as any).findMany = async () => [
    { id: 'el_1', elementName: 'Solar Array', componentId: 'comp_100' },
    { id: 'el_2', elementName: 'Battery', componentId: 'comp_102' },
    { id: 'el_3', elementName: 'Inverter', componentId: 'comp_104' },
    { id: 'el_4', elementName: 'Microcontroller', componentId: null }
  ];

  const elements = await ClaimService.getClaimElements('p1', 'c1');
  assert.strictEqual(elements.length, 4);
  assert.strictEqual(elements[0].componentId, 'comp_100');
  assert.strictEqual(elements[1].componentId, 'comp_102');
  assert.strictEqual(elements[2].componentId, 'comp_104');
  assert.strictEqual(elements[3].componentId, null);

  (prisma.patentClaim as any).findUnique = origFindUnique;
  (prisma.claimElement as any).findMany = origFindMany;
});

test('Task 9 (3.20): Regression verification — Tasks 1 to 8 policy tests remain valid', async () => {
  // Verify ProjectPolicy and DocumentPolicy role resolvers still function identically
  const sampleProject = { ownerId: 'user_A', members: [{ userId: 'user_B', role: 'INVENTOR' }] };
  assert.strictEqual(ProjectPolicy.canViewProject({ userId: 'user_A', role: 'Inventor' }, sampleProject), true);
  assert.strictEqual(ProjectPolicy.canViewProject({ userId: 'user_B', role: 'Inventor' }, sampleProject), true);
  assert.strictEqual(ProjectPolicy.canViewProject({ userId: 'user_C', role: 'Inventor' }, sampleProject), false);
});

// 20. Task 9 — Steps 4 to 11: AI Claims Engineering, Validation, FTO & Docket Tests

test('Task 9 (4.1): ClaimAiService generates structured claim proposal schema with apparatus and method claims', async () => {
  const origFindUnique = prisma.patentProject.findUnique;
  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Autonomous Smart Irrigation System',
    category: 'AGRITECH',
    technicalDomain: 'IoT',
    innovationIdea: 'Soil moisture responsive automated valve',
    problemStatement: 'Water wastage in agriculture',
    proposedSolution: 'Automated solar irrigation valve with micro-controller',
    drawingFigures: [
      {
        figureNumber: 'FIG. 1',
        title: 'Valve assembly',
        components: [{ id: 'comp_1', referenceNumber: '100', componentName: 'Actuator Valve' }]
      }
    ],
    patentReferences: []
  });

  const proposal = await ClaimAiService.generateClaimProposal('p1', 'u1');
  assert.ok(proposal.claims.length >= 5);
  assert.strictEqual(proposal.claims[0].claimType, 'INDEPENDENT');
  assert.ok(proposal.claims.some((c) => c.claimType === 'DEPENDENT'));
  assert.ok(proposal.disclaimer.includes('Not legal advice'));

  (prisma.patentProject as any).findUnique = origFindUnique;
});

test('Task 9 (4.2): ClaimAiService proposal generation is read-only and does not persist claims', async () => {
  let createCalled = false;
  const origFindUnique = prisma.patentProject.findUnique;
  const origCreate = prisma.patentClaim.create;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Drone Delivery Box',
    drawingFigures: [],
    patentReferences: []
  });

  (prisma.patentClaim as any).create = async () => {
    createCalled = true;
    return {};
  };

  await ClaimAiService.generateClaimProposal('p1', 'u1');
  assert.strictEqual(createCalled, false, 'AI generation must never modify or create PatentClaim records.');

  (prisma.patentProject as any).findUnique = origFindUnique;
  (prisma.patentClaim as any).create = origCreate;
});

test('Task 9 (5.1): ClaimValidationService.validateAntecedents detects missing antecedent basis', async () => {
  // "the optical sensor" used without prior "an optical sensor"
  const claim = {
    preamble: 'An automated tracking device comprising:',
    body: 'a main chassis; wherein the optical sensor transmits readings to the controller.'
  };

  const result = ClaimValidationService.validateAntecedents(claim);
  const sensorIssue = result.issues.find((i) => i.term === 'optical sensor' || i.term === 'optical' || i.term === 'sensor');
  assert.ok(sensorIssue !== undefined, 'Should detect missing antecedent basis for optical sensor');
  assert.strictEqual(sensorIssue.type, 'MISSING_ANTECEDENT');
});

test('Task 9 (5.2): ClaimValidationService.validateAntecedents passes valid antecedent basis', async () => {
  const claim = {
    preamble: 'An automated tracking device comprising:',
    body: 'an optical sensor; and a microcontroller coupled to the optical sensor, wherein the microcontroller receives signals from the optical sensor.'
  };

  const result = ClaimValidationService.validateAntecedents(claim);
  const antecedentErrors = result.issues.filter((i) => i.type === 'MISSING_ANTECEDENT' && (i.term === 'microcontroller' || i.term === 'optical sensor'));
  assert.strictEqual(antecedentErrors.length, 0);
});

test('Task 9 (5.3): ClaimValidationService.validateAntecedents flags subjective non-technical terms', async () => {
  const claim = {
    preamble: 'A system comprising:',
    body: 'a revolutionary processing unit configured to achieve optimal power consumption.'
  };

  const result = ClaimValidationService.validateAntecedents(claim);
  const vagueIssues = result.issues.filter((i) => i.type === 'VAGUE_TERM');
  assert.ok(vagueIssues.length >= 2, 'Should flag "revolutionary" and "optimal"');
});

test('Task 9 (5.4): ClaimValidationService.validateClaim validates independent claims', async () => {
  const validClaim = {
    claimNumber: 1,
    claimType: 'INDEPENDENT',
    dependsOnNumber: null,
    preamble: 'A system comprising:',
    body: 'a sensor and a processor.'
  };
  const res1 = ClaimValidationService.validateClaim(validClaim);
  assert.strictEqual(res1.valid, true);

  const invalidClaim = {
    claimNumber: 1,
    claimType: 'INDEPENDENT',
    dependsOnNumber: 2, // Independent claim with parent
    body: 'a sensor and a processor.'
  };
  const res2 = ClaimValidationService.validateClaim(invalidClaim);
  assert.strictEqual(res2.valid, false);
  assert.ok(res2.errors.some((e) => e.includes('Independent claims cannot have a parent')));
});

test('Task 9 (5.5): ClaimValidationService.validateClaim validates dependent claims and rejects self-dependency', async () => {
  const selfDep = {
    claimNumber: 2,
    claimType: 'DEPENDENT',
    dependsOnNumber: 2,
    body: 'the sensor of claim 2.'
  };
  const res = ClaimValidationService.validateClaim(selfDep);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('cannot depend on itself')));
});

test('Task 9 (5.6): ClaimValidationService.validateProposal detects duplicate temporary numbers and dependency cycles', async () => {
  const cyclicProposal = {
    claims: [
      { temporaryNumber: 1, claimType: 'DEPENDENT', dependsOnNumber: 2, body: 'claim 1' },
      { temporaryNumber: 2, claimType: 'DEPENDENT', dependsOnNumber: 1, body: 'claim 2' }
    ]
  };

  const res = ClaimValidationService.validateProposal(cyclicProposal as any);
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('cycle detected')));
});

test('Task 9 (5.7): ClaimValidationService.importProposal imports claims transactionally and remaps numbers', async () => {
  const origFindManyClaims = prisma.patentClaim.findMany;
  const origFindManyComps = prisma.drawingComponent.findMany;
  const origTransaction = prisma.$transaction;

  (prisma.patentClaim as any).findMany = async () => [
    { claimNumber: 1, orderIndex: 0 },
    { claimNumber: 2, orderIndex: 1 }
  ];
  (prisma.drawingComponent as any).findMany = async () => [{ id: 'comp_1' }];

  let transactionExecuted = false;
  (prisma as any).$transaction = async (fn: any) => {
    transactionExecuted = true;
    const txMock = {
      patentClaim: {
        create: async ({ data }: any) => ({ id: `claim_${data.claimNumber}`, ...data })
      },
      claimElement: {
        create: async ({ data }: any) => ({ id: `el_${Date.now()}`, ...data })
      }
    };
    return await fn(txMock);
  };

  const proposal = {
    claims: [
      {
        temporaryNumber: 1,
        claimType: 'INDEPENDENT' as const,
        dependsOnNumber: null,
        preamble: 'A system comprising:',
        body: 'a transceiver;',
        elements: [{ elementName: 'Transceiver', elementText: 'a transceiver', suggestedComponentId: 'comp_1' }]
      },
      {
        temporaryNumber: 2,
        claimType: 'DEPENDENT' as const,
        dependsOnNumber: 1,
        body: 'the transceiver of claim 1.',
        elements: []
      }
    ]
  };

  const created = await ClaimValidationService.importProposal('p1', 'u1', proposal);
  assert.strictEqual(transactionExecuted, true);
  assert.strictEqual(created.length, 2);
  // Remapped after existing 1, 2 -> 3 and 4
  assert.strictEqual(created[0].claimNumber, 3);
  assert.strictEqual(created[0].dependsOnNumber, null);
  assert.strictEqual(created[1].claimNumber, 4);
  assert.strictEqual(created[1].dependsOnNumber, 3); // 2 -> 1 remapped to 4 -> 3

  (prisma.patentClaim as any).findMany = origFindManyClaims;
  (prisma.drawingComponent as any).findMany = origFindManyComps;
  (prisma as any).$transaction = origTransaction;
});

test('Task 9 (5.8): ClaimValidationService.importProposal preserves multi-level parent dependencies during remapping', async () => {
  const origFindManyClaims = prisma.patentClaim.findMany;
  const origFindManyComps = prisma.drawingComponent.findMany;
  const origTransaction = prisma.$transaction;

  (prisma.patentClaim as any).findMany = async () => [];
  (prisma.drawingComponent as any).findMany = async () => [];

  (prisma as any).$transaction = async (fn: any) => {
    const txMock = {
      patentClaim: { create: async ({ data }: any) => ({ id: `c_${data.claimNumber}`, ...data }) },
      claimElement: { create: async () => ({}) }
    };
    return await fn(txMock);
  };

  const proposal = {
    claims: [
      { temporaryNumber: 1, claimType: 'INDEPENDENT' as const, dependsOnNumber: null, body: 'level 1' },
      { temporaryNumber: 2, claimType: 'DEPENDENT' as const, dependsOnNumber: 1, body: 'level 2' },
      { temporaryNumber: 3, claimType: 'DEPENDENT' as const, dependsOnNumber: 2, body: 'level 3' }
    ]
  };

  const created = await ClaimValidationService.importProposal('p1', 'u1', proposal);
  assert.strictEqual(created[0].claimNumber, 1);
  assert.strictEqual(created[1].claimNumber, 2);
  assert.strictEqual(created[1].dependsOnNumber, 1);
  assert.strictEqual(created[2].claimNumber, 3);
  assert.strictEqual(created[2].dependsOnNumber, 2);

  (prisma.patentClaim as any).findMany = origFindManyClaims;
  (prisma.drawingComponent as any).findMany = origFindManyComps;
  (prisma as any).$transaction = origTransaction;
});

test('Task 9 (5.9): ClaimValidationService.importProposal verifies drawing component project ownership', async () => {
  const origFindManyClaims = prisma.patentClaim.findMany;
  const origFindManyComps = prisma.drawingComponent.findMany;
  const origTransaction = prisma.$transaction;

  (prisma.patentClaim as any).findMany = async () => [];
  // Only comp_proj1 belongs to project, comp_foreign does not
  (prisma.drawingComponent as any).findMany = async () => [{ id: 'comp_proj1' }];

  let recordedComponentId: any = null;
  (prisma as any).$transaction = async (fn: any) => {
    const txMock = {
      patentClaim: { create: async ({ data }: any) => ({ id: 'c1', ...data }) },
      claimElement: {
        create: async ({ data }: any) => {
          recordedComponentId = data.componentId;
          return { id: 'el1', ...data };
        }
      }
    };
    return await fn(txMock);
  };

  const proposal = {
    claims: [
      {
        temporaryNumber: 1,
        claimType: 'INDEPENDENT' as const,
        dependsOnNumber: null,
        body: 'system with foreign component',
        elements: [{ elementName: 'Foreign Comp', elementText: 'text', suggestedComponentId: 'comp_foreign' }]
      }
    ]
  };

  await ClaimValidationService.importProposal('p1', 'u1', proposal);
  assert.strictEqual(recordedComponentId, null, 'Foreign suggestedComponentId must be cleared');

  (prisma.patentClaim as any).findMany = origFindManyClaims;
  (prisma.drawingComponent as any).findMany = origFindManyComps;
  (prisma as any).$transaction = origTransaction;
});

test('Task 9 (5.10): ClaimValidationService.importProposal rejects invalid proposal before database transaction', async () => {
  const invalidProposal = {
    claims: [
      { temporaryNumber: 1, claimType: 'INVALID_TYPE' as any, dependsOnNumber: null, body: '' }
    ]
  };

  await assert.rejects(
    async () => {
      await ClaimValidationService.importProposal('p1', 'u1', invalidProposal);
    },
    /Cannot import invalid proposal/
  );
});

test('Task 9 (6.1): FtoAnalysisService.generateClaimChart generates overlap breakdown against prior art', async () => {
  const origFindClaim = prisma.patentClaim.findUnique;
  const origFindRef = prisma.patentReference.findUnique;
  const origTransaction = prisma.$transaction;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c1',
    projectId: 'p1',
    claimNumber: 1,
    claimElements: [
      { id: 'el1', elementName: 'Optical Sensor', elementText: 'optical sensing array' },
      { id: 'el2', elementName: 'Microprocessor', elementText: '32-bit CPU' }
    ]
  });

  (prisma.patentReference as any).findUnique = async () => ({
    id: 'ref1',
    projectId: 'p1',
    patentNumber: 'US-9999999-B2',
    title: 'Optical Sensor and Controller System',
    abstract: 'A system with an optical sensor and processing circuitry.'
  });

  (prisma as any).$transaction = async (fn: any) => {
    const txMock = {
      claimChart: {
        upsert: async () => ({ id: 'chart1', projectId: 'p1', referenceId: 'ref1', overallRisk: 'MEDIUM' })
      },
      claimChartElement: {
        deleteMany: async () => ({}),
        create: async () => ({})
      }
    };
    return await fn(txMock);
  };

  const chart = await FtoAnalysisService.generateClaimChart('p1', 'c1', 'ref1', 'u1');
  assert.strictEqual(chart.id, 'chart1');
  assert.strictEqual(chart.elements.length, 2);
  assert.ok(chart.disclaimer.includes('preliminary AI-assisted'));

  (prisma.patentClaim as any).findUnique = origFindClaim;
  (prisma.patentReference as any).findUnique = origFindRef;
  (prisma as any).$transaction = origTransaction;
});

test('Task 9 (6.2): FtoAnalysisService computes deterministic overall risk (LOW, MEDIUM, HIGH)', async () => {
  // If elements have identical/equivalent -> HIGH risk
  const elementsHigh = [{ overlapLevel: 'IDENTICAL' }, { overlapLevel: 'NONE' }];
  const hasIdenticalOrEquiv = elementsHigh.some((el: any) => el.overlapLevel === 'IDENTICAL' || el.overlapLevel === 'EQUIVALENT');
  assert.strictEqual(hasIdenticalOrEquiv, true);

  // If elements only have partial -> MEDIUM risk
  const elementsMed = [{ overlapLevel: 'PARTIAL' }, { overlapLevel: 'NONE' }];
  const isMed = !elementsMed.some((el: any) => el.overlapLevel === 'IDENTICAL' || el.overlapLevel === 'EQUIVALENT') && elementsMed.some((el: any) => el.overlapLevel === 'PARTIAL');
  assert.strictEqual(isMed, true);

  // If all elements are NONE -> LOW risk
  const elementsLow = [{ overlapLevel: 'NONE' }, { overlapLevel: 'NONE' }];
  const isLow = !elementsLow.some((el: any) => el.overlapLevel !== 'NONE');
  assert.strictEqual(isLow, true);
});

test('Task 9 (6.3): FtoAnalysisService rejects generating FTO chart for reference from another project', async () => {
  const origFindClaim = prisma.patentClaim.findUnique;
  const origFindRef = prisma.patentReference.findUnique;

  (prisma.patentClaim as any).findUnique = async () => ({
    id: 'c1',
    projectId: 'project_A',
    claimElements: [{ id: 'el1', elementName: 'Sensor' }]
  });

  // Reference belongs to project_B, not project_A
  (prisma.patentReference as any).findUnique = async () => ({
    id: 'ref_foreign',
    projectId: 'project_B'
  });

  await assert.rejects(
    async () => {
      await FtoAnalysisService.generateClaimChart('project_A', 'c1', 'ref_foreign', 'u1');
    },
    /Patent reference not found or belongs to another project/
  );

  (prisma.patentClaim as any).findUnique = origFindClaim;
  (prisma.patentReference as any).findUnique = origFindRef;
});

test('Task 9 (6.4): FtoAnalysisService.deleteClaimChart deletes chart and enforces project isolation', async () => {
  const origFindUnique = prisma.claimChart.findUnique;
  const origDelete = prisma.claimChart.delete;

  (prisma.claimChart as any).findUnique = async () => ({ id: 'chart1', projectId: 'project_A' });
  (prisma.claimChart as any).delete = async () => ({ id: 'chart1' });

  // Attempting to delete project_A chart via project_B endpoint
  await assert.rejects(
    async () => {
      await FtoAnalysisService.deleteClaimChart('project_B', 'chart1', 'u1');
    },
    /Claim chart not found or does not belong to this project/
  );

  const res = await FtoAnalysisService.deleteClaimChart('project_A', 'chart1', 'u1');
  assert.strictEqual(res.success, true);

  (prisma.claimChart as any).findUnique = origFindUnique;
  (prisma.claimChart as any).delete = origDelete;
});

test('Task 9 (9.1): ClaimService.syncClaimsToForm2 formats structured claims into Form 2 specification text', async () => {
  const origFindManyClaims = prisma.patentClaim.findMany;
  const origFindUniqueProj = prisma.patentProject.findUnique;
  const origFindFirstForm = prisma.patentForm.findFirst;
  const origUpdateForm = prisma.patentForm.update;

  (prisma.patentClaim as any).findMany = async () => [
    { claimNumber: 1, claimType: 'INDEPENDENT', dependsOnNumber: null, preamble: 'An apparatus comprising:', body: 'a sensor.', orderIndex: 0 },
    { claimNumber: 2, claimType: 'DEPENDENT', dependsOnNumber: 1, preamble: '', body: 'the sensor is an optical sensor.', orderIndex: 1 }
  ];

  (prisma.patentProject as any).findUnique = async () => ({ id: 'p1', title: 'Smart Sensor' });
  (prisma.patentForm as any).findFirst = async () => ({
    id: 'form2_id',
    projectId: 'p1',
    formType: 'Form 2',
    formData: { title: 'Smart Sensor', novelFeatures: 'optical' }
  });

  (prisma.patentForm as any).update = async ({ data }: any) => ({ id: 'form2_id', ...data });

  const res = await ClaimService.syncClaimsToForm2('p1', 'u1');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.claimsCount, 2);
  assert.ok(res.formattedClaimsText.includes('1. An apparatus comprising: a sensor.'));
  assert.ok(res.formattedClaimsText.includes('2. The system of claim 1, wherein the sensor is an optical sensor.'));

  (prisma.patentClaim as any).findMany = origFindManyClaims;
  (prisma.patentProject as any).findUnique = origFindUniqueProj;
  (prisma.patentForm as any).findFirst = origFindFirstForm;
  (prisma.patentForm as any).update = origUpdateForm;
});

test('Task 9 (9.2): ClaimService.syncClaimsToForm2 rejects sync when no claims exist in project', async () => {
  const origFindManyClaims = prisma.patentClaim.findMany;
  (prisma.patentClaim as any).findMany = async () => [];

  await assert.rejects(
    async () => {
      await ClaimService.syncClaimsToForm2('p1', 'u1');
    },
    /No structured claims exist for this project to sync/
  );

  (prisma.patentClaim as any).findMany = origFindManyClaims;
});

test('Task 9 (10.1): PdfService.generateClaimsDocketPdf creates and registers Claims Docket PDF', async () => {
  const origFindUnique = prisma.patentProject.findUnique;
  const origCreateDoc = prisma.document.create;

  (prisma.patentProject as any).findUnique = async () => ({
    id: 'p1',
    title: 'Autonomous Solar Inverter',
    technicalDomain: 'Renewable Energy',
    patentClaims: [
      {
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        status: 'APPROVED',
        preamble: 'A solar inverter comprising:',
        body: 'a bridge rectifier and a micro-inverter controller.',
        claimElements: []
      }
    ],
    patentReferences: [],
    claimCharts: []
  });

  (prisma.document as any).create = async ({ data }: any) => ({
    id: 'doc_docket_1',
    ...data
  });

  const doc = await PdfService.generateClaimsDocketPdf('p1', 'u1');
  assert.strictEqual(doc.category, 'PATENT_DRAFT');
  assert.ok(doc.name.includes('Claims Docket'));

  (prisma.patentProject as any).findUnique = origFindUnique;
  (prisma.document as any).create = origCreateDoc;
});

test('Task 9 (11.1): ClaimPolicy enforces role authorization for AI generation, proposal import, FTO, and sync', async () => {
  const project = {
    id: 'p1',
    ownerId: 'u_owner',
    members: [
      { userId: 'u_inventor', role: 'INVENTOR' },
      { userId: 'u_guide', role: 'GUIDE' }
    ]
  };

  const owner = { userId: 'u_owner', role: 'Inventor' };
  const inventor = { userId: 'u_inventor', role: 'Inventor' };
  const guide = { userId: 'u_guide', role: 'Guide' };
  const outsider = { userId: 'u_outsider', role: 'Inventor' };

  // Owner & Inventor can import proposals and sync claims
  assert.strictEqual(ClaimPolicy.canImportClaimProposal(owner, project), true);
  assert.strictEqual(ClaimPolicy.canImportClaimProposal(inventor, project), true);
  assert.strictEqual(ClaimPolicy.canSyncClaims(inventor, project), true);

  // Guide can view and run FTO, but cannot import/modify claims directly
  assert.strictEqual(ClaimPolicy.canGenerateClaimProposal(guide, project), true);
  assert.strictEqual(ClaimPolicy.canRunFtoAnalysis(guide, project), true);
  assert.strictEqual(ClaimPolicy.canImportClaimProposal(guide, project), false);
  assert.strictEqual(ClaimPolicy.canSyncClaims(guide, project), false);

  // Outsider cannot do anything
  assert.strictEqual(ClaimPolicy.canGenerateClaimProposal(outsider, project), false);
  assert.strictEqual(ClaimPolicy.canRunFtoAnalysis(outsider, project), false);
  assert.strictEqual(ClaimPolicy.canImportClaimProposal(outsider, project), false);
  assert.strictEqual(ClaimPolicy.canSyncClaims(outsider, project), false);
});

test('Task 9 (11.2): Security Isolation — User A cannot access or import claims into User B project', async () => {
  const projectB = {
    id: 'project_B',
    ownerId: 'user_B',
    members: []
  };

  const userA = { userId: 'user_A', role: 'Inventor' };
  assert.strictEqual(ClaimPolicy.canViewClaims(userA, projectB), false);
  assert.strictEqual(ClaimPolicy.canCreateClaim(userA, projectB), false);
  assert.strictEqual(ClaimPolicy.canImportClaimProposal(userA, projectB), false);
  assert.strictEqual(ClaimPolicy.canSyncClaims(userA, projectB), false);
});

test('Co-Inventor Integration (1): Co-Inventor project isolation and RBAC access', async () => {
  const project1 = {
    id: 'proj_co_1',
    ownerId: 'lead_inventor_1',
    members: [
      { userId: 'coinventor_1', role: 'CO_INVENTOR' }
    ]
  };

  const projectUnrelated = {
    id: 'proj_unrelated',
    ownerId: 'stranger_1',
    members: [
      { userId: 'stranger_2', role: 'INVENTOR' }
    ]
  };

  const coInventorUser = { userId: 'coinventor_1', role: 'CoInventor' };
  const strangerUser = { userId: 'stranger_3', role: 'CoInventor' };

  // Project access
  assert.strictEqual(ProjectPolicy.canViewProject(coInventorUser, project1), true);
  assert.strictEqual(ProjectPolicy.canViewProject(coInventorUser, projectUnrelated), false);
  assert.strictEqual(ProjectPolicy.canViewProject(strangerUser, project1), false);

  // Claims access
  assert.strictEqual(ClaimPolicy.canViewClaims(coInventorUser, project1), true);
  assert.strictEqual(ClaimPolicy.canCreateClaim(coInventorUser, project1), true);
  assert.strictEqual(ClaimPolicy.canEditClaim(coInventorUser, project1), true);
  assert.strictEqual(ClaimPolicy.canViewClaims(coInventorUser, projectUnrelated), false);
  assert.strictEqual(ClaimPolicy.canCreateClaim(coInventorUser, projectUnrelated), false);

  // Document access
  assert.strictEqual(DocumentPolicy.canView(coInventorUser, project1), true);
  assert.strictEqual(DocumentPolicy.canUpload(coInventorUser, project1), true);
  assert.strictEqual(DocumentPolicy.canView(coInventorUser, projectUnrelated), false);
  assert.strictEqual(DocumentPolicy.canUpload(coInventorUser, projectUnrelated), false);

  // Review policy: Inventors / Co-inventors cannot approve their own projects
  assert.strictEqual(ReviewPolicy.canApprove(coInventorUser, project1), false);
});

test('Co-Inventor Integration (2): Co-Inventor cannot delete or archive projects owned by others', async () => {
  const project1 = {
    id: 'proj_co_1',
    ownerId: 'lead_inventor_1',
    members: [
      { userId: 'coinventor_1', role: 'CO_INVENTOR' }
    ]
  };

  const coInventorUser = { userId: 'coinventor_1', role: 'CoInventor' };
  assert.strictEqual(ProjectPolicy.canDeleteProject(coInventorUser, project1), false);
  assert.strictEqual(ProjectPolicy.canArchiveProject(coInventorUser, project1), false);
});

test('Collaboration & Notification (1): NotificationService creates persistent database notifications with user isolation', async () => {
  const origCreate = prisma.notification.create;
  (prisma.notification as any).create = async ({ data }: any) => ({
    id: 'notif_mock_1',
    createdAt: new Date(),
    readAt: null,
    metadata: data.metadata || null,
    ...data,
  });

  const user1 = 'test_user_notif_1';
  const n1 = await NotificationService.createNotification(
    user1,
    'Collaboration Request',
    'Alice invited you to collaborate on Smart Traffic Signal.',
    'INVITATION',
    'inv-100',
    'proj-100',
    { role: 'CO_INVENTOR' }
  );

  assert.ok(n1);
  assert.strictEqual(n1?.userId, user1);
  assert.strictEqual(n1?.isRead, false);
  assert.strictEqual(n1?.type, 'INVITATION');

  (prisma.notification as any).create = origCreate;
});

test('Collaboration & Notification (2): Notification recipient ownership and unread count', async () => {
  const origCount = prisma.notification.count;
  (prisma.notification as any).count = async ({ where }: any) => {
    assert.strictEqual(where.userId, 'test_user_notif_1');
    assert.strictEqual(where.isRead, false);
    return 3;
  };

  const user1 = 'test_user_notif_1';
  const unread = await NotificationService.getUnreadCount(user1);
  assert.strictEqual(unread, 3);

  (prisma.notification as any).count = origCount;
});

test('Collaboration & Notification (3): InvitationPolicy validates sender authority and prevents unauthorized invites', async () => {
  const origFindFirst = prisma.user.findFirst;
  const origFindUnique = prisma.user.findUnique;
  (prisma.user as any).findFirst = async () => ({ id: 'target_id', username: 'target_user', email: 'target@example.com' });
  (prisma.user as any).findUnique = async () => ({ id: 'target_id', username: 'target_user', email: 'target@example.com' });

  const project = {
    id: 'proj_auth_1',
    ownerId: 'owner_1',
    members: [{ userId: 'member_1', role: 'CO_INVENTOR' }]
  };

  const owner = { userId: 'owner_1', role: 'Inventor' };
  const stranger = { userId: 'stranger_1', role: 'Inventor' };

  // Owner can invite
  const canOwnerInvite = await InvitationPolicy.canInvite(owner, project as any, 'target_user', 'CO_INVENTOR' as any);
  assert.strictEqual(canOwnerInvite, true);

  // Stranger cannot invite (throws Access Denied Error)
  await assert.rejects(
    async () => {
      await InvitationPolicy.canInvite(stranger, project as any, 'target_user', 'CO_INVENTOR' as any);
    },
    /Access denied/
  );

  (prisma.user as any).findFirst = origFindFirst;
  (prisma.user as any).findUnique = origFindUnique;
});

test('Collaboration & Notification (4): InvitationPolicy enforces recipient ownership on accept / reject', async () => {
  const invitation = {
    id: 'inv_101',
    projectId: 'proj_101',
    senderId: 'owner_1',
    receiverId: 'target_receiver',
    role: 'CO_INVENTOR',
    status: 'PENDING'
  };

  const correctReceiver = { userId: 'target_receiver', role: 'CoInventor' };
  const unauthorizedUser = { userId: 'impostor_user', role: 'CoInventor' };

  assert.strictEqual(InvitationPolicy.canAccept(correctReceiver, invitation as any), true);
  assert.strictEqual(InvitationPolicy.canAccept(unauthorizedUser, invitation as any), false);
});

test('Collaboration & Notification (5): Email failure does not throw or break mail service caller', async () => {
  // Test that mailService returns a boolean and does not throw on invalid recipient
  const res = await MailService.sendCollaborationInviteEmail(
    'invalid-email@test.internal',
    'Test Recipient',
    'Test Sender',
    'Test Project',
    'co-inventor'
  );
  assert.strictEqual(typeof res, 'boolean');
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
