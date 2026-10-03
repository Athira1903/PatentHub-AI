import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { OrganizationService } from '../services/organizationService';
import { OrganizationPolicy } from '../policies/organization/organization.policy';

export const getMyOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(404).json({ message: 'User is not associated with an organization.' });
      return;
    }

    const org = await OrganizationService.getOrganizationDetails(orgId);
    res.status(200).json({ organization: org });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch organization details.' });
  }
};

export const getOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You do not belong to this organization.' });
      return;
    }

    const org = await OrganizationService.getOrganizationDetails(orgId);
    res.status(200).json({ organization: org });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch organization.' });
  }
};

export const updateOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can update organization settings.' });
      return;
    }

    const updated = await OrganizationService.updateOrganizationDetails(orgId, req.body);
    res.status(200).json({ message: 'Organization updated successfully.', organization: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update organization.' });
  }
};

export const getOrganizationDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You cannot view this organization dashboard.' });
      return;
    }

    const data = await OrganizationService.getOrganizationDashboardMetrics(orgId);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch organization dashboard.' });
  }
};

export const getOrganizationUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You cannot view this organization users.' });
      return;
    }

    const { role, status, search } = req.query;
    const users = await OrganizationService.getOrganizationUsers(
      orgId,
      role as string,
      status as string,
      search as string
    );
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch organization users.' });
  }
};

export const addUserToOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can add users.' });
      return;
    }

    const adminUserId = req.user!.userId;
    const result = await OrganizationService.addUserToOrganization(orgId, adminUserId, req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to add user to organization.' });
  }
};

export const getOrganizationProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You cannot view this organization projects.' });
      return;
    }

    const { search, stage } = req.query;
    const projects = await OrganizationService.getOrganizationProjects(
      orgId,
      search as string,
      stage as string
    );
    res.status(200).json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch organization projects.' });
  }
};
