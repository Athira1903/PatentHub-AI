import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testGuideWorkflow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING GUIDE WORKFLOW (feature/guide)');
  console.log('======================================================\n');

  const guide = await prisma.user.findFirst({
    where: { username: 'GDE20260001' },
    include: { role: true },
  });

  if (!guide) {
    throw new Error('Test guide GDE20260001 not found.');
  }

  // Create valid JWT
  const token = jwt.sign(
    { userId: guide.id, username: guide.username, role: guide.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Fetch Guide Dashboard Analytics
  console.log('1. Fetching Guide Dashboard Analytics...');
  const analyticsRes = await fetch(`${API_URL}/projects/analytics/guide`, {
    headers: authHeaders,
  });
  const analyticsData: any = await analyticsRes.json();
  if (analyticsRes.status !== 200 || !analyticsData.kpis) {
    throw new Error(`Failed to fetch guide analytics: ${JSON.stringify(analyticsData)}`);
  }
  console.log(`  ✅ Guide KPIs retrieved: Supervised=${analyticsData.kpis.supervisedProjects}, PendingReviews=${analyticsData.kpis.pendingReviews}, CompletedReviews=${analyticsData.kpis.completedReviews}`);

  // 2. Fetch Guide Supervised Projects List
  console.log('2. Fetching Projects for Guide...');
  const projRes = await fetch(`${API_URL}/projects`, {
    headers: authHeaders,
  });
  const projData: any = await projRes.json();
  if (projRes.status !== 200) {
    throw new Error(`Failed to fetch projects: ${JSON.stringify(projData)}`);
  }
  console.log(`  ✅ Supervised projects query returned ${projData.projects?.length || 0} projects`);

  // 3. Security & Anti-Privilege Escalation
  console.log('3. Verifying Security & Authorization Boundaries...');
  const adminCheck = await fetch(`${API_URL}/admin/users`, {
    headers: authHeaders,
  });
  if (adminCheck.status === 200) {
    throw new Error('SECURITY VIOLATION: Guide was able to access /api/admin/users!');
  }
  console.log(`  ✅ Admin user management strictly forbidden for Guide (Status: ${adminCheck.status})`);

  console.log('\n🎉 ALL GUIDE WORKFLOW TESTS PASSED CLEANLY!\n');
  await prisma.$disconnect();
}

testGuideWorkflow().catch(err => {
  console.error('Guide workflow test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
