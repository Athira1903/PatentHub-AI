


import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextActionService } from './src/services/nextActionService';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'patenthub_secret';

async function runNextActionEngineTests() {
  console.log('\n======================================================');
  console.log('🚀 TESTING NEXT ACTION ENGINE (30 COMPREHENSIVE SUITES)');
  console.log('======================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      failedCount++;
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(message);
    } else {
      passedCount++;
      console.log(`  ✅ PASSED: ${message}`);
    }
  }

  // 1. Setup Users
  const inventor = await prisma.user.findFirst({
    where: { username: 'STU202600001' },
    include: { role: true },
  });
  if (!inventor) throw new Error('Inventor STU202600001 not found.');

  const guide = await prisma.user.findFirst({
    where: { username: 'GDE20260001' },
    include: { role: true },
  }) || await prisma.user.findFirst({
    where: { role: { name: { in: ['Guide', 'Faculty Guide'] } } },
    include: { role: true },
  });
  if (!guide) throw new Error('Guide user not found.');

  const expert = await prisma.user.findFirst({
    where: { username: 'PEX20260001' },
    include: { role: true },
  }) || await prisma.user.findFirst({
    where: { role: { name: { in: ['Patent Expert', 'PatentExpert'] } } },
    include: { role: true },
  });
  if (!expert) throw new Error('Patent Expert user not found.');

  const admin = await prisma.user.findFirst({
    where: { username: 'ADM20260001' },
    include: { role: true },
  }) || await prisma.user.findFirst({
    where: { role: { name: 'Admin' } },
    include: { role: true },
  });
  if (!admin) throw new Error('Admin user not found.');

  let coInventor = await prisma.user.findFirst({
    where: { role: { name: { in: ['Co-Inventor', 'CoInventor', 'Coinventor'] } } },
    include: { role: true },
  });
  if (!coInventor) {
    const coRole = await prisma.role.findFirst({
      where: { name: { in: ['Co-Inventor', 'CoInventor', 'Coinventor'] } },
    }) || await prisma.role.findFirst({ where: { name: 'Inventor' } });
    if (coRole) {
      coInventor = await prisma.user.create({
        data: {
          username: `COINV_${Date.now()}`,
          email: `coinventor_${Date.now()}@patenthub.local`,
          password: 'Password123!',
          fullName: 'Test Co-Inventor',
          roleId: coRole.id,
          isActive: true,
        },
        include: { role: true },
      });
    }
  }

  // Generate Tokens
  const inventorToken = jwt.sign(
    { userId: inventor.id, username: inventor.username, role: inventor.role.name },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  const guideToken = jwt.sign(
    { userId: guide.id, username: guide.username, role: guide.role.name },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  const expertToken = jwt.sign(
    { userId: expert.id, username: expert.username, role: expert.role.name },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  const adminToken = jwt.sign(
    { userId: admin.id, username: admin.username, role: admin.role.name },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const inventorHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${inventorToken}`,
  };

  // Helper cleanup project
  const testProjectTag = 'EngineTest_' + Date.now();
  const createdProjectIds: string[] = [];

  try {
    // ----------------------------------------------------
    // Test 1: Incomplete Innovation Details (State 1 & 2)
    // ----------------------------------------------------
    console.log('\n--- Test 1: Incomplete Innovation Details ---');
    const p1 = await prisma.patentProject.create({
      data: {
        title: 'AI', // Too short (< 5 chars)
        category: 'SOFTWARE_AI',
        technicalDomain: 'Computer Vision',
        ownerId: inventor.id,
        innovationIdea: 'Short',
        problemStatement: '',
        proposedSolution: '',
        stage: 'IDEA',
        members: {
          create: [
            { userId: guide.id, role: 'GUIDE' },
            { userId: expert.id, role: 'PATENT_EXPERT' },
            ...(coInventor ? [{ userId: coInventor.id, role: 'CO_INVENTOR' as any }] : [])
          ]
        }
      },
    });
    createdProjectIds.push(p1.id);

    const res1 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data1: any = await res1.json();
    assert(res1.status === 200, 'HTTP 200 returned for Test 1');
    assert(data1.primaryAction?.actionType === 'COMPLETE_INNOVATION_DETAILS', `Action is COMPLETE_INNOVATION_DETAILS (got ${data1.primaryAction?.actionType})`);
    assert(data1.primaryAction?.route.includes('Innovation%20Details'), 'Route points to Innovation Details tab');

    // ----------------------------------------------------
    // Test 2: Complete Innovation, No Prior Art (State 3)
    // ----------------------------------------------------
    console.log('\n--- Test 2: Complete Innovation, No Prior Art ---');
    await prisma.patentProject.update({
      where: { id: p1.id },
      data: {
        title: `Neuromorphic Visual Tracking System ${testProjectTag}`,
        problemStatement: 'Severe dynamic range limitation and motion blur in low light tracking environments.',
        proposedSolution: 'Asynchronous event stream processing with spiking neural attention architecture.',
      },
    });
    const res2 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data2: any = await res2.json();
    assert(data2.primaryAction?.actionType === 'START_PRIOR_ART_RESEARCH', `Action is START_PRIOR_ART_RESEARCH (got ${data2.primaryAction?.actionType})`);
    assert(data2.primaryAction?.route.includes('Prior%20Art%20Search'), 'Route is Prior Art Search');

    // ----------------------------------------------------
    // Test 3: Partial Prior Art (< 3 references)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Partial Prior Art (< 3 references) ---');
    await prisma.patentReference.create({
      data: {
        projectId: p1.id,
        patentNumber: `US-TEST-${Date.now()}-1`,
        title: 'Event-driven image processor',
        abstract: 'Prior art in event vision sensor.',
        source: 'USPTO',
      },
    });
    const res3 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data3: any = await res3.json();
    assert(data3.primaryAction?.actionType === 'REVIEW_PRIOR_ART_RESEARCH', `Action is REVIEW_PRIOR_ART_RESEARCH (got ${data3.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 4: 3 References, No AI Analysis (State 5)
    // ----------------------------------------------------
    console.log('\n--- Test 4: 3 References, No AI Analysis ---');
    await prisma.patentReference.createMany({
      data: [
        {
          projectId: p1.id,
          patentNumber: `US-TEST-${Date.now()}-2`,
          title: 'Spiking neural network tracker',
          abstract: 'Prior art in spiking CNN.',
          source: 'USPTO',
        },
        {
          projectId: p1.id,
          patentNumber: `US-TEST-${Date.now()}-3`,
          title: 'Asynchronous pixel sensor array',
          abstract: 'Prior art in sensor array.',
          source: 'EPO',
        },
      ],
    });
    const res4 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data4: any = await res4.json();
    assert(data4.primaryAction?.actionType === 'RUN_INNOVATION_ANALYSIS', `Action is RUN_INNOVATION_ANALYSIS (got ${data4.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 5: AI Analysis Present, Drawings/Prototype Missing (State 6)
    // ----------------------------------------------------
    console.log('\n--- Test 5: AI Analysis Present, Drawings Missing ---');
    await prisma.aIAnalysis.create({
      data: {
        projectId: p1.id,
        analysisType: 'INNOVATION_OVERLAP',
        prompt: 'Analyze overlap for neuromorphic system',
        output: { noveltyScore: 88, verdict: 'PATENTABLE' },
      },
    });
    const res5 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data5: any = await res5.json();
    assert(data5.primaryAction?.actionType === 'ADD_PROTOTYPE_OR_DRAWINGS', `Action is ADD_PROTOTYPE_OR_DRAWINGS (got ${data5.primaryAction?.actionType})`);
    assert(data5.primaryAction?.route.includes('Drawings'), 'Route is Drawings');

    // ----------------------------------------------------
    // Test 6: Drawing Present, Specification Missing / Incomplete (State 7)
    // ----------------------------------------------------
    console.log('\n--- Test 6: Drawing Present, Specification Incomplete ---');
    await prisma.drawingFigure.create({
      data: {
        projectId: p1.id,
        figureNumber: 'FIG. 1',
        title: 'System Block Diagram',
        description: 'Schematic illustration of the neuromorphic sensor array and spiking processor.',
      },
    });
    const res6 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data6: any = await res6.json();
    assert(data6.primaryAction?.actionType === 'COMPLETE_SPECIFICATION', `Action is COMPLETE_SPECIFICATION (got ${data6.primaryAction?.actionType})`);
    assert(data6.primaryAction?.route.includes('Specification'), 'Route is Specification');

    // ----------------------------------------------------
    // Test 7: Specification Complete, Claims Missing (State 8)
    // ----------------------------------------------------
    console.log('\n--- Test 7: Specification Complete, Claims Missing ---');
    await prisma.specification.create({
      data: {
        projectId: p1.id,
        title: 'Neuromorphic Event-Camera Tracking System',
        abstract: 'A neuromorphic sensing pipeline for low light conditions.',
        background: 'Conventional CMOS cameras suffer dynamic range degradation.',
        problem: 'Motion blur in low light tracking.',
        proposedSolution: 'Asynchronous event stream processing with spiking neural attention.',
        summary: 'The apparatus includes neuromorphic array and temporal aggregator.',
        detailedDescription: 'Referring to Figure 1, the neuromorphic sensing apparatus comprises a high-bandwidth asynchronous event stream detector coupled to a spiking neural processor. The photodiode array detects individual photon flux transitions and generates microsecond timestamped event packets.',
        technicalComponents: 'Sensor 102, Processor 104, Output buffer 106',
        workingPrinciple: 'Events are accumulated and dispatched as sparse tensors.',
        advantages: '90% power reduction and microsecond latency.',
        applications: 'Drone navigation, night surveillance, surgical robotics.',
        industrialApplicability: 'Applicable in robotics and semiconductor sensor manufacturing.',
        status: 'COMPLETE',
        isCurrent: true,
      },
    });
    const res7 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data7: any = await res7.json();
    assert(data7.primaryAction?.actionType === 'CREATE_PATENT_CLAIMS', `Action is CREATE_PATENT_CLAIMS (got ${data7.primaryAction?.actionType})`);
    assert(data7.primaryAction?.route.includes('Claims%20Studio'), 'Route is Claims Studio');

    // ----------------------------------------------------
    // Test 8: Claims Present but Missing Independent Claim
    // ----------------------------------------------------
    console.log('\n--- Test 8: Claims Missing Independent Claim ---');
    const claim1 = await prisma.patentClaim.create({
      data: {
        projectId: p1.id,
        claimNumber: 1,
        claimType: 'DEPENDENT',
        preamble: 'The tracking system of claim 0, wherein',
        body: 'said sensor array comprises a plurality of asynchronous photodiode pixels.',
        status: 'DRAFT',
      },
    });
    const res8 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data8: any = await res8.json();
    assert(data8.primaryAction?.actionType === 'DRAFT_INDEPENDENT_CLAIM', `Action is DRAFT_INDEPENDENT_CLAIM (got ${data8.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 9: Independent Claim with Antecedent Basis Error
    // ----------------------------------------------------
    console.log('\n--- Test 9: Independent Claim with Antecedent Basis Error ---');
    await prisma.patentClaim.update({
      where: { id: claim1.id },
      data: {
        claimType: 'INDEPENDENT',
        preamble: '1. A neuromorphic tracking apparatus comprising:',
        body: 'a sensor array configured to capture optical photons; wherein said processor executes spiking neural attention on event streams.', // "said processor" has no antecedent
      },
    });
    const res9 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data9: any = await res9.json();
    assert(data9.primaryAction?.actionType === 'RESOLVE_CLAIM_STRUCTURE_ISSUES', `Action is RESOLVE_CLAIM_STRUCTURE_ISSUES (got ${data9.primaryAction?.actionType})`);
    assert(data9.primaryAction?.priority === 'HIGH', 'Priority is HIGH for antecedent basis issues');

    // ----------------------------------------------------
    // Test 10: Clean Claims, Missing Legal Applicants (State 10)
    // ----------------------------------------------------
    console.log('\n--- Test 10: Clean Claims, Missing Legal Applicants ---');
    await prisma.patentClaim.update({
      where: { id: claim1.id },
      data: {
        body: 'a sensor array configured to capture optical photons; and a processor coupled to said sensor array configured to execute spiking neural attention on event streams.',
      },
    });
    const res10 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data10: any = await res10.json();
    assert(data10.primaryAction?.actionType === 'COMPLETE_APPLICANT_INFORMATION', `Action is COMPLETE_APPLICANT_INFORMATION (got ${data10.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 11: Applicant Present, Missing Legal Inventors (State 10)
    // ----------------------------------------------------
    console.log('\n--- Test 11: Applicant Present, Missing Legal Inventors ---');
    await prisma.applicant.create({
      data: {
        projectId: p1.id,
        name: 'National Institute of Technology',
        applicantType: 'EDUCATIONAL_INSTITUTE',
        address: '100 Innovation Way, Tech City, Karnataka',
        email: 'dean.research@nit.ac.in',
        isPrimary: true,
      },
    });
    const res11 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data11: any = await res11.json();
    assert(data11.primaryAction?.actionType === 'COMPLETE_INVENTOR_INFORMATION', `Action is COMPLETE_INVENTOR_INFORMATION (got ${data11.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 12: Incomplete Statutory Forms / Filing Readiness Blocker (State 11)
    // ----------------------------------------------------
    console.log('\n--- Test 12: Incomplete Statutory Forms ---');
    await prisma.inventor.create({
      data: {
        projectId: p1.id,
        name: 'Dr. Test Inventor',
        address: '45 Faculty Enclave, Tech Campus',
        email: 'inventor@nit.ac.in',
        isPrimary: true,
      },
    });
    const res12 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data12: any = await res12.json();
    assert(data12.primaryAction !== null, 'Primary action returned for filing readiness check');
    console.log(`  ℹ️ Top action during form stage: ${data12.primaryAction?.actionType}`);

    // ----------------------------------------------------
    // Test 13: Ready for Guide Submission (State 12 - Inventor perspective)
    // ----------------------------------------------------
    console.log('\n--- Test 13: Ready for Guide Submission ---');
    // Sign inventorship declaration
    await prisma.inventor.updateMany({
      where: { projectId: p1.id },
      data: { inventorshipDeclarationSigned: true },
    });
    // Add dependent claim
    await prisma.patentClaim.create({
      data: {
        projectId: p1.id,
        claimNumber: 2,
        claimType: 'DEPENDENT',
        dependsOnNumber: 1,
        preamble: 'The apparatus of claim 1, wherein',
        body: 'the sensor array comprises asynchronous silicon photodiode pixels.',
        status: 'DRAFT',
      },
    });
    // Generate all 5 statutory forms
    const forms = ['Form 1', 'Form 2', 'Form 3', 'Form 5', 'Form 26'];
    for (const f of forms) {
      await prisma.patentForm.create({
        data: {
          projectId: p1.id,
          formType: f,
          status: 'DRAFT',
          formData: { completed: true },
        },
      });
    }

    const res13 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data13: any = await res13.json();
    assert(data13.primaryAction?.actionType === 'SUBMIT_FOR_GUIDE_REVIEW', `Action is SUBMIT_FOR_GUIDE_REVIEW (got ${data13.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 14: Guide Review Stage (Guide perspective - State 13)
    // ----------------------------------------------------
    console.log('\n--- Test 14: Guide Review Stage (Guide perspective) ---');
    await prisma.patentProject.update({
      where: { id: p1.id },
      data: { stage: 'GUIDE_REVIEW' },
    });
    const guideHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${guideToken}`,
    };
    const res14 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: guideHeaders });
    const data14: any = await res14.json();
    assert(data14.primaryAction?.actionType === 'EVALUATE_GUIDE_REVIEW', `Action is EVALUATE_GUIDE_REVIEW for guide (got ${data14.primaryAction?.actionType})`);
    assert(data14.primaryAction?.priority === 'HIGH', 'Guide review priority is HIGH');

    // ----------------------------------------------------
    // Test 15: Guide Review Stage (Inventor perspective)
    // ----------------------------------------------------
    console.log('\n--- Test 15: Guide Review Stage (Inventor perspective) ---');
    const res15 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data15: any = await res15.json();
    assert(data15.primaryAction?.actionType === 'AWAIT_GUIDE_REVIEW', `Action is AWAIT_GUIDE_REVIEW for inventor (got ${data15.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 16: Guide Review CHANGES_REQUESTED (CRITICAL Priority Override)
    // ----------------------------------------------------
    console.log('\n--- Test 16: Guide Review CHANGES_REQUESTED (CRITICAL Override) ---');
    const guideReview = await prisma.projectReview.create({
      data: {
        projectId: p1.id,
        reviewerId: guide.id,
        reviewType: 'GUIDE_REVIEW',
        decision: 'CHANGES_REQUESTED',
        comments: 'Please elaborate on the hardware timing constraints of the event aggregator.',
      },
    });
    const res16 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data16: any = await res16.json();
    assert(data16.primaryAction?.actionType === 'ADDRESS_GUIDE_CHANGES', `Action is ADDRESS_GUIDE_CHANGES (got ${data16.primaryAction?.actionType})`);
    assert(data16.primaryAction?.priority === 'CRITICAL', 'Priority is CRITICAL for guide changes requested');

    // ----------------------------------------------------
    // Test 17: Guide Approved, Expert Review Stage (Expert perspective - State 15)
    // ----------------------------------------------------
    console.log('\n--- Test 17: Expert Review Stage (Expert perspective) ---');
    await prisma.projectReview.update({
      where: { id: guideReview.id },
      data: { decision: 'APPROVED' },
    });
    await prisma.patentProject.update({
      where: { id: p1.id },
      data: { stage: 'PATENT_EXPERT_REVIEW' },
    });
    const expertHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${expertToken}`,
    };
    const res17 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: expertHeaders });
    const data17: any = await res17.json();
    assert(data17.primaryAction?.actionType === 'EVALUATE_EXPERT_REVIEW', `Action is EVALUATE_EXPERT_REVIEW for expert (got ${data17.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 18: Guide Approved, Expert Review Stage (Inventor perspective)
    // ----------------------------------------------------
    console.log('\n--- Test 18: Expert Review Stage (Inventor perspective) ---');
    const res18 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data18: any = await res18.json();
    assert(data18.primaryAction?.actionType === 'AWAIT_EXPERT_REVIEW', `Action is AWAIT_EXPERT_REVIEW for inventor (got ${data18.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 19: Expert Review CHANGES_REQUESTED (CRITICAL Priority Override)
    // ----------------------------------------------------
    console.log('\n--- Test 19: Expert Review CHANGES_REQUESTED (CRITICAL Override) ---');
    const expertReview = await prisma.projectReview.create({
      data: {
        projectId: p1.id,
        reviewerId: expert.id,
        reviewType: 'EXPERT_REVIEW',
        decision: 'CHANGES_REQUESTED',
        comments: 'Clarify Section 3(k) patentability exemption regarding mathematical methods.',
      },
    });
    const res19 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data19: any = await res19.json();
    assert(data19.primaryAction?.actionType === 'RESOLVE_EXPERT_CHANGES', `Action is RESOLVE_EXPERT_CHANGES (got ${data19.primaryAction?.actionType})`);
    assert(data19.primaryAction?.priority === 'CRITICAL', 'Priority is CRITICAL for expert changes requested');

    // ----------------------------------------------------
    // Test 20: Both Approved / FILING_READY (State 17)
    // ----------------------------------------------------
    console.log('\n--- Test 20: Both Approved / FILING_READY ---');
    await prisma.projectReview.update({
      where: { id: expertReview.id },
      data: { decision: 'APPROVED' },
    });
    await prisma.patentProject.update({
      where: { id: p1.id },
      data: { stage: 'FILING_READY' },
    });
    const res20 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data20: any = await res20.json();
    assert(data20.primaryAction?.actionType === 'PREPARE_FILING_PACKAGE', `Action is PREPARE_FILING_PACKAGE (got ${data20.primaryAction?.actionType})`);

    // ----------------------------------------------------
    // Test 21: Overdue Statutory Deadline (CRITICAL Priority Override)
    // ----------------------------------------------------
    console.log('\n--- Test 21: Overdue Statutory Deadline (CRITICAL Override) ---');
    const overdueDeadline = await prisma.deadline.create({
      data: {
        projectId: p1.id,
        deadlineType: 'COMPLETE_SPECIFICATION_FILING',
        referenceEvent: 'PROVISIONAL_FILING',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        status: 'OVERDUE',
        description: 'Mandatory 12-month complete specification window is past due.',
      },
    });
    const res21 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data21: any = await res21.json();
    assert(data21.primaryAction?.actionType === 'RESOLVE_OVERDUE_DEADLINE', `Action is RESOLVE_OVERDUE_DEADLINE (got ${data21.primaryAction?.actionType})`);
    assert(data21.primaryAction?.priority === 'CRITICAL', 'Priority is CRITICAL for overdue deadline');

    // ----------------------------------------------------
    // Test 22: Approaching Deadline Notification
    // ----------------------------------------------------
    console.log('\n--- Test 22: Approaching Deadline Notification ---');
    await prisma.deadline.update({
      where: { id: overdueDeadline.id },
      data: { status: 'APPROACHING', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15) },
    });
    const res22 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data22: any = await res22.json();
    assert(data22.primaryAction !== null, 'Approaching deadline returns valid primary action');

    // ----------------------------------------------------
    // Test 23: Filed Project (State 18)
    // ----------------------------------------------------
    console.log('\n--- Test 23: Filed Project ---');
    await prisma.deadline.delete({ where: { id: overdueDeadline.id } });
    await prisma.patentProject.update({
      where: { id: p1.id },
      data: { stage: 'FILED' },
    });
    await prisma.filingEvent.create({
      data: {
        projectId: p1.id,
        eventType: 'COMPLETE_SPECIFICATION_FILING',
        applicationNumber: '202641012345',
        cbrNumber: 'CBR-2026-98765',
        status: 'FILED',
        description: 'Complete specification filed at IPO Chennai.',
      },
    });
    const res23 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data23: any = await res23.json();
    assert(data23.primaryAction?.actionType === 'VIEW_FILING_RECORD', `Action is VIEW_FILING_RECORD (got ${data23.primaryAction?.actionType})`);
    assert(data23.primaryAction?.progress === 100, 'Progress is 100% for filed project');

    // ----------------------------------------------------
    // Test 24: Co-Inventor with Assigned Task
    // ----------------------------------------------------
    console.log('\n--- Test 24: Co-Inventor Assigned Task ---');
    if (coInventor) {
      const coProject = await prisma.patentProject.create({
        data: {
          title: `Co-Inventor Project ${testProjectTag}`,
          ownerId: inventor.id,
          problemStatement: 'Decentralized consensus latency.',
          proposedSolution: 'Directed acyclic graph validation protocol.',
          category: 'SOFTWARE_AI',
          technicalDomain: 'Cryptography',
          stage: 'PROTOTYPE',
          innovationIdea: 'Distributed cryptographic patent validation nodes.',
        },
      });
      createdProjectIds.push(coProject.id);

      await prisma.projectMember.create({
        data: {
          projectId: coProject.id,
          userId: coInventor.id,
          role: 'CO_INVENTOR',
          permissionLevel: 'EDIT',
        },
      });

      await prisma.task.create({
        data: {
          projectId: coProject.id,
          assignedToId: coInventor.id,
          title: 'Draft Figure 3 Annotations',
          description: 'Add callouts 302 through 314 on schematic diagram.',
          status: 'TODO',
          priority: 'HIGH',
        },
      });

      const coToken = jwt.sign(
        { userId: coInventor.id, username: coInventor.username, role: 'Co-Inventor' },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
      const coHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coToken}`,
      };

      const res24 = await fetch(`${API_URL}/projects/${coProject.id}/next-action`, { headers: coHeaders });
      const data24: any = await res24.json();
      assert(data24.primaryAction?.actionType === 'COMPLETE_ASSIGNED_TASK', `Action is COMPLETE_ASSIGNED_TASK (got ${data24.primaryAction?.actionType})`);
      assert(data24.primaryAction?.title.includes('Draft Figure 3'), 'Task title matched in primary action');

      // ----------------------------------------------------
      // Test 25: Co-Inventor with VIEW Permission
      // ----------------------------------------------------
      console.log('\n--- Test 25: Co-Inventor VIEW Permission ---');
      const viewProject = await prisma.patentProject.create({
        data: {
          title: `View Only Project ${testProjectTag}`,
          ownerId: inventor.id,
          problemStatement: 'Hardware entropy depletion.',
          proposedSolution: 'Quantum phase noise extraction circuit.',
          category: 'HARDWARE_IOT',
          technicalDomain: 'Quantum Computing',
          stage: 'DOCUMENTATION',
          innovationIdea: 'Quantum random number generator for hardware keys.',
        },
      });
      createdProjectIds.push(viewProject.id);

      await prisma.projectMember.create({
        data: {
          projectId: viewProject.id,
          userId: coInventor.id,
          role: 'CO_INVENTOR',
          permissionLevel: 'VIEW',
        },
      });

      const res25 = await fetch(`${API_URL}/projects/${viewProject.id}/next-action`, { headers: coHeaders });
      const data25: any = await res25.json();
      assert(data25.primaryAction !== null, 'View-only collaborator received next action');
      console.log(`  ℹ️ View-only action: ${data25.primaryAction?.actionType}`);
    }

    // ----------------------------------------------------
    // Test 26: Admin User Access to Project Next Action
    // ----------------------------------------------------
    console.log('\n--- Test 26: Admin User Access ---');
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
    const res26 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: adminHeaders });
    const data26: any = await res26.json();
    assert(res26.status === 200, 'Admin can view next action on any project');
    assert(data26.primaryAction !== null, 'Admin received valid next action');

    // ----------------------------------------------------
    // Test 27: Unauthorized User Access
    // ----------------------------------------------------
    console.log('\n--- Test 27: Unauthorized User Access ---');
    const unauthHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid_token_123',
    };
    const res27 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: unauthHeaders });
    assert(res27.status === 401 || res27.status === 403, `Access denied with invalid token (status: ${res27.status})`);

    // ----------------------------------------------------
    // Test 28: Global User Primary Next Action (Multi-Project API)
    // ----------------------------------------------------
    console.log('\n--- Test 28: User Primary Next Action (Global API) ---');
    const res28 = await fetch(`${API_URL}/projects/next-action/primary`, { headers: inventorHeaders });
    const data28: any = await res28.json();
    assert(res28.status === 200, 'HTTP 200 for user primary next action');
    assert(data28.nextAction !== undefined || data28 === null, 'Returned valid primary next action payload');

    // ----------------------------------------------------
    // Test 29: Unified 5-Stage Breakdown Calculation
    // ----------------------------------------------------
    console.log('\n--- Test 29: 5-Stage Unified Progress Breakdown ---');
    const res29 = await fetch(`${API_URL}/projects/${p1.id}/next-action`, { headers: inventorHeaders });
    const data29: any = await res29.json();
    assert(typeof data29.progressPercentage === 'number', 'progressPercentage is a number');
    assert(data29.stageBreakdown !== undefined, 'stageBreakdown is defined');
    assert(typeof data29.stageBreakdown.define === 'number', 'stageBreakdown.define is a number');
    assert(typeof data29.stageBreakdown.draft === 'number', 'stageBreakdown.draft is a number');
    assert(typeof data29.stageBreakdown.filing === 'number', 'stageBreakdown.filing is a number');

    // ----------------------------------------------------
    // Test 30: Direct Service Call Unit Test
    // ----------------------------------------------------
    console.log('\n--- Test 30: Direct Service Unit Call ---');
    const directResult = await NextActionService.determineNextAction(p1.id, {
      userId: inventor.id,
      role: 'Inventor',
    });
    assert(directResult !== null, 'Direct service call returned non-null result');
    assert(directResult.primaryAction !== undefined, 'Direct service primaryAction is defined');
    assert(Array.isArray(directResult.secondaryActions), 'Direct service secondaryActions is an array');
    assert(typeof directResult.progressPercentage === 'number', 'Direct service progressPercentage is a number');
  } finally {
    // Cleanup created test data
    console.log('\n--- Cleaning up temporary test artifacts ---');
    for (const pid of createdProjectIds) {
      try {
        await prisma.task.deleteMany({ where: { projectId: pid } });
        await prisma.projectMember.deleteMany({ where: { projectId: pid } });
        await prisma.projectReview.deleteMany({ where: { projectId: pid } });
        await prisma.patentForm.deleteMany({ where: { projectId: pid } });
        await prisma.applicant.deleteMany({ where: { projectId: pid } });
        await prisma.inventor.deleteMany({ where: { projectId: pid } });
        await prisma.patentClaim.deleteMany({ where: { projectId: pid } });
        await prisma.specification.deleteMany({ where: { projectId: pid } });
        await prisma.drawingFigure.deleteMany({ where: { projectId: pid } });
        await prisma.aIAnalysis.deleteMany({ where: { projectId: pid } });
        await prisma.patentReference.deleteMany({ where: { projectId: pid } });
        await prisma.filingEvent.deleteMany({ where: { projectId: pid } });
        await prisma.deadline.deleteMany({ where: { projectId: pid } });
        await prisma.patentProject.delete({ where: { id: pid } });
      } catch (err: any) {
        console.warn(`Could not cleanup project ${pid}: ${err.message}`);
      }
    }
  }

  console.log('\n======================================================');
  console.log(`📊 SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runNextActionEngineTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
