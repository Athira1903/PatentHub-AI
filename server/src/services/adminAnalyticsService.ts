import { prisma } from '../config/db';

export interface ReportsAnalyticsData {
  timeRange: string;
  generatedAt: string;
  userGrowth: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    newUsersInPeriod: number;
    roleBreakdown: Array<{ role: string; count: number; percentage: number }>;
    growthTimeline: Array<{ period: string; newUsers: number; cumulative: number }>;
  };
  organizationActivity: {
    totalOrganizations: number;
    activeOrganizations: number;
    avgMembersPerOrg: number;
    topOrganizations: Array<{
      id: string;
      name: string;
      domain: string;
      membersCount: number;
      projectsCount: number;
      status: string;
    }>;
  };
  projectLifecycle: {
    totalProjects: number;
    activeProjects: number;
    stalledProjects: number;
    filingReadyCount: number;
    avgProjectAgeDays: number;
    stageDistribution: Record<string, number>;
    roadmapMilestones: {
      total: number;
      completed: number;
      completionRate: number;
    };
  };
  reviewPerformance: {
    totalReviews: number;
    pendingReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    avgTurnaroundDays: number;
    turnaroundDistribution: {
      under2Days: number;
      twoToFiveDays: number;
      overFiveDays: number;
    };
  };
  filingDeadlines: {
    upcoming30Days: number;
    upcoming60Days: number;
    upcoming90Days: number;
    overdueTasks: number;
    completedTasks: number;
    readinessDistribution: {
      high: number;    // >= 75%
      medium: number;  // 40 - 74%
      low: number;     // < 40%
    };
    deadlinesList: Array<{
      id: string;
      projectTitle: string;
      deadlineType: string;
      dueDate: string;
      daysRemaining: number;
      status: string;
    }>;
  };
  aiTelemetry: {
    telemetryCollected: boolean;
    provider: string;
    status: string;
    totalOperationsInPeriod: number;
    operationsByType: Record<string, number>;
    avgLatencyMs: number | null; // null if not instrumented, never fake 0
  };
  securityEvents: {
    totalAdminActionsInPeriod: number;
    roleChangesCount: number;
    suspensionEventsCount: number;
    policyUpdatesCount: number;
    recentSecurityActions: Array<{
      id: string;
      action: string;
      actor: string;
      target: string;
      createdAt: string;
    }>;
  };
}

