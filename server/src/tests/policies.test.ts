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
import { TaskService } from '../services/taskService';
import { AnalyticsService } from '../services/analyticsService';
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

  (prisma.patentProject as any).findMany = async () => [
    {
      id: 'p1',
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
      stage: 'IDEA',
      patentReferences: [],
      prototypes: [],
      projectReviews: [],
      tasks: [{ status: 'TODO', dueDate: new Date(Date.now() - 86400000) }],
      patentForms: [],
      documents: []
    }
  ];

  const portfolio = await AnalyticsService.getDashboardAnalytics('u1');
  assert.ok(portfolio);
  assert.strictEqual(portfolio.totalProjects, 2);
  assert.strictEqual(portfolio.filingReadyProjects, 1);
  assert.strictEqual(portfolio.inProgressProjects, 1);
  assert.strictEqual(portfolio.overdueTasksCount, 1);
  assert.strictEqual(portfolio.totalReferences, 1);

  (prisma.patentProject as any).findMany = origFindMany;
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
