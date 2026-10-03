import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testCoInventorWorkflow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING CO-INVENTOR WORKFLOW (feature/coinventor)');
  console.log('======================================================\n');

  const coInventor = await prisma.user.findFirst({
    where: { username: 'COI20260001' },
    include: { role: true },
  });

  if (!coInventor) {
    throw new Error('Test co-inventor COI20260001 not found.');
  }

  // Create valid JWT
  const token = jwt.sign(
    { userId: coInventor.id, username: coInventor.username, role: coInventor.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Fetch Co-Inventor Dashboard / Analytics
  console.log('1. Fetching Co-Inventor Dashboard Analytics...');
  const analyticsRes = await fetch(`${API_URL}/projects/analytics/coinventor`, {
    headers: authHeaders,
  });
  const analyticsData: any = await analyticsRes.json();
  if (analyticsRes.status !== 200 || !analyticsData.kpis) {
    throw new Error(`Failed to fetch co-inventor analytics: ${JSON.stringify(analyticsData)}`);
  }
  console.log(`  ✅ Co-Inventor KPIs retrieved: Projects=${analyticsData.kpis.myProjects}, Active=${analyticsData.kpis.activeProjects}, AssignedTasks=${analyticsData.kpis.assignedTasks || 0}`);

  // 2. Fetch Projects list
  console.log('2. Fetching Co-Inventor Associated Projects...');
  const projRes = await fetch(`${API_URL}/projects`, {
    headers: authHeaders,
  });
  const projData: any = await projRes.json();
  if (projRes.status !== 200) {
    throw new Error(`Failed to fetch projects: ${JSON.stringify(projData)}`);
  }
  console.log(`  ✅ Successfully retrieved projects list for Co-Inventor (${projData.projects?.length || 0} projects)`);

  // 3. Verify Role Authorization Restrictions (Anti-Privilege Escalation)
  console.log('3. Verifying Security & Authorization Boundaries...');
  // Co-Inventor should NOT have admin permissions
  const adminCheck = await fetch(`${API_URL}/admin/system/metrics`, {
    headers: authHeaders,
  });
  if (adminCheck.status === 200) {
    throw new Error('SECURITY VIOLATION: Co-Inventor was able to access /api/admin/system/metrics!');
  }
  console.log(`  ✅ Administrative access strictly restricted (Status: ${adminCheck.status})`);

  console.log('\n🎉 ALL CO-INVENTOR WORKFLOW TESTS PASSED CLEANLY!\n');
  await prisma.$disconnect();
}

testCoInventorWorkflow().catch(err => {
  console.error('Co-Inventor workflow test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
