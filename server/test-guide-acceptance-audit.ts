import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'patenthub_secret';

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const auditResults: StepResult[] = [];

function recordResult(step: number, name: string, passed: boolean, details?: string, error?: string) {
  auditResults.push({ step, name, passed, details, error });
  if (passed) {
    console.log(`  ✅ [Step ${step}] ${name}: ${details || 'PASSED'}`);
  } else {
    console.error(`  ❌ [Step ${step}] ${name} FAILED: ${error || 'Unknown error'}`);
  }
}

async function runGuideFullAudit() {
  console.log('\n================================================================');
  console.log('🔍 PATENTHUB AI — GUIDE FINAL ACCEPTANCE AUDIT (32 STEPS)');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testPassword = 'Password@123';

  // 1. Roles & Orgs Setup
  const guideRole = await prisma.role.findFirst({ where: { name: 'Guide' } });
  const inventorRole = await prisma.role.findFirst({ where: { name: 'Inventor' } });
  if (!guideRole || !inventorRole) {
    throw new Error('Required roles (Guide, Inventor) not found in DB');
  }

  const orgA = await prisma.organization.create({
    data: {
      name: `Audit Org A ${timestamp}`,
      domain: `orga-${timestamp}.edu`,
      type: 'ACADEMIC_INSTITUTION',
    },
  });

  const orgB = await prisma.organization.create({
    data: {
      name: `Audit Org B ${timestamp}`,
      domain: `orgb-${timestamp}.edu`,
      type: 'RESEARCH_LAB',
    },
  });

  // Guide A (the subject of our audit)
  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  const guideA = await prisma.user.create({
    data: {
      username: `GUIDEA_${timestamp}`.slice(0, 30),
      email: `guide_a_${timestamp}@patenthub.local`,
      password: hashedPassword,
      fullName: 'Dr. Guide Alpha',
      roleId: guideRole.id,
      organizationId: orgA.id,
      isActive: true,
    },
    include: { role: true },
  });

  // Guide B (unrelated guide in Org A)
  const guideB = await prisma.user.create({
    data: {
      username: `GUIDEB_${timestamp}`.slice(0, 30),
      email: `guide_b_${timestamp}@patenthub.local`,
      password: hashedPassword,
      fullName: 'Dr. Guide Beta',
      roleId: guideRole.id,
      organizationId: orgA.id,
      isActive: true,
    },
    include: { role: true },
  });

  // Inventor A (in Org A)
  const inventorA = await prisma.user.create({
    data: {
      username: `INVENTORA_${timestamp}`.slice(0, 30),
      email: `inventor_a_${timestamp}@patenthub.local`,
      password: hashedPassword,
      fullName: 'Student Inventor Alpha',
      roleId: inventorRole.id,
      organizationId: orgA.id,
      isActive: true,
    },
    include: { role: true },
  });

  // Project 1: Assigned to Guide A (Org A)
  const project1 = await prisma.patentProject.create({
    data: {
      title: `Hybrid Nanofluid Solar Evaporator ${timestamp}`,
      category: 'CLEAN_ENERGY',
      technicalDomain: 'Thermal & Renewable Energy Engineering',
      innovationIdea: 'A novel solar desalination technology utilizing plasmonic nanofluids.',
      problemStatement: 'Low photothermal conversion efficiency in high-salinity industrial wastewater desalinators.',
      proposedSolution: 'Plasmonic titanium sub-oxide nanoparticles dispersed in a porous carbon aerogel matrix with micro-channel capillary feed.',
      objectives: 'Achieve >92% solar-to-steam conversion efficiency under 1 sun illumination.',
      novelFeatures: 'Self-regenerating salt-rejecting capillary network with gradient optical absorption.',
      keywords: 'photothermal, nanofluid, solar evaporation, desalination',
      stage: 'GUIDE_REVIEW',
      ownerId: inventorA.id,
      organizationId: orgA.id,
      members: {
        create: [
          { userId: guideA.id, role: 'GUIDE' },
        ],
      },
    },
  });

  // Project 2: Supervised by Guide B (Org A) - Guide A NOT assigned
  const project2 = await prisma.patentProject.create({
    data: {
      title: `Unrelated Project B ${timestamp}`,
      category: 'SOFTWARE_AI',
      technicalDomain: 'Computer Vision',
      innovationIdea: 'Quantized temporal spike tensor network for edge object tracking.',
      problemStatement: 'High latency in edge object tracking.',
      proposedSolution: 'Quantized temporal spike tensor network.',
      stage: 'GUIDE_REVIEW',
      ownerId: inventorA.id,
      organizationId: orgA.id,
      members: {
        create: [
          { userId: guideB.id, role: 'GUIDE' },
        ],
      },
    },
  });

  // Project 3: Unrelated Org B Project - Guide A NOT assigned
  const project3 = await prisma.patentProject.create({
    data: {
      title: `Unrelated Org B Project ${timestamp}`,
      category: 'BIOMEDICAL',
      technicalDomain: 'Medical Devices',
      innovationIdea: 'Continuous enzymatic microneedle biosensor.',
      problemStatement: 'Invasive glucose monitoring challenges.',
      proposedSolution: 'Continuous enzymatic microneedle biosensor.',
      stage: 'GUIDE_REVIEW',
      ownerId: inventorA.id,
      organizationId: orgB.id,
    },
  });

  let guideToken = '';
  let guideHeaders: any = {};
  let taskId = '';

  try {
    // -------------------------------------------------------------
    // Step 1: Guide Authentication
    // -------------------------------------------------------------
    console.log('1. Testing Guide Authentication via API...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: guideA.username,
        password: testPassword,
      }),
    });
    const loginData: any = await loginRes.json();
    if (loginRes.status === 200 && loginData.token) {
      guideToken = loginData.token;
      guideHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guideToken}`,
      };
      recordResult(1, 'Guide Authentication', true, `Token issued for ${guideA.username}`);
    } else {
      recordResult(1, 'Guide Authentication', false, undefined, JSON.stringify(loginData));
      throw new Error('Guide login failed');
    }

    // -------------------------------------------------------------
    // Step 2: No Login OTP (Direct authentication)
    // -------------------------------------------------------------
    console.log('2. Verifying No Login OTP requirement...');
    const hasOtpPrompt = loginData.requiresOtp || loginData.otpSent || loginData.message?.includes('OTP');
    if (!hasOtpPrompt && loginData.token) {
      recordResult(2, 'No Login OTP Verification', true, 'Guide authenticated directly without OTP prompt');
    } else {
      recordResult(2, 'No Login OTP Verification', false, undefined, 'Login unexpectedly requested OTP');
    }

    // -------------------------------------------------------------
    // Step 3: Guide Dashboard & Dynamic DB-Backed Data Flow Verification
    // -------------------------------------------------------------
    console.log('3. Testing Guide Dashboard Analytics & Real DB-Backed Data Flow...');
    const dashRes = await fetch(`${API_URL}/projects/analytics/guide`, { headers: guideHeaders });
    const dashData: any = await dashRes.json();
    const initialSupervisedCount = dashData.kpis?.supervisedProjects;

    // Real DB Data Flow Demonstration:
    // Create a new real project and assign Guide A as a supervisor
    const demoProject = await prisma.patentProject.create({
      data: {
        title: `Real DB Demonstration Project ${timestamp}`,
        category: 'MECHANICAL',
        technicalDomain: 'Fluid Dynamics',
        innovationIdea: 'Demonstrating live PostgreSQL data flow to Guide Dashboard.',
        problemStatement: 'Static dashboard verification.',
        proposedSolution: 'Live DB queries via Prisma.',
        stage: 'GUIDE_REVIEW',
        ownerId: inventorA.id,
        organizationId: orgA.id,
        members: {
          create: [{ userId: guideA.id, role: 'GUIDE' }],
        },
      },
    });

    // Verify dashboard reflects addition
    const dashResAfterAdd = await fetch(`${API_URL}/projects/analytics/guide`, { headers: guideHeaders });
    const dashDataAfterAdd: any = await dashResAfterAdd.json();
    const countAfterAdd = dashDataAfterAdd.kpis?.supervisedProjects;
    const hasDemoInList = dashDataAfterAdd.supervisedProjectsList?.some((p: any) => p.id === demoProject.id);

    // Now remove the real project record
    await prisma.projectMember.deleteMany({ where: { projectId: demoProject.id } });
    await prisma.patentProject.delete({ where: { id: demoProject.id } });

    // Verify dashboard reflects removal
    const dashResAfterRemove = await fetch(`${API_URL}/projects/analytics/guide`, { headers: guideHeaders });
    const dashDataAfterRemove: any = await dashResAfterRemove.json();
    const countAfterRemove = dashDataAfterRemove.kpis?.supervisedProjects;
    const hasDemoAfterRemove = dashDataAfterRemove.supervisedProjectsList?.some((p: any) => p.id === demoProject.id);

    const dataFlowVerified =
      initialSupervisedCount === 1 &&
      countAfterAdd === 2 &&
      hasDemoInList === true &&
      countAfterRemove === 1 &&
      hasDemoAfterRemove === false;

    // Verify GuideDashboard.tsx source code contains no hardcoded production data
    const fs = await import('fs');
    const path = await import('path');
    const guideDashboardCode = fs.readFileSync(
      path.resolve(__dirname, '../client/src/components/dashboard/GuideDashboard.tsx'),
      'utf8'
    );
    const forbiddenPatterns = [
      'Smart Traffic',
      'Athira Biju',
      'fallbackProjects',
      'demoProjects',
      'mockProjects',
      'sampleProjects',
    ];
    const foundForbidden = forbiddenPatterns.filter((pattern) => guideDashboardCode.includes(pattern));

    if (
      dashRes.status === 200 &&
      dashData.kpis &&
      dataFlowVerified &&
      foundForbidden.length === 0
    ) {
      recordResult(
        3,
        'Guide Dashboard Data-Driven Verification',
        true,
        `Initial: ${initialSupervisedCount}, After Add: ${countAfterAdd} (included), After Remove: ${countAfterRemove} (excluded), Source clean: 0 mock patterns`
      );
    } else {
      recordResult(
        3,
        'Guide Dashboard Data-Driven Verification',
        false,
        undefined,
        `Data flow: initial=${initialSupervisedCount}, add=${countAfterAdd}, rem=${countAfterRemove}, forbidden=${foundForbidden.join(', ')}`
      );
    }

    // -------------------------------------------------------------
    // Step 4: Supervised Project Retrieval (Strict Scoping)
    // -------------------------------------------------------------
    console.log('4. Testing Supervised Project Retrieval...');
    const projListRes = await fetch(`${API_URL}/projects`, { headers: guideHeaders });
    const projListData: any = await projListRes.json();
    const retrievedProjectIds = (projListData.projects || []).map((p: any) => p.id);
    const hasProject1 = retrievedProjectIds.includes(project1.id);
    const hasProject2 = retrievedProjectIds.includes(project2.id);
    const hasProject3 = retrievedProjectIds.includes(project3.id);

    if (hasProject1 && !hasProject2 && !hasProject3) {
      recordResult(4, 'Supervised Project Retrieval', true, `Only assigned project retrieved (Project 1 included, Projects 2 & 3 excluded)`);
    } else {
      recordResult(4, 'Supervised Project Retrieval', false, undefined, `Isolation leaked: hasP1=${hasProject1}, hasP2=${hasProject2}, hasP3=${hasProject3}`);
    }

    // -------------------------------------------------------------
    // Step 5: Project Authorization (Assigned project: ALLOW)
    // -------------------------------------------------------------
    console.log('5. Testing Project Authorization on Assigned Project...');
    const p1Res = await fetch(`${API_URL}/projects/${project1.id}`, { headers: guideHeaders });
    const p1Data: any = await p1Res.json();
    if (p1Res.status === 200 && p1Data.project?.id === project1.id) {
      recordResult(5, 'Project Authorization (ALLOW)', true, `Accessed assigned project "${p1Data.project.title}"`);
    } else {
      recordResult(5, 'Project Authorization (ALLOW)', false, undefined, JSON.stringify(p1Data));
    }

    // -------------------------------------------------------------
    // Step 6: Organization Isolation (Unrelated Org Project: DENY)
    // -------------------------------------------------------------
    console.log('6. Testing Organization Isolation on Unrelated Org Project...');
    const p3Res = await fetch(`${API_URL}/projects/${project3.id}`, { headers: guideHeaders });
    if (p3Res.status === 403 || p3Res.status === 404) {
      recordResult(6, 'Organization Isolation (DENY)', true, `Access rejected with HTTP ${p3Res.status}`);
    } else {
      recordResult(6, 'Organization Isolation (DENY)', false, undefined, `Unexpected status: ${p3Res.status}`);
    }

    // -------------------------------------------------------------
    // Step 7: Invention Disclosure Access
    // -------------------------------------------------------------
    console.log('7. Verifying Invention Disclosure Fields...');
    const p = p1Data.project;
    if (
      p &&
      p.title &&
      p.technicalDomain &&
      p.problemStatement &&
      p.proposedSolution &&
      p.novelFeatures &&
      p.keywords &&
      p.category
    ) {
      recordResult(7, 'Invention Disclosure Inspection', true, `Full technical disclosure retrieved`);
    } else {
      recordResult(7, 'Invention Disclosure Inspection', false, undefined, 'Missing required disclosure fields');
    }

    // -------------------------------------------------------------
    // Step 8: Research Access (Viewing references)
    // -------------------------------------------------------------
    console.log('8. Testing Prior-Art References Retrieval...');
    // Seed a reference
    await prisma.patentReference.create({
      data: {
        projectId: project1.id,
        patentNumber: 'US10987654B2',
        title: 'High-Efficiency Photothermal Desalination Apparatus',
        assignee: 'Solartech Solutions Inc.',
      },
    });

    const refRes = await fetch(`${API_URL}/projects/${project1.id}/patents/references`, { headers: guideHeaders });
    const refData: any = await refRes.json();
    if (refRes.status === 200 && Array.isArray(refData.references) && refData.references.length >= 1) {
      recordResult(8, 'Research Access', true, `Retrieved ${refData.references.length} saved patent reference(s)`);
    } else {
      recordResult(8, 'Research Access', false, undefined, JSON.stringify(refData));
    }

    // -------------------------------------------------------------
    // Step 9: Prior-Art Review Rights (Guide is VIEWER, cannot add references)
    // -------------------------------------------------------------
    console.log('9. Verifying Guide Cannot Mutate References...');
    const addRefRes = await fetch(`${API_URL}/projects/${project1.id}/patents/references`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({
        patentNumber: 'US9999999',
        title: 'Unauthorized Guide Reference',
      }),
    });
    if (addRefRes.status === 403) {
      recordResult(9, 'Prior-Art Reviewer Role Boundary', true, 'Reference mutation strictly forbidden for Guide (HTTP 403)');
    } else {
      recordResult(9, 'Prior-Art Reviewer Role Boundary', false, undefined, `Expected 403, received ${addRefRes.status}`);
    }

    // -------------------------------------------------------------
    // Step 10: AI Analysis Access
    // -------------------------------------------------------------
    console.log('10. Testing AI Analysis Access...');
    const aiSimRes = await fetch(`${API_URL}/projects/${project1.id}/ai/similarity`, { headers: guideHeaders });
    if (aiSimRes.status === 200) {
      recordResult(10, 'AI Analysis Access', true, 'AI similarity analysis retrieved successfully');
    } else {
      recordResult(10, 'AI Analysis Access', false, undefined, `Status: ${aiSimRes.status}`);
    }

    // -------------------------------------------------------------
    // Step 11: Claims Review (Inspect claims & elements)
    // -------------------------------------------------------------
    console.log('11. Testing Claims Inspection...');
    const claim1 = await prisma.patentClaim.create({
      data: {
        projectId: project1.id,
        claimNumber: 1,
        claimType: 'INDEPENDENT',
        preamble: 'A solar-driven photothermal evaporation apparatus, comprising:',
        body: 'a porous carbon aerogel receiver; and a gradient capillary feeder disposed beneath the receiver.',
        status: 'DRAFT',
      },
    });

    const claimsRes = await fetch(`${API_URL}/projects/${project1.id}/claims`, { headers: guideHeaders });
    const claimsData: any = await claimsRes.json();
    if (claimsRes.status === 200 && Array.isArray(claimsData.claims) && claimsData.claims.length >= 1) {
      recordResult(11, 'Claims Review Inspection', true, `Retrieved ${claimsData.claims.length} claim(s) including Claim #${claim1.claimNumber}`);
    } else {
      recordResult(11, 'Claims Review Inspection', false, undefined, JSON.stringify(claimsData));
    }

    // -------------------------------------------------------------
    // Step 12: Specification Review
    // -------------------------------------------------------------
    console.log('12. Testing Specification Studio Inspection...');
    const specRes = await fetch(`${API_URL}/projects/${project1.id}/specification`, { headers: guideHeaders });
    const specData: any = await specRes.json();
    if (specRes.status === 200 && specData.completeness && typeof specData.completeness.totalCount === 'number') {
      recordResult(12, 'Specification Review', true, `Spec loaded: completeness=${specData.completeness.percentage}%`);
    } else {
      recordResult(12, 'Specification Review', false, undefined, JSON.stringify(specData));
    }

    // -------------------------------------------------------------
    // Step 13: Specification Version History
    // -------------------------------------------------------------
    console.log('13. Verifying Specification Version History...');
    if (specData.versions && Array.isArray(specData.versions) && specData.versions.length >= 1) {
      recordResult(13, 'Specification Version History', true, `${specData.versions.length} version snapshot(s) available`);
    } else {
      recordResult(13, 'Specification Version History', false, undefined, 'Version history missing');
    }

    // -------------------------------------------------------------
    // Step 14: Version Comparison
    // -------------------------------------------------------------
    console.log('14. Testing Version Comparison Diff...');
    const diffRes = await fetch(`${API_URL}/projects/${project1.id}/specification/compare/1/current`, { headers: guideHeaders });
    const diffData: any = await diffRes.json();
    if (diffRes.status === 200 && (Array.isArray(diffData.differences) || Array.isArray(diffData.diffs) || Array.isArray(diffData.sections))) {
      recordResult(14, 'Specification Version Comparison', true, `Side-by-side section diffs generated (${diffData.differences?.length || 0} sections evaluated)`);
    } else {
      recordResult(14, 'Specification Version Comparison', false, undefined, JSON.stringify(diffData));
    }

    // -------------------------------------------------------------
    // Step 15: Drawing Review
    // -------------------------------------------------------------
    console.log('15. Testing Drawing & Prototype Inspection...');
    await prisma.drawingFigure.create({
      data: {
        projectId: project1.id,
        figureNumber: 'FIG. 1',
        title: 'Schematic cross-section of solar evaporator',
        description: 'Cross-sectional view illustrating the porous carbon aerogel matrix and micro-channel feed.',
      },
    });

    const figRes = await fetch(`${API_URL}/projects/${project1.id}/figures`, { headers: guideHeaders });
    const figData: any = await figRes.json();
    if (figRes.status === 200 && Array.isArray(figData.figures) && figData.figures.length >= 1) {
      recordResult(15, 'Drawing Review Inspection', true, `Retrieved ${figData.figures.length} technical figure(s)`);
    } else {
      recordResult(15, 'Drawing Review Inspection', false, undefined, JSON.stringify(figData));
    }

    // -------------------------------------------------------------
    // Step 16: Task Management (Create & update task)
    // -------------------------------------------------------------
    console.log('16. Testing Guide Task Supervision...');
    const createTaskRes = await fetch(`${API_URL}/projects/${project1.id}/tasks`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({
        title: 'Provide 1-Sun Thermal Efficiency Data',
        description: 'Upload certified laboratory test results measuring steady-state evaporation rates.',
        priority: 'HIGH',
        assignedToId: inventorA.id,
      }),
    });
    const taskData: any = await createTaskRes.json();
    if (createTaskRes.status === 201 && taskData.task?.id) {
      taskId = taskData.task.id;
      recordResult(16, 'Task Supervision Management', true, `Created task "${taskData.task.title}" (${taskId})`);
    } else {
      recordResult(16, 'Task Supervision Management', false, undefined, JSON.stringify(taskData));
    }

    // -------------------------------------------------------------
    // Step 17: Review Comments / Discussion
    // -------------------------------------------------------------
    console.log('17. Testing Review Comments...');
    const commentRes = await fetch(`${API_URL}/projects/${project1.id}/comments`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({
        content: 'Please verify the antecedent basis for "the gradient capillary feeder" in dependent claims.',
      }),
    });
    const commentData: any = await commentRes.json();
    if (commentRes.status === 201 && commentData.comment?.id) {
      recordResult(17, 'Review Discussion Comments', true, `Posted observation comment (${commentData.comment.id})`);
    } else {
      recordResult(17, 'Review Discussion Comments', false, undefined, JSON.stringify(commentData));
    }

    // -------------------------------------------------------------
    // Step 18: Changes Requested Workflow
    // -------------------------------------------------------------
    console.log('18. Testing Guide CHANGES_REQUESTED Decision...');
    const changesRes = await fetch(`${API_URL}/projects/${project1.id}/reviews`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({
        reviewType: 'GUIDE_REVIEW',
        decision: 'CHANGES_REQUESTED',
        comments: 'Please elaborate on the thermal insulation boundaries and complete Form 1, 2, 3, 5 before endorsement.',
      }),
    });
    const changesData: any = await changesRes.json();
    const updatedP1 = await prisma.patentProject.findUnique({ where: { id: project1.id } });
    if (changesRes.status === 201 && updatedP1?.stage === 'DOCUMENTATION') {
      recordResult(18, 'Changes Requested Workflow', true, `Workflow transitioned to ${updatedP1.stage}, review recorded`);
    } else {
      recordResult(18, 'Changes Requested Workflow', false, undefined, `Status: ${changesRes.status}, Stage: ${updatedP1?.stage}`);
    }

    // -------------------------------------------------------------
    // Step 19: Inventor Resubmission
    // -------------------------------------------------------------
    console.log('19. Testing Inventor Resubmission...');
    const inventorHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt.sign({ userId: inventorA.id, username: inventorA.username, role: 'Inventor' }, JWT_SECRET, { expiresIn: '1h' })}`,
    };
    const resubmitRes = await fetch(`${API_URL}/projects/${project1.id}`, {
      method: 'PUT',
      headers: inventorHeaders,
      body: JSON.stringify({ stage: 'GUIDE_REVIEW' }),
    });
    const resubmittedP1 = await prisma.patentProject.findUnique({ where: { id: project1.id } });
    if (resubmitRes.status === 200 && resubmittedP1?.stage === 'GUIDE_REVIEW') {
      recordResult(19, 'Inventor Resubmission', true, `Project stage restored to ${resubmittedP1.stage}`);
    } else {
      recordResult(19, 'Inventor Resubmission', false, undefined, `Stage: ${resubmittedP1?.stage}`);
    }

    // -------------------------------------------------------------
    // Step 20: Guide Approval Workflow
    // -------------------------------------------------------------
    console.log('20. Testing Guide Approval (with mandatory forms)...');
    // Seed mandatory Form 1, 2, 3, 5 documents so approval policy passes
    for (const formNum of ['1', '2', '3', '5']) {
      await prisma.document.create({
        data: {
          projectId: project1.id,
          name: `Form ${formNum} - Official Application Filing Draft.pdf`,
          fileUrl: `https://storage.patenthub.local/forms/form_${formNum}.pdf`,
          category: 'PATENT_FORM',
        },
      });
    }

    const approveRes = await fetch(`${API_URL}/projects/${project1.id}/reviews`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({
        reviewType: 'GUIDE_REVIEW',
        decision: 'APPROVED',
        comments: 'Invention details, prior-art, claims, and statutory forms verified. Endorsed for Patent Expert clearance.',
      }),
    });
    const approveData: any = await approveRes.json();
    if (approveRes.status === 201) {
      recordResult(20, 'Guide Approval Workflow', true, 'Guide approval submitted successfully');
    } else {
      recordResult(20, 'Guide Approval Workflow', false, undefined, JSON.stringify(approveData));
    }

    // -------------------------------------------------------------
    // Step 21: Patent Expert Stage Transition
    // -------------------------------------------------------------
    console.log('21. Verifying Transition to PATENT_EXPERT_REVIEW...');
    const approvedProject = await prisma.patentProject.findUnique({ where: { id: project1.id } });
    if (approvedProject?.stage === 'PATENT_EXPERT_REVIEW') {
      recordResult(21, 'Patent Expert Stage Transition', true, `Stage successfully advanced to ${approvedProject.stage}`);
    } else {
      recordResult(21, 'Patent Expert Stage Transition', false, undefined, `Current stage: ${approvedProject?.stage}`);
    }

    // -------------------------------------------------------------
    // Step 22: Filing Readiness Assessment
    // -------------------------------------------------------------
    console.log('22. Testing Filing Readiness Assessment...');
    const readinessRes = await fetch(`${API_URL}/projects/${project1.id}/filing-assessment`, { headers: guideHeaders });
    const readinessData: any = await readinessRes.json();
    const filingScore = readinessData.overallScore ?? readinessData.readinessScore;
    if (readinessRes.status === 200 && filingScore !== undefined) {
      recordResult(22, 'Filing Readiness Assessment', true, `Score: ${filingScore}%, Issues: ${readinessData.issues?.length || readinessData.blockingIssues?.length || 0}`);
    } else {
      recordResult(22, 'Filing Readiness Assessment', false, undefined, JSON.stringify(readinessData));
    }

    // -------------------------------------------------------------
    // Step 23: Deadline Retrieval (Section 9(1) statutory check)
    // -------------------------------------------------------------
    console.log('23. Testing Statutory Deadline Synchronization...');
    await prisma.filingEvent.create({
      data: {
        projectId: project1.id,
        eventType: 'PROVISIONAL_FILING',
        filingDate: new Date(),
        applicationNumber: 'IN202611009876',
      },
    });

    const deadlineRes = await fetch(`${API_URL}/projects/${project1.id}/deadlines`, { headers: guideHeaders });
    const deadlineData: any = await deadlineRes.json();
    const deadlineList = Array.isArray(deadlineData) ? deadlineData : deadlineData.deadlines;
    if (deadlineRes.status === 200 && Array.isArray(deadlineList) && deadlineList.length >= 1) {
      recordResult(23, 'Statutory Deadline Monitoring', true, `Retrieved ${deadlineList.length} deadline(s) under Section 9(1)`);
    } else {
      recordResult(23, 'Statutory Deadline Monitoring', false, undefined, JSON.stringify(deadlineData));
    }

    // -------------------------------------------------------------
    // Step 24: Notifications Retrieval
    // -------------------------------------------------------------
    console.log('24. Testing Notifications Retrieval...');
    const notifRes = await fetch(`${API_URL}/notifications`, { headers: guideHeaders });
    const notifData: any = await notifRes.json();
    const notifList = Array.isArray(notifData) ? notifData : notifData.notifications;
    if (notifRes.status === 200 && Array.isArray(notifList)) {
      recordResult(24, 'Notifications Retrieval', true, `Retrieved ${notifList.length} notification(s)`);
    } else {
      recordResult(24, 'Notifications Retrieval', false, undefined, JSON.stringify(notifData));
    }

    // -------------------------------------------------------------
    // Step 25: Role-Specific Next Action Engine
    // -------------------------------------------------------------
    console.log('25. Testing Next Action for Guide...');
    const nextActionRes = await fetch(`${API_URL}/projects/${project1.id}/next-action`, { headers: guideHeaders });
    const nextActionData: any = await nextActionRes.json();
    if (nextActionRes.status === 200 && nextActionData.primaryAction) {
      recordResult(25, 'Next Action Engine Integration', true, `Action: "${nextActionData.primaryAction.title}" (${nextActionData.primaryAction.priority})`);
    } else {
      recordResult(25, 'Next Action Engine Integration', false, undefined, JSON.stringify(nextActionData));
    }

    // -------------------------------------------------------------
    // Step 26: Activity / History Timeline
    // -------------------------------------------------------------
    console.log('26. Testing Activity Audit History...');
    const actRes = await fetch(`${API_URL}/projects/${project1.id}/activity`, { headers: guideHeaders });
    const actData: any = await actRes.json();
    if (actRes.status === 200 && Array.isArray(actData.activities) && actData.activities.length >= 1) {
      recordResult(26, 'Activity Audit Trail History', true, `Retrieved ${actData.activities.length} activity audit log(s)`);
    } else {
      recordResult(26, 'Activity Audit Trail History', false, undefined, JSON.stringify(actData));
    }

    // -------------------------------------------------------------
    // Step 27: Team / Collaboration Visibility
    // -------------------------------------------------------------
    console.log('27. Testing Team Member Visibility...');
    const teamRes = await fetch(`${API_URL}/projects/${project1.id}`, { headers: guideHeaders });
    const teamData: any = await teamRes.json();
    const members = teamData.project?.members || [];
    const hasGuideMember = members.some((m: any) => m.userId === guideA.id && m.role === 'GUIDE');
    if (hasGuideMember && teamData.project?.owner?.id === inventorA.id) {
      recordResult(27, 'Team / Collaboration Visibility', true, `Inventor and Guide correctly displayed with roles`);
    } else {
      recordResult(27, 'Team / Collaboration Visibility', false, undefined, 'Team members not properly populated');
    }

    // -------------------------------------------------------------
    // Step 28: Platform Admin Lockout (Anti-Privilege Escalation)
    // -------------------------------------------------------------
    console.log('28. Testing Platform Admin API Lockout...');
    const adminLockoutRes = await fetch(`${API_URL}/admin/users`, { headers: guideHeaders });
    if (adminLockoutRes.status === 403) {
      recordResult(28, 'Platform Admin Lockout', true, 'Access to /api/admin/users strictly forbidden (HTTP 403)');
    } else {
      recordResult(28, 'Platform Admin Lockout', false, undefined, `Expected 403, received ${adminLockoutRes.status}`);
    }

    // -------------------------------------------------------------
    // Step 29: Organization Admin Lockout
    // -------------------------------------------------------------
    console.log('29. Testing Organization Admin API Lockout...');
    const orgAdminRes = await fetch(`${API_URL}/admin/policies`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'ILLEGAL_POLICY', targetRole: 'Guide' }),
    });
    if (orgAdminRes.status === 403) {
      recordResult(29, 'Organization Admin Lockout', true, 'Access to /api/admin/policies strictly forbidden (HTTP 403)');
    } else {
      recordResult(29, 'Organization Admin Lockout', false, undefined, `Expected 403, received ${orgAdminRes.status}`);
    }

    // -------------------------------------------------------------
    // Step 30: Cross-Project Isolation (Guide A -> Unassigned Project 2)
    // -------------------------------------------------------------
    console.log('30. Testing Cross-Project Isolation...');
    const crossProjRes = await fetch(`${API_URL}/projects/${project2.id}`, { headers: guideHeaders });
    if (crossProjRes.status === 403 || crossProjRes.status === 404) {
      recordResult(30, 'Cross-Project Isolation', true, `Unassigned project access denied with HTTP ${crossProjRes.status}`);
    } else {
      recordResult(30, 'Cross-Project Isolation', false, undefined, `Expected 403/404, received ${crossProjRes.status}`);
    }

    // -------------------------------------------------------------
    // Step 31: Sensitive Data Protection
    // -------------------------------------------------------------
    console.log('31. Testing Sensitive Data Protection...');
    const profRes = await fetch(`${API_URL}/auth/profile`, { headers: guideHeaders });
    const profData: any = await profRes.json();
    const profStr = JSON.stringify(profData);
    const leaksPassword = profStr.includes('password') && profData.user?.password !== undefined;
    const leaksOtp = profStr.includes('activationOtp') || profStr.includes('resetOtp');
    if (!leaksPassword && !leaksOtp) {
      recordResult(31, 'Sensitive Data Protection', true, 'No password hashes or OTP secrets leaked in profile');
    } else {
      recordResult(31, 'Sensitive Data Protection', false, undefined, 'Sensitive secrets detected in API response');
    }

    // -------------------------------------------------------------
    // Step 32: Error Handling & Validation
    // -------------------------------------------------------------
    console.log('32. Testing Error Handling on Invalid Input...');
    const notFoundRes = await fetch(`${API_URL}/projects/00000000-0000-0000-0000-000000000000`, { headers: guideHeaders });
    const badReviewRes = await fetch(`${API_URL}/projects/${project1.id}/reviews`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ reviewType: 'INVALID_TYPE' }),
    });
    if ((notFoundRes.status === 404 || notFoundRes.status === 403) && badReviewRes.status === 400) {
      recordResult(32, 'Error Handling & Validation', true, `404 on nonexistent project, 400 on invalid review body`);
    } else {
      recordResult(32, 'Error Handling & Validation', false, undefined, `NotFound: ${notFoundRes.status}, BadBody: ${badReviewRes.status}`);
    }

  } finally {
    // Cleanup temporary test data
    console.log('\n--- Cleaning up temporary test artifacts ---');
    try {
      await prisma.projectReview.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.document.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.drawingFigure.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.patentClaim.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.patentReference.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.task.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.comment.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.activityLog.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.deadline.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.filingEvent.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.specification.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.projectMember.deleteMany({ where: { projectId: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.patentProject.deleteMany({ where: { id: { in: [project1.id, project2.id, project3.id] } } });
      await prisma.notification.deleteMany({ where: { userId: { in: [guideA.id, guideB.id, inventorA.id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [guideA.id, guideB.id, inventorA.id] } } });
      await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr);
    }
  }

  // -------------------------------------------------------------
  // Final Evaluation
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 GUIDE ACCEPTANCE AUDIT RESULTS SUMMARY');
  console.log('================================================================');
  const totalPassed = auditResults.filter((r) => r.passed).length;
  console.log(`Passed: ${totalPassed} / ${auditResults.length}`);

  if (totalPassed === 32) {
    console.log('\n🏆 ALL 32 GUIDE ACCEPTANCE AUDIT STEPS PASSED CLEANLY!\n');
    process.exit(0);
  } else {
    console.error(`\n💥 AUDIT FAILED: ${32 - totalPassed} step(s) failed.\n`);
    process.exit(1);
  }
}

runGuideFullAudit()
  .catch((err) => {
    console.error('Audit execution error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
