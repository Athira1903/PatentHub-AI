import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testAdminWorkflow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING ADMIN WORKFLOW (feature/admin)');
  console.log('======================================================\n');

  const admin = await prisma.user.findFirst({
    where: { username: 'ADM20260001' },
    include: { role: true },
  });

  if (!admin) {
    throw new Error('Test admin ADM20260001 not found.');
  }

  // Create valid Admin JWT
  const token = jwt.sign(
    { userId: admin.id, username: admin.username, role: admin.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Fetch Admin Dashboard Platform Metrics
  console.log('1. Fetching Admin Platform Overview...');
  const dashRes = await fetch(`${API_URL}/admin/dashboard`, {
    headers: authHeaders,
  });
  const dashData: any = await dashRes.json();
  const kpis = dashData.kpis || dashData.metrics;
  if (dashRes.status !== 200 || !kpis) {
    throw new Error(`Failed to fetch admin dashboard: ${JSON.stringify(dashData)}`);
  }
  console.log(`  ✅ Platform Metrics: TotalUsers=${kpis.totalUsers}, TotalProjects=${kpis.totalProjects}, TotalOrganizations=${kpis.totalOrganizations}`);

  // 2. Fetch User Management Directory
  console.log('2. Fetching User Directory...');
  const usersRes = await fetch(`${API_URL}/admin/users`, {
    headers: authHeaders,
  });
  const usersData: any = await usersRes.json();
  if (usersRes.status !== 200 || !Array.isArray(usersData.users)) {
    throw new Error(`Failed to fetch users: ${JSON.stringify(usersData)}`);
  }
  console.log(`  ✅ User Directory: ${usersData.users.length} users registered across roles`);

  // 3. Fetch Platform Projects Overview
  console.log('3. Fetching Platform Projects...');
  const projRes = await fetch(`${API_URL}/admin/projects`, {
    headers: authHeaders,
  });
  const projData: any = await projRes.json();
  if (projRes.status !== 200 || !Array.isArray(projData.projects)) {
    throw new Error(`Failed to fetch projects: ${JSON.stringify(projData)}`);
  }
  console.log(`  ✅ Platform Projects: ${projData.projects.length} patent projects audited`);

  // 4. Fetch Role Permissions Matrix
  console.log('4. Fetching Role Permissions Matrix...');
  const permsRes = await fetch(`${API_URL}/admin/roles-permissions`, {
    headers: authHeaders,
  });
  const permsData: any = await permsRes.json();
  if (permsRes.status !== 200) {
    throw new Error(`Failed to fetch permissions: ${JSON.stringify(permsData)}`);
  }
  console.log(`  ✅ Role Permissions Matrix loaded successfully`);

  // 5. Fetch System Settings
  console.log('5. Fetching System Settings...');
  const settingsRes = await fetch(`${API_URL}/admin/settings`, {
    headers: authHeaders,
  });
  const settingsData: any = await settingsRes.json();
  if (settingsRes.status !== 200) {
    throw new Error(`Failed to fetch settings: ${JSON.stringify(settingsData)}`);
  }
  console.log(`  ✅ System Settings: ${settingsData.settings?.length || 0} settings keys retrieved`);

  // 6. Fetch Audit Activity Logs
  console.log('6. Fetching Platform Audit Logs...');
  const auditRes = await fetch(`${API_URL}/admin/activity-logs?page=1&limit=10`, {
    headers: authHeaders,
  });
  const auditData: any = await auditRes.json();
  if (auditRes.status !== 200) {
    throw new Error(`Failed to fetch audit logs: ${JSON.stringify(auditData)}`);
  }
  console.log(`  ✅ Audit Logs: ${auditData.total || 0} activity records recorded in log stream`);

  // 7. Test Anti-Privilege Escalation (Non-Admin Rejected)
  console.log('7. Verifying Non-Admin Access Rejection...');
  const student = await prisma.user.findFirst({
    where: { username: 'STU202600001' },
    include: { role: true },
  });
  const studentToken = jwt.sign(
    { userId: student!.id, username: student!.username, role: student!.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );
  const rejectRes = await fetch(`${API_URL}/admin/dashboard`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`,
    },
  });
  if (rejectRes.status === 200) {
    throw new Error('SECURITY VIOLATION: Student user accessed /api/admin/dashboard!');
  }
  console.log(`  ✅ Non-admin user access correctly rejected (Status: ${rejectRes.status})`);

  console.log('\n🎉 ALL ADMIN WORKFLOW TESTS PASSED CLEANLY!\n');
  await prisma.$disconnect();
}

testAdminWorkflow().catch(err => {
  console.error('Admin workflow test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
