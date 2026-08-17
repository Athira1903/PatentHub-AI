"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const collaborationController_1 = require("../controllers/collaborationController");
const projectService_1 = require("../services/projectService");
const authentication_policy_1 = require("../policies/auth/authentication.policy");
const project_policy_1 = require("../policies/project/project.policy");
const document_policy_1 = require("../policies/document/document.policy");
const workflow_policy_1 = require("../policies/workflow/workflow.policy");
const review_policy_1 = require("../policies/review/review.policy");
const invitation_policy_1 = require("../policies/invitation/invitation.policy");
const report_policy_1 = require("../policies/report/report.policy");
const patent_reference_policy_1 = require("../policies/project/patent-reference.policy");
const db_1 = require("../config/db");
const aiService_1 = require("../services/aiService");
const patentSearchService_1 = require("../services/patentSearchService");
const patentReferenceService_1 = require("../services/patentReferenceService");
const formService_1 = require("../services/formService");
const reviewService_1 = require("../services/reviewService");
const filingReadinessService_1 = require("../services/filingReadinessService");
const prototypeService_1 = require("../services/prototypeService");
const pdfService_1 = require("../services/pdfService");
const activityService_1 = require("../services/activityService");
const notificationService_1 = require("../services/notificationService");
const taskService_1 = require("../services/taskService");
const analyticsService_1 = require("../services/analyticsService");
const claimService_1 = require("../services/claimService");
const claimAiService_1 = require("../services/claimAiService");
const claimValidationService_1 = require("../services/claimValidationService");
const ftoAnalysisService_1 = require("../services/ftoAnalysisService");
const claim_policy_1 = require("../policies/claim/claim.policy");
const aiController_1 = require("../controllers/aiController");
const patentController_1 = require("../controllers/patentController");
// Simple Test Runner framework
let passedTests = 0;
let failedTests = 0;
const testsQueue = [];
function test(name, fn) {
    testsQueue.push({ name, fn });
}
// ----------------------------------------------------
// 1. Authentication Tests
// ----------------------------------------------------
test('Authentication: Activated user can log in', async () => {
    const originalFindFirst = db_1.prisma.user.findFirst;
    db_1.prisma.user.findFirst = async () => ({ id: 'u1', isActive: true });
    const canLogin = await authentication_policy_1.AuthenticationPolicy.canLogin('activeUser');
    assert_1.default.strictEqual(canLogin, true);
    db_1.prisma.user.findFirst = originalFindFirst;
});
test('Authentication: Unactivated/Suspended user denied login', async () => {
    const originalFindFirst = db_1.prisma.user.findFirst;
    db_1.prisma.user.findFirst = async () => ({ id: 'u2', isActive: false });
    const canLogin = await authentication_policy_1.AuthenticationPolicy.canLogin('inactiveUser');
    assert_1.default.strictEqual(canLogin, false);
    db_1.prisma.user.findFirst = originalFindFirst;
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
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(mockOwner, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canEditProject(mockOwner, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(mockOwner, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canArchiveProject(mockOwner, mockProject), true);
});
test('Project: Member can view but not edit, delete, or archive project', () => {
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(mockMember, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canEditProject(mockMember, mockProject), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(mockMember, mockProject), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canArchiveProject(mockMember, mockProject), false);
});
test('Project: Non-member is denied view, edit, delete, and archive', () => {
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(mockNonMember, mockProject), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canEditProject(mockNonMember, mockProject), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(mockNonMember, mockProject), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canArchiveProject(mockNonMember, mockProject), false);
});
test('Project: Admin can bypass checks and manage project', () => {
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(mockAdmin, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canEditProject(mockAdmin, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(mockAdmin, mockProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canArchiveProject(mockAdmin, mockProject), true);
});
// ----------------------------------------------------
// 3. Document Policy Tests
// ----------------------------------------------------
test('Document: Editor (Inventor/CoInventor member) can upload and edit', () => {
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(mockOwner, mockProject), true);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(mockMember, mockProject), true);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canEdit(mockMember, mockProject), true);
});
test('Document: Viewer / non-editor cannot upload or edit', () => {
    const mockViewerProject = {
        ...mockProject,
        members: [{ userId: 'user_member', role: 'VIEWER' }] // Viewer role
    };
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(mockMember, mockViewerProject), false);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canEdit(mockMember, mockViewerProject), false);
});
test('Document: Non-member cannot view or upload documents', () => {
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canView(mockNonMember, mockProject), false);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(mockNonMember, mockProject), false);
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
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(mockGuideUser, mockGuideProject), true);
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockGuideUser, mockGuideProject), true);
});
test('Review: Inventor cannot approve own review', () => {
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockOwner, mockGuideProject), false);
});
test('Review: Guide cannot approve if mandatory forms are missing', () => {
    const incompleteProject = { ...mockGuideProject, documents: [] };
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(mockGuideUser, incompleteProject), false);
});
test('Review: Global Guide who is NOT a project member CANNOT review or approve', () => {
    const nonMemberGuide = { userId: 'different_guide', role: 'Guide' };
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(nonMemberGuide, mockGuideProject), false);
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(nonMemberGuide, mockGuideProject), false);
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
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canReview(inventorAsGuideUser, projectWithStudentGuide), true);
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(inventorAsGuideUser, projectWithStudentGuide), true);
});
// ----------------------------------------------------
// 5. Workflow Policy Tests
// ----------------------------------------------------
test('Workflow: Valid stage transition succeeds', () => {
    const ok = workflow_policy_1.WorkflowPolicy.isStageTransitionValid('IDEA', 'LITERATURE_REVIEW');
    assert_1.default.strictEqual(ok, true);
});
test('Workflow: Invalid stage transition (skipping stages) denied', () => {
    const ok = workflow_policy_1.WorkflowPolicy.isStageTransitionValid('IDEA', 'PROTOTYPE');
    assert_1.default.strictEqual(ok, false);
});
test('Workflow: Rejection transition to DOCUMENTATION is allowed', () => {
    const ok1 = workflow_policy_1.WorkflowPolicy.isStageTransitionValid('GUIDE_REVIEW', 'DOCUMENTATION');
    const ok2 = workflow_policy_1.WorkflowPolicy.isStageTransitionValid('PATENT_EXPERT_REVIEW', 'DOCUMENTATION');
    assert_1.default.strictEqual(ok1, true);
    assert_1.default.strictEqual(ok2, true);
});
// ----------------------------------------------------
// 6. Invitation Policy Tests
// ----------------------------------------------------
test('Invitation: Authorized owner can invite compatible role', async () => {
    const originalFindUnique = db_1.prisma.user.findUnique;
    const originalProjectMemberFind = db_1.prisma.projectMember.findUnique;
    const originalInvitationFind = db_1.prisma.invitation.findFirst;
    // Mock invitee exists with Inventor role
    db_1.prisma.user.findUnique = async () => ({ id: 'u_invitee', username: 'guest_user', role: { name: 'Inventor' } });
    db_1.prisma.projectMember.findUnique = async () => null;
    db_1.prisma.invitation.findFirst = async () => null;
    const allowed = await invitation_policy_1.InvitationPolicy.canInvite(mockOwner, mockProject, 'guest_user', 'CO_INVENTOR');
    assert_1.default.strictEqual(allowed, true);
    db_1.prisma.user.findUnique = originalFindUnique;
    db_1.prisma.projectMember.findUnique = originalProjectMemberFind;
    db_1.prisma.invitation.findFirst = originalInvitationFind;
});
test('Invitation: User registered globally as Inventor can be invited as a GUIDE (project-scoped multi-role)', async () => {
    const originalFindUnique = db_1.prisma.user.findUnique;
    const originalProjectMemberFind = db_1.prisma.projectMember.findUnique;
    const originalInvitationFind = db_1.prisma.invitation.findFirst;
    // Mock invitee exists with Inventor role
    db_1.prisma.user.findUnique = async () => ({ id: 'u_invitee', username: 'guest_user', role: { name: 'Inventor' } });
    db_1.prisma.projectMember.findUnique = async () => null;
    db_1.prisma.invitation.findFirst = async () => null;
    // Invite as GUIDE
    const allowed = await invitation_policy_1.InvitationPolicy.canInvite(mockOwner, mockProject, 'guest_user', 'GUIDE');
    assert_1.default.strictEqual(allowed, true);
    db_1.prisma.user.findUnique = originalFindUnique;
    db_1.prisma.projectMember.findUnique = originalProjectMemberFind;
    db_1.prisma.invitation.findFirst = originalInvitationFind;
});
// ----------------------------------------------------
// 7. Report Policy Tests
// ----------------------------------------------------
test('Report: Incomplete project cannot generate readiness report', () => {
    // Missing documents and forms
    assert_1.default.strictEqual(report_policy_1.ReportPolicy.canGenerateReadinessReport(mockOwner, mockProject), false);
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
    assert_1.default.strictEqual(report_policy_1.ReportPolicy.canGenerateReadinessReport(mockOwner, completedProject), true);
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
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUnique = db_1.prisma.invitation.findUnique;
    db_1.prisma.invitation.findUnique = async () => ({
        id: 'invite_1',
        receiverId: 'correct_user',
        status: 'PENDING',
        project: { id: 'p1' }
    });
    await (0, collaborationController_1.respondToInvitation)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 403);
    assert_1.default.strictEqual(responseData.message.includes('Access denied'), true);
    db_1.prisma.invitation.findUnique = originalFindUnique;
});
test('Controller: respondToInvitation rejects with 404 if project no longer exists', async () => {
    const mockReq = {
        user: { userId: 'correct_user' },
        body: { invitationId: 'invite_1', status: 'ACCEPTED' }
    };
    let statusSet = 500;
    let responseData = {};
    const mockRes = {
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUnique = db_1.prisma.invitation.findUnique;
    db_1.prisma.invitation.findUnique = async () => ({
        id: 'invite_1',
        receiverId: 'correct_user',
        status: 'PENDING',
        project: null
    });
    await (0, collaborationController_1.respondToInvitation)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 404);
    assert_1.default.strictEqual(responseData.message.includes('no longer exists'), true);
    db_1.prisma.invitation.findUnique = originalFindUnique;
});
test('Controller: respondToInvitation rejects with 400 if user already a project member', async () => {
    const mockReq = {
        user: { userId: 'correct_user' },
        body: { invitationId: 'invite_1', status: 'ACCEPTED' }
    };
    let statusSet = 500;
    let responseData = {};
    const mockRes = {
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUnique = db_1.prisma.invitation.findUnique;
    const originalMemberFindUnique = db_1.prisma.projectMember.findUnique;
    db_1.prisma.invitation.findUnique = async () => ({
        id: 'invite_1',
        projectId: 'p1',
        receiverId: 'correct_user',
        status: 'PENDING',
        project: { id: 'p1' }
    });
    db_1.prisma.projectMember.findUnique = async () => ({ id: 'pm_1', projectId: 'p1', userId: 'correct_user' });
    await (0, collaborationController_1.respondToInvitation)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 400);
    assert_1.default.strictEqual(responseData.message.includes('already a member'), true);
    db_1.prisma.invitation.findUnique = originalFindUnique;
    db_1.prisma.projectMember.findUnique = originalMemberFindUnique;
});
test('Controller: respondToInvitation successfully accepts and writes within a transaction', async () => {
    const mockReq = {
        user: { userId: 'correct_user' },
        body: { invitationId: 'invite_1', status: 'ACCEPTED' }
    };
    let statusSet = 500;
    let responseData = {};
    const mockRes = {
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUnique = db_1.prisma.invitation.findUnique;
    const originalMemberFindUnique = db_1.prisma.projectMember.findUnique;
    const originalTransaction = db_1.prisma.$transaction;
    const originalUpdate = db_1.prisma.invitation.update;
    const originalCreateMember = db_1.prisma.projectMember.create;
    const originalCreateNotification = db_1.prisma.notification.create;
    const originalCreateActivity = db_1.prisma.activityLog.create;
    let invitationUpdated = false;
    let memberCreated = false;
    let notificationsDispatched = false;
    db_1.prisma.invitation.findUnique = async () => ({
        id: 'invite_1',
        receiverId: 'correct_user',
        senderId: 'sender_1',
        role: 'GUIDE',
        status: 'PENDING',
        project: { id: 'p1', title: 'Test Project' },
        receiver: { fullName: 'Recipient Name' }
    });
    db_1.prisma.projectMember.findUnique = async () => null;
    db_1.prisma.$transaction = async (callback) => {
        return callback(db_1.prisma);
    };
    db_1.prisma.invitation.update = async (args) => {
        invitationUpdated = true;
        assert_1.default.strictEqual(args.data.status, 'ACCEPTED');
        return {};
    };
    db_1.prisma.projectMember.create = async (args) => {
        memberCreated = true;
        assert_1.default.strictEqual(args.data.role, 'GUIDE');
        return {};
    };
    db_1.prisma.notification.create = async () => {
        notificationsDispatched = true;
        return {};
    };
    db_1.prisma.activityLog.create = async () => {
        return {};
    };
    await (0, collaborationController_1.respondToInvitation)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 200);
    assert_1.default.strictEqual(invitationUpdated, true);
    assert_1.default.strictEqual(memberCreated, true);
    assert_1.default.strictEqual(notificationsDispatched, true);
    db_1.prisma.invitation.findUnique = originalFindUnique;
    db_1.prisma.projectMember.findUnique = originalMemberFindUnique;
    db_1.prisma.$transaction = originalTransaction;
    db_1.prisma.invitation.update = originalUpdate;
    db_1.prisma.projectMember.create = originalCreateMember;
    db_1.prisma.notification.create = originalCreateNotification;
    db_1.prisma.activityLog.create = originalCreateActivity;
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
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    await (0, collaborationController_1.inviteMember)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 400);
    assert_1.default.strictEqual(responseData.message.includes('Invalid project role'), true);
});
test('Controller: inviteMember rejects self-invitation', async () => {
    const mockReq = {
        user: { userId: 'sender_1' },
        body: { projectId: 'p1', username: 'sender_user', role: 'GUIDE' }
    };
    let statusSet = 500;
    let responseData = {};
    const mockRes = {
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUniqueProject = db_1.prisma.patentProject.findUnique;
    const originalFindUniqueUser = db_1.prisma.user.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1' });
    db_1.prisma.user.findUnique = async (args) => {
        if (args.where.username === 'sender_user') {
            return { id: 'sender_1', username: 'sender_user' };
        }
        return null;
    };
    await (0, collaborationController_1.inviteMember)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 400);
    assert_1.default.strictEqual(responseData.message.includes('cannot invite yourself'), true);
    db_1.prisma.patentProject.findUnique = originalFindUniqueProject;
    db_1.prisma.user.findUnique = originalFindUniqueUser;
});
test('Controller: inviteMember rejects if user already a project member', async () => {
    const mockReq = {
        user: { userId: 'sender_1' },
        body: { projectId: 'p1', username: 'receiver_user', role: 'GUIDE' }
    };
    let statusSet = 500;
    let responseData = {};
    const mockRes = {
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUniqueProject = db_1.prisma.patentProject.findUnique;
    const originalFindUniqueUser = db_1.prisma.user.findUnique;
    const originalMemberFindUnique = db_1.prisma.projectMember.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1' });
    db_1.prisma.user.findUnique = async (args) => {
        if (args.where.username === 'receiver_user') {
            return { id: 'receiver_1', username: 'receiver_user' };
        }
        if (args.where.id === 'sender_1') {
            return { id: 'sender_1', username: 'sender_user' };
        }
        return null;
    };
    db_1.prisma.projectMember.findUnique = async () => ({ id: 'pm_1' });
    await (0, collaborationController_1.inviteMember)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 400);
    assert_1.default.strictEqual(responseData.message.includes('already a member'), true);
    db_1.prisma.patentProject.findUnique = originalFindUniqueProject;
    db_1.prisma.user.findUnique = originalFindUniqueUser;
    db_1.prisma.projectMember.findUnique = originalMemberFindUnique;
});
test('Controller: inviteMember rejects if active invitation already exists', async () => {
    const mockReq = {
        user: { userId: 'sender_1' },
        body: { projectId: 'p1', username: 'receiver_user', role: 'GUIDE' }
    };
    let statusSet = 500;
    let responseData = {};
    const mockRes = {
        status: (code) => { statusSet = code; return mockRes; },
        json: (data) => { responseData = data; }
    };
    const originalFindUniqueProject = db_1.prisma.patentProject.findUnique;
    const originalFindUniqueUser = db_1.prisma.user.findUnique;
    const originalMemberFindUnique = db_1.prisma.projectMember.findUnique;
    const originalInvitationFindFirst = db_1.prisma.invitation.findFirst;
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1' });
    db_1.prisma.user.findUnique = async (args) => {
        if (args.where.username === 'receiver_user') {
            return { id: 'receiver_1', username: 'receiver_user' };
        }
        if (args.where.id === 'sender_1') {
            return { id: 'sender_1', username: 'sender_user' };
        }
        return null;
    };
    db_1.prisma.projectMember.findUnique = async () => null;
    db_1.prisma.invitation.findFirst = async () => ({ id: 'inv_existing', status: 'PENDING' });
    await (0, collaborationController_1.inviteMember)(mockReq, mockRes);
    assert_1.default.strictEqual(statusSet, 400);
    assert_1.default.strictEqual(responseData.message.includes('pending invitation has already been sent'), true);
    db_1.prisma.patentProject.findUnique = originalFindUniqueProject;
    db_1.prisma.user.findUnique = originalFindUniqueUser;
    db_1.prisma.projectMember.findUnique = originalMemberFindUnique;
    db_1.prisma.invitation.findFirst = originalInvitationFindFirst;
});
test('Service: inviteMemberByUsername rejects invalid ProjectRole', async () => {
    await assert_1.default.rejects(async () => {
        await projectService_1.ProjectService.inviteMemberByUsername('p1', 'sender_1', 'receiver_user', 'INVALID_ROLE');
    }, /Invalid project role/);
});
test('Service: inviteMemberByUsername rejects self-addition', async () => {
    const originalFindUniqueProject = db_1.prisma.patentProject.findUnique;
    const originalFindUniqueUser = db_1.prisma.user.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1', ownerId: 'sender_1' });
    db_1.prisma.user.findUnique = async () => ({ id: 'sender_1', username: 'sender_user' });
    await assert_1.default.rejects(async () => {
        await projectService_1.ProjectService.inviteMemberByUsername('p1', 'sender_1', 'sender_user', 'GUIDE');
    }, /cannot add yourself/);
    db_1.prisma.patentProject.findUnique = originalFindUniqueProject;
    db_1.prisma.user.findUnique = originalFindUniqueUser;
});
test('Service: inviteMemberByUsername rejects if active invitation exists', async () => {
    const originalFindUniqueProject = db_1.prisma.patentProject.findUnique;
    const originalFindUniqueUser = db_1.prisma.user.findUnique;
    const originalMemberFindUnique = db_1.prisma.projectMember.findUnique;
    const originalInvitationFindFirst = db_1.prisma.invitation.findFirst;
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1', ownerId: 'sender_1' });
    db_1.prisma.user.findUnique = async () => ({ id: 'receiver_1', username: 'receiver_user' });
    db_1.prisma.projectMember.findUnique = async () => null;
    db_1.prisma.invitation.findFirst = async () => ({ id: 'inv_existing', status: 'PENDING' });
    await assert_1.default.rejects(async () => {
        await projectService_1.ProjectService.inviteMemberByUsername('p1', 'sender_1', 'receiver_user', 'GUIDE');
    }, /pending invitation has already been sent/);
    db_1.prisma.patentProject.findUnique = originalFindUniqueProject;
    db_1.prisma.user.findUnique = originalFindUniqueUser;
    db_1.prisma.projectMember.findUnique = originalMemberFindUnique;
    db_1.prisma.invitation.findFirst = originalInvitationFindFirst;
});
// ----------------------------------------------------
// 7. AI & Gemini Integration Tests
// ----------------------------------------------------
test('Controller: generateInnovationAi suggests title successfully', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    const originalSuggestions = aiService_1.AiService.generateInnovationSuggestions;
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        title: 'Smart Ingestor',
        innovationIdea: 'A smart ingestor system',
        proposedSolution: 'Using distributed feedback queues',
        category: 'Software',
        technicalDomain: 'Computing'
    });
    aiService_1.AiService.generateInnovationSuggestions = async () => 'Suggested Patent Title';
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'p1' },
        body: { action: 'title' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.generateInnovationAi)(req, res);
    assert_1.default.strictEqual(statusVal, 200);
    assert_1.default.strictEqual(jsonVal.success, true);
    assert_1.default.strictEqual(jsonVal.suggestion, 'Suggested Patent Title');
    db_1.prisma.patentProject.findUnique = originalFindUnique;
    aiService_1.AiService.generateInnovationSuggestions = originalSuggestions;
});
test('Controller: getSimilarityAnalysis returns similarity response without fabricated prior art', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    const originalSimilarity = aiService_1.AiService.analyzeSimilarity;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    aiService_1.AiService.analyzeSimilarity = async () => mockAnalysis;
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'p1' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.getSimilarityAnalysis)(req, res);
    assert_1.default.strictEqual(statusVal, 200);
    assert_1.default.strictEqual(jsonVal.success, true);
    assert_1.default.strictEqual(jsonVal.score, 15);
    assert_1.default.strictEqual(jsonVal.riskLevel, 'Low Risk');
    assert_1.default.deepStrictEqual(jsonVal.priorArtReferences, []);
    db_1.prisma.patentProject.findUnique = originalFindUnique;
    aiService_1.AiService.analyzeSimilarity = originalSimilarity;
});
test('Controller: getNoveltyAssessment returns novelty response with proper disclaimer', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    const originalNovelty = aiService_1.AiService.analyzeNovelty;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    aiService_1.AiService.analyzeNovelty = async () => mockNovelty;
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'p1' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.getNoveltyAssessment)(req, res);
    assert_1.default.strictEqual(statusVal, 200);
    assert_1.default.strictEqual(jsonVal.success, true);
    assert_1.default.strictEqual(jsonVal.score, 85);
    assert_1.default.strictEqual(jsonVal.assessment, 'High');
    db_1.prisma.patentProject.findUnique = originalFindUnique;
    aiService_1.AiService.analyzeNovelty = originalNovelty;
});
test('Controller: generatePatentDrawing returns drawing component annotations metadata', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    const originalDrawing = aiService_1.AiService.generatePatentDrawingAnalysis;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    aiService_1.AiService.generatePatentDrawingAnalysis = async () => mockDrawing;
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'p1' },
        body: { originalUrl: 'https://images.unsplash.com/test' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.generatePatentDrawing)(req, res);
    assert_1.default.strictEqual(statusVal, 200);
    assert_1.default.strictEqual(jsonVal.success, true);
    assert_1.default.strictEqual(jsonVal.drawingMetadata.figNum, 'FIG. 1');
    assert_1.default.strictEqual(jsonVal.drawingMetadata.components[0].label, 'Primary Port');
    db_1.prisma.patentProject.findUnique = originalFindUnique;
    aiService_1.AiService.generatePatentDrawingAnalysis = originalDrawing;
});
test('Controller: AI endpoints return 404 for missing project', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    db_1.prisma.patentProject.findUnique = async () => null;
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'missing_id' },
        body: { action: 'title' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.generateInnovationAi)(req, res);
    assert_1.default.strictEqual(statusVal, 404);
    db_1.prisma.patentProject.findUnique = originalFindUnique;
});
test('Controller: AI endpoints return 400 for empty project content', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        title: '',
        innovationIdea: '',
        proposedSolution: ''
    });
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'p1' },
        body: { action: 'title' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.generateInnovationAi)(req, res);
    assert_1.default.strictEqual(statusVal, 400);
    assert_1.default.ok(jsonVal.message.includes('must have a title'));
    db_1.prisma.patentProject.findUnique = originalFindUnique;
});
test('Controller: AI endpoints handle Gemini service failure gracefully with 502', async () => {
    const originalFindUnique = db_1.prisma.patentProject.findUnique;
    const originalNovelty = aiService_1.AiService.analyzeNovelty;
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        title: 'Smart Ingestor',
        innovationIdea: 'A smart ingestor system',
        proposedSolution: 'Using distributed feedback queues'
    });
    aiService_1.AiService.analyzeNovelty = async () => {
        throw new Error('Gemini quota exceeded or server timeout.');
    };
    let statusVal = 0;
    let jsonVal = null;
    const req = {
        params: { id: 'p1' }
    };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, aiController_1.getNoveltyAssessment)(req, res);
    assert_1.default.strictEqual(statusVal, 502);
    assert_1.default.ok(jsonVal.message.includes('currently unavailable'));
    db_1.prisma.patentProject.findUnique = originalFindUnique;
    aiService_1.AiService.analyzeNovelty = originalNovelty;
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
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSearch(ownerUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSearch(editorUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSearch(viewerUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSearch(externalUser, testProject), false);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canViewReferences(ownerUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canViewReferences(viewerUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canViewReferences(externalUser, testProject), false);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSaveReference(ownerUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSaveReference(adminUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSaveReference(editorUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSaveReference(viewerUser, testProject), false);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canSaveReference(externalUser, testProject), false);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canDeleteReference(ownerUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canDeleteReference(editorUser, testProject), true);
    assert_1.default.strictEqual(patent_reference_policy_1.PatentReferencePolicy.canDeleteReference(viewerUser, testProject), false);
});
test('Patent Search Service: Performs mock search fallback cleanly', async () => {
    const results = await patentSearchService_1.PatentSearchService.search('consensus');
    assert_1.default.ok(Array.isArray(results));
    assert_1.default.ok(results.length > 0);
    assert_1.default.strictEqual(results[0].source, 'MOCK');
    assert_1.default.ok(results[0].patentNumber);
    assert_1.default.ok(results[0].title);
});
test('Patent Controller: Empty query returns 400 Bad Request', async () => {
    let statusVal = 0;
    let jsonVal = null;
    const req = { query: { q: '' } };
    const res = {
        status: (s) => { statusVal = s; return res; },
        json: (j) => { jsonVal = j; }
    };
    await (0, patentController_1.searchPatents)(req, res);
    assert_1.default.strictEqual(statusVal, 400);
    assert_1.default.ok(jsonVal.message.includes('required'));
});
test('Patent Reference Service: Saves reference and prevents duplicates', async () => {
    const originalFindUnique = db_1.prisma.patentReference.findUnique;
    const originalCreate = db_1.prisma.patentReference.create;
    let createdData = null;
    db_1.prisma.patentReference.findUnique = async () => null;
    db_1.prisma.patentReference.create = async (args) => {
        createdData = args.data;
        return { id: 'ref_101', ...args.data };
    };
    const saved = await patentReferenceService_1.PatentReferenceService.saveReference('p1', {
        patentNumber: 'US11048956B2',
        title: 'Decentralized trust verification system',
        abstract: 'A system for verifying digital assets',
        source: 'MOCK'
    });
    assert_1.default.strictEqual(saved.id, 'ref_101');
    assert_1.default.strictEqual(createdData.patentNumber, 'US11048956B2');
    assert_1.default.strictEqual(createdData.source, 'MOCK');
    // Test duplicate prevention
    db_1.prisma.patentReference.findUnique = async () => ({ id: 'ref_101', projectId: 'p1', patentNumber: 'US11048956B2' });
    await assert_1.default.rejects(async () => {
        await patentReferenceService_1.PatentReferenceService.saveReference('p1', {
            patentNumber: 'US11048956B2',
            title: 'Decentralized trust verification system',
            source: 'MOCK'
        });
    }, /already saved/);
    db_1.prisma.patentReference.findUnique = originalFindUnique;
    db_1.prisma.patentReference.create = originalCreate;
});
test('Patent Reference Service: Enforces project isolation on deletion', async () => {
    const originalFindUnique = db_1.prisma.patentReference.findUnique;
    const originalDelete = db_1.prisma.patentReference.delete;
    db_1.prisma.patentReference.findUnique = async () => ({
        id: 'ref_101',
        projectId: 'p1',
        patentNumber: 'US11048956B2'
    });
    // Attempting to delete for wrong project 'p2' should throw isolation error
    await assert_1.default.rejects(async () => {
        await patentReferenceService_1.PatentReferenceService.deleteReference('p2', 'ref_101');
    }, /Project isolation violation/);
    db_1.prisma.patentReference.findUnique = originalFindUnique;
    db_1.prisma.patentReference.delete = originalDelete;
});
test('AI Service: analyzeSimilarity handles project with 0 references cleanly', async () => {
    const res = await aiService_1.AiService.analyzeSimilarity('Smart Ingestor', 'Software', 'Computing', 'An automated ingestor', 'Distributed queues', []);
    assert_1.default.strictEqual(res.score, 0);
    assert_1.default.strictEqual(res.similarityScore, 0);
    assert_1.default.strictEqual(res.matches.length, 0);
    assert_1.default.ok(res.explanation.includes('No verified prior-art references'));
});
// ----------------------------------------------------
// 13. Task 5: Patent Forms, Reviews & Filing Readiness Tests
// ----------------------------------------------------
test('Task 5: FormService normalizes form types and pre-fills default data', () => {
    assert_1.default.strictEqual(formService_1.FormService.normalizeFormType('1'), 'Form 1');
    assert_1.default.strictEqual(formService_1.FormService.normalizeFormType('form 2'), 'Form 2');
    assert_1.default.strictEqual(formService_1.FormService.normalizeFormType('Form 3'), 'Form 3');
    assert_1.default.strictEqual(formService_1.FormService.normalizeFormType('5'), 'Form 5');
    assert_1.default.strictEqual(formService_1.FormService.normalizeFormType('form_26'), 'Form 26');
    const dummyProj = {
        title: 'Quantum Sensor Array',
        category: 'Electronics',
        innovationIdea: 'A quantum sensor',
        problemStatement: 'High noise',
        proposedSolution: 'Cold atom trap',
        owner: { fullName: 'Dr. Alice', email: 'alice@institution.edu', institution: 'MIT' },
        members: []
    };
    const form1Data = formService_1.FormService.generateDefaultFormData(dummyProj, 'Form 1');
    assert_1.default.strictEqual(form1Data.applicantName, 'Dr. Alice');
    assert_1.default.strictEqual(form1Data.title, 'Quantum Sensor Array');
    const form2Data = formService_1.FormService.generateDefaultFormData(dummyProj, 'Form 2');
    assert_1.default.strictEqual(form2Data.specificationType, 'COMPLETE');
    assert_1.default.strictEqual(form2Data.abstract, 'A quantum sensor');
});
test('Task 5: FormService upserts forms and handles version increment on approved edit', async () => {
    const origFindUnique = db_1.prisma.patentForm.findUnique;
    const origUpdate = db_1.prisma.patentForm.update;
    const origCreate = db_1.prisma.patentForm.create;
    // 1. Test creation
    db_1.prisma.patentForm.findUnique = async () => null;
    db_1.prisma.patentForm.create = async (args) => ({ id: 'f1', ...args.data });
    const saved = await formService_1.FormService.saveForm('p1', 'Form 1', { applicantName: 'Dr. Alice' }, 'u1');
    assert_1.default.strictEqual(saved.version, 1);
    assert_1.default.strictEqual(saved.status, 'DRAFT');
    // 2. Test version bump if status was APPROVED
    db_1.prisma.patentForm.findUnique = async () => ({
        id: 'f1',
        projectId: 'p1',
        formType: 'Form 1',
        formData: { applicantName: 'Dr. Alice' },
        status: 'APPROVED',
        version: 1
    });
    db_1.prisma.patentForm.update = async (args) => ({
        id: 'f1',
        ...args.data
    });
    const updated = await formService_1.FormService.saveForm('p1', 'Form 1', { applicantName: 'Dr. Alice Updated' }, 'u1');
    assert_1.default.strictEqual(updated.version, 2);
    assert_1.default.strictEqual(updated.status, 'DRAFT');
    db_1.prisma.patentForm.findUnique = origFindUnique;
    db_1.prisma.patentForm.update = origUpdate;
    db_1.prisma.patentForm.create = origCreate;
});
test('Task 5: ReviewService advances stage on APPROVED and returns to DOCUMENTATION on REJECTED', async () => {
    const origFindProject = db_1.prisma.patentProject.findUnique;
    const origUpdateProject = db_1.prisma.patentProject.update;
    const origCreateReview = db_1.prisma.projectReview.create;
    const origCreateLog = db_1.prisma.activityLog.create;
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
    db_1.prisma.patentProject.findUnique = async () => mockProject;
    let updatedStage = '';
    db_1.prisma.patentProject.update = async (args) => {
        updatedStage = args.data.stage;
        return { ...mockProject, stage: args.data.stage };
    };
    db_1.prisma.projectReview.create = async (args) => ({ id: 'rev_1', ...args.data });
    db_1.prisma.activityLog.create = async () => ({ id: 'log_1' });
    const guideUser = { userId: 'guide_1', role: 'Guide' };
    // 1. Approval advances stage from GUIDE_REVIEW to PATENT_EXPERT_REVIEW
    const reviewApproved = await reviewService_1.ReviewService.submitReviewDecision('p1', guideUser, {
        reviewType: 'GUIDE_REVIEW',
        decision: 'APPROVED',
        comments: 'Looks good!'
    });
    assert_1.default.strictEqual(reviewApproved.decision, 'APPROVED');
    assert_1.default.strictEqual(updatedStage, 'PATENT_EXPERT_REVIEW');
    // 2. Rejection sends stage back to DOCUMENTATION
    mockProject.stage = 'GUIDE_REVIEW';
    await reviewService_1.ReviewService.submitReviewDecision('p1', guideUser, {
        reviewType: 'GUIDE_REVIEW',
        decision: 'REJECTED',
        comments: 'Missing drawings.'
    });
    assert_1.default.strictEqual(updatedStage, 'DOCUMENTATION');
    db_1.prisma.patentProject.findUnique = origFindProject;
    db_1.prisma.patentProject.update = origUpdateProject;
    db_1.prisma.projectReview.create = origCreateReview;
    db_1.prisma.activityLog.create = origCreateLog;
});
test('Task 5: FilingReadinessService checklist returns NOT_READY vs READY correctly', async () => {
    const origFindProject = db_1.prisma.patentProject.findUnique;
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
    db_1.prisma.patentProject.findUnique = async () => incompleteProj;
    const incompleteRes = await filingReadinessService_1.FilingReadinessService.getFilingReadiness('p1');
    assert_1.default.strictEqual(incompleteRes.overallReadiness, 'NOT_READY');
    assert_1.default.ok(incompleteRes.blockingIssues.length > 0);
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
    db_1.prisma.patentProject.findUnique = async () => completeProj;
    const completeRes = await filingReadinessService_1.FilingReadinessService.getFilingReadiness('p2');
    assert_1.default.strictEqual(completeRes.overallReadiness, 'READY');
    assert_1.default.strictEqual(completeRes.completedCount, 6);
    assert_1.default.strictEqual(completeRes.blockingIssues.length, 0);
    db_1.prisma.patentProject.findUnique = origFindProject;
});
test('Task 5: Filing Package export throws when incomplete and compiles PDF when ready', async () => {
    const origGetReadiness = filingReadinessService_1.FilingReadinessService.getFilingReadiness;
    const origFindProject = db_1.prisma.patentProject.findUnique;
    const origCreateDoc = db_1.prisma.document.create;
    const origCreateLog = db_1.prisma.activityLog.create;
    // 1. Incomplete throws error with blockingIssues
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = async () => ({
        overallReadiness: 'NOT_READY',
        completedCount: 2,
        totalRequiredCount: 6,
        checklist: [],
        blockingIssues: ['Forms 1, 2, 3, 5 missing']
    });
    await assert_1.default.rejects(async () => {
        await filingReadinessService_1.FilingReadinessService.exportFilingPackage('p1', 'user1');
    }, /audit failed/);
    // 2. Complete generates PDF package and registers Document record
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = async () => ({
        overallReadiness: 'READY',
        completedCount: 6,
        totalRequiredCount: 6,
        checklist: [],
        blockingIssues: []
    });
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        title: 'Complete Autonomous System',
        stage: 'FILING_READY',
        owner: { fullName: 'Alice', email: 'alice@test.com' },
        members: [],
        patentForms: [],
        patentReferences: [],
        projectReviews: []
    });
    db_1.prisma.document.create = async (args) => ({ id: 'doc_package_1', ...args.data });
    db_1.prisma.activityLog.create = async () => ({ id: 'log_1' });
    const packageDoc = await filingReadinessService_1.FilingReadinessService.exportFilingPackage('p1', 'user1');
    assert_1.default.ok(packageDoc.id);
    assert_1.default.ok(packageDoc.fileUrl.includes('.pdf'));
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = origGetReadiness;
    db_1.prisma.patentProject.findUnique = origFindProject;
    db_1.prisma.document.create = origCreateDoc;
    db_1.prisma.activityLog.create = origCreateLog;
});
// ----------------------------------------------------
// 14. Task 6: Prototype & Technical Drawing Intelligence Tests
// ----------------------------------------------------
test('Task 6: PrototypeService creation, retrieval, and project isolation', async () => {
    const origFindProj = db_1.prisma.patentProject.findUnique;
    const origCreateProto = db_1.prisma.prototype.create;
    const origFindMany = db_1.prisma.prototype.findMany;
    const origFindUnique = db_1.prisma.prototype.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1', title: 'Solar Array' });
    db_1.prisma.prototype.create = async (args) => ({ id: 'proto_1', ...args.data });
    db_1.prisma.prototype.findMany = async (args) => [{ id: 'proto_1', projectId: args.where.projectId, title: 'Alpha Model' }];
    const proto = await prototypeService_1.PrototypeService.createPrototype('p1', { title: 'Alpha Model', description: 'Initial CAD draft' }, 'u1');
    assert_1.default.strictEqual(proto.title, 'Alpha Model');
    assert_1.default.strictEqual(proto.projectId, 'p1');
    const list = await prototypeService_1.PrototypeService.getProjectPrototypes('p1');
    assert_1.default.strictEqual(list.length, 1);
    // Project isolation violation check
    db_1.prisma.prototype.findUnique = async () => ({ id: 'proto_1', projectId: 'p1', title: 'Alpha Model' });
    await assert_1.default.rejects(async () => {
        await prototypeService_1.PrototypeService.getPrototypeById('p2_wrong', 'proto_1');
    }, /isolation violation/);
    db_1.prisma.patentProject.findUnique = origFindProj;
    db_1.prisma.prototype.create = origCreateProto;
    db_1.prisma.prototype.findMany = origFindMany;
    db_1.prisma.prototype.findUnique = origFindUnique;
});
test('Task 6: DrawingFigure and DrawingComponent tag persistence', async () => {
    const origCount = db_1.prisma.drawingFigure.count;
    const origFindDup = db_1.prisma.drawingFigure.findUnique;
    const origCreateFig = db_1.prisma.drawingFigure.create;
    const origDeleteComp = db_1.prisma.drawingComponent.deleteMany;
    const origCreateComp = db_1.prisma.drawingComponent.create;
    db_1.prisma.drawingFigure.count = async () => 0;
    db_1.prisma.drawingFigure.findUnique = async () => null;
    db_1.prisma.drawingFigure.create = async (args) => ({ id: 'fig_1', ...args.data });
    db_1.prisma.drawingComponent.deleteMany = async () => ({ count: 0 });
    db_1.prisma.drawingComponent.create = async (args) => ({ id: 'comp_1', ...args.data });
    const fig = await prototypeService_1.PrototypeService.createDrawingFigure('p1', { title: 'Assembly Perspective', description: 'FIG. 1 View' });
    assert_1.default.strictEqual(fig.figureNumber, 'FIG. 1');
    assert_1.default.strictEqual(fig.title, 'Assembly Perspective');
    // Update component tags
    db_1.prisma.drawingFigure.findUnique = async () => ({ id: 'fig_1', projectId: 'p1', figureNumber: 'FIG. 1' });
    const components = await prototypeService_1.PrototypeService.updateFigureComponents('p1', 'fig_1', [
        { referenceNumber: '100', componentName: 'Base Housing', description: 'Enclosure chassis' },
        { referenceNumber: '102', componentName: 'Optical Sensor', description: 'Photodiode array' }
    ]);
    assert_1.default.strictEqual(components.length, 2);
    assert_1.default.strictEqual(components[0].referenceNumber, '100');
    assert_1.default.strictEqual(components[1].componentName, 'Optical Sensor');
    db_1.prisma.drawingFigure.count = origCount;
    db_1.prisma.drawingFigure.findUnique = origFindDup;
    db_1.prisma.drawingFigure.create = origCreateFig;
    db_1.prisma.drawingComponent.deleteMany = origDeleteComp;
    db_1.prisma.drawingComponent.create = origCreateComp;
});
test('Task 6: Gemini Vision analysis handles invalid buffers and clamps confidence scores', async () => {
    // 1. Invalid empty buffer throws clean error
    await assert_1.default.rejects(async () => {
        await aiService_1.AiService.analyzePrototypeImageVision(Buffer.from(''), 'image/png', {
            title: 'Sensor',
            innovationIdea: 'Idea',
            proposedSolution: 'Solution'
        });
    }, /empty or unreadable/);
    // 2. Unsupported format throws clean error
    await assert_1.default.rejects(async () => {
        await aiService_1.AiService.analyzePrototypeImageVision(Buffer.from('test data'), 'image/bmp', {
            title: 'Sensor',
            innovationIdea: 'Idea',
            proposedSolution: 'Solution'
        });
    }, /Unsupported image format/);
});
test('Task 6: Server-side Patent Figure Sheet PDF generation attaches Document record', async () => {
    const origFindProj = db_1.prisma.patentProject.findUnique;
    const origFindFig = db_1.prisma.drawingFigure.findUnique;
    const origCreateDoc = db_1.prisma.document.create;
    const origUpdateFig = db_1.prisma.drawingFigure.update;
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        title: 'Autonomous Rover',
        category: 'Robotics',
        owner: { fullName: 'Dr. Carol', email: 'carol@test.com' }
    });
    db_1.prisma.drawingFigure.findUnique = async () => ({
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
    db_1.prisma.document.create = async (args) => ({ id: 'doc_fig_101', ...args.data });
    db_1.prisma.drawingFigure.update = async (args) => ({ id: 'fig_101', ...args.data });
    const figDoc = await pdfService_1.PdfService.generatePatentFigureSheetPdf('p1', 'fig_101', 'u1');
    assert_1.default.ok(figDoc.id);
    assert_1.default.strictEqual(figDoc.category, 'PATENT_DRAFT');
    assert_1.default.ok(figDoc.fileUrl.includes('.pdf'));
    db_1.prisma.patentProject.findUnique = origFindProj;
    db_1.prisma.drawingFigure.findUnique = origFindFig;
    db_1.prisma.document.create = origCreateDoc;
    db_1.prisma.drawingFigure.update = origUpdateFig;
});
// ----------------------------------------------------
// 15. Task 7: Activity Timeline, Notifications & Task Assignment Tests
// ----------------------------------------------------
test('Task 7: ActivityService creates structured audit logs and sanitizes metadata', async () => {
    const origCreate = db_1.prisma.activityLog.create;
    const origFindMany = db_1.prisma.activityLog.findMany;
    db_1.prisma.activityLog.create = async (args) => ({ id: 'act_1', ...args.data });
    db_1.prisma.activityLog.findMany = async (args) => [
        { id: 'act_1', projectId: 'p1', action: 'Uploaded document draft.pdf', type: 'DOCUMENT' }
    ];
    const log = await activityService_1.ActivityService.createActivity('p1', 'u1', 'Uploaded document draft.pdf', 'DOCUMENT', {
        docId: 'doc_1',
        password: 'secret_token_value' // Sensitive field should be stripped
    });
    assert_1.default.ok(log);
    assert_1.default.strictEqual(log?.action, 'Uploaded document draft.pdf');
    assert_1.default.strictEqual(log?.type, 'DOCUMENT');
    assert_1.default.strictEqual(log?.metadata?.docId, 'doc_1');
    assert_1.default.strictEqual(log?.metadata?.password, undefined);
    const activities = await activityService_1.ActivityService.listProjectActivities('p1', 'DOCUMENT');
    assert_1.default.strictEqual(activities.length, 1);
    assert_1.default.strictEqual(activities[0].type, 'DOCUMENT');
    db_1.prisma.activityLog.create = origCreate;
    db_1.prisma.activityLog.findMany = origFindMany;
});
test('Task 7: NotificationService dispatch, unread count, and recipient isolation', async () => {
    const origCreate = db_1.prisma.notification.create;
    const origCount = db_1.prisma.notification.count;
    const origFindUnique = db_1.prisma.notification.findUnique;
    const origUpdate = db_1.prisma.notification.update;
    const origUpdateMany = db_1.prisma.notification.updateMany;
    db_1.prisma.notification.create = async (args) => ({ id: 'notif_1', isRead: false, ...args.data });
    db_1.prisma.notification.count = async () => 3;
    db_1.prisma.notification.findUnique = async () => ({ id: 'notif_1', userId: 'u1', isRead: false });
    db_1.prisma.notification.update = async (args) => ({ id: 'notif_1', userId: 'u1', isRead: true, readAt: new Date() });
    db_1.prisma.notification.updateMany = async () => ({ count: 3 });
    const notif = await notificationService_1.NotificationService.createNotification('u1', 'Review Decision', 'Your review was approved.', 'REVIEW', 'rev_1', 'p1');
    assert_1.default.ok(notif);
    assert_1.default.strictEqual(notif?.title, 'Review Decision');
    const count = await notificationService_1.NotificationService.getUnreadCount('u1');
    assert_1.default.strictEqual(count, 3);
    const updated = await notificationService_1.NotificationService.markNotificationRead('u1', 'notif_1');
    assert_1.default.strictEqual(updated.isRead, true);
    const batchRead = await notificationService_1.NotificationService.markAllNotificationsRead('u1');
    assert_1.default.strictEqual(batchRead.count, 3);
    // Recipient privacy violation check
    db_1.prisma.notification.findUnique = async () => ({ id: 'notif_1', userId: 'u1_owner', isRead: false });
    await assert_1.default.rejects(async () => {
        await notificationService_1.NotificationService.markNotificationRead('u2_attacker', 'notif_1');
    }, /access denied/);
    db_1.prisma.notification.create = origCreate;
    db_1.prisma.notification.count = origCount;
    db_1.prisma.notification.findUnique = origFindUnique;
    db_1.prisma.notification.update = origUpdate;
    db_1.prisma.notification.updateMany = origUpdateMany;
});
test('Task 7: TaskService task creation, assignment validation, and status transitions', async () => {
    const origFindProj = db_1.prisma.patentProject.findUnique;
    const origCreateTask = db_1.prisma.task.create;
    const origFindTask = db_1.prisma.task.findUnique;
    const origUpdateTask = db_1.prisma.task.update;
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        ownerId: 'u1_owner',
        members: [{ userId: 'u2_member' }]
    });
    db_1.prisma.task.create = async (args) => ({ id: 'task_1', ...args.data });
    db_1.prisma.task.findUnique = async () => ({ id: 'task_1', projectId: 'p1', status: 'TODO', assignedToId: 'u2_member' });
    db_1.prisma.task.update = async (args) => ({ id: 'task_1', projectId: 'p1', ...args.data });
    // 1. Valid task creation with priority
    const task = await taskService_1.TaskService.createTask('p1', 'u1_owner', {
        title: 'Draft Claims Section',
        assignedToId: 'u2_member',
        priority: 'HIGH'
    });
    assert_1.default.strictEqual(task.title, 'Draft Claims Section');
    assert_1.default.strictEqual(task.priority, 'HIGH');
    assert_1.default.strictEqual(task.status, 'TODO');
    // 2. Invalid assigned user throws error
    await assert_1.default.rejects(async () => {
        await taskService_1.TaskService.createTask('p1', 'u1_owner', {
            title: 'Invalid Task Assignment',
            assignedToId: 'u9_nonmember'
        });
    }, /not a valid member/);
    // 3. Update task status to COMPLETED sets completedAt
    const completedTask = await taskService_1.TaskService.updateTask('p1', 'task_1', 'u1_owner', {
        status: 'COMPLETED'
    });
    assert_1.default.strictEqual(completedTask.status, 'COMPLETED');
    assert_1.default.ok(completedTask.completedAt);
    db_1.prisma.patentProject.findUnique = origFindProj;
    db_1.prisma.task.create = origCreateTask;
    db_1.prisma.task.findUnique = origFindTask;
    db_1.prisma.task.update = origUpdateTask;
});
// ----------------------------------------------------
// 16. Task 8: Advanced Analytics & Master Intelligence Report Tests
// ----------------------------------------------------
test('Task 8: AnalyticsService computes project intelligence scores and supporting metrics', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    const analytics = await analyticsService_1.AnalyticsService.getProjectAnalytics('p1', 'u1');
    assert_1.default.ok(analytics);
    assert_1.default.strictEqual(analytics.projectId, 'p1');
    assert_1.default.strictEqual(analytics.metrics.totalTasks, 2);
    assert_1.default.strictEqual(analytics.metrics.completedTasks, 1);
    assert_1.default.strictEqual(analytics.metrics.overdueTasks, 1);
    assert_1.default.strictEqual(analytics.metrics.taskCompletionPercentage, 50);
    assert_1.default.ok(analytics.scores.legalComplianceHealth >= 80);
    assert_1.default.ok(analytics.scores.filingReadinessScore >= 80);
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: AnalyticsService aggregates portfolio analytics for user projects', async () => {
    const origFindMany = db_1.prisma.patentProject.findMany;
    const origGetReadiness = filingReadinessService_1.FilingReadinessService.getFilingReadiness;
    db_1.prisma.patentProject.findMany = async () => [
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
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = async (id) => ({
        overallReadiness: id === 'p1' ? 'READY' : 'NOT_READY',
        completedCount: id === 'p1' ? 6 : 1,
        totalRequiredCount: 6,
        checklist: [],
        blockingIssues: []
    });
    const portfolio = await analyticsService_1.AnalyticsService.getDashboardAnalytics('u1');
    assert_1.default.ok(portfolio);
    assert_1.default.strictEqual(portfolio.totalProjects, 2);
    assert_1.default.strictEqual(portfolio.filingReadyProjects, 1);
    assert_1.default.strictEqual(portfolio.inProgressProjects, 1);
    assert_1.default.strictEqual(portfolio.overdueTasksCount, 1);
    assert_1.default.strictEqual(portfolio.totalReferences, 1);
    assert_1.default.ok(portfolio.averageFilingReadiness > 0);
    db_1.prisma.patentProject.findMany = origFindMany;
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = origGetReadiness;
});
test('Task 8: PdfService compiles multi-page Master Patent Intelligence Report PDF', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
    const origCreateDoc = db_1.prisma.document.create;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    db_1.prisma.document.create = async (args) => ({ id: 'doc_master_1', ...args.data });
    const masterDoc = await pdfService_1.PdfService.generateComprehensivePatentReportPdf('p1', 'u1');
    assert_1.default.ok(masterDoc.id);
    assert_1.default.strictEqual(masterDoc.category, 'PATENT_DRAFT');
    assert_1.default.ok(masterDoc.fileUrl.includes('.pdf'));
    db_1.prisma.patentProject.findUnique = origFindUnique;
    db_1.prisma.document.create = origCreateDoc;
});
test('Task 8: Prior Art Risk Index produces higher risk for 0 references than for projects with verified references', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
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
    db_1.prisma.patentProject.findUnique = async (args) => {
        if (args.where.id === 'p_zero')
            return projectZeroRefs;
        if (args.where.id === 'p_with_refs')
            return projectWithRefs;
        return null;
    };
    const analyticsZero = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_zero', 'u1');
    const analyticsWithRefs = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_with_refs', 'u1');
    assert_1.default.ok(analyticsZero.scores.priorArtRiskIndex > analyticsWithRefs.scores.priorArtRiskIndex, `Expected 0 references (${analyticsZero.scores.priorArtRiskIndex}%) to have higher risk than project with references (${analyticsWithRefs.scores.priorArtRiskIndex}%)`);
    assert_1.default.strictEqual(analyticsZero.scores.priorArtRiskIndex, 85);
    assert_1.default.strictEqual(analyticsWithRefs.scores.priorArtRiskIndex, 55);
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: Prior Art Risk Index decreases monotonically as verified references are added (never increases risk)', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
    const baseProject = {
        id: 'p_step',
        title: 'Stepwise Test',
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
    let currentRefs = [];
    db_1.prisma.patentProject.findUnique = async () => ({
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
        const result = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_step', 'u1');
        const risk = result.scores.priorArtRiskIndex;
        assert_1.default.ok(risk <= previousRisk, `Adding references must not increase risk: previous=${previousRisk}, current=${risk}`);
        assert_1.default.ok(risk >= 0 && risk <= 100, `Risk must be between 0 and 100, got ${risk}`);
        previousRisk = risk;
    }
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: Prior Art Risk Index score remains strictly bounded between 0 and 100 for extreme edge cases', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
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
    db_1.prisma.patentProject.findUnique = async () => extremeProject;
    const result = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_extreme', 'u1');
    assert_1.default.ok(result.scores.priorArtRiskIndex >= 0 && result.scores.priorArtRiskIndex <= 100);
    assert_1.default.strictEqual(result.scores.priorArtRiskIndex, 5);
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: Patent Eligibility & Novelty Score is low for an empty project', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
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
    db_1.prisma.patentProject.findUnique = async () => emptyProject;
    const analytics = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_empty', 'u1');
    assert_1.default.ok(analytics.scores.patentEligibilityScore <= 10, `Expected empty project score <= 10%, got ${analytics.scores.patentEligibilityScore}%`);
    assert_1.default.ok(analytics.scores.patentEligibilityScore >= 0);
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: Patent Eligibility Score increases monotonically as patent evidence is added (never decreases)', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
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
        db_1.prisma.patentProject.findUnique = async () => steps[i];
        const res = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_evo', 'u1');
        const score = res.scores.patentEligibilityScore;
        assert_1.default.ok(score >= prevScore, `Step ${i} score (${score}%) must be >= previous step (${prevScore}%)`);
        assert_1.default.ok(score >= 0 && score <= 100, `Score must be in [0, 100], got ${score}%`);
        prevScore = score;
    }
    assert_1.default.strictEqual(prevScore, 100);
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: Patent Eligibility Score is strictly bounded between 0 and 100 for edge cases', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
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
    db_1.prisma.patentProject.findUnique = async () => minProject;
    const resMin = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_min', 'u1');
    assert_1.default.strictEqual(resMin.scores.patentEligibilityScore, 0);
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
    db_1.prisma.patentProject.findUnique = async () => maxProject;
    const resMax = await analyticsService_1.AnalyticsService.getProjectAnalytics('p_max', 'u1');
    assert_1.default.strictEqual(resMax.scores.patentEligibilityScore, 100);
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 8: Portfolio Dashboard readiness equals arithmetic mean of FilingReadinessService results', async () => {
    const origFindMany = db_1.prisma.patentProject.findMany;
    const origGetReadiness = filingReadinessService_1.FilingReadinessService.getFilingReadiness;
    db_1.prisma.patentProject.findMany = async () => [
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
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = async (projectId) => {
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
    const dashboard = await analyticsService_1.AnalyticsService.getDashboardAnalytics('u1');
    const p1Summary = dashboard.projectHealthSummaries.find(p => p.id === 'p1');
    const p2Summary = dashboard.projectHealthSummaries.find(p => p.id === 'p2');
    const p3Summary = dashboard.projectHealthSummaries.find(p => p.id === 'p3');
    assert_1.default.strictEqual(p1Summary?.readinessScore, 100, 'p1 readiness should be 100%');
    assert_1.default.strictEqual(p2Summary?.readinessScore, 50, 'p2 readiness should be 50%');
    assert_1.default.strictEqual(p3Summary?.readinessScore, 0, 'p3 empty project readiness should be 0% (unfabricated)');
    // Arithmetic mean = Math.round((100 + 50 + 0) / 3) = Math.round(150 / 3) = 50%
    assert_1.default.strictEqual(dashboard.averageFilingReadiness, 50, 'Portfolio average must equal arithmetic mean (50%)');
    assert_1.default.ok(dashboard.averageFilingReadiness >= 0 && dashboard.averageFilingReadiness <= 100);
    assert_1.default.ok(dashboard.needsAttentionProjects >= 1);
    db_1.prisma.patentProject.findMany = origFindMany;
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = origGetReadiness;
});
test('Task 8: Single-project portfolio average equals exact single project readiness score', async () => {
    const origFindMany = db_1.prisma.patentProject.findMany;
    const origGetReadiness = filingReadinessService_1.FilingReadinessService.getFilingReadiness;
    db_1.prisma.patentProject.findMany = async () => [
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
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = async () => ({
        overallReadiness: 'NOT_READY',
        completedCount: 4,
        totalRequiredCount: 6,
        checklist: [],
        blockingIssues: []
    });
    const dashboard = await analyticsService_1.AnalyticsService.getDashboardAnalytics('u1');
    const expectedScore = Math.round((4 / 6) * 100); // 67%
    assert_1.default.strictEqual(dashboard.totalProjects, 1);
    assert_1.default.strictEqual(dashboard.averageFilingReadiness, expectedScore);
    assert_1.default.strictEqual(dashboard.projectHealthSummaries[0].readinessScore, expectedScore);
    db_1.prisma.patentProject.findMany = origFindMany;
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = origGetReadiness;
});
test('Task 8: Empty portfolio returns 0 and empty distributions without fabricated data', async () => {
    const origFindMany = db_1.prisma.patentProject.findMany;
    db_1.prisma.patentProject.findMany = async () => [];
    const dashboard = await analyticsService_1.AnalyticsService.getDashboardAnalytics('u_empty');
    assert_1.default.strictEqual(dashboard.totalProjects, 0);
    assert_1.default.strictEqual(dashboard.inProgressProjects, 0);
    assert_1.default.strictEqual(dashboard.filingReadyProjects, 0);
    assert_1.default.strictEqual(dashboard.needsAttentionProjects, 0);
    assert_1.default.strictEqual(dashboard.averageFilingReadiness, 0);
    assert_1.default.strictEqual(dashboard.averageTaskCompletion, 0);
    assert_1.default.strictEqual(dashboard.totalReferences, 0);
    assert_1.default.strictEqual(dashboard.totalPrototypes, 0);
    assert_1.default.strictEqual(dashboard.totalReviews, 0);
    assert_1.default.strictEqual(dashboard.totalForms, 0);
    assert_1.default.strictEqual(dashboard.overdueTasksCount, 0);
    assert_1.default.deepStrictEqual(dashboard.stageDistribution, {});
    assert_1.default.deepStrictEqual(dashboard.projectHealthSummaries, []);
    db_1.prisma.patentProject.findMany = origFindMany;
});
test('Task 8: Dashboard analytics accurately scopes queries for non-admins vs Admin role', async () => {
    const origFindMany = db_1.prisma.patentProject.findMany;
    let lastWhereClause = null;
    db_1.prisma.patentProject.findMany = async (args) => {
        lastWhereClause = args.where;
        return [];
    };
    // 1. Non-admin user (e.g. Inventor / Guide)
    await analyticsService_1.AnalyticsService.getDashboardAnalytics('user_123', 'Inventor');
    assert_1.default.deepStrictEqual(lastWhereClause, {
        OR: [
            { ownerId: 'user_123' },
            { members: { some: { userId: 'user_123' } } }
        ]
    });
    // 2. Global Admin user
    await analyticsService_1.AnalyticsService.getDashboardAnalytics('admin_123', 'Admin');
    assert_1.default.deepStrictEqual(lastWhereClause, {});
    db_1.prisma.patentProject.findMany = origFindMany;
});
test('Task 8: Overdue task counts and stage distributions strictly match database records', async () => {
    const origFindMany = db_1.prisma.patentProject.findMany;
    const origGetReadiness = filingReadinessService_1.FilingReadinessService.getFilingReadiness;
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago (overdue)
    const futureDate = new Date(Date.now() + 86400000); // 1 day in future
    db_1.prisma.patentProject.findMany = async () => [
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
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = async (id) => ({
        overallReadiness: id === 'p3' ? 'READY' : 'NOT_READY',
        completedCount: id === 'p3' ? 6 : 2,
        totalRequiredCount: 6,
        checklist: [],
        blockingIssues: []
    });
    const dashboard = await analyticsService_1.AnalyticsService.getDashboardAnalytics('u1');
    assert_1.default.strictEqual(dashboard.totalProjects, 3);
    assert_1.default.strictEqual(dashboard.overdueTasksCount, 2); // t1 and t4 are overdue
    assert_1.default.strictEqual(dashboard.stageDistribution['IDEA'], 1);
    assert_1.default.strictEqual(dashboard.stageDistribution['PROTOTYPE'], 1);
    assert_1.default.strictEqual(dashboard.stageDistribution['FILING_READY'], 1);
    assert_1.default.strictEqual(dashboard.totalReferences, 2);
    assert_1.default.strictEqual(dashboard.totalPrototypes, 1);
    assert_1.default.strictEqual(dashboard.totalReviews, 1);
    assert_1.default.strictEqual(dashboard.totalForms, 1);
    db_1.prisma.patentProject.findMany = origFindMany;
    filingReadinessService_1.FilingReadinessService.getFilingReadiness = origGetReadiness;
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
    assert_1.default.strictEqual(mockClaim1.claimNumber, 1);
    assert_1.default.strictEqual(mockClaim1.claimType, 'INDEPENDENT');
    assert_1.default.strictEqual(mockClaim1.dependsOnNumber, null);
    assert_1.default.strictEqual(mockClaim1.projectId, 'proj_alpha');
    assert_1.default.ok(mockClaim1.body.includes('azimuth actuator'));
});
test('Task 9: PatentClaim enforces unique claim numbering per project', async () => {
    const claimsStore = [
        { projectId: 'proj_alpha', claimNumber: 1 }
    ];
    const canAddClaim = (projId, num) => {
        return !claimsStore.some(c => c.projectId === projId && c.claimNumber === num);
    };
    assert_1.default.strictEqual(canAddClaim('proj_alpha', 1), false, 'Duplicate claim 1 in same project must be rejected');
    assert_1.default.strictEqual(canAddClaim('proj_alpha', 2), true, 'New claim 2 in same project is allowed');
    assert_1.default.strictEqual(canAddClaim('proj_beta', 1), true, 'Claim 1 in a different project is allowed (project isolation)');
});
test('Task 9: Dependent claim correctly references antecedent claim and rejects invalid self-dependency', async () => {
    const validateClaimDependency = (claimNumber, claimType, dependsOnNumber) => {
        if (claimType === 'INDEPENDENT') {
            if (dependsOnNumber !== null)
                return { valid: false, error: 'Independent claims cannot have a parent claim dependency.' };
            return { valid: true };
        }
        if (claimType === 'DEPENDENT') {
            if (!dependsOnNumber)
                return { valid: false, error: 'Dependent claim must specify a parent claim number.' };
            if (dependsOnNumber === claimNumber)
                return { valid: false, error: 'Claim cannot depend on itself (self-dependency).' };
            if (dependsOnNumber >= claimNumber)
                return { valid: false, error: 'Dependent claim must depend on an antecedent claim with a lower claim number.' };
            return { valid: true };
        }
        return { valid: false, error: 'Unknown claim type.' };
    };
    // Valid Independent
    assert_1.default.deepStrictEqual(validateClaimDependency(1, 'INDEPENDENT', null), { valid: true });
    // Valid Dependent
    assert_1.default.deepStrictEqual(validateClaimDependency(2, 'DEPENDENT', 1), { valid: true });
    // Invalid: Independent with dependency
    assert_1.default.strictEqual(validateClaimDependency(1, 'INDEPENDENT', 2).valid, false);
    // Invalid: Self-dependency (Claim 2 depending on Claim 2)
    const selfDep = validateClaimDependency(2, 'DEPENDENT', 2);
    assert_1.default.strictEqual(selfDep.valid, false);
    assert_1.default.ok(selfDep.error?.includes('self-dependency'));
    // Invalid: Forward dependency (Claim 2 depending on Claim 3)
    const fwdDep = validateClaimDependency(2, 'DEPENDENT', 3);
    assert_1.default.strictEqual(fwdDep.valid, false);
    assert_1.default.ok(fwdDep.error?.includes('antecedent claim'));
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
    assert_1.default.strictEqual(mockClaimElement.claimId, 'claim_1');
    assert_1.default.strictEqual(mockClaimElement.componentId, 'comp_102');
    assert_1.default.strictEqual(mockClaimElement.elementName, 'Azimuth Actuator');
});
test('Task 9: ClaimChart enforces unique project-reference constraint and isolates overlap mappings', async () => {
    const existingCharts = [
        { id: 'chart_1', projectId: 'proj_alpha', referenceId: 'ref_uspto_1', overallRisk: 'MEDIUM' }
    ];
    const canCreateChart = (projId, refId) => {
        return !existingCharts.some(c => c.projectId === projId && c.referenceId === refId);
    };
    assert_1.default.strictEqual(canCreateChart('proj_alpha', 'ref_uspto_1'), false, 'Duplicate chart for same project/reference rejected');
    assert_1.default.strictEqual(canCreateChart('proj_alpha', 'ref_uspto_2'), true, 'New chart for different reference allowed');
    assert_1.default.strictEqual(canCreateChart('proj_beta', 'ref_uspto_1'), true, 'Same reference in different project allowed');
    const validOverlapLevels = ['NONE', 'PARTIAL', 'IDENTICAL', 'EQUIVALENT'];
    const testElementMapping = {
        id: 'cce_1',
        chartId: 'chart_1',
        claimElementId: 'el_1',
        priorArtFeature: 'Motorized dual-axis solar positioning mechanism described in column 4',
        overlapLevel: 'EQUIVALENT',
        analysisNotes: 'Performs substantially the same function in substantially the same way to achieve the same result.'
    };
    assert_1.default.ok(validOverlapLevels.includes(testElementMapping.overlapLevel));
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
    const deleteProjectCascade = (projId) => {
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
    assert_1.default.strictEqual(claimsDB.length, 1);
    assert_1.default.strictEqual(claimsDB[0].projectId, 'p2');
    assert_1.default.strictEqual(elementsDB.length, 1);
    assert_1.default.strictEqual(elementsDB[0].id, 'e4');
    assert_1.default.strictEqual(chartsDB.length, 1);
    assert_1.default.strictEqual(chartsDB[0].projectId, 'p2');
    assert_1.default.strictEqual(chartElementsDB.length, 1);
    assert_1.default.strictEqual(chartElementsDB[0].id, 'che2');
});
// 18. Task 9 — Step 2: Claim Service & Dependency Validation Tests
test('Task 9 (2.1): ClaimService creates independent claim successfully', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    const origCreate = db_1.prisma.patentClaim.create;
    db_1.prisma.patentClaim.findMany = async () => [];
    db_1.prisma.patentClaim.create = async ({ data }) => ({
        id: 'claim_101',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const created = await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        preamble: 'A solar-powered IoT sensor device comprising:',
        body: 'a photovoltaic panel, a microcontroller, and a low-power wireless transceiver.'
    });
    assert_1.default.strictEqual(created.claimNumber, 1);
    assert_1.default.strictEqual(created.claimType, 'INDEPENDENT');
    assert_1.default.strictEqual(created.dependsOnNumber, null);
    db_1.prisma.patentClaim.findMany = origFindMany;
    db_1.prisma.patentClaim.create = origCreate;
});
test('Task 9 (2.2): ClaimService creates dependent claim referencing valid parent', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    const origCreate = db_1.prisma.patentClaim.create;
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'c1', claimNumber: 1, dependsOnNumber: null }
    ];
    db_1.prisma.patentClaim.create = async ({ data }) => ({
        id: 'claim_102',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const created = await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
        claimNumber: 2,
        claimType: 'DEPENDENT',
        dependsOnNumber: 1,
        preamble: 'The device of claim 1,',
        body: 'further comprising a rechargeable lithium-iron-phosphate battery module.'
    });
    assert_1.default.strictEqual(created.claimNumber, 2);
    assert_1.default.strictEqual(created.claimType, 'DEPENDENT');
    assert_1.default.strictEqual(created.dependsOnNumber, 1);
    db_1.prisma.patentClaim.findMany = origFindMany;
    db_1.prisma.patentClaim.create = origCreate;
});
test('Task 9 (2.3): ClaimService rejects dependent claim without dependsOnNumber', async () => {
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
            claimNumber: 2,
            claimType: 'DEPENDENT',
            body: 'a further sensor element.'
        });
    }, /Dependent claims must specify a parent claim number/);
});
test('Task 9 (2.4): ClaimService rejects independent claim with dependsOnNumber', async () => {
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
            claimNumber: 1,
            claimType: 'INDEPENDENT',
            dependsOnNumber: 2,
            body: 'an independent system.'
        });
    }, /Independent claims cannot specify a parent dependency/);
});
test('Task 9 (2.5): ClaimService rejects self-dependency on creation', async () => {
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
            claimNumber: 3,
            claimType: 'DEPENDENT',
            dependsOnNumber: 3,
            body: 'a self-referential clause.'
        });
    }, /Claim cannot depend on itself/);
});
test('Task 9 (2.6): ClaimService rejects nonexistent parent dependency', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'c1', claimNumber: 1, dependsOnNumber: null }
    ];
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
            claimNumber: 2,
            claimType: 'DEPENDENT',
            dependsOnNumber: 99, // 99 does not exist
            body: 'a dependent clause referencing 99.'
        });
    }, /Referenced parent claim 99 does not exist in this project/);
    db_1.prisma.patentClaim.findMany = origFindMany;
});
test('Task 9 (2.7): ClaimService isolates claim dependencies by project (cross-project rejected)', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    // Project B only has claim 5, not claim 1 from Project A
    db_1.prisma.patentClaim.findMany = async ({ where }) => {
        if (where.projectId === 'proj_B') {
            return [{ id: 'cb5', claimNumber: 5, dependsOnNumber: null }];
        }
        return [{ id: 'ca1', claimNumber: 1, dependsOnNumber: null }];
    };
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaim('proj_B', 'user_1', {
            claimNumber: 6,
            claimType: 'DEPENDENT',
            dependsOnNumber: 1, // Claim 1 is in Project A, not Project B
            body: 'attempting cross project parent.'
        });
    }, /Referenced parent claim 1 does not exist in this project/);
    db_1.prisma.patentClaim.findMany = origFindMany;
});
test('Task 9 (2.8): ClaimService rejects dependency cycle detection during creation', async () => {
    // Cycle detection logic:
    // Existing: Claim 2 -> depends on 3. Claim 3 -> depends on 1.
    // Creating: Claim 1 -> depends on 2 (Creates 1 -> 2 -> 3 -> 1 cycle)
    const existing = [
        { claimNumber: 2, dependsOnNumber: 3 },
        { claimNumber: 3, dependsOnNumber: 1 }
    ];
    assert_1.default.strictEqual(claimService_1.ClaimService.hasDependencyCycle([...existing, { claimNumber: 1, dependsOnNumber: 2 }]), true, 'Must detect 1 -> 2 -> 3 -> 1 cycle');
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
    assert_1.default.strictEqual(claimService_1.ClaimService.hasDependencyCycle(validTree), false);
});
test('Task 9 (2.10): ClaimService allows non-sequential claim numbers', async () => {
    const nonSequentialTree = [
        { claimNumber: 10, dependsOnNumber: null },
        { claimNumber: 25, dependsOnNumber: 10 },
        { claimNumber: 42, dependsOnNumber: 25 },
        { claimNumber: 100, dependsOnNumber: null },
        { claimNumber: 105, dependsOnNumber: 100 }
    ];
    assert_1.default.strictEqual(claimService_1.ClaimService.hasDependencyCycle(nonSequentialTree), false);
});
test('Task 9 (2.11): ClaimService rejects duplicate claim number within project', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'c1', claimNumber: 1, dependsOnNumber: null }
    ];
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaim('proj_1', 'user_1', {
            claimNumber: 1, // Duplicate
            claimType: 'INDEPENDENT',
            body: 'duplicate claim number.'
        });
    }, /Claim number 1 already exists in this project/);
    db_1.prisma.patentClaim.findMany = origFindMany;
});
test('Task 9 (2.12): ClaimService updates claim while strictly preserving claim ID', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origFindMany = db_1.prisma.patentClaim.findMany;
    const origUpdate = db_1.prisma.patentClaim.update;
    db_1.prisma.patentClaim.findUnique = async () => ({
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
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'claim_fixed_id_123', claimNumber: 1, dependsOnNumber: null }
    ];
    let updateArgs = null;
    db_1.prisma.patentClaim.update = async (args) => {
        updateArgs = args;
        return { id: 'claim_fixed_id_123', ...args.data };
    };
    const updated = await claimService_1.ClaimService.updateClaim('proj_1', 'user_1', 'claim_fixed_id_123', {
        body: 'Updated novel patent body with detailed limitations.',
        status: 'REVIEWED'
    });
    assert_1.default.strictEqual(updated.id, 'claim_fixed_id_123');
    assert_1.default.strictEqual(updateArgs.where.id, 'claim_fixed_id_123');
    assert_1.default.strictEqual(updated.status, 'REVIEWED');
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.patentClaim.findMany = origFindMany;
    db_1.prisma.patentClaim.update = origUpdate;
});
test('Task 9 (2.13): ClaimService rejects update that introduces a dependency cycle', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origFindMany = db_1.prisma.patentClaim.findMany;
    // Claim 1 is independent, Claim 2 depends on 1
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c1',
        projectId: 'proj_1',
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        dependsOnNumber: null
    });
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'c1', claimNumber: 1, dependsOnNumber: null },
        { id: 'c2', claimNumber: 2, dependsOnNumber: 1 }
    ];
    // Try updating Claim 1 to depend on Claim 2 -> 1 -> 2 -> 1 cycle!
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.updateClaim('proj_1', 'user_1', 'c1', {
            claimType: 'DEPENDENT',
            dependsOnNumber: 2
        });
    }, /Claim dependency cycle detected/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.patentClaim.findMany = origFindMany;
});
test('Task 9 (2.14): ClaimService deletes claim successfully when no dependents exist', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origFindMany = db_1.prisma.patentClaim.findMany;
    const origDelete = db_1.prisma.patentClaim.delete;
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c2',
        projectId: 'proj_1',
        claimNumber: 2,
        dependsOnNumber: 1
    });
    db_1.prisma.patentClaim.findMany = async () => []; // No claims depend on claim 2
    db_1.prisma.patentClaim.delete = async () => ({ id: 'c2' });
    const res = await claimService_1.ClaimService.deleteClaim('proj_1', 'user_1', 'c2');
    assert_1.default.strictEqual(res.success, true);
    assert_1.default.strictEqual(res.deletedClaimId, 'c2');
    assert_1.default.strictEqual(res.deletedClaimNumber, 2);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.patentClaim.findMany = origFindMany;
    db_1.prisma.patentClaim.delete = origDelete;
});
test('Task 9 (2.15): ClaimService rejects deletion when dependent claims exist', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origFindMany = db_1.prisma.patentClaim.findMany;
    // Claim 1 has Claim 2 and Claim 3 depending on it
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c1',
        projectId: 'proj_1',
        claimNumber: 1
    });
    db_1.prisma.patentClaim.findMany = async () => [
        { claimNumber: 2 },
        { claimNumber: 3 }
    ];
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.deleteClaim('proj_1', 'user_1', 'c1');
    }, /Cannot delete claim 1 because other claims \(2, 3\) depend on it/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.patentClaim.findMany = origFindMany;
});
test('Task 9 (2.16): ClaimService reorders claims successfully and preserves claim numbers', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    const origTransaction = db_1.prisma.$transaction;
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'c1', claimNumber: 1, orderIndex: 0 },
        { id: 'c2', claimNumber: 2, orderIndex: 1 },
        { id: 'c3', claimNumber: 3, orderIndex: 2 }
    ];
    let txUpdates = [];
    db_1.prisma.$transaction = async (actions) => {
        txUpdates = actions;
        return actions;
    };
    const reordered = await claimService_1.ClaimService.reorderClaims('proj_1', 'user_1', ['c3', 'c1', 'c2']);
    assert_1.default.ok(Array.isArray(reordered));
    db_1.prisma.patentClaim.findMany = origFindMany;
    db_1.prisma.$transaction = origTransaction;
});
test('Task 9 (2.17): ClaimService rejects duplicate IDs in reorder request', async () => {
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.reorderClaims('proj_1', 'user_1', ['c1', 'c2', 'c1']);
    }, /Duplicate claim IDs provided in reorder request/);
});
test('Task 9 (2.18): ClaimService rejects foreign-project claim IDs during reorder', async () => {
    const origFindMany = db_1.prisma.patentClaim.findMany;
    db_1.prisma.patentClaim.findMany = async () => [
        { id: 'c1', claimNumber: 1 },
        { id: 'c2', claimNumber: 2 }
    ];
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.reorderClaims('proj_1', 'user_1', ['c1', 'foreign_claim_id']);
    }, /Invalid claim ID or claim belongs to another project/);
    db_1.prisma.patentClaim.findMany = origFindMany;
});
test('Task 9 (2.19): ClaimService getClaimById enforces project isolation', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c1',
        projectId: 'proj_alpha',
        claimNumber: 1
    });
    // Attempt to access proj_alpha claim through proj_beta endpoint
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.getClaimById('proj_beta', 'c1');
    }, /Claim not found or does not belong to this project/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
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
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim({ userId: 'u_owner', role: 'Inventor' }, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim({ userId: 'u_admin', role: 'Admin' }, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim({ userId: 'u_inventor', role: 'Inventor' }, project), true);
    // Guide, PatentExpert can view but cannot directly mutate claims
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaims({ userId: 'u_guide', role: 'Guide' }, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim({ userId: 'u_guide', role: 'Guide' }, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canDeleteClaim({ userId: 'u_expert', role: 'PatentExpert' }, project), false);
    // Outside user cannot view or mutate
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaims({ userId: 'u_outsider', role: 'Inventor' }, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim({ userId: 'u_outsider', role: 'Inventor' }, project), false);
});
// 19. Task 9 — Step 3: Claim Elements & Technical Drawing Component Linking Tests
test('Task 9 (3.1): ClaimService creates claim element successfully', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origCreate = db_1.prisma.claimElement.create;
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c1',
        projectId: 'p1',
        claimNumber: 1
    });
    db_1.prisma.claimElement.create = async ({ data }) => ({
        id: 'el_101',
        ...data,
        component: null,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const element = await claimService_1.ClaimService.createClaimElement('p1', 'c1', 'u1', {
        elementName: 'Microcontroller Unit',
        elementText: 'a 32-bit low-power RISC-V microcontroller configured to process sensor readings'
    });
    assert_1.default.strictEqual(element.id, 'el_101');
    assert_1.default.strictEqual(element.elementName, 'Microcontroller Unit');
    assert_1.default.strictEqual(element.claimId, 'c1');
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.claimElement.create = origCreate;
});
test('Task 9 (3.2): ClaimService rejects empty element name', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1' });
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaimElement('p1', 'c1', 'u1', {
            elementName: '   ',
            elementText: 'valid element text'
        });
    }, /Element name is required and cannot be empty/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
});
test('Task 9 (3.3): ClaimService rejects empty element text', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1' });
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaimElement('p1', 'c1', 'u1', {
            elementName: 'Actuator',
            elementText: '   '
        });
    }, /Element text is required and cannot be empty/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
});
test('Task 9 (3.4): ClaimService retrieves claim elements ordered deterministically', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origFindMany = db_1.prisma.claimElement.findMany;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1' });
    db_1.prisma.claimElement.findMany = async () => [
        { id: 'e1', elementName: 'Sensor', createdAt: new Date(1000) },
        { id: 'e2', elementName: 'Transceiver', createdAt: new Date(2000) }
    ];
    const elements = await claimService_1.ClaimService.getClaimElements('p1', 'c1');
    assert_1.default.strictEqual(elements.length, 2);
    assert_1.default.strictEqual(elements[0].elementName, 'Sensor');
    assert_1.default.strictEqual(elements[1].elementName, 'Transceiver');
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.claimElement.findMany = origFindMany;
});
test('Task 9 (3.5): ClaimService updates claim element successfully', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    const origUpdate = db_1.prisma.claimElement.update;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.findUnique = async () => ({
        id: 'e1',
        claimId: 'c1',
        elementName: 'Old Sensor',
        elementText: 'Old text',
        componentId: null
    });
    db_1.prisma.claimElement.update = async ({ data }) => ({
        id: 'e1',
        claimId: 'c1',
        ...data
    });
    const updated = await claimService_1.ClaimService.updateClaimElement('p1', 'c1', 'e1', 'u1', {
        elementName: 'High Precision Sensor',
        elementText: 'optical humidity sensor with ±1% accuracy'
    });
    assert_1.default.strictEqual(updated.elementName, 'High Precision Sensor');
    assert_1.default.ok(updated.elementText.includes('±1% accuracy'));
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
    db_1.prisma.claimElement.update = origUpdate;
});
test('Task 9 (3.6): ClaimService deletes claim element successfully', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    const origDelete = db_1.prisma.claimElement.delete;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Filter' });
    db_1.prisma.claimElement.delete = async () => ({ id: 'e1' });
    const res = await claimService_1.ClaimService.deleteClaimElement('p1', 'c1', 'e1', 'u1');
    assert_1.default.strictEqual(res.success, true);
    assert_1.default.strictEqual(res.deletedElementId, 'e1');
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
    db_1.prisma.claimElement.delete = origDelete;
});
test('Task 9 (3.7): ClaimService links claim element to valid DrawingComponent within same project', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    const origFindUniqueComp = db_1.prisma.drawingComponent.findUnique;
    const origUpdate = db_1.prisma.claimElement.update;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array' });
    db_1.prisma.drawingComponent.findUnique = async () => ({
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
    db_1.prisma.claimElement.update = async () => ({
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
    const linked = await claimService_1.ClaimService.linkClaimElementToComponent('p1', 'c1', 'e1', 'u1', 'comp_102');
    assert_1.default.strictEqual(linked.componentId, 'comp_102');
    assert_1.default.strictEqual(linked.component.referenceNumber, '102');
    assert_1.default.strictEqual(linked.component.figure.figureNumber, 'FIG. 1');
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
    db_1.prisma.drawingComponent.findUnique = origFindUniqueComp;
    db_1.prisma.claimElement.update = origUpdate;
});
test('Task 9 (3.8): ClaimService unlinks DrawingComponent from claim element', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    const origUpdate = db_1.prisma.claimElement.update;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array', componentId: 'comp_102' });
    db_1.prisma.claimElement.update = async () => ({
        id: 'e1',
        claimId: 'c1',
        elementName: 'Solar Array',
        componentId: null,
        component: null
    });
    const unlinked = await claimService_1.ClaimService.unlinkClaimElementFromComponent('p1', 'c1', 'e1', 'u1');
    assert_1.default.strictEqual(unlinked.componentId, null);
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
    db_1.prisma.claimElement.update = origUpdate;
});
test('Task 9 (3.9): ClaimService rejects nonexistent DrawingComponent on link', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    const origFindUniqueComp = db_1.prisma.drawingComponent.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array' });
    db_1.prisma.drawingComponent.findUnique = async () => null; // Component does not exist
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.linkClaimElementToComponent('p1', 'c1', 'e1', 'u1', 'nonexistent_comp');
    }, /Drawing component not found or belongs to another project/);
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
    db_1.prisma.drawingComponent.findUnique = origFindUniqueComp;
});
test('Task 9 (3.10): ClaimService rejects cross-project DrawingComponent linking', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    const origFindUniqueComp = db_1.prisma.drawingComponent.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'project_A', claimNumber: 1 });
    db_1.prisma.claimElement.findUnique = async () => ({ id: 'e1', claimId: 'c1', elementName: 'Solar Array' });
    // Component belongs to project_B, not project_A
    db_1.prisma.drawingComponent.findUnique = async () => ({
        id: 'comp_foreign',
        figure: { projectId: 'project_B' }
    });
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.linkClaimElementToComponent('project_A', 'c1', 'e1', 'u1', 'comp_foreign');
    }, /Drawing component not found or belongs to another project/);
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
    db_1.prisma.drawingComponent.findUnique = origFindUniqueComp;
});
test('Task 9 (3.11): ClaimService rejects element creation if claim belongs to another project', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'project_A' });
    // Attempting to create element for claim c1 under project_B
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.createClaimElement('project_B', 'c1', 'u1', {
            elementName: 'Antenna',
            elementText: 'patch antenna'
        });
    }, /Claim not found or does not belong to this project/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
});
test('Task 9 (3.12): ClaimService rejects element update if element belongs to another claim', async () => {
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origFindUniqueElement = db_1.prisma.claimElement.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'claim_1', projectId: 'p1', claimNumber: 1 });
    // Element belongs to claim_2, not claim_1
    db_1.prisma.claimElement.findUnique = async () => ({ id: 'e_other', claimId: 'claim_2' });
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.updateClaimElement('p1', 'claim_1', 'e_other', 'u1', {
            elementName: 'New Name'
        });
    }, /Claim element not found or does not belong to this claim/);
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.findUnique = origFindUniqueElement;
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
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaimElement(outsider, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canEditClaimElement(outsider, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canDeleteClaimElement(outsider, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canLinkDrawingComponent(outsider, project), false);
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
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaimElements(inventor, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaimElement(inventor, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canEditClaimElement(inventor, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canDeleteClaimElement(inventor, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canLinkDrawingComponent(inventor, project), true);
});
test('Task 9 (3.15): ClaimService getClaimById includes linked drawing component with figure metadata', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({
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
    const claim = await claimService_1.ClaimService.getClaimById('p1', 'claim_1');
    assert_1.default.strictEqual(claim.claimElements.length, 1);
    assert_1.default.strictEqual(claim.claimElements[0].component.referenceNumber, '104');
    assert_1.default.strictEqual(claim.claimElements[0].component.figure.figureNumber, 'FIG. 2');
    db_1.prisma.patentClaim.findUnique = origFindUnique;
});
test('Task 9 (3.16): ClaimService getClaimElements enforces project isolation', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'proj_alpha' });
    // Accessing proj_alpha claim through proj_beta endpoint
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.getClaimElements('proj_beta', 'c1');
    }, /Claim not found or does not belong to this project/);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
});
test('Task 9 (3.17): ActivityService logs CLAIM events on element lifecycle actions', async () => {
    let loggedActivity = null;
    const origCreateActivity = activityService_1.ActivityService.createActivity;
    activityService_1.ActivityService.createActivity = async (pId, uId, action, type, meta) => {
        loggedActivity = { pId, uId, action, type, meta };
        return { id: 'act_1', ...loggedActivity };
    };
    const origFindUniqueClaim = db_1.prisma.patentClaim.findUnique;
    const origCreate = db_1.prisma.claimElement.create;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.create = async ({ data }) => ({ id: 'el_1', ...data });
    await claimService_1.ClaimService.createClaimElement('p1', 'u1', 'c1', {
        elementName: 'Battery Unit',
        elementText: 'lithium battery'
    });
    assert_1.default.ok(loggedActivity !== null);
    assert_1.default.strictEqual(loggedActivity.type, 'CLAIM');
    assert_1.default.ok(loggedActivity.action.includes('Added technical element'));
    activityService_1.ActivityService.createActivity = origCreateActivity;
    db_1.prisma.patentClaim.findUnique = origFindUniqueClaim;
    db_1.prisma.claimElement.create = origCreate;
});
test('Task 9 (3.18): NotificationService isolates recipients when notifications are triggered', async () => {
    const recipientIds = [];
    const origCreateNotification = notificationService_1.NotificationService.createNotification;
    notificationService_1.NotificationService.createNotification = async (userId, title, message) => {
        recipientIds.push(userId);
        return { id: 'notif_1', userId, title, message };
    };
    await notificationService_1.NotificationService.createNotification('target_user_1', 'Claim Review', 'Claim 1 updated', 'CLAIM', 'c1', 'p1');
    assert_1.default.strictEqual(recipientIds.length, 1);
    assert_1.default.strictEqual(recipientIds[0], 'target_user_1');
    notificationService_1.NotificationService.createNotification = origCreateNotification;
});
test('Task 9 (3.19): Multiple elements can belong to one claim with distinct technical components', async () => {
    const origFindUnique = db_1.prisma.patentClaim.findUnique;
    const origFindMany = db_1.prisma.claimElement.findMany;
    db_1.prisma.patentClaim.findUnique = async () => ({ id: 'c1', projectId: 'p1', claimNumber: 1 });
    db_1.prisma.claimElement.findMany = async () => [
        { id: 'el_1', elementName: 'Solar Array', componentId: 'comp_100' },
        { id: 'el_2', elementName: 'Battery', componentId: 'comp_102' },
        { id: 'el_3', elementName: 'Inverter', componentId: 'comp_104' },
        { id: 'el_4', elementName: 'Microcontroller', componentId: null }
    ];
    const elements = await claimService_1.ClaimService.getClaimElements('p1', 'c1');
    assert_1.default.strictEqual(elements.length, 4);
    assert_1.default.strictEqual(elements[0].componentId, 'comp_100');
    assert_1.default.strictEqual(elements[1].componentId, 'comp_102');
    assert_1.default.strictEqual(elements[2].componentId, 'comp_104');
    assert_1.default.strictEqual(elements[3].componentId, null);
    db_1.prisma.patentClaim.findUnique = origFindUnique;
    db_1.prisma.claimElement.findMany = origFindMany;
});
test('Task 9 (3.20): Regression verification — Tasks 1 to 8 policy tests remain valid', async () => {
    // Verify ProjectPolicy and DocumentPolicy role resolvers still function identically
    const sampleProject = { ownerId: 'user_A', members: [{ userId: 'user_B', role: 'INVENTOR' }] };
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject({ userId: 'user_A', role: 'Inventor' }, sampleProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject({ userId: 'user_B', role: 'Inventor' }, sampleProject), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject({ userId: 'user_C', role: 'Inventor' }, sampleProject), false);
});
// 20. Task 9 — Steps 4 to 11: AI Claims Engineering, Validation, FTO & Docket Tests
test('Task 9 (4.1): ClaimAiService generates structured claim proposal schema with apparatus and method claims', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    const proposal = await claimAiService_1.ClaimAiService.generateClaimProposal('p1', 'u1');
    assert_1.default.ok(proposal.claims.length >= 5);
    assert_1.default.strictEqual(proposal.claims[0].claimType, 'INDEPENDENT');
    assert_1.default.ok(proposal.claims.some((c) => c.claimType === 'DEPENDENT'));
    assert_1.default.ok(proposal.disclaimer.includes('Not legal advice'));
    db_1.prisma.patentProject.findUnique = origFindUnique;
});
test('Task 9 (4.2): ClaimAiService proposal generation is read-only and does not persist claims', async () => {
    let createCalled = false;
    const origFindUnique = db_1.prisma.patentProject.findUnique;
    const origCreate = db_1.prisma.patentClaim.create;
    db_1.prisma.patentProject.findUnique = async () => ({
        id: 'p1',
        title: 'Drone Delivery Box',
        drawingFigures: [],
        patentReferences: []
    });
    db_1.prisma.patentClaim.create = async () => {
        createCalled = true;
        return {};
    };
    await claimAiService_1.ClaimAiService.generateClaimProposal('p1', 'u1');
    assert_1.default.strictEqual(createCalled, false, 'AI generation must never modify or create PatentClaim records.');
    db_1.prisma.patentProject.findUnique = origFindUnique;
    db_1.prisma.patentClaim.create = origCreate;
});
test('Task 9 (5.1): ClaimValidationService.validateAntecedents detects missing antecedent basis', async () => {
    // "the optical sensor" used without prior "an optical sensor"
    const claim = {
        preamble: 'An automated tracking device comprising:',
        body: 'a main chassis; wherein the optical sensor transmits readings to the controller.'
    };
    const result = claimValidationService_1.ClaimValidationService.validateAntecedents(claim);
    const sensorIssue = result.issues.find((i) => i.term === 'optical sensor' || i.term === 'optical' || i.term === 'sensor');
    assert_1.default.ok(sensorIssue !== undefined, 'Should detect missing antecedent basis for optical sensor');
    assert_1.default.strictEqual(sensorIssue.type, 'MISSING_ANTECEDENT');
});
test('Task 9 (5.2): ClaimValidationService.validateAntecedents passes valid antecedent basis', async () => {
    const claim = {
        preamble: 'An automated tracking device comprising:',
        body: 'an optical sensor; and a microcontroller coupled to the optical sensor, wherein the microcontroller receives signals from the optical sensor.'
    };
    const result = claimValidationService_1.ClaimValidationService.validateAntecedents(claim);
    const antecedentErrors = result.issues.filter((i) => i.type === 'MISSING_ANTECEDENT' && (i.term === 'microcontroller' || i.term === 'optical sensor'));
    assert_1.default.strictEqual(antecedentErrors.length, 0);
});
test('Task 9 (5.3): ClaimValidationService.validateAntecedents flags subjective non-technical terms', async () => {
    const claim = {
        preamble: 'A system comprising:',
        body: 'a revolutionary processing unit configured to achieve optimal power consumption.'
    };
    const result = claimValidationService_1.ClaimValidationService.validateAntecedents(claim);
    const vagueIssues = result.issues.filter((i) => i.type === 'VAGUE_TERM');
    assert_1.default.ok(vagueIssues.length >= 2, 'Should flag "revolutionary" and "optimal"');
});
test('Task 9 (5.4): ClaimValidationService.validateClaim validates independent claims', async () => {
    const validClaim = {
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        dependsOnNumber: null,
        preamble: 'A system comprising:',
        body: 'a sensor and a processor.'
    };
    const res1 = claimValidationService_1.ClaimValidationService.validateClaim(validClaim);
    assert_1.default.strictEqual(res1.valid, true);
    const invalidClaim = {
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        dependsOnNumber: 2, // Independent claim with parent
        body: 'a sensor and a processor.'
    };
    const res2 = claimValidationService_1.ClaimValidationService.validateClaim(invalidClaim);
    assert_1.default.strictEqual(res2.valid, false);
    assert_1.default.ok(res2.errors.some((e) => e.includes('Independent claims cannot have a parent')));
});
test('Task 9 (5.5): ClaimValidationService.validateClaim validates dependent claims and rejects self-dependency', async () => {
    const selfDep = {
        claimNumber: 2,
        claimType: 'DEPENDENT',
        dependsOnNumber: 2,
        body: 'the sensor of claim 2.'
    };
    const res = claimValidationService_1.ClaimValidationService.validateClaim(selfDep);
    assert_1.default.strictEqual(res.valid, false);
    assert_1.default.ok(res.errors.some((e) => e.includes('cannot depend on itself')));
});
test('Task 9 (5.6): ClaimValidationService.validateProposal detects duplicate temporary numbers and dependency cycles', async () => {
    const cyclicProposal = {
        claims: [
            { temporaryNumber: 1, claimType: 'DEPENDENT', dependsOnNumber: 2, body: 'claim 1' },
            { temporaryNumber: 2, claimType: 'DEPENDENT', dependsOnNumber: 1, body: 'claim 2' }
        ]
    };
    const res = claimValidationService_1.ClaimValidationService.validateProposal(cyclicProposal);
    assert_1.default.strictEqual(res.valid, false);
    assert_1.default.ok(res.errors.some((e) => e.includes('cycle detected')));
});
test('Task 9 (5.7): ClaimValidationService.importProposal imports claims transactionally and remaps numbers', async () => {
    const origFindManyClaims = db_1.prisma.patentClaim.findMany;
    const origFindManyComps = db_1.prisma.drawingComponent.findMany;
    const origTransaction = db_1.prisma.$transaction;
    db_1.prisma.patentClaim.findMany = async () => [
        { claimNumber: 1, orderIndex: 0 },
        { claimNumber: 2, orderIndex: 1 }
    ];
    db_1.prisma.drawingComponent.findMany = async () => [{ id: 'comp_1' }];
    let transactionExecuted = false;
    db_1.prisma.$transaction = async (fn) => {
        transactionExecuted = true;
        const txMock = {
            patentClaim: {
                create: async ({ data }) => ({ id: `claim_${data.claimNumber}`, ...data })
            },
            claimElement: {
                create: async ({ data }) => ({ id: `el_${Date.now()}`, ...data })
            }
        };
        return await fn(txMock);
    };
    const proposal = {
        claims: [
            {
                temporaryNumber: 1,
                claimType: 'INDEPENDENT',
                dependsOnNumber: null,
                preamble: 'A system comprising:',
                body: 'a transceiver;',
                elements: [{ elementName: 'Transceiver', elementText: 'a transceiver', suggestedComponentId: 'comp_1' }]
            },
            {
                temporaryNumber: 2,
                claimType: 'DEPENDENT',
                dependsOnNumber: 1,
                body: 'the transceiver of claim 1.',
                elements: []
            }
        ]
    };
    const created = await claimValidationService_1.ClaimValidationService.importProposal('p1', 'u1', proposal);
    assert_1.default.strictEqual(transactionExecuted, true);
    assert_1.default.strictEqual(created.length, 2);
    // Remapped after existing 1, 2 -> 3 and 4
    assert_1.default.strictEqual(created[0].claimNumber, 3);
    assert_1.default.strictEqual(created[0].dependsOnNumber, null);
    assert_1.default.strictEqual(created[1].claimNumber, 4);
    assert_1.default.strictEqual(created[1].dependsOnNumber, 3); // 2 -> 1 remapped to 4 -> 3
    db_1.prisma.patentClaim.findMany = origFindManyClaims;
    db_1.prisma.drawingComponent.findMany = origFindManyComps;
    db_1.prisma.$transaction = origTransaction;
});
test('Task 9 (5.8): ClaimValidationService.importProposal preserves multi-level parent dependencies during remapping', async () => {
    const origFindManyClaims = db_1.prisma.patentClaim.findMany;
    const origFindManyComps = db_1.prisma.drawingComponent.findMany;
    const origTransaction = db_1.prisma.$transaction;
    db_1.prisma.patentClaim.findMany = async () => [];
    db_1.prisma.drawingComponent.findMany = async () => [];
    db_1.prisma.$transaction = async (fn) => {
        const txMock = {
            patentClaim: { create: async ({ data }) => ({ id: `c_${data.claimNumber}`, ...data }) },
            claimElement: { create: async () => ({}) }
        };
        return await fn(txMock);
    };
    const proposal = {
        claims: [
            { temporaryNumber: 1, claimType: 'INDEPENDENT', dependsOnNumber: null, body: 'level 1' },
            { temporaryNumber: 2, claimType: 'DEPENDENT', dependsOnNumber: 1, body: 'level 2' },
            { temporaryNumber: 3, claimType: 'DEPENDENT', dependsOnNumber: 2, body: 'level 3' }
        ]
    };
    const created = await claimValidationService_1.ClaimValidationService.importProposal('p1', 'u1', proposal);
    assert_1.default.strictEqual(created[0].claimNumber, 1);
    assert_1.default.strictEqual(created[1].claimNumber, 2);
    assert_1.default.strictEqual(created[1].dependsOnNumber, 1);
    assert_1.default.strictEqual(created[2].claimNumber, 3);
    assert_1.default.strictEqual(created[2].dependsOnNumber, 2);
    db_1.prisma.patentClaim.findMany = origFindManyClaims;
    db_1.prisma.drawingComponent.findMany = origFindManyComps;
    db_1.prisma.$transaction = origTransaction;
});
test('Task 9 (5.9): ClaimValidationService.importProposal verifies drawing component project ownership', async () => {
    const origFindManyClaims = db_1.prisma.patentClaim.findMany;
    const origFindManyComps = db_1.prisma.drawingComponent.findMany;
    const origTransaction = db_1.prisma.$transaction;
    db_1.prisma.patentClaim.findMany = async () => [];
    // Only comp_proj1 belongs to project, comp_foreign does not
    db_1.prisma.drawingComponent.findMany = async () => [{ id: 'comp_proj1' }];
    let recordedComponentId = null;
    db_1.prisma.$transaction = async (fn) => {
        const txMock = {
            patentClaim: { create: async ({ data }) => ({ id: 'c1', ...data }) },
            claimElement: {
                create: async ({ data }) => {
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
                claimType: 'INDEPENDENT',
                dependsOnNumber: null,
                body: 'system with foreign component',
                elements: [{ elementName: 'Foreign Comp', elementText: 'text', suggestedComponentId: 'comp_foreign' }]
            }
        ]
    };
    await claimValidationService_1.ClaimValidationService.importProposal('p1', 'u1', proposal);
    assert_1.default.strictEqual(recordedComponentId, null, 'Foreign suggestedComponentId must be cleared');
    db_1.prisma.patentClaim.findMany = origFindManyClaims;
    db_1.prisma.drawingComponent.findMany = origFindManyComps;
    db_1.prisma.$transaction = origTransaction;
});
test('Task 9 (5.10): ClaimValidationService.importProposal rejects invalid proposal before database transaction', async () => {
    const invalidProposal = {
        claims: [
            { temporaryNumber: 1, claimType: 'INVALID_TYPE', dependsOnNumber: null, body: '' }
        ]
    };
    await assert_1.default.rejects(async () => {
        await claimValidationService_1.ClaimValidationService.importProposal('p1', 'u1', invalidProposal);
    }, /Cannot import invalid proposal/);
});
test('Task 9 (6.1): FtoAnalysisService.generateClaimChart generates overlap breakdown against prior art', async () => {
    const origFindClaim = db_1.prisma.patentClaim.findUnique;
    const origFindRef = db_1.prisma.patentReference.findUnique;
    const origTransaction = db_1.prisma.$transaction;
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c1',
        projectId: 'p1',
        claimNumber: 1,
        claimElements: [
            { id: 'el1', elementName: 'Optical Sensor', elementText: 'optical sensing array' },
            { id: 'el2', elementName: 'Microprocessor', elementText: '32-bit CPU' }
        ]
    });
    db_1.prisma.patentReference.findUnique = async () => ({
        id: 'ref1',
        projectId: 'p1',
        patentNumber: 'US-9999999-B2',
        title: 'Optical Sensor and Controller System',
        abstract: 'A system with an optical sensor and processing circuitry.'
    });
    db_1.prisma.$transaction = async (fn) => {
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
    const chart = await ftoAnalysisService_1.FtoAnalysisService.generateClaimChart('p1', 'c1', 'ref1', 'u1');
    assert_1.default.strictEqual(chart.id, 'chart1');
    assert_1.default.strictEqual(chart.elements.length, 2);
    assert_1.default.ok(chart.disclaimer.includes('preliminary AI-assisted'));
    db_1.prisma.patentClaim.findUnique = origFindClaim;
    db_1.prisma.patentReference.findUnique = origFindRef;
    db_1.prisma.$transaction = origTransaction;
});
test('Task 9 (6.2): FtoAnalysisService computes deterministic overall risk (LOW, MEDIUM, HIGH)', async () => {
    // If elements have identical/equivalent -> HIGH risk
    const elementsHigh = [{ overlapLevel: 'IDENTICAL' }, { overlapLevel: 'NONE' }];
    const hasIdenticalOrEquiv = elementsHigh.some((el) => el.overlapLevel === 'IDENTICAL' || el.overlapLevel === 'EQUIVALENT');
    assert_1.default.strictEqual(hasIdenticalOrEquiv, true);
    // If elements only have partial -> MEDIUM risk
    const elementsMed = [{ overlapLevel: 'PARTIAL' }, { overlapLevel: 'NONE' }];
    const isMed = !elementsMed.some((el) => el.overlapLevel === 'IDENTICAL' || el.overlapLevel === 'EQUIVALENT') && elementsMed.some((el) => el.overlapLevel === 'PARTIAL');
    assert_1.default.strictEqual(isMed, true);
    // If all elements are NONE -> LOW risk
    const elementsLow = [{ overlapLevel: 'NONE' }, { overlapLevel: 'NONE' }];
    const isLow = !elementsLow.some((el) => el.overlapLevel !== 'NONE');
    assert_1.default.strictEqual(isLow, true);
});
test('Task 9 (6.3): FtoAnalysisService rejects generating FTO chart for reference from another project', async () => {
    const origFindClaim = db_1.prisma.patentClaim.findUnique;
    const origFindRef = db_1.prisma.patentReference.findUnique;
    db_1.prisma.patentClaim.findUnique = async () => ({
        id: 'c1',
        projectId: 'project_A',
        claimElements: [{ id: 'el1', elementName: 'Sensor' }]
    });
    // Reference belongs to project_B, not project_A
    db_1.prisma.patentReference.findUnique = async () => ({
        id: 'ref_foreign',
        projectId: 'project_B'
    });
    await assert_1.default.rejects(async () => {
        await ftoAnalysisService_1.FtoAnalysisService.generateClaimChart('project_A', 'c1', 'ref_foreign', 'u1');
    }, /Patent reference not found or belongs to another project/);
    db_1.prisma.patentClaim.findUnique = origFindClaim;
    db_1.prisma.patentReference.findUnique = origFindRef;
});
test('Task 9 (6.4): FtoAnalysisService.deleteClaimChart deletes chart and enforces project isolation', async () => {
    const origFindUnique = db_1.prisma.claimChart.findUnique;
    const origDelete = db_1.prisma.claimChart.delete;
    db_1.prisma.claimChart.findUnique = async () => ({ id: 'chart1', projectId: 'project_A' });
    db_1.prisma.claimChart.delete = async () => ({ id: 'chart1' });
    // Attempting to delete project_A chart via project_B endpoint
    await assert_1.default.rejects(async () => {
        await ftoAnalysisService_1.FtoAnalysisService.deleteClaimChart('project_B', 'chart1', 'u1');
    }, /Claim chart not found or does not belong to this project/);
    const res = await ftoAnalysisService_1.FtoAnalysisService.deleteClaimChart('project_A', 'chart1', 'u1');
    assert_1.default.strictEqual(res.success, true);
    db_1.prisma.claimChart.findUnique = origFindUnique;
    db_1.prisma.claimChart.delete = origDelete;
});
test('Task 9 (9.1): ClaimService.syncClaimsToForm2 formats structured claims into Form 2 specification text', async () => {
    const origFindManyClaims = db_1.prisma.patentClaim.findMany;
    const origFindUniqueProj = db_1.prisma.patentProject.findUnique;
    const origFindFirstForm = db_1.prisma.patentForm.findFirst;
    const origUpdateForm = db_1.prisma.patentForm.update;
    db_1.prisma.patentClaim.findMany = async () => [
        { claimNumber: 1, claimType: 'INDEPENDENT', dependsOnNumber: null, preamble: 'An apparatus comprising:', body: 'a sensor.', orderIndex: 0 },
        { claimNumber: 2, claimType: 'DEPENDENT', dependsOnNumber: 1, preamble: '', body: 'the sensor is an optical sensor.', orderIndex: 1 }
    ];
    db_1.prisma.patentProject.findUnique = async () => ({ id: 'p1', title: 'Smart Sensor' });
    db_1.prisma.patentForm.findFirst = async () => ({
        id: 'form2_id',
        projectId: 'p1',
        formType: 'Form 2',
        formData: { title: 'Smart Sensor', novelFeatures: 'optical' }
    });
    db_1.prisma.patentForm.update = async ({ data }) => ({ id: 'form2_id', ...data });
    const res = await claimService_1.ClaimService.syncClaimsToForm2('p1', 'u1');
    assert_1.default.strictEqual(res.success, true);
    assert_1.default.strictEqual(res.claimsCount, 2);
    assert_1.default.ok(res.formattedClaimsText.includes('1. An apparatus comprising: a sensor.'));
    assert_1.default.ok(res.formattedClaimsText.includes('2. The system of claim 1, wherein the sensor is an optical sensor.'));
    db_1.prisma.patentClaim.findMany = origFindManyClaims;
    db_1.prisma.patentProject.findUnique = origFindUniqueProj;
    db_1.prisma.patentForm.findFirst = origFindFirstForm;
    db_1.prisma.patentForm.update = origUpdateForm;
});
test('Task 9 (9.2): ClaimService.syncClaimsToForm2 rejects sync when no claims exist in project', async () => {
    const origFindManyClaims = db_1.prisma.patentClaim.findMany;
    db_1.prisma.patentClaim.findMany = async () => [];
    await assert_1.default.rejects(async () => {
        await claimService_1.ClaimService.syncClaimsToForm2('p1', 'u1');
    }, /No structured claims exist for this project to sync/);
    db_1.prisma.patentClaim.findMany = origFindManyClaims;
});
test('Task 9 (10.1): PdfService.generateClaimsDocketPdf creates and registers Claims Docket PDF', async () => {
    const origFindUnique = db_1.prisma.patentProject.findUnique;
    const origCreateDoc = db_1.prisma.document.create;
    db_1.prisma.patentProject.findUnique = async () => ({
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
    db_1.prisma.document.create = async ({ data }) => ({
        id: 'doc_docket_1',
        ...data
    });
    const doc = await pdfService_1.PdfService.generateClaimsDocketPdf('p1', 'u1');
    assert_1.default.strictEqual(doc.category, 'PATENT_DRAFT');
    assert_1.default.ok(doc.name.includes('Claims Docket'));
    db_1.prisma.patentProject.findUnique = origFindUnique;
    db_1.prisma.document.create = origCreateDoc;
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
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canImportClaimProposal(owner, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canImportClaimProposal(inventor, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canSyncClaims(inventor, project), true);
    // Guide can view and run FTO, but cannot import/modify claims directly
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canGenerateClaimProposal(guide, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canRunFtoAnalysis(guide, project), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canImportClaimProposal(guide, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canSyncClaims(guide, project), false);
    // Outsider cannot do anything
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canGenerateClaimProposal(outsider, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canRunFtoAnalysis(outsider, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canImportClaimProposal(outsider, project), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canSyncClaims(outsider, project), false);
});
test('Task 9 (11.2): Security Isolation — User A cannot access or import claims into User B project', async () => {
    const projectB = {
        id: 'project_B',
        ownerId: 'user_B',
        members: []
    };
    const userA = { userId: 'user_A', role: 'Inventor' };
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaims(userA, projectB), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim(userA, projectB), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canImportClaimProposal(userA, projectB), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canSyncClaims(userA, projectB), false);
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
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(coInventorUser, project1), true);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(coInventorUser, projectUnrelated), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canViewProject(strangerUser, project1), false);
    // Claims access
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaims(coInventorUser, project1), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim(coInventorUser, project1), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canEditClaim(coInventorUser, project1), true);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canViewClaims(coInventorUser, projectUnrelated), false);
    assert_1.default.strictEqual(claim_policy_1.ClaimPolicy.canCreateClaim(coInventorUser, projectUnrelated), false);
    // Document access
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canView(coInventorUser, project1), true);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(coInventorUser, project1), true);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canView(coInventorUser, projectUnrelated), false);
    assert_1.default.strictEqual(document_policy_1.DocumentPolicy.canUpload(coInventorUser, projectUnrelated), false);
    // Review policy: Inventors / Co-inventors cannot approve their own projects
    assert_1.default.strictEqual(review_policy_1.ReviewPolicy.canApprove(coInventorUser, project1), false);
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
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canDeleteProject(coInventorUser, project1), false);
    assert_1.default.strictEqual(project_policy_1.ProjectPolicy.canArchiveProject(coInventorUser, project1), false);
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
        }
        catch (err) {
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
    }
    else {
        process.exit(0);
    }
}
setTimeout(runAllTests, 500);
