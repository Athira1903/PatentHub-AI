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
    console.log(`  ✅ [Step ${step.toString().padStart(2, '0')}] ${name}: ${details || 'PASSED'}`);
  } else {
    console.error(`  ❌ [Step ${step.toString().padStart(2, '0')}] ${name} FAILED: ${error || 'Unknown error'}`);
  }
}

async function runPatentExpertAcceptanceAudit() {
  console.log('\n================================================================');
  console.log('🔍 PATENTHUB AI — PATENT EXPERT ACCEPTANCE AUDIT (34 STEPS)');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testPassword = 'Password@123';

  // 1. Roles & Orgs Setup
  const expertRole = await prisma.role.findFirst({ where: { name: 'PatentExpert' } });
  const guideRole = await prisma.role.findFirst({ where: { name: 'Guide' } });
  const inventorRole = await prisma.role.findFirst({ where: { name: 'Inventor' } });
  if (!expertRole || !guideRole || !inventorRole) {
    throw new Error('Required roles (PatentExpert, Guide, Inventor) not found in DB');
  }

  const orgA = await prisma.organization.create({
    data: {
      name: `Expert Audit Org A ${timestamp}`,
      domain: `orga-expert-${timestamp}.edu`,
      type: 'ACADEMIC_INSTITUTION',
    },
  });

  const orgB = await prisma.organization.create({
    data: {
      name: `Expert Audit Org B ${timestamp}`,
      domain: `orgb-expert-${timestamp}.edu`,
      type: 'RESEARCH_LAB',
    },
  });

  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Expert A (the subject of our audit)
  const expertA = await prisma.user.create({
    data: {
      username: `EXPERTA_${timestamp}`.slice(0, 30),
      email: `expert_a_${timestamp}@patenthub.local`,
      password: hashedPassword,
      fullName: 'Adv. Arun Patent Expert',
      roleId: expertRole.id,
      organizationId: orgA.id,
      isActive: true,
    },
    include: { role: true },
  });

  // Expert B (unrelated expert in Org A)
  const expertB = await prisma.user.create({
    data: {
      username: `EXPERTB_${timestamp}`.slice(0, 30),
      email: `expert_b_${timestamp}@patenthub.local`,
      password: hashedPassword,
      fullName: 'Adv. Expert Beta',
      roleId: expertRole.id,
      organizationId: orgA.id,
      isActive: true,
    },
    include: { role: true },
  });

  // Guide A
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

  // Inventor A (Org A)
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

  // Inventor B (Org B)
  const inventorB = await prisma.user.create({
    data: {
      username: `INVENTORB_${timestamp}`.slice(0, 30),
      email: `inventor_b_${timestamp}@patenthub.local`,
      password: hashedPassword,
      fullName: 'External Researcher Beta',
      roleId: inventorRole.id,
      organizationId: orgB.id,
      isActive: true,
    },
    include: { role: true },
  });

  // Tokens
  const expertAToken = jwt.sign(
    { userId: expertA.id, username: expertA.username, role: expertA.role.name, organizationId: orgA.id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const expertAHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${expertAToken}`,
  };

  const guideAToken = jwt.sign(
    { userId: guideA.id, username: guideA.username, role: guideA.role.name, organizationId: orgA.id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const guideAHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${guideAToken}`,
  };

  const inventorAToken = jwt.sign(
    { userId: inventorA.id, username: inventorA.username, role: inventorA.role.name, organizationId: orgA.id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const inventorAHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${inventorAToken}`,
  };

  // Create Assigned Project in Org A
  const assignedProject = await prisma.patentProject.create({
    data: {
      title: `Expert Audit Quantum Key Project ${timestamp}`,
      innovationIdea: 'Continuous-variable quantum key distribution system implementing real-time FPGA phase calibration.',
      technicalDomain: 'Quantum Cryptography',
      category: 'COMMUNICATION',
      stage: 'PATENT_EXPERT_REVIEW',
      problemStatement: 'Classical asymmetric encryption vulnerabilities against future Shor algorithm quantum computing attacks.',
      proposedSolution: 'Continuous-variable quantum key distribution with real-time phase error compensation and entangled photon states.',
      objectives: 'Achieve 1 Gbps secure key rate over standard telecommunications single-mode fiber with 99.9% fidelity.',
      novelFeatures: 'Self-calibrating optical phase modulator with FPGA-driven pulse feedback.',
      keywords: 'quantum cryptography, qkd, phase modulation, photonics',
      ownerId: inventorA.id,
      organizationId: orgA.id,
      members: {
        create: [
          { userId: inventorA.id, role: 'INVENTOR', permissionLevel: 'SUBMIT' },
          { userId: guideA.id, role: 'GUIDE', permissionLevel: 'EDIT' },
          { userId: expertA.id, role: 'PATENT_EXPERT', permissionLevel: 'EDIT' },
        ],
      },
      patentClaims: {
        create: [
          {
            claimNumber: 1,
            claimType: 'INDEPENDENT',
            preamble: 'A quantum key distribution system comprising:',
            body: '(a) an entangled photon source configured to generate polarization-entangled photon pairs;\n(b) an optical phase modulator coupled to the source;\n(c) a real-time FPGA feedback controller.',
            status: 'UNDER_REVIEW',
            orderIndex: 0,
            claimElements: {
              create: [
                { elementName: 'Entangled photon source', elementText: 'Source generating polarization-entangled photon pairs at 1550 nm.' },
                { elementName: 'Optical phase modulator', elementText: 'Lithium niobate waveguide modulator operating at 10 GHz bandwidth.' },
                { elementName: 'FPGA feedback controller', elementText: 'Controller executing real-time phase calibration.' }
              ]
            }
          },
          {
            claimNumber: 2,
            claimType: 'DEPENDENT',
            dependsOnNumber: 1,
            preamble: 'The system of claim 1, wherein:',
            body: 'said optical phase modulator comprises dual-drive Mach-Zehnder lithium niobate waveguides.',
            status: 'UNDER_REVIEW',
            orderIndex: 1,
          }
        ],
      },
      specifications: {
        create: {
          title: `Specification for Quantum Key Project ${timestamp}`,
          isCurrent: true,
          version: 1,
          abstract: 'A continuous-variable quantum key distribution system implementing real-time FPGA phase calibration.',
          background: 'Modern cryptographic networks require post-quantum security guarantees against quantum algorithmic attacks.',
          problem: 'Phase drift in optical fiber networks degrades quantum bit error rates.',
          proposedSolution: 'Continuous feedback compensation stabilizes polarization states across standard telecom fiber.',
          summary: 'The invention provides real-time phase compensation in an entangled photon distribution network.',
          detailedDescription: 'FIG. 1 shows the optical schematic. FIG. 2 shows the FPGA control loop with digital signal processing.',
          technicalComponents: 'Laser diode, polarization controller, beam splitter, avalanche photodetectors, FPGA unit.',
          workingPrinciple: 'Entangled photon states are distributed through the channel, while phase errors are corrected via pilot pulses.',
          advantages: 'Eliminates manual optical alignment and achieves continuous error rates below 1.5%.',
          applications: 'Government networks, banking communications, critical infrastructure protection.',
          industrialApplicability: 'Applicable in telecommunication fiber backbones and secure datacenter interconnects.',
          status: 'IN_REVIEW',
          specificationType: 'COMPLETE',
        },
      },
      patentReferences: {
        create: [
          {
            patentNumber: 'US-9876543-B2',
            title: 'Continuous Variable Quantum Cryptography Method',
            abstract: 'A method for continuous variable quantum key distribution using optical modulators and homodyne detection.',
            inventors: 'Alice Smith, Bob Jones',
            assignee: 'Quantum Telecom Corp',
            publishDate: new Date('2022-04-15T00:00:00.000Z'),
            source: 'USPTO'
          }
        ]
      },
      drawingFigures: {
        create: [
          {
            figureNumber: 'FIG. 1',
            title: 'System architecture showing optical distribution network',
            description: 'Optical schematic illustrating CV-QKD transceiver setup.',
            analysisStatus: 'ANALYZED',
          }
        ]
      },
      deadlines: {
        create: [
          {
            deadlineType: 'RESPONSE_TO_FER',
            referenceEvent: 'FER_ISSUED',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now (this week)
            status: 'APPROACHING',
            description: 'Patent Expert Statutory Review Clearance',
          }
        ]
      },
      documents: {
        create: [
          { name: 'Form 1 Application for Patent.pdf', fileUrl: '/uploads/form1.pdf', category: 'SUPPORTING' },
          { name: 'Form 2 Complete Specification.pdf', fileUrl: '/uploads/form2.pdf', category: 'PATENT_DRAFT' },
          { name: 'Form 3 Statement & Undertaking.pdf', fileUrl: '/uploads/form3.pdf', category: 'SUPPORTING' },
          { name: 'Form 5 Declaration as to Inventorship.pdf', fileUrl: '/uploads/form5.pdf', category: 'SUPPORTING' },
        ]
      },
      applicants: {
        create: [
          { name: 'Indian Institute of Quantum Tech', applicantType: 'EDUCATIONAL_INSTITUTE', nationality: 'Indian', address: 'New Delhi, India', email: 'patent@iiqt.ac.in' }
        ]
      },
      inventors: {
        create: [
          { name: 'Student Inventor Alpha', nationality: 'Indian', address: 'Bangalore, India', email: 'student@iiqt.ac.in', isPrimary: true }
        ]
      }
    },
  });

  // Create Unrelated Project in Org A (Expert A is NOT a member)
  const unrelatedProjectOrgA = await prisma.patentProject.create({
    data: {
      title: `Unrelated Org A Project ${timestamp}`,
      innovationIdea: 'Autonomous drone collision avoidance using LiDAR.',
      problemStatement: 'LiDAR range sensors drift in foggy environments.',
      proposedSolution: 'Dual-frequency pulsed LiDAR with active noise cancellation.',
      technicalDomain: 'Robotics & Avionics',
      category: 'COMMUNICATION',
      stage: 'PATENT_EXPERT_REVIEW',
      ownerId: inventorA.id,
      organizationId: orgA.id,
      members: {
        create: [
          { userId: inventorA.id, role: 'INVENTOR', permissionLevel: 'SUBMIT' },
          { userId: expertB.id, role: 'PATENT_EXPERT', permissionLevel: 'EDIT' },
        ],
      },
    },
  });

  // Create Project in Org B (External Org)
  const otherOrgProject = await prisma.patentProject.create({
    data: {
      title: `External Org B Project ${timestamp}`,
      innovationIdea: 'Deep learning based medical image compression.',
      problemStatement: 'High resolution MRI images exceed hospital network transmission limits.',
      proposedSolution: 'Wavelet-transformed autoencoder compression with lossless diagnostic ROI preservation.',
      technicalDomain: 'Biomedical Imaging',
      category: 'COMMUNICATION',
      stage: 'PATENT_EXPERT_REVIEW',
      ownerId: inventorB.id,
      organizationId: orgB.id,
      members: {
        create: [
          { userId: inventorB.id, role: 'INVENTOR', permissionLevel: 'SUBMIT' },
        ],
      },
    },
  });

  try {
    // -------------------------------------------------------------
    // Step 1: Expert Authentication
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Expert Authentication ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: expertA.email,
        password: testPassword,
      }),
    });
    const loginData = (await loginRes.json()) as any;
    const step1Passed = loginRes.status === 200 && Boolean(loginData.token);
    recordResult(1, 'Expert Authentication', step1Passed, `Logged in successfully as ${expertA.fullName}`);

    // -------------------------------------------------------------
    // Step 2: No Login OTP
    // -------------------------------------------------------------
    console.log('\n--- Step 2: No Login OTP ---');
    const step2Passed = loginData.requiresOtp === false || loginData.requiresOtp === undefined;
    recordResult(2, 'No Login OTP', step2Passed, 'Direct JWT issued without secondary OTP prompt');

    // -------------------------------------------------------------
    // Step 3: Expert Dashboard
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Expert Dashboard ---');
    const dashRes = await fetch(`${API_URL}/projects/analytics/expert`, { headers: expertAHeaders });
    const dashData = (await dashRes.json()) as any;
    const kpis = dashData.kpis || {};
    const step3Passed =
      dashRes.status === 200 &&
      typeof kpis.pendingReviews === 'number' &&
      typeof kpis.ftoAnalysis === 'number' &&
      typeof kpis.claimReviews === 'number' &&
      kpis.pendingReviews > 0 &&
      dashData.projects?.length > 0;
    recordResult(3, 'Expert Dashboard', step3Passed, `KPIs: pendingReviews=${kpis.pendingReviews}, ftoAnalysis=${kpis.ftoAnalysis}, claimReviews=${kpis.claimReviews}, projectsCount=${dashData.projects?.length}`);

    // -------------------------------------------------------------
    // Step 4: Assigned Project Access
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Assigned Project Access ---');
    const assignedRes = await fetch(`${API_URL}/projects/${assignedProject.id}`, { headers: expertAHeaders });
    const assignedData = (await assignedRes.json()) as any;
    const step4Passed = assignedRes.status === 200 && assignedData.project?.id === assignedProject.id;
    recordResult(4, 'Assigned Project Access', step4Passed, `Successfully accessed assigned project "${assignedProject.title}"`);

    // -------------------------------------------------------------
    // Step 5: Project Isolation (Deny unrelated project in same org)
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Project Isolation ---');
    const unrelatedRes = await fetch(`${API_URL}/projects/${unrelatedProjectOrgA.id}`, { headers: expertAHeaders });
    const step5Passed = unrelatedRes.status === 403 || unrelatedRes.status === 404;
    recordResult(5, 'Project Isolation', step5Passed, `Unrelated project access denied with HTTP ${unrelatedRes.status}`);

    // -------------------------------------------------------------
    // Step 6: Organization Isolation (Deny project in another org)
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Organization Isolation ---');
    const otherOrgRes = await fetch(`${API_URL}/projects/${otherOrgProject.id}`, { headers: expertAHeaders });
    const step6Passed = otherOrgRes.status === 403 || otherOrgRes.status === 404;
    recordResult(6, 'Organization Isolation', step6Passed, `Cross-organization project access denied with HTTP ${otherOrgRes.status}`);

    // -------------------------------------------------------------
    // Step 7: Invention Review
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Invention Review ---');
    const proj = assignedData.project;
    const step7Passed =
      Boolean(proj.title) &&
      Boolean(proj.problemStatement) &&
      Boolean(proj.proposedSolution) &&
      Boolean(proj.technicalDomain) &&
      Boolean(proj.novelFeatures) &&
      Boolean(proj.objectives);
    recordResult(7, 'Invention Review', step7Passed, `Invention disclosures complete. Domain: ${proj.technicalDomain}`);

    // -------------------------------------------------------------
    // Step 8: Research Review & Technical Similarity
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Research Review & Technical Similarity ---');
    const simRes = await fetch(`${API_URL}/projects/${assignedProject.id}/ai/similarity`, {
      method: 'GET',
      headers: expertAHeaders,
    });
    const simData = (await simRes.json()) as any;
    const step8Passed = simRes.status === 200 && (simData.similarityScore !== undefined || simData.matches !== undefined);
    recordResult(8, 'Research Review & Technical Similarity', step8Passed, `Similarity check returned score: ${simData.similarityScore}%`);

    // -------------------------------------------------------------
    // Step 9: Prior-Art Access
    // -------------------------------------------------------------
    console.log('\n--- Step 9: Prior-Art Access ---');
    const refsRes = await fetch(`${API_URL}/projects/${assignedProject.id}/patents/references`, { headers: expertAHeaders });
    const refsData = (await refsRes.json()) as any;
    const step9Passed = refsRes.status === 200 && Array.isArray(refsData.references) && refsData.references.length > 0;
    recordResult(9, 'Prior-Art Access', step9Passed, `Found ${refsData.references?.length} saved patent references`);

    // -------------------------------------------------------------
    // Step 10: FTO Workflow (Generate Claim Chart, Inspect, and Delete)
    // -------------------------------------------------------------
    console.log('\n--- Step 10: FTO Workflow ---');
    const claim1 = await prisma.patentClaim.findFirst({
      where: { projectId: assignedProject.id, claimNumber: 1 },
      include: { claimElements: true }
    });
    const ref1 = await prisma.patentReference.findFirst({
      where: { projectId: assignedProject.id }
    });

    if (!claim1 || !ref1) {
      throw new Error('Test fixtures missing claim or reference for FTO');
    }

    const ftoGenerateRes = await fetch(`${API_URL}/projects/${assignedProject.id}/claims/${claim1.id}/chart/${ref1.id}`, {
      method: 'POST',
      headers: expertAHeaders,
    });
    const ftoGenData = (await ftoGenerateRes.json()) as any;

    const ftoChartsRes = await fetch(`${API_URL}/projects/${assignedProject.id}/claims/charts`, { headers: expertAHeaders });
    const ftoChartsData = (await ftoChartsRes.json()) as any;

    const dbChart = await prisma.claimChart.findUnique({
      where: { projectId_referenceId: { projectId: assignedProject.id, referenceId: ref1.id } },
      include: { elements: true }
    });

    const step10Passed =
      ftoGenerateRes.status === 200 &&
      ftoChartsRes.status === 200 &&
      Boolean(dbChart) &&
      ['LOW', 'MEDIUM', 'HIGH'].includes(dbChart?.overallRisk || '') &&
      (dbChart?.elements?.length || 0) > 0;
    recordResult(10, 'FTO Workflow', step10Passed, `Generated DB ClaimChart (ID: ${dbChart?.id}) with overallRisk: ${dbChart?.overallRisk} and ${dbChart?.elements?.length} element mappings`);

    // -------------------------------------------------------------
    // Step 11: Claims Review
    // -------------------------------------------------------------
    console.log('\n--- Step 11: Claims Review ---');
    const claimsRes = await fetch(`${API_URL}/projects/${assignedProject.id}/claims`, { headers: expertAHeaders });
    const claimsData = (await claimsRes.json()) as any;
    const step11Passed =
      claimsRes.status === 200 &&
      Array.isArray(claimsData.claims) &&
      claimsData.claims.length >= 2 &&
      claimsData.claims.some((c: any) => c.claimType === 'INDEPENDENT') &&
      claimsData.claims.some((c: any) => c.claimType === 'DEPENDENT');
    recordResult(11, 'Claims Review', step11Passed, `Retrieved ${claimsData.claims?.length} claims (Independent & Dependent hierarchy verified)`);

    // -------------------------------------------------------------
    // Step 12: Claim Engineering Validation
    // -------------------------------------------------------------
    console.log('\n--- Step 12: Claim Engineering Validation ---');
    const valRes = await fetch(`${API_URL}/projects/${assignedProject.id}/claims/validate-antecedents`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({
        preamble: claim1.preamble,
        body: claim1.body
      })
    });
    const valData = (await valRes.json()) as any;
    const step12Passed = valRes.status === 200 && valData.success === true;
    recordResult(12, 'Claim Engineering Validation', step12Passed, `Antecedent validation executed. Valid: ${valData.isValid}`);

    // -------------------------------------------------------------
    // Step 13: Specification Review
    // -------------------------------------------------------------
    console.log('\n--- Step 13: Specification Review ---');
    const specRes = await fetch(`${API_URL}/projects/${assignedProject.id}/specification`, { headers: expertAHeaders });
    const specData = (await specRes.json()) as any;
    const spec = specData.specification || specData;
    const step13Passed =
      specRes.status === 200 &&
      Boolean(spec) &&
      Boolean(spec.abstract) &&
      Boolean(spec.detailedDescription) &&
      Boolean(spec.workingPrinciple);
    recordResult(13, 'Specification Review', step13Passed, `Form 2 Specification inspected. Title: "${spec?.title}"`);

    // -------------------------------------------------------------
    // Step 14: Specification Versions
    // -------------------------------------------------------------
    console.log('\n--- Step 14: Specification Versions ---');
    // Create version snapshot
    await fetch(`${API_URL}/projects/${assignedProject.id}/specification/versions`, {
      method: 'POST',
      headers: inventorAHeaders,
      body: JSON.stringify({ changeSummary: 'Initial specification baseline version' }),
    });

    const versionsRes = await fetch(`${API_URL}/projects/${assignedProject.id}/specification/versions`, { headers: expertAHeaders });
    const versionsData = (await versionsRes.json()) as any;
    const versionsList = Array.isArray(versionsData) ? versionsData : (versionsData.versions || []);
    const step14Passed = versionsRes.status === 200 && Array.isArray(versionsList) && versionsList.length > 0;
    recordResult(14, 'Specification Versions', step14Passed, `Found ${versionsList.length} specification version records`);

    // -------------------------------------------------------------
    // Step 15: Version Comparison
    // -------------------------------------------------------------
    console.log('\n--- Step 15: Version Comparison ---');
    // Create second version snapshot to compare
    const v2Res = await fetch(`${API_URL}/projects/${assignedProject.id}/specification/versions`, {
      method: 'POST',
      headers: inventorAHeaders,
      body: JSON.stringify({ changeSummary: 'Refined FPGA feedback description' }),
    });
    const v2Data = (await v2Res.json()) as any;

    const v1Id = versionsList[0]?.id || '1';
    const v2Id = v2Data.createdVersion?.id || v2Data.version?.id || '2';

    const compareRes = await fetch(`${API_URL}/projects/${assignedProject.id}/specification/compare/${v1Id}/${v2Id}`, {
      headers: expertAHeaders
    });
    const compareData = (await compareRes.json()) as any;
    const step15Passed = compareRes.status === 200 && (Boolean(compareData.differences) || Boolean(compareData.comparison));
    recordResult(15, 'Version Comparison', step15Passed, `Compared specification revisions successfully`);

    // -------------------------------------------------------------
    // Step 16: Drawing Review
    // -------------------------------------------------------------
    console.log('\n--- Step 16: Drawing Review ---');
    const figuresRes = await fetch(`${API_URL}/projects/${assignedProject.id}/figures`, { headers: expertAHeaders });
    const figuresData = (await figuresRes.json()) as any;
    const figures = figuresData.figures || [];
    const step16Passed = figuresRes.status === 200 && figures.length > 0;
    recordResult(16, 'Drawing Review', step16Passed, `Inspected ${figures.length} technical figures (${figures[0]?.figureNumber}: ${figures[0]?.title})`);

    // -------------------------------------------------------------
    // Step 17: Form Review
    // -------------------------------------------------------------
    console.log('\n--- Step 17: Form Review ---');
    const projDocsRes = await fetch(`${API_URL}/projects/${assignedProject.id}`, { headers: expertAHeaders });
    const projDocsData = (await projDocsRes.json()) as any;
    const docs = projDocsData.project?.documents || [];
    const hasForm1 = docs.some((d: any) => d.name.includes('Form 1'));
    const hasForm2 = docs.some((d: any) => d.name.includes('Form 2'));
    const hasForm3 = docs.some((d: any) => d.name.includes('Form 3'));
    const hasForm5 = docs.some((d: any) => d.name.includes('Form 5'));
    const step17Passed = hasForm1 && hasForm2 && hasForm3 && hasForm5;
    recordResult(17, 'Form Review', step17Passed, 'Mandatory Indian Patent forms (Form 1, 2, 3, 5) verified in project dossier');

    // -------------------------------------------------------------
    // Step 18: Filing Readiness
    // -------------------------------------------------------------
    console.log('\n--- Step 18: Filing Readiness ---');
    const readinessRes = await fetch(`${API_URL}/projects/${assignedProject.id}/filing-readiness`, { headers: expertAHeaders });
    const readinessData = (await readinessRes.json()) as any;
    const readiness = readinessData.readiness || readinessData;
    const step18Passed = readinessRes.status === 200 && (readiness.overallReadiness !== undefined || typeof readiness.completedCount === 'number');
    recordResult(18, 'Filing Readiness', step18Passed, `Readiness Status: ${readiness.overallReadiness || 'ASSESSED'} (Completed: ${readiness.completedCount}/${readiness.totalRequiredCount || readiness.totalCount || 6})`);

    // -------------------------------------------------------------
    // Step 19: Changes Requested Workflow
    // -------------------------------------------------------------
    console.log('\n--- Step 19: Changes Requested Workflow ---');
    const reqChangesRes = await fetch(`${API_URL}/projects/${assignedProject.id}/reviews`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({
        reviewType: 'EXPERT_REVIEW',
        decision: 'CHANGES_REQUESTED',
        comments: 'Please narrow claim 1 to explicitly specify the 1550 nm telecommunication wavelength limitation.',
      }),
    });
    const reqChangesData = (await reqChangesRes.json()) as any;
    const updatedProjAfterChanges = await prisma.patentProject.findUnique({ where: { id: assignedProject.id } });
    const step19Passed =
      reqChangesRes.status === 201 &&
      reqChangesData.review?.decision === 'CHANGES_REQUESTED' &&
      updatedProjAfterChanges?.stage === 'DOCUMENTATION';
    recordResult(19, 'Changes Requested Workflow', step19Passed, `Review logged CHANGES_REQUESTED. Project stage reverted to ${updatedProjAfterChanges?.stage}`);

    // -------------------------------------------------------------
    // Step 20: Resubmission & Progression
    // -------------------------------------------------------------
    console.log('\n--- Step 20: Resubmission & Progression ---');
    // Inventor updates and resubmits to GUIDE_REVIEW
    await fetch(`${API_URL}/projects/${assignedProject.id}`, {
      method: 'PUT',
      headers: inventorAHeaders,
      body: JSON.stringify({ stage: 'GUIDE_REVIEW' }),
    });
    // Guide approves to advance project to PATENT_EXPERT_REVIEW
    await fetch(`${API_URL}/projects/${assignedProject.id}/reviews`, {
      method: 'POST',
      headers: guideAHeaders,
      body: JSON.stringify({
        reviewType: 'GUIDE_REVIEW',
        decision: 'APPROVED',
        comments: 'Guide approval granted following inventor revisions.',
      }),
    });
    const projReadyForExpert = await prisma.patentProject.findUnique({ where: { id: assignedProject.id } });
    const step20Passed = projReadyForExpert?.stage === 'PATENT_EXPERT_REVIEW';
    recordResult(20, 'Resubmission & Progression', step20Passed, `Project resubmitted and advanced back to ${projReadyForExpert?.stage}`);

    // -------------------------------------------------------------
    // Step 21: Expert Approval
    // -------------------------------------------------------------
    console.log('\n--- Step 21: Expert Approval ---');
    const expertApproveRes = await fetch(`${API_URL}/projects/${assignedProject.id}/reviews`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({
        reviewType: 'EXPERT_REVIEW',
        decision: 'APPROVED',
        comments: 'Claims scope verified, preliminary FTO overlap addressed, and Form 1-5 clearance certified.',
      }),
    });
    const expertApproveData = (await expertApproveRes.json()) as any;
    const step21Passed = expertApproveRes.status === 201 && expertApproveData.review?.decision === 'APPROVED';
    recordResult(21, 'Expert Approval', step21Passed, `Patent Expert formal review decision APPROVED submitted successfully`);

    // -------------------------------------------------------------
    // Step 22: FILING_READY Transition
    // -------------------------------------------------------------
    console.log('\n--- Step 22: FILING_READY Transition ---');
    const finalProj = await prisma.patentProject.findUnique({ where: { id: assignedProject.id } });
    const step22Passed = finalProj?.stage === 'FILING_READY';
    recordResult(22, 'FILING_READY Transition', step22Passed, `Project stage successfully transitioned in PostgreSQL to ${finalProj?.stage}`);

    // -------------------------------------------------------------
    // Step 23: Deadlines
    // -------------------------------------------------------------
    console.log('\n--- Step 23: Deadlines ---');
    const deadlinesRes = await fetch(`${API_URL}/projects/${assignedProject.id}/deadlines`, { headers: expertAHeaders });
    const deadlinesData = (await deadlinesRes.json()) as any;
    const deadlinesList = Array.isArray(deadlinesData) ? deadlinesData : (deadlinesData.deadlines || []);
    const step23Passed = deadlinesRes.status === 200 && Array.isArray(deadlinesList) && deadlinesList.length > 0;
    recordResult(23, 'Deadlines', step23Passed, `Found ${deadlinesList.length} statutory deadlines for project`);

    // -------------------------------------------------------------
    // Step 24: Tasks Management
    // -------------------------------------------------------------
    console.log('\n--- Step 24: Tasks Management ---');
    const createTaskRes = await fetch(`${API_URL}/projects/${assignedProject.id}/tasks`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({
        title: 'Complete final optical schematic review',
        description: 'Verify FIG. 1 phase modulator callouts against claim 1 limitation (b).',
        priority: 'HIGH'
      })
    });
    const taskData = (await createTaskRes.json()) as any;

    const tasksRes = await fetch(`${API_URL}/projects/${assignedProject.id}/tasks`, { headers: expertAHeaders });
    const tasksListData = (await tasksRes.json()) as any;
    const step24Passed = createTaskRes.status === 201 && tasksRes.status === 200 && tasksListData.tasks?.length > 0;
    recordResult(24, 'Tasks Management', step24Passed, `Expert created task "${taskData.task?.title}". Total project tasks: ${tasksListData.tasks?.length}`);

    // -------------------------------------------------------------
    // Step 25: Notifications
    // -------------------------------------------------------------
    console.log('\n--- Step 25: Notifications ---');
    const notifsRes = await fetch(`${API_URL}/notifications`, { headers: expertAHeaders });
    const notifsData = (await notifsRes.json()) as any;
    const notifsList = Array.isArray(notifsData) ? notifsData : (notifsData.notifications || []);
    const step25Passed = notifsRes.status === 200 && Array.isArray(notifsList);
    recordResult(25, 'Notifications', step25Passed, `Notification feed retrieved successfully (${notifsList.length} items)`);

    // -------------------------------------------------------------
    // Step 26: Next Action Engine
    // -------------------------------------------------------------
    console.log('\n--- Step 26: Next Action Engine ---');
    const nextActionRes = await fetch(`${API_URL}/projects/${assignedProject.id}/next-action`, { headers: expertAHeaders });
    const nextActionData = (await nextActionRes.json()) as any;
    const step26Passed = nextActionRes.status === 200 && Boolean(nextActionData.primaryAction);
    recordResult(26, 'Next Action Engine', step26Passed, `Primary Next Action: "${nextActionData.primaryAction?.title}"`);

    // -------------------------------------------------------------
    // Step 27: Review History
    // -------------------------------------------------------------
    console.log('\n--- Step 27: Review History ---');
    const historyRes = await fetch(`${API_URL}/projects/${assignedProject.id}/reviews`, { headers: expertAHeaders });
    const historyData = (await historyRes.json()) as any;
    const reviewsList = historyData.reviews || [];
    const step27Passed =
      historyRes.status === 200 &&
      reviewsList.length >= 2 &&
      reviewsList.some((r: any) => r.decision === 'CHANGES_REQUESTED') &&
      reviewsList.some((r: any) => r.decision === 'APPROVED');
    recordResult(27, 'Review History', step27Passed, `Review audit trail contains ${reviewsList.length} formal historical decisions with timestamps`);

    // -------------------------------------------------------------
    // Step 28: Comments
    // -------------------------------------------------------------
    console.log('\n--- Step 28: Comments ---');
    const commentRes = await fetch(`${API_URL}/projects/${assignedProject.id}/comments`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({ content: 'Legal examination complete. All claims compliant with Sections 2(1)(j) and 10 of Indian Patent Act.' })
    });
    const commentData = (await commentRes.json()) as any;
    const step28Passed = commentRes.status === 201 && Boolean(commentData.comment?.id);
    recordResult(28, 'Comments', step28Passed, `Expert observation comment persisted with ID: ${commentData.comment?.id}`);

    // -------------------------------------------------------------
    // Step 29: Team Visibility
    // -------------------------------------------------------------
    console.log('\n--- Step 29: Team Visibility ---');
    const teamRes = await fetch(`${API_URL}/projects/${assignedProject.id}`, { headers: expertAHeaders });
    const teamData = (await teamRes.json()) as any;
    const members = teamData.project?.members || [];
    const step29Passed =
      teamRes.status === 200 &&
      members.some((m: any) => m.role === 'INVENTOR') &&
      members.some((m: any) => m.role === 'GUIDE') &&
      members.some((m: any) => m.role === 'PATENT_EXPERT');
    recordResult(29, 'Team Visibility', step29Passed, `Team verified: ${members.length} members (Inventor, Guide, Patent Expert)`);

    // -------------------------------------------------------------
    // Step 30: Platform Admin Lockout
    // -------------------------------------------------------------
    console.log('\n--- Step 30: Platform Admin Lockout ---');
    const adminLockRes = await fetch(`${API_URL}/admin/system/settings`, { headers: expertAHeaders });
    const step30Passed = adminLockRes.status === 403;
    recordResult(30, 'Platform Admin Lockout', step30Passed, `Platform Admin API strictly forbidden for Patent Expert (HTTP ${adminLockRes.status})`);

    // -------------------------------------------------------------
    // Step 31: Organization Admin Lockout
    // -------------------------------------------------------------
    console.log('\n--- Step 31: Organization Admin Lockout ---');
    const orgAdminLockRes = await fetch(`${API_URL}/organizations/${orgA.id}/policies`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({ name: 'Unauthorized Org Policy' }),
    });
    const step31Passed = orgAdminLockRes.status === 403;
    recordResult(31, 'Organization Admin Lockout', step31Passed, `Organization Admin API strictly forbidden for Patent Expert (HTTP ${orgAdminLockRes.status})`);

    // -------------------------------------------------------------
    // Step 32: Cross-Project Isolation
    // -------------------------------------------------------------
    console.log('\n--- Step 32: Cross-Project Isolation ---');
    const crossReviewRes = await fetch(`${API_URL}/projects/${unrelatedProjectOrgA.id}/reviews`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({ reviewType: 'EXPERT_REVIEW', decision: 'APPROVED', comments: 'Unauthorized review attempt' })
    });
    const step32Passed = crossReviewRes.status === 403 || crossReviewRes.status === 404;
    recordResult(32, 'Cross-Project Isolation', step32Passed, `Reviewing unassigned project strictly rejected with HTTP ${crossReviewRes.status}`);

    // -------------------------------------------------------------
    // Step 33: Sensitive-Data Protection
    // -------------------------------------------------------------
    console.log('\n--- Step 33: Sensitive-Data Protection ---');
    const billingLockRes = await fetch(`${API_URL}/admin/subscriptions/stats`, { headers: expertAHeaders });
    const step33Passed = billingLockRes.status === 403;
    recordResult(33, 'Sensitive-Data Protection', step33Passed, `Billing and subscription administration strictly forbidden for Patent Expert (HTTP ${billingLockRes.status})`);

    // -------------------------------------------------------------
    // Step 34: Error Handling & Validation
    // -------------------------------------------------------------
    console.log('\n--- Step 34: Error Handling & Validation ---');
    // Attempt to submit review with invalid decision
    const invalidReviewRes = await fetch(`${API_URL}/projects/${assignedProject.id}/reviews`, {
      method: 'POST',
      headers: expertAHeaders,
      body: JSON.stringify({ reviewType: 'EXPERT_REVIEW', decision: 'INVALID_STATUS' })
    });
    const step34Passed = invalidReviewRes.status === 400 || invalidReviewRes.status === 403;
    recordResult(34, 'Error Handling & Validation', step34Passed, `Invalid review decision rejected with HTTP ${invalidReviewRes.status}`);

  } finally {
    // Clean up test organizations and users
    try {
      await prisma.projectReview.deleteMany({ where: { projectId: { in: [assignedProject.id, unrelatedProjectOrgA.id, otherOrgProject.id] } } });
      await prisma.claimChartElement.deleteMany({ where: { chart: { projectId: assignedProject.id } } });
      await prisma.claimChart.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.claimElement.deleteMany({ where: { claim: { projectId: assignedProject.id } } });
      await prisma.patentClaim.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.specificationVersion.deleteMany({ where: { specification: { projectId: assignedProject.id } } });
      await prisma.specification.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.patentReference.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.drawingFigure.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.deadline.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.document.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.applicant.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.inventor.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.task.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.comment.deleteMany({ where: { projectId: assignedProject.id } });
      await prisma.activityLog.deleteMany({ where: { projectId: { in: [assignedProject.id, unrelatedProjectOrgA.id, otherOrgProject.id] } } });
      await prisma.projectMember.deleteMany({ where: { projectId: { in: [assignedProject.id, unrelatedProjectOrgA.id, otherOrgProject.id] } } });
      await prisma.patentProject.deleteMany({ where: { id: { in: [assignedProject.id, unrelatedProjectOrgA.id, otherOrgProject.id] } } });
      await prisma.notification.deleteMany({ where: { userId: { in: [expertA.id, expertB.id, guideA.id, inventorA.id, inventorB.id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [expertA.id, expertB.id, guideA.id, inventorA.id, inventorB.id] } } });
      await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    } catch (e) {
      // Non-fatal cleanup
    }
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n================================================================');
  console.log(`📊 AUDIT SUMMARY: ${auditResults.filter(r => r.passed).length}/${auditResults.length} STEPS PASSED`);
  console.log('================================================================\n');

  const failedSteps = auditResults.filter(r => !r.passed);
  if (failedSteps.length > 0) {
    console.error('❌ FAILED STEPS:');
    for (const f of failedSteps) {
      console.error(`  - Step ${f.step}: ${f.name} (${f.error || 'Failed'})`);
    }
    process.exit(1);
  } else {
    console.log('🎉 ALL 34 CRITERIA PASSED! PATENT EXPERT ROLE AUDIT VERIFIED!');
    process.exit(0);
  }
}

runPatentExpertAcceptanceAudit().catch((err) => {
  console.error('Unhandled acceptance audit error:', err);
  prisma.$disconnect();
  process.exit(1);
});