export class AdminAnalyticsService {
  /**
   * Compiles authentic database-backed analytics and reporting metrics.
   */
  static async getReports(timeRange: string = '30d'): Promise<ReportsAnalyticsData> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '365d':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // 1. Users Analytics
    const [allUsers, newUsersInPeriod] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, role: { select: { name: true } }, isActive: true, createdAt: true, institution: true, email: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u) => u.isActive).length;
    const suspendedUsers = totalUsers - activeUsers;

    const roleCounts: Record<string, number> = {};
    allUsers.forEach((u) => {
      const r = u.role.name || 'User';
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    });

    const roleBreakdown = Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
    }));

    // Growth Timeline (grouped by interval)
    const growthTimeline: Array<{ period: string; newUsers: number; cumulative: number }> = [];
    const intervalDays = timeRange === '7d' ? 1 : timeRange === '30d' ? 5 : timeRange === '90d' ? 14 : 30;
    let curr = new Date(startDate.getTime());
    let cumulative = allUsers.filter((u) => u.createdAt < startDate).length;

    while (curr <= now) {
      const next = new Date(curr.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const added = allUsers.filter((u) => u.createdAt >= curr && u.createdAt < next).length;
      cumulative += added;
      growthTimeline.push({
        period: curr.toISOString().split('T')[0],
        newUsers: added,
        cumulative,
      });
      curr = next;
    }

    // 2. Organization Activity
    const orgMap: Record<string, { membersCount: number; projectsCount: number; domain: string; name: string }> = {};
    allUsers.forEach((u) => {
      const orgName = u.institution?.trim() || (u.email.includes('@') ? u.email.split('@')[1] : 'Independent');
      if (!orgMap[orgName]) {
        orgMap[orgName] = {
          name: orgName,
          domain: u.email.includes('@') ? u.email.split('@')[1] : 'patenthub.ai',
          membersCount: 0,
          projectsCount: 0,
        };
      }
      orgMap[orgName].membersCount++;
    });

    const allProjects = await prisma.patentProject.findMany({
      select: {
        id: true,
        title: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
        isArchived: true,
        owner: { select: { institution: true, email: true } },
      },
    });

    allProjects.forEach((p) => {
      const orgName = p.owner.institution?.trim() || (p.owner.email.includes('@') ? p.owner.email.split('@')[1] : 'Independent');
      if (orgMap[orgName]) {
        orgMap[orgName].projectsCount++;
      }
    });

    const topOrganizations = Object.entries(orgMap)
      .map(([name, data], idx) => ({
        id: `org-${idx + 1}`,
        name,
        domain: data.domain,
        membersCount: data.membersCount,
        projectsCount: data.projectsCount,
        status: 'ACTIVE',
      }))
      .sort((a, b) => b.projectsCount + b.membersCount - (a.projectsCount + a.membersCount))
      .slice(0, 10);

    const totalOrganizations = Math.max(Object.keys(orgMap).length, 1);
    const avgMembersPerOrg = Math.round((totalUsers / totalOrganizations) * 10) / 10;

    // 3. Project Lifecycle & Stalled Projects
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const stalledProjects = allProjects.filter(
      (p) => !p.isArchived && p.stage !== 'FILED' && new Date(p.updatedAt) < thirtyDaysAgo
    ).length;

    const stageDist: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 0,
      PROTOTYPE: 0,
      DOCUMENTATION: 0,
      FORMS_PREPARATION: 0,
      GUIDE_REVIEW: 0,
      PATENT_EXPERT_REVIEW: 0,
      FILING_READY: 0,
      FILED: 0,
    };
    let totalAgeDays = 0;

    allProjects.forEach((p) => {
      stageDist[p.stage] = (stageDist[p.stage] || 0) + 1;
      const ageMs = now.getTime() - new Date(p.createdAt).getTime();
      totalAgeDays += Math.floor(ageMs / (24 * 60 * 60 * 1000));
    });

    const avgProjectAgeDays = allProjects.length > 0 ? Math.round(totalAgeDays / allProjects.length) : 0;
    const filingReadyCount = (stageDist['FILING_READY'] || 0) + (stageDist['FILED'] || 0);

    // Roadmap Milestones
    const [totalMilestones, completedMilestones] = await Promise.all([
      prisma.roadmapMilestone.count(),
      prisma.roadmapMilestone.count({ where: { status: 'COMPLETED' } }),
    ]);

    // 4. Review Workload & Turnaround Times
    const reviews = await prisma.projectReview.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        decision: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let approvedReviews = 0;
    let rejectedReviews = 0;
    let pendingReviews = 0;
    let totalTurnaroundDays = 0;
    let decidedCount = 0;
    let under2Days = 0;
    let twoToFiveDays = 0;
    let overFiveDays = 0;

    reviews.forEach((r) => {
      if (r.decision === 'PENDING') {
        pendingReviews++;
      } else {
        if (r.decision === 'APPROVED') approvedReviews++;
        if (r.decision === 'REJECTED') rejectedReviews++;
        decidedCount++;
        const days = (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (24 * 60 * 60 * 1000);
        totalTurnaroundDays += Math.max(days, 0.1);
        if (days <= 2) under2Days++;
        else if (days <= 5) twoToFiveDays++;
        else overFiveDays++;
      }
    });

    const avgTurnaroundDays = decidedCount > 0 ? Math.round((totalTurnaroundDays / decidedCount) * 10) / 10 : 0;

    // 5. Filing Deadlines & Tasks
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [deadlines, tasks] = await Promise.all([
      prisma.deadline.findMany({
        where: { dueDate: { gte: now } },
        include: { project: { select: { title: true } } },
        orderBy: { dueDate: 'asc' },
        take: 15,
      }),
      prisma.task.findMany({
        select: { status: true, dueDate: true },
      }),
    ]);

    const upcoming30Days = deadlines.filter((d) => new Date(d.dueDate) <= in30Days).length;
    const upcoming60Days = deadlines.filter((d) => new Date(d.dueDate) <= in60Days).length;
    const upcoming90Days = deadlines.filter((d) => new Date(d.dueDate) <= in90Days).length;

    const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED').length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

    const deadlinesList = deadlines.map((d) => {
      const daysRemaining = Math.max(0, Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      return {
        id: d.id,
        projectTitle: d.project.title,
        deadlineType: d.deadlineType || 'Statutory Filing Deadline',
        dueDate: new Date(d.dueDate).toLocaleDateString(),
        daysRemaining,
        status: d.status || 'UPCOMING',
      };
    });

    // Readiness distribution (based on project stage maturity)
    let highReadiness = 0;
    let mediumReadiness = 0;
    let lowReadiness = 0;
    allProjects.forEach((p) => {
      if (['FILING_READY', 'FILED'].includes(p.stage)) highReadiness++;
      else if (['FORMS_PREPARATION', 'GUIDE_REVIEW', 'PATENT_EXPERT_REVIEW'].includes(p.stage)) mediumReadiness++;
      else lowReadiness++;
    });

    // 6. AI Telemetry & Usage
    const aiLogs = await prisma.activityLog.findMany({
      where: {
        type: 'AI',
        createdAt: { gte: startDate },
      },
      select: { action: true },
    });

    const operationsByType: Record<string, number> = {};
    aiLogs.forEach((l) => {
      operationsByType[l.action] = (operationsByType[l.action] || 0) + 1;
    });

    const aiConfigured = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.length > 5 &&
      process.env.GEMINI_API_KEY !== 'your_api_key'
    );

    // 7. Security & Admin Actions
    const [adminLogs, sensitiveStats] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          type: { in: ['AUDIT', 'SECURITY', 'ADMIN'] },
          createdAt: { gte: startDate },
        },
        include: {
          user: { select: { fullName: true, username: true } },
          project: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.activityLog.groupBy({
        by: ['action'],
        where: {
          type: { in: ['AUDIT', 'SECURITY', 'ADMIN'] },
          createdAt: { gte: startDate },
        },
        _count: { action: true },
      }),
    ]);

    let roleChangesCount = 0;
    let suspensionEventsCount = 0;
    let policyUpdatesCount = 0;
    sensitiveStats.forEach((s) => {
      if (s.action.includes('ROLE')) roleChangesCount += s._count.action;
      if (s.action.includes('STATUS') || s.action.includes('SUSPEND')) suspensionEventsCount += s._count.action;
      if (s.action.includes('POLICY')) policyUpdatesCount += s._count.action;
    });

    const recentSecurityActions = adminLogs.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.user?.fullName || l.user?.username || 'Platform Admin',
      target: l.project?.title || (l.metadata as any)?.targetId || 'Platform Policy / User',
      createdAt: new Date(l.createdAt).toLocaleDateString(),
    }));

    return {
      timeRange,
      generatedAt: now.toISOString(),
      userGrowth: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        newUsersInPeriod,
        roleBreakdown,
        growthTimeline,
      },
      organizationActivity: {
        totalOrganizations,
        activeOrganizations: totalOrganizations,
        avgMembersPerOrg,
        topOrganizations,
      },
      projectLifecycle: {
        totalProjects: allProjects.length,
        activeProjects: allProjects.filter((p) => !p.isArchived).length,
        stalledProjects,
        filingReadyCount,
        avgProjectAgeDays,
        stageDistribution: stageDist,
        roadmapMilestones: {
          total: totalMilestones,
          completed: completedMilestones,
          completionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        },
      },
      reviewPerformance: {
        totalReviews: reviews.length,
        pendingReviews,
        approvedReviews,
        rejectedReviews,
        avgTurnaroundDays,
        turnaroundDistribution: {
          under2Days,
          twoToFiveDays,
          overFiveDays,
        },
      },
      filingDeadlines: {
        upcoming30Days,
        upcoming60Days,
        upcoming90Days,
        overdueTasks,
        completedTasks,
        readinessDistribution: {
          high: highReadiness,
          medium: mediumReadiness,
          low: lowReadiness,
        },
        deadlinesList,
      },
      aiTelemetry: {
        telemetryCollected: true,
        provider: 'Google Gemini Pro',
        status: aiConfigured ? 'AVAILABLE' : 'STATUS_UNAVAILABLE',
        totalOperationsInPeriod: aiLogs.length,
        operationsByType,
        avgLatencyMs: null, // Clearly distinguish uninstrumented latency from 0
      },
      securityEvents: {
        totalAdminActionsInPeriod: adminLogs.length,
        roleChangesCount,
        suspensionEventsCount,
        policyUpdatesCount,
        recentSecurityActions,
      },
    };
  }
}
