import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testInventorWorkflow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING INVENTOR WORKFLOW (feature/inventor)');
  console.log('======================================================\n');

  const inventor = await prisma.user.findFirst({
    where: { username: 'STU202600001' },
    include: { role: true },
  });

  if (!inventor) {
    throw new Error('Test inventor STU202600001 not found.');
  }

  // Create valid JWT for testing authenticated inventor endpoints
  const token = jwt.sign(
    { userId: inventor.id, username: inventor.username, role: inventor.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Fetch Inventor Analytics / Dashboard
  console.log('1. Fetching Inventor Analytics...');
  const analyticsRes = await fetch(`${API_URL}/projects/analytics/inventor`, {
    headers: authHeaders,
  });
  const analyticsData: any = await analyticsRes.json();
  if (analyticsRes.status !== 200 || !analyticsData.kpis) {
    throw new Error(`Failed to fetch inventor analytics: ${JSON.stringify(analyticsData)}`);
  }
  console.log(`  ✅ Inventor KPIs retrieved: MyProjects=${analyticsData.kpis.myProjects}, Active=${analyticsData.kpis.activeProjects}, Readiness=${analyticsData.kpis.filingReadiness}%`);

  // 2. Fetch Projects list
  console.log('2. Fetching Inventor Projects...');
  const projRes = await fetch(`${API_URL}/projects`, {
    headers: authHeaders,
  });
  const projData: any = await projRes.json();
  const projects = projData.projects || [];
  if (projRes.status !== 200 || projects.length === 0) {
    throw new Error('No projects found for inventor');
  }
  console.log(`  ✅ Found ${projects.length} projects for inventor`);
  const targetProject = projects[0];

  // 3. Test Next Action Recommendation Engine
  console.log('3. Testing Smart Next-Action Engine...');
  const nextActionRes = await fetch(`${API_URL}/projects/${targetProject.id}/next-action`, {
    headers: authHeaders,
  });
  const nextActionData: any = await nextActionRes.json();
  const title = nextActionData.title || nextActionData.action?.title || nextActionData.primaryAction?.title;
  const priority = nextActionData.priority || nextActionData.primaryAction?.priority || 'MEDIUM';
  if (nextActionRes.status !== 200 || !title) {
    throw new Error(`Failed to get next action: ${JSON.stringify(nextActionData)}`);
  }
  console.log(`  ✅ Next Action Recommendation: "${title}" (${priority} priority)`);

  // 4. Test Statutory Filing Readiness Assessment
  console.log('4. Testing Filing Readiness Assessment...');
  const assessRes = await fetch(`${API_URL}/projects/${targetProject.id}/filing-assessment`, {
    headers: authHeaders,
  });
  const assessData: any = await assessRes.json();
  const score = assessData.overallScore ?? assessData.score;
  if (assessRes.status !== 200 || score === undefined) {
    throw new Error(`Failed to get filing assessment: ${JSON.stringify(assessData)}`);
  }
  console.log(`  ✅ 12-point Statutory Assessment Score: ${score}% (Status: ${assessData.status})`);

  // 5. Test Indian Statutory Deadline Engine
  console.log('5. Testing Statutory Deadlines...');
  const deadlineRes = await fetch(`${API_URL}/projects/${targetProject.id}/deadlines`, {
    headers: authHeaders,
  });
  const deadlineData: any = await deadlineRes.json();
  if (deadlineRes.status !== 200) {
    throw new Error(`Failed to fetch deadlines: ${JSON.stringify(deadlineData)}`);
  }
  console.log(`  ✅ Statutory Deadlines: ${deadlineData.deadlines?.length || 0} statutory deadlines calculated`);

  // 6. Test Form 2 Specification Studio
  console.log('6. Testing Form 2 Specification Studio...');
  const specRes = await fetch(`${API_URL}/projects/${targetProject.id}/specification`, {
    headers: authHeaders,
  });
  const specData: any = await specRes.json();
  if (specRes.status !== 200) {
    throw new Error(`Failed to get specification: ${JSON.stringify(specData)}`);
  }
  console.log(`  ✅ Form 2 Specification: Title="${specData.specification?.title || targetProject.title}" (Version ${specData.specification?.currentVersion || 1})`);

  console.log('\n🎉 ALL INVENTOR WORKFLOW TESTS PASSED CLEANLY!\n');
  await prisma.$disconnect();
}

testInventorWorkflow().catch(err => {
  console.error('Inventor workflow test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
