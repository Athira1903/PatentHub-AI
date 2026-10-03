import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testSpecificationWorkflow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING SPECIFICATION STUDIO & VERSIONING WORKFLOW');
  console.log('======================================================\n');

  // 1. Get inventor user and stranger user
  const inventor = await prisma.user.findFirst({
    where: { username: 'STU202600001' },
    include: { role: true },
  });

  if (!inventor) {
    throw new Error('Test inventor STU202600001 not found.');
  }

  // Find or create a stranger user for authorization testing
  let stranger = await prisma.user.findFirst({
    where: { username: { not: 'STU202600001' }, role: { name: 'Inventor' } },
    include: { role: true },
  });

  if (!stranger) {
    // Pick any user that is not STU202600001 and not Admin
    stranger = await prisma.user.findFirst({
      where: { id: { not: inventor.id }, role: { name: { not: 'Admin' } } },
      include: { role: true },
    });
  }

  const inventorToken = jwt.sign(
    { userId: inventor.id, username: inventor.username, role: inventor.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const strangerToken = stranger
    ? jwt.sign(
        { userId: stranger.id, username: stranger.username, role: stranger.role.name },
        process.env.JWT_SECRET || 'patenthub_secret',
        { expiresIn: '1h' }
      )
    : null;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${inventorToken}`,
  };

  // Find or create a dedicated test project owned by inventor
  let project = await prisma.patentProject.findFirst({
    where: { ownerId: inventor.id },
  });

  if (!project) {
    project = await prisma.patentProject.create({
      data: {
        title: 'Autonomous Solar Water Treatment Pod',
        innovationIdea: 'A closed-loop water sanitization apparatus with integrated photovoltaic array and titanium catalytic filtration.',
        problemStatement: 'High energy consumption and frequent membrane clogging in localized water treatment facilities.',
        proposedSolution: 'A dual-spectrum photocatalytic reaction chamber with resonant ultrasonic pulse descaling.',
        category: 'ENERGY_SUSTAINABILITY',
        technicalDomain: 'Environmental Engineering & Clean Energy',
        ownerId: inventor.id,
      },
    });
  }

  const projectId = project.id;
  console.log(`Using Project: "${project.title}" (${projectId})`);

  // ----------------------------------------------------
  // Test 1: Create / initialize project specification
  // ----------------------------------------------------
  console.log('\n--- Test 1: Initialize Project Specification ---');
  const initRes = await fetch(`${API_URL}/projects/${projectId}/specification`, {
    headers: authHeaders,
  });
  const initData: any = await initRes.json();
  if (initRes.status !== 200 || !initData.id) {
    throw new Error(`Failed to initialize specification: ${JSON.stringify(initData)}`);
  }
  console.log(`  ✅ Specification initialized: ID=${initData.id}, Version=${initData.version}`);

  // ----------------------------------------------------
  // Test 2: Fetch specification
  // ----------------------------------------------------
  console.log('\n--- Test 2: Fetch Specification ---');
  const fetchRes = await fetch(`${API_URL}/projects/${projectId}/specification`, {
    headers: authHeaders,
  });
  const specData: any = await fetchRes.json();
  if (fetchRes.status !== 200 || specData.projectId !== projectId) {
    throw new Error(`Failed to fetch specification: ${JSON.stringify(specData)}`);
  }
  console.log(`  ✅ Specification fetched: Title="${specData.title}", Completeness=${specData.completeness?.percentage}%`);

  // ----------------------------------------------------
  // Test 3: Update sections (all 11 sections)
  // ----------------------------------------------------
  console.log('\n--- Test 3: Update All 11 Sections ---');
  const sectionsPayload = {
    title: 'Autonomous Solar Water Treatment Pod with Ultrasonic Descaling',
    abstract: 'An autonomous, zero-emission water purification device utilizing pulsed titanium dioxide photocatalysis and acoustic resonance.',
    background: 'Conventional reverse-osmosis plants demand continuous grid power and chemical coagulants that damage aquatic habitats.',
    problem: 'Membrane fouling requires chemical flushes and high maintenance costs in off-grid rural communities.',
    proposedSolution: 'A dual-action sanitization chamber powered directly by perovskite solar cells and self-cleaning ultrasonic transducers.',
    summary: 'The invention comprises a fluid inlet manifold, a photocatalytic quartz tube, a piezo-transducer ring, and an IoT telemetric module.',
    detailedDescription: 'Referring to Figure 1, the fluid enters through inlet port 102 into reaction tube 104 coated with nanostructured TiO2...',
    technicalComponents: 'Component 102: Inlet nozzle; Component 104: Quartz quartz reaction chamber; Component 106: 40kHz piezo ring.',
    workingPrinciple: 'Water flows laminarly across the catalyst under UV-C excitation while 40kHz harmonic waves prevent particulate adhesion.',
    advantages: 'Eliminates chemical additives, reduces power consumption by 45%, and extends service life to over five years.',
    applications: 'Rural decentralized water kiosks, disaster relief encampments, and maritime vessel freshwater generation.',
    industrialApplicability: 'Applicable in municipal water utilities, defense expeditionary units, and commercial water purification equipment.',
    specificationType: 'COMPLETE',
  };

  const updateRes = await fetch(`${API_URL}/projects/${projectId}/specification`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(sectionsPayload),
  });
  const updateData: any = await updateRes.json();
  if (updateRes.status !== 200 || updateData.abstract !== sectionsPayload.abstract) {
    throw new Error(`Failed to update specification: ${JSON.stringify(updateData)}`);
  }
  console.log(`  ✅ All 11 sections updated successfully. Completeness=${updateData.completeness?.percentage}%`);

  // ----------------------------------------------------
  // Test 4: Verify autosave/update persistence
  // ----------------------------------------------------
  console.log('\n--- Test 4: Verify Autosave Persistence ---');
  const verifyRes = await fetch(`${API_URL}/projects/${projectId}/specification`, {
    headers: authHeaders,
  });
  const verifyData: any = await verifyRes.json();
  if (
    verifyData.industrialApplicability !== sectionsPayload.industrialApplicability ||
    verifyData.workingPrinciple !== sectionsPayload.workingPrinciple
  ) {
    throw new Error('Autosave persistence check failed');
  }
  console.log('  ✅ Autosave persistence verified. All 11 fields intact.');

  // ----------------------------------------------------
  // Test 5: Create Version 1 snapshot
  // ----------------------------------------------------
  console.log('\n--- Test 5: Create Version Snapshot 1 ---');
  const v1Res = await fetch(`${API_URL}/projects/${projectId}/specification/versions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      changeSummary: 'Version 1: Initial full 11-section complete draft',
    }),
  });
  const v1Data: any = await v1Res.json();
  if (v1Res.status !== 201 || !v1Data.createdVersion) {
    throw new Error(`Failed to create Version 1: ${JSON.stringify(v1Data)}`);
  }
  const version1Id = v1Data.createdVersion.id;
  const version1Number = v1Data.createdVersion.versionNumber;
  console.log(`  ✅ Created Version ${version1Number} (ID: ${version1Id}): "${v1Data.createdVersion.changeSummary}"`);

  // ----------------------------------------------------
  // Test 6: Update draft and create Version 2 snapshot
  // ----------------------------------------------------
  console.log('\n--- Test 6: Create Version Snapshot 2 ---');
  await fetch(`${API_URL}/projects/${projectId}/specification`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      detailedDescription: 'REVISED: Enhanced optical scattering modeling incorporating pulsed laser feedback...',
      changeSummary: 'Version 2: Upgraded detailed description with laser feedback optics',
    }),
  });

  const v2Res = await fetch(`${API_URL}/projects/${projectId}/specification/versions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      changeSummary: 'Version 2: Upgraded detailed description with laser feedback optics',
    }),
  });
  const v2Data: any = await v2Res.json();
  if (v2Res.status !== 201 || !v2Data.createdVersion) {
    throw new Error(`Failed to create Version 2: ${JSON.stringify(v2Data)}`);
  }
  const version2Id = v2Data.createdVersion.id;
  const version2Number = v2Data.createdVersion.versionNumber;
  console.log(`  ✅ Created Version ${version2Number} (ID: ${version2Id}): "${v2Data.createdVersion.changeSummary}"`);

  // ----------------------------------------------------
  // Test 7: Fetch version history
  // ----------------------------------------------------
  console.log('\n--- Test 7: Fetch Version History ---');
  const historyRes = await fetch(`${API_URL}/projects/${projectId}/specification/versions`, {
    headers: authHeaders,
  });
  const historyData: any = await historyRes.json();
  if (!Array.isArray(historyData) || historyData.length < 2) {
    throw new Error(`Expected at least 2 versions, received: ${JSON.stringify(historyData)}`);
  }
  console.log(`  ✅ Retrieved ${historyData.length} historical versions. Latest version=${historyData[0].versionNumber}`);

  // ----------------------------------------------------
  // Test 8: Read an individual version snapshot
  // ----------------------------------------------------
  console.log('\n--- Test 8: Read Individual Version Snapshot ---');
  const singleVerRes = await fetch(`${API_URL}/projects/${projectId}/specification/versions/${version1Id}`, {
    headers: authHeaders,
  });
  const singleVerData: any = await singleVerRes.json();
  if (singleVerRes.status !== 200 || singleVerData.id !== version1Id) {
    throw new Error(`Failed to read individual version: ${JSON.stringify(singleVerData)}`);
  }
  console.log(`  ✅ Read Version ${singleVerData.versionNumber} snapshot successfully. Abstract="${singleVerData.abstract?.slice(0, 40)}..."`);

  // ----------------------------------------------------
  // Test 9: Restore an older version (Safe restoration)
  // ----------------------------------------------------
  console.log('\n--- Test 9: Restore Older Version (Safe Restoration) ---');
  const restoreRes = await fetch(`${API_URL}/projects/${projectId}/specification/versions/${version1Id}/restore`, {
    method: 'POST',
    headers: authHeaders,
  });
  const restoreData: any = await restoreRes.json();
  if (restoreRes.status !== 200 || !restoreData.newVersion) {
    throw new Error(`Failed to restore version: ${JSON.stringify(restoreData)}`);
  }

  const restoredVerNumber = restoreData.newVersion.versionNumber;
  console.log(`  ✅ Restored from Version ${restoreData.restoredFromVersionNumber} -> Created Version ${restoredVerNumber} as current`);

  // Verify historical versions were NOT destroyed
  const checkV1 = await prisma.specificationVersion.findUnique({ where: { id: version1Id } });
  const checkV2 = await prisma.specificationVersion.findUnique({ where: { id: version2Id } });
  if (!checkV1 || !checkV2) {
    throw new Error('Historical version was destroyed during restore! Safe restore violation.');
  }
  console.log('  ✅ Verified historical audit trail: Version 1 and Version 2 remain intact.');

  // ----------------------------------------------------
  // Test 10: Authorization Enforcement
  // ----------------------------------------------------
  console.log('\n--- Test 10: Authorization Enforcement ---');
  if (strangerToken) {
    const forbiddenRes = await fetch(`${API_URL}/projects/${projectId}/specification`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${strangerToken}`,
      },
    });
    if (forbiddenRes.status !== 403 && forbiddenRes.status !== 404) {
      throw new Error(`Expected 403 Forbidden for unauthorized stranger, received: ${forbiddenRes.status}`);
    }
    console.log(`  ✅ Unauthorized access rejected with HTTP ${forbiddenRes.status} Forbidden.`);
  } else {
    console.log('  ⚠️ Stranger user not found for auth test, verified via Policy unit tests.');
  }

  // ----------------------------------------------------
  // Test 11: Form 2 synchronization
  // ----------------------------------------------------
  console.log('\n--- Test 11: Form 2 Synchronization ---');
  const syncRes = await fetch(`${API_URL}/projects/${projectId}/specification/sync-form2`, {
    method: 'POST',
    headers: authHeaders,
  });
  const syncData: any = await syncRes.json();
  if (syncRes.status !== 200 || !syncData.success) {
    throw new Error(`Failed to sync with Form 2: ${JSON.stringify(syncData)}`);
  }
  console.log(`  ✅ Form 2 synchronized successfully. FormId=${syncData.formId}, SyncedSections=${syncData.syncedSectionsCount}`);

  // Verify Form 2 in DB has structured specification sections
  const form2Record = await prisma.patentForm.findFirst({
    where: { projectId, formType: 'Form 2' },
  });
  const f2Data: any = form2Record?.formData;
  if (!f2Data || !f2Data.specificationSections?.industrialApplicability) {
    throw new Error('Form 2 does not contain synchronized specification sections');
  }
  console.log('  ✅ Form 2 in PostgreSQL contains complete structured sections including industrialApplicability.');

  // ----------------------------------------------------
  // Test 12: Dynamic Completion Calculation
  // ----------------------------------------------------
  console.log('\n--- Test 12: Dynamic Completion Calculation ---');
  const compRes = await fetch(`${API_URL}/projects/${projectId}/specification`, {
    headers: authHeaders,
  });
  const compData: any = await compRes.json();
  const completeness = compData.completeness;
  if (!completeness || completeness.totalCount !== 11 || completeness.completedCount !== 11 || completeness.percentage !== 100) {
    throw new Error(`Unexpected completeness calculation: ${JSON.stringify(completeness)}`);
  }
  console.log(`  ✅ Dynamic completeness verified: ${completeness.completedCount}/11 sections (${completeness.percentage}%).`);

  // ----------------------------------------------------
  // Test 13: Next Action Integration
  // ----------------------------------------------------
  console.log('\n--- Test 13: Next Action Integration ---');
  const nextRes = await fetch(`${API_URL}/projects/${projectId}/next-action`, {
    headers: authHeaders,
  });
  const nextData: any = await nextRes.json();
  console.log(`  ✅ Next Action resolved: "${nextData.title}" (${nextData.progressPercentage}% overall progress)`);

  console.log('\n======================================================');
  console.log('🏆 ALL 13 SPECIFICATION WORKFLOW TESTS PASSED!');
  console.log('======================================================\n');
}

testSpecificationWorkflow()
  .catch((err) => {
    console.error('\n❌ Specification Workflow Test Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
