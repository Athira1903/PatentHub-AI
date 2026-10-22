import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runEnhancementAudit() {
  console.log('\n======================================================');
  console.log('🧪 PATENTHUB AI: ENTERPRISE ADMIN PANEL ENHANCEMENT AUDIT');
  console.log('======================================================\n');

  const admin = await prisma.user.findFirst({
    where: { username: 'ADM20260001' },
    include: { role: true },
  });

  if (!admin) {
    throw new Error('Test admin ADM20260001 not found.');
  }

  const token = jwt.sign(
    { userId: admin.id, username: admin.username, role: admin.role.name },
    process.env.JWT_SECRET || 'patenthub_secret',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // TEST 1: Dashboard Overview Metrics with Enhanced Indicators
  console.log('1. Testing Enhanced Dashboard Overview Metrics...');
  const dashRes = await fetch(`${API_URL}/admin/dashboard?timeRange=30d`, {
    headers: authHeaders,
  });
  const dashData: any = await dashRes.json();
  const kpis = dashData.kpis;
  if (dashRes.status !== 200 || !kpis) {
    throw new Error(`Failed to fetch admin dashboard: ${JSON.stringify(dashData)}`);
  }
  console.log(`   ✅ Total Users: ${kpis.totalUsers}, Active: ${kpis.activeUsers}, In Period: ${kpis.newUsersPeriod ?? 'N/A'}`);
  console.log(`   ✅ Stalled Projects: ${kpis.stalledProjects}, Overdue Tasks: ${kpis.overdueTasks}, Upcoming Deadlines: ${kpis.upcomingDeadlines}`);
  console.log(`   ✅ Roadmap Milestones: ${kpis.completedRoadmapMilestones} / ${kpis.totalRoadmapMilestones}`);
  console.log(`   ✅ Database Ping Latency: ${kpis.dbPingMs} ms`);

  // TEST 2: Comprehensive Reports & Analytics
  console.log('\n2. Testing Comprehensive Reports & Analytics API...');
  const reportsRes = await fetch(`${API_URL}/admin/reports?timeRange=30d`, {
    headers: authHeaders,
  });
  const reports: any = await reportsRes.json();
  if (reportsRes.status !== 200) {
    throw new Error(`Failed to fetch reports: ${JSON.stringify(reports)}`);
  }
  console.log(`   ✅ User Growth: ${reports.userGrowth.totalUsers} total users across ${reports.userGrowth.roleBreakdown.length} roles`);
  console.log(`   ✅ Growth Timeline points: ${reports.userGrowth.growthTimeline.length} intervals recorded`);
  console.log(`   ✅ Top Organizations: ${reports.organizationActivity.topOrganizations.length} institutions tracked`);
  console.log(`   ✅ Project Lifecycle: Avg Age=${reports.projectLifecycle.avgProjectAgeDays} days, Stalled=${reports.projectLifecycle.stalledProjects}`);
  console.log(`   ✅ Review Workload: Avg Turnaround=${reports.reviewPerformance.avgTurnaroundDays} days, Pending=${reports.reviewPerformance.pendingReviews}`);
  console.log(`   ✅ Filing Deadlines: Upcoming 30d=${reports.filingDeadlines.upcoming30Days}, Overdue Tasks=${reports.filingDeadlines.overdueTasks}`);
  console.log(`   ✅ AI Telemetry: Operations=${reports.aiTelemetry.totalOperationsInPeriod}, Provider=${reports.aiTelemetry.provider} (${reports.aiTelemetry.status})`);
  console.log(`   ✅ Security Events: Total Admin Actions=${reports.securityEvents.totalAdminActionsInPeriod}`);

  // TEST 3: Cross-Project Operational Oversight
  console.log('\n3. Testing Cross-Project Operational Oversight...');
  const projRes = await fetch(`${API_URL}/admin/projects`, {
    headers: authHeaders,
  });
  const projData: any = await projRes.json();
  if (projRes.status !== 200 || !Array.isArray(projData.projects)) {
    throw new Error(`Failed to fetch projects: ${JSON.stringify(projData)}`);
  }
  console.log(`   ✅ Projects audited: ${projData.projects.length}`);
  const firstProj = projData.projects[0];
  if (firstProj) {
    console.log(`   ✅ First project: "${firstProj.title}"`);
    console.log(`      Milestones: ${firstProj.completedMilestonesCount} / ${firstProj.milestonesCount} (${firstProj.milestoneProgress}%)`);
    console.log(`      Overdue Tasks: ${firstProj.overdueTasksCount}, Stalled: ${firstProj.isStalled}`);
    // Verify confidentiality: raw text bodies must not be exposed
    if ((firstProj as any).patentClaimsText || (firstProj as any).specificationDraft) {
      throw new Error('Confidential invention disclosure texts improperly exposed to admin!');
    }
  }

  // TEST 4: Sensitive Administrative Operation & Audit Logging
  console.log('\n4. Testing Sensitive Operation & Audit Trail Persistence...');
  const targetUser = await prisma.user.findFirst({
    where: { username: { not: 'ADM20260001' } },
  });
  if (!targetUser) throw new Error('Target user not found');

  const initialStatus = targetUser.isActive;
  const toggleRes = await fetch(`${API_URL}/admin/users/${targetUser.id}/status`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ isActive: !initialStatus }),
  });
  if (toggleRes.status !== 200) {
    throw new Error('Failed to update user status');
  }

  // Verify Audit Log was recorded
  const auditLog = await prisma.activityLog.findFirst({
    where: {
      userId: admin.id,
      type: 'SECURITY',
      action: { in: ['ADMIN_SUSPEND_USER', 'ADMIN_REACTIVATE_USER'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!auditLog) {
    throw new Error('Audit log was NOT written for admin user status change!');
  }
  console.log(`   ✅ Audit log persisted in PostgreSQL: Action="${auditLog.action}", Type="${auditLog.type}", Actor="${admin.fullName}"`);

  // Restore original status
  await fetch(`${API_URL}/admin/users/${targetUser.id}/status`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ isActive: initialStatus }),
  });

  // TEST 5: Live System Health & Telemetry Probe
  console.log('\n5. Testing Live System Health & Telemetry...');
  const healthRes = await fetch(`${API_URL}/admin/health`, {
    headers: authHeaders,
  });
  const healthData: any = await healthRes.json();
  if (healthRes.status !== 200) {
    throw new Error('Failed to fetch system health');
  }
  console.log(`   ✅ Database Status: ${healthData.database} (${healthData.dbLatencyMs} ms latency)`);
  console.log(`   ✅ Node.js: ${healthData.nodeVersion}, Uptime: ${healthData.uptimeSeconds}s`);
  console.log(`   ✅ Memory: Heap=${healthData.memoryUsage?.heapUsedMb} MB, RSS=${healthData.memoryUsage?.rssMb} MB`);
  console.log(`   ✅ AI Provider Status: ${healthData.aiService}`);

  console.log('\n======================================================');
  console.log('🎉 ALL ADMIN ENHANCEMENT AUDIT CHECKS PASSED 100%!');
  console.log('======================================================\n');
  await prisma.$disconnect();
}

runEnhancementAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  prisma.$disconnect();
  process.exit(1);
});
