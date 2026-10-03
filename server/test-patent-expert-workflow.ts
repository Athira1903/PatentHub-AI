import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testPatentExpertWorkflow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING PATENT EXPERT WORKFLOW (feature/patent-expert)');
  console.log('======================================================\n');

  const expert = await prisma.user.findFirst({
    where: { username: 'PEX20260001' },
    include: { role: true },
  });

  if (!expert) {
    throw new Error('Test patent expert PEX20260001 not found.');
  }

  // Create valid JWT
  const token = jwt.sign(
    { userId: expert.id, username: expert.username, role: expert.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Fetch Patent Expert Dashboard Analytics
  console.log('1. Fetching Patent Expert Dashboard Analytics...');
  const analyticsRes = await fetch(`${API_URL}/projects/analytics/expert`, {
    headers: authHeaders,
  });
  const analyticsData: any = await analyticsRes.json();
  if (analyticsRes.status !== 200 || !analyticsData.kpis) {
    throw new Error(`Failed to fetch patent expert analytics: ${JSON.stringify(analyticsData)}`);
  }
  console.log(`  ✅ Patent Expert KPIs: PendingReviews=${analyticsData.kpis.pendingReviews}, FTOAnalysis=${analyticsData.kpis.ftoAnalysis}, ClaimReviews=${analyticsData.kpis.claimReviews}`);

  // 2. Fetch Projects for Patent Expert Review
  console.log('2. Fetching Projects for Expert Review...');
  const projRes = await fetch(`${API_URL}/projects`, {
    headers: authHeaders,
  });
  const projData: any = await projRes.json();
  if (projRes.status !== 200) {
    throw new Error(`Failed to fetch projects: ${JSON.stringify(projData)}`);
  }
  console.log(`  ✅ Expert projects query returned ${projData.projects?.length || 0} projects`);

  // 3. Security & Anti-Privilege Escalation
  console.log('3. Verifying Security & Authorization Boundaries...');
  const adminCheck = await fetch(`${API_URL}/admin/system/settings`, {
    headers: authHeaders,
  });
  if (adminCheck.status === 200) {
    throw new Error('SECURITY VIOLATION: Patent Expert was able to access /api/admin/system/settings!');
  }
  console.log(`  ✅ Admin system settings strictly forbidden for Patent Expert (Status: ${adminCheck.status})`);

  console.log('\n🎉 ALL PATENT EXPERT WORKFLOW TESTS PASSED CLEANLY!\n');
  await prisma.$disconnect();
}

testPatentExpertWorkflow().catch(err => {
  console.error('Patent expert workflow test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
