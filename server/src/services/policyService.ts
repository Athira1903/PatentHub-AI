import { prisma } from '../config/db';

export interface CreatePolicyInput {
  name: string;
  description?: string;
  rules?: any;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdatePolicyInput {
  name?: string;
  description?: string;
  rules?: any;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface AssignPolicyInput {
  userIds?: string[];
  role?: string; // 'INVENTORS' | 'GUIDES' | 'PATENT_EXPERTS' | 'ALL'
  expiresAt?: string | Date;
}

export class PolicyService {
  /**
   * Create a new organization policy.
   */
  static async createPolicy(orgId: string, createdById: string, data: CreatePolicyInput) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Policy name is required.');
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new Error('Organization not found.');
    }

    return prisma.policy.create({
      data: {
        organizationId: orgId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        rules: data.rules || null,
        status: data.status || 'ACTIVE',
        createdById,
      },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  /**
   * Update an existing policy.
   */
  static async updatePolicy(orgId: string, policyId: string, data: UpdatePolicyInput) {
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
    });

    if (!policy) {
      throw new Error('Policy not found in this organization.');
    }

    return prisma.policy.update({
      where: { id: policyId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.rules !== undefined && { rules: data.rules }),
        ...(data.status && { status: data.status }),
      },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  /**
   * Update status (ACTIVE / INACTIVE) of a policy.
   */
  static async updatePolicyStatus(orgId: string, policyId: string, status: 'ACTIVE' | 'INACTIVE') {
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
    });

    if (!policy) {
      throw new Error('Policy not found in this organization.');
    }

    return prisma.policy.update({
      where: { id: policyId },
      data: { status },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get all policies for an organization.
   */
  static async getOrganizationPolicies(orgId: string, search?: string, status?: string) {
    const whereClause: any = {
      organizationId: orgId,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const policies = await prisma.policy.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
        assignments: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return policies.map((p) => {
      const activeAssignments = p.assignments.filter((a) => a.status === 'ACTIVE');
      return {
        id: p.id,
        organizationId: p.organizationId,
        name: p.name,
        description: p.description,
        rules: p.rules,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: p.createdBy,
        activeAssignmentsCount: activeAssignments.length,
        totalAssignmentsCount: p.assignments.length,
      };
    });
  }

  /**
   * Get single policy details with active and historical assignments.
   */
  static async getPolicyDetails(orgId: string, policyId: string) {
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
      include: {
        organization: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                role: { select: { name: true } },
                profile: { select: { department: true } },
              },
            },
            assignedBy: { select: { id: true, fullName: true, username: true } },
            revokedBy: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!policy) {
      throw new Error('Policy not found in this organization.');
    }

    const activeAssignments = policy.assignments.filter((a) => a.status === 'ACTIVE');

    return {
      ...policy,
      activeAssignments,
      activeAssignmentsCount: activeAssignments.length,
      totalAssignmentsCount: policy.assignments.length,
    };
  }

  /**
   * Assign a policy to users or by role within the organization.
   */
  static async assignPolicy(orgId: string, policyId: string, assignedById: string, data: AssignPolicyInput) {
    // 1. Verify policy belongs to this organization
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId: orgId },
    });

    if (!policy) {
      throw new Error('Policy not found in this organization.');
    }

    if (policy.status !== 'ACTIVE') {
      throw new Error('Cannot assign an inactive policy. Please activate it first.');
    }

    // 2. Resolve target users
    let targetUserIds: string[] = [];

    if (data.userIds && data.userIds.length > 0) {
      // Verify all users belong to this organization
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: data.userIds },
          organizationId: orgId,
        },
        select: { id: true },
      });
      targetUserIds = validUsers.map((u) => u.id);
    } else if (data.role) {
      const roleWhere: any = { organizationId: orgId };
      if (data.role === 'INVENTORS' || data.role === 'Inventor') {
        roleWhere.role = { name: { in: ['Inventor', 'CoInventor'] } };
      } else if (data.role === 'GUIDES' || data.role === 'Guide') {
        roleWhere.role = { name: 'Guide' };
      } else if (data.role === 'PATENT_EXPERTS' || data.role === 'PatentExpert') {
        roleWhere.role = { name: 'PatentExpert' };
      } else if (data.role === 'ALL') {
        // all members
      }

      const roleUsers = await prisma.user.findMany({
        where: roleWhere,
        select: { id: true },
      });
      targetUserIds = roleUsers.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      throw new Error('No eligible users found in this organization for assignment.');
    }

    // 3. Prevent duplicate active assignments
    const existingActive = await prisma.policyAssignment.findMany({
      where: {
        policyId,
        organizationId: orgId,
        userId: { in: targetUserIds },
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    const activeUserSet = new Set(existingActive.map((a) => a.userId));
    const toAssignUserIds = targetUserIds.filter((id) => !activeUserSet.has(id));

    if (toAssignUserIds.length === 0) {
      return {
        message: 'All selected users already have an active assignment for this policy.',
        assignedCount: 0,
        skippedCount: targetUserIds.length,
        assignments: [],
      };
    }

    // 4. Create assignments
    const expiresDate = data.expiresAt ? new Date(data.expiresAt) : null;
    const assignments = await prisma.$transaction(
      toAssignUserIds.map((userId) =>
        prisma.policyAssignment.create({
          data: {
            policyId,
            userId,
            organizationId: orgId,
            assignedById,
            assignedAt: new Date(),
            expiresAt: expiresDate,
            status: 'ACTIVE',
          },
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true } },
            policy: { select: { id: true, name: true } },
          },
        })
      )
    );

    return {
      message: `Successfully assigned policy to ${assignments.length} user(s).`,
      assignedCount: assignments.length,
      skippedCount: targetUserIds.length - assignments.length,
      assignments,
    };
  }

  /**
   * Revoke an active policy assignment.
   */
  static async revokePolicyAssignment(orgId: string, assignmentId: string, revokedById: string) {
    const assignment = await prisma.policyAssignment.findFirst({
      where: { id: assignmentId, organizationId: orgId },
    });

    if (!assignment) {
      throw new Error('Policy assignment not found in this organization.');
    }

    if (assignment.status === 'REVOKED') {
      throw new Error('Policy assignment has already been revoked.');
    }

    return prisma.policyAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedById,
      },
      include: {
        policy: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, username: true, email: true } },
        assignedBy: { select: { id: true, fullName: true, username: true } },
        revokedBy: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  /**
   * Get policy assignment history (audit trail).
   */
  static async getPolicyAssignmentHistory(orgId: string, search?: string, statusFilter?: string) {
    const whereClause: any = {
      organizationId: orgId,
    };

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { policy: { name: { contains: q, mode: 'insensitive' } } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    return prisma.policyAssignment.findMany({
      where: whereClause,
      include: {
        policy: { select: { id: true, name: true, description: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            role: { select: { name: true } },
            profile: { select: { department: true } },
          },
        },
        assignedBy: { select: { id: true, fullName: true, username: true } },
        revokedBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Get active policies assigned to a specific user (Inventor / Guide / Patent Expert view).
   */
  static async getUserPolicies(userId: string) {
    const assignments = await prisma.policyAssignment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        policy: {
          select: {
            id: true,
            name: true,
            description: true,
            rules: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
            contactNumber: true,
            domain: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return assignments.map((a) => ({
      assignmentId: a.id,
      policyId: a.policy.id,
      name: a.policy.name,
      description: a.policy.description,
      rules: a.policy.rules,
      policyStatus: a.policy.status,
      assignedAt: a.assignedAt,
      expiresAt: a.expiresAt,
      organizationName: a.organization.name,
      organization: a.organization,
      assignedBy: a.assignedBy,
      status: a.status,
    }));
  }
}
