import { prisma } from './src/config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { seedRoles } from './src/services/authService';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint: string, options: { method?: string; body?: any; token?: string } = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const status = res.status;
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status, data };
}

async function runMultiTenantPolicyTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING ORGANIZATION MULTI-TENANT & POLICY MANAGEMENT SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  const stamp = Date.now();
  const orgAName = `Amal Jyothi College of Eng ${stamp}`;
  const orgBName = `IIT Bombay Tech Hub ${stamp}`;
  const testPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  let orgA: any = null;
  let orgB: any = null;
  let orgAdminA: any = null;
  let inventorA: any = null;
  let guideA: any = null;
  let patentExpertA: any = null;
  let orgAdminB: any = null;
  let inventorB: any = null;

  let tokenAdminA: string = '';
  let tokenInventorA: string = '';
  let tokenGuideA: string = '';
  let tokenInventorB: string = '';
  let createdPolicyId: string = '';
  let createdAssignmentId: string = '';
  let createdProjectId: string = '';

  try {
    // Step 0: Ensure default roles exist
    await seedRoles();
    const orgAdminRole = await prisma.role.findUnique({ where: { name: 'OrganizationAdmin' } });
    const inventorRole = await prisma.role.findUnique({ where: { name: 'Inventor' } });
    const guideRole = await prisma.role.findUnique({ where: { name: 'Guide' } });
    const expertRole = await prisma.role.findUnique({ where: { name: 'PatentExpert' } });

    assert(!!orgAdminRole, 'Role "OrganizationAdmin" exists in PostgreSQL database');

    // Step 1: Create Organization A and Organization B
    console.log('\n--- 1. Setting up Test Organizations & Users in PostgreSQL ---');
    orgA = await prisma.organization.create({
      data: {
        name: orgAName,
        domain: 'ajce.in',
        type: 'UNIVERSITY',
        contactEmail: `admin_${stamp}@ajce.in`,
        contactNumber: '9876543210',
        address: 'Kanjirappally, Kottayam, Kerala',
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      },
    });

    orgB = await prisma.organization.create({
      data: {
        name: orgBName,
        domain: 'iitb.ac.in',
        type: 'UNIVERSITY',
        contactEmail: `admin_${stamp}@iitb.ac.in`,
        contactNumber: '9876543211',
        address: 'Powai, Mumbai, Maharashtra',
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      },
    });

    assert(!!orgA && !!orgB, 'Organizations A & B created successfully in DB');

    // Create Users under Org A
    orgAdminA = await prisma.user.create({
      data: {
        fullName: `OrgAdmin A ${stamp}`,
        username: `OAD_${stamp}_A`,
        email: `orgadmin_a_${stamp}@ajce.in`,
        password: hashedPassword,
        institution: orgAName,
        accountType: 'ORGANIZATION',
        organizationId: orgA.id,
        roleId: orgAdminRole!.id,
        isActive: true,
      },
      include: { role: true, organization: true },
    });

    inventorA = await prisma.user.create({
      data: {
        fullName: `Inventor A ${stamp}`,
        username: `STU_${stamp}_A`,
        email: `inventor_a_${stamp}@ajce.in`,
        password: hashedPassword,
        institution: orgAName,
        accountType: 'ORGANIZATION',
        organizationId: orgA.id,
        roleId: inventorRole!.id,
        isActive: true,
      },
      include: { role: true, organization: true },
    });

    guideA = await prisma.user.create({
      data: {
        fullName: `Guide A ${stamp}`,
        username: `GDE_${stamp}_A`,
        email: `guide_a_${stamp}@ajce.in`,
        password: hashedPassword,
        institution: orgAName,
        accountType: 'ORGANIZATION',
        organizationId: orgA.id,
        roleId: guideRole!.id,
        isActive: true,
      },
      include: { role: true, organization: true },
    });

    patentExpertA = await prisma.user.create({
      data: {
        fullName: `Expert A ${stamp}`,
        username: `PEX_${stamp}_A`,
        email: `expert_a_${stamp}@ajce.in`,
        password: hashedPassword,
        institution: orgAName,
        accountType: 'ORGANIZATION',
        organizationId: orgA.id,
        roleId: expertRole!.id,
        isActive: true,
      },
      include: { role: true, organization: true },
    });

    // Create Users under Org B
    orgAdminB = await prisma.user.create({
      data: {
        fullName: `OrgAdmin B ${stamp}`,
        username: `OAD_${stamp}_B`,
        email: `orgadmin_b_${stamp}@iitb.ac.in`,
        password: hashedPassword,
        institution: orgBName,
        accountType: 'ORGANIZATION',
        organizationId: orgB.id,
        roleId: orgAdminRole!.id,
        isActive: true,
      },
      include: { role: true, organization: true },
    });

    inventorB = await prisma.user.create({
      data: {
        fullName: `Inventor B ${stamp}`,
        username: `STU_${stamp}_B`,
        email: `inventor_b_${stamp}@iitb.ac.in`,
        password: hashedPassword,
        institution: orgBName,
        accountType: 'ORGANIZATION',
        organizationId: orgB.id,
        roleId: inventorRole!.id,
        isActive: true,
      },
      include: { role: true, organization: true },
    });

    // Step 2: Login and JWT Verification for Org Admin A
    console.log('\n--- 2. Testing Direct Password Login for Organization Admin ---');
    const loginResA = await request('/auth/login', {
      method: 'POST',
      body: {
        emailOrUsername: orgAdminA.username,
        password: testPassword,
      },
    });

    assert(loginResA.status === 200, 'OrgAdmin A login succeeds with HTTP 200');
    assert(!!loginResA.data.token, 'OrgAdmin A receives JWT session token directly');
    tokenAdminA = loginResA.data.token;

    const decodedA = jwt.decode(tokenAdminA) as any;
    assert(decodedA.role === 'OrganizationAdmin', 'JWT role is OrganizationAdmin');
    assert(decodedA.organizationId === orgA.id, 'JWT contains valid organizationId for Org A');

    // Get tokens for other users
    const loginInvA = await request('/auth/login', {
      method: 'POST',
      body: { emailOrUsername: inventorA.username, password: testPassword },
    });
    tokenInventorA = loginInvA.data.token;

    const loginGdeA = await request('/auth/login', {
      method: 'POST',
      body: { emailOrUsername: guideA.username, password: testPassword },
    });
    tokenGuideA = loginGdeA.data.token;

    const loginInvB = await request('/auth/login', {
      method: 'POST',
      body: { emailOrUsername: inventorB.username, password: testPassword },
    });
    tokenInventorB = loginInvB.data.token;

    // Step 3: Organization Admin Dashboard Metrics
    console.log('\n--- 3. Testing Organization Admin Dashboard Metrics (Real PostgreSQL Counts) ---');
    const dashRes = await request(`/organizations/${orgA.id}/dashboard`, {
      token: tokenAdminA,
    });

    assert(dashRes.status === 200, 'Dashboard metrics returned with HTTP 200');
    assert(dashRes.data.metrics.totalInventors === 1, 'Metrics: totalInventors is 1 (Inventor A)');
    assert(dashRes.data.metrics.totalGuides === 1, 'Metrics: totalGuides is 1 (Guide A)');
    assert(dashRes.data.metrics.totalPatentExperts === 1, 'Metrics: totalPatentExperts is 1 (Expert A)');
    assert(dashRes.data.metrics.totalProjects === 0, 'Metrics: totalProjects is initially 0');
    assert(dashRes.data.metrics.activePolicies === 0, 'Metrics: activePolicies is initially 0');

    // Step 4: Organization Users Roster & Isolation
    console.log('\n--- 4. Testing Organization User Isolation & Roster ---');
    const usersRes = await request(`/organizations/${orgA.id}/users`, {
      token: tokenAdminA,
    });

    assert(usersRes.status === 200, 'Users query returned HTTP 200');
    const userIds = usersRes.data.users.map((u: any) => u.id);
    assert(userIds.includes(inventorA.id), 'Org A users includes Inventor A');
    assert(userIds.includes(guideA.id), 'Org A users includes Guide A');
    assert(userIds.includes(patentExpertA.id), 'Org A users includes Patent Expert A');
    assert(!userIds.includes(inventorB.id), 'Org A users strictly excludes Inventor B from Org B');
    assert(!userIds.includes(orgAdminB.id), 'Org A users strictly excludes OrgAdmin B');

    // Step 5: Create Policy in PostgreSQL
    console.log('\n--- 5. Testing Policy Creation in PostgreSQL ---');
    const createPolicyRes = await request(`/organizations/${orgA.id}/policies`, {
      method: 'POST',
      token: tokenAdminA,
      body: {
        name: 'University IP Ownership & Filing Policy 2026',
        description: 'Mandatory guidelines for institutional patent filing and IP revenue sharing.',
        rules: { requireGuideSignoff: true, coApplicantMandatory: true },
        status: 'ACTIVE',
      },
    });

    assert(createPolicyRes.status === 201, 'Policy created with HTTP 201 Created');
    assert(createPolicyRes.data.policy.name === 'University IP Ownership & Filing Policy 2026', 'Policy name matches');
    assert(createPolicyRes.data.policy.organizationId === orgA.id, 'Policy belongs to Org A');
    createdPolicyId = createPolicyRes.data.policy.id;

    // Verify DB record
    const dbPolicy = await prisma.policy.findUnique({ where: { id: createdPolicyId } });
    assert(!!dbPolicy && dbPolicy.status === 'ACTIVE', 'Policy record verified in PostgreSQL database');

    // Step 6: Policy Assignment Logic
    console.log('\n--- 6. Testing Policy Assignment to Real Users ---');
    const assignRes = await request(`/organizations/${orgA.id}/policies/${createdPolicyId}/assign`, {
      method: 'POST',
      token: tokenAdminA,
      body: {
        userIds: [inventorA.id, guideA.id],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    assert(assignRes.status === 200, 'Policy assignment returned HTTP 200');
    assert(assignRes.data.assignedCount === 2, 'Assigned to 2 users (Inventor A and Guide A)');
    createdAssignmentId = assignRes.data.assignments[0].id;

    // Test Duplicate Assignment Prevention
    const duplicateAssignRes = await request(`/organizations/${orgA.id}/policies/${createdPolicyId}/assign`, {
      method: 'POST',
      token: tokenAdminA,
      body: {
        userIds: [inventorA.id],
      },
    });

    assert(duplicateAssignRes.data.assignedCount === 0, 'Duplicate active assignment was safely prevented');

    // Step 7: User Policy Visibility (Inventor & Guide View)
    console.log('\n--- 7. Testing User Policy Visibility (/api/policies/my-policies) ---');
    const myPoliciesInvA = await request('/policies/my-policies', {
      token: tokenInventorA,
    });

    assert(myPoliciesInvA.status === 200, 'Inventor A queries my-policies successfully');
    assert(myPoliciesInvA.data.policies.length === 1, 'Inventor A sees exactly 1 assigned active policy');
    assert(myPoliciesInvA.data.policies[0].policyId === createdPolicyId, 'Policy ID matches created policy');
    assert(myPoliciesInvA.data.policies[0].organizationName === orgAName, 'Organization name matches Org A');

    const myPoliciesGdeA = await request('/policies/my-policies', {
      token: tokenGuideA,
    });
    assert(myPoliciesGdeA.data.policies.length === 1, 'Guide A also sees the assigned active policy');

    const myPoliciesInvB = await request('/policies/my-policies', {
      token: tokenInventorB,
    });
    assert(myPoliciesInvB.data.policies.length === 0, 'Inventor B under Org B sees 0 policies (Full Isolation)');

    // Step 8: Multi-Tenant Data Isolation & Security Restrictions
    console.log('\n--- 8. Testing Multi-Tenant Boundary Security & 403 Rejection ---');
    const crossDash = await request(`/organizations/${orgB.id}/dashboard`, {
      token: tokenAdminA,
    });
    assert(crossDash.status === 403, 'OrgAdmin A accessing Org B dashboard is rejected with HTTP 403 Forbidden');

    const crossUsers = await request(`/organizations/${orgB.id}/users`, {
      token: tokenAdminA,
    });
    assert(crossUsers.status === 403, 'OrgAdmin A accessing Org B users is rejected with HTTP 403 Forbidden');

    const crossAssign = await request(`/organizations/${orgA.id}/policies/${createdPolicyId}/assign`, {
      method: 'POST',
      token: tokenAdminA,
      body: { userIds: [inventorB.id] }, // cross-tenant assignment
    });
    assert(crossAssign.status === 400 || crossAssign.status === 403, 'Cross-tenant user policy assignment is rejected');

    // Step 9: Policy Revocation & History Audit
    console.log('\n--- 9. Testing Policy Revocation & Audit History ---');
    const revokeRes = await request(`/organizations/${orgA.id}/policies/assignments/${createdAssignmentId}`, {
      method: 'DELETE',
      token: tokenAdminA,
    });

    assert(revokeRes.status === 200, 'Policy assignment revocation returns HTTP 200');
    assert(revokeRes.data.assignment.status === 'REVOKED', 'Assignment status transitioned to REVOKED');
    assert(!!revokeRes.data.assignment.revokedAt, 'RevokedAt timestamp recorded');

    // Check Audit History
    const historyRes = await request(`/organizations/${orgA.id}/policies/history`, {
      token: tokenAdminA,
    });

    assert(historyRes.status === 200, 'Policy assignment history query returns HTTP 200');
    assert(historyRes.data.history.length >= 2, 'Audit history contains all created assignment records');
    const revokedRecord = historyRes.data.history.find((h: any) => h.id === createdAssignmentId);
    assert(revokedRecord?.status === 'REVOKED', 'Audit trail shows revoked assignment with revoker details');

    // Step 10: Automatic Project Organization Binding
    console.log('\n--- 10. Testing Automatic Project Organization Binding ---');
    const createProjectRes = await request('/projects', {
      method: 'POST',
      token: tokenInventorA,
      body: {
        title: `Novel Solar Powered IoT Drone ${stamp}`,
        innovationIdea: 'A high-efficiency autonomous solar drone for precision agriculture.',
        problemStatement: 'Existing battery drones have limited flight duration.',
        proposedSolution: 'Integrated ultra-thin solar cells with MPPT converter.',
        technicalDomain: 'Renewable Energy & IoT',
        category: 'Invention',
      },
    });

    assert(createProjectRes.status === 201, 'Project created with HTTP 201');
    createdProjectId = createProjectRes.data.project.id;

    // Verify DB project has organizationId = orgA.id automatically
    const dbProject = await prisma.patentProject.findUnique({ where: { id: createdProjectId } });
    assert(dbProject?.organizationId === orgA.id, 'Project organizationId automatically bound to Org A in PostgreSQL');

    // Check Org Admin A sees this project, but Org Admin B does not
    const orgAProjectsRes = await request(`/organizations/${orgA.id}/projects`, {
      token: tokenAdminA,
    });
    const projIds = orgAProjectsRes.data.projects.map((p: any) => p.id);
    assert(projIds.includes(createdProjectId), 'Org Admin A sees created project in Org A projects list');

  } catch (error: any) {
    console.error('Test execution exception:', error);
    failed++;
  } finally {
    // Cleanup temporary test records
    console.log('\n--- Cleaning up temporary test data from PostgreSQL ---');
    try {
      if (createdProjectId) {
        await prisma.patentProject.deleteMany({ where: { id: createdProjectId } });
      }
      if (orgA?.id) {
        await prisma.policyAssignment.deleteMany({ where: { organizationId: orgA.id } });
        await prisma.policy.deleteMany({ where: { organizationId: orgA.id } });
        await prisma.user.deleteMany({ where: { organizationId: orgA.id } });
        await prisma.organization.deleteMany({ where: { id: orgA.id } });
      }
      if (orgB?.id) {
        await prisma.user.deleteMany({ where: { organizationId: orgB.id } });
        await prisma.organization.deleteMany({ where: { id: orgB.id } });
      }
      console.log('✅ Temporary test data cleaned up successfully');
    } catch (cleanupErr) {
      console.error('Cleanup warning:', cleanupErr);
    }
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiTenantPolicyTests();
