import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PolicyService } from '../services/policyService';
import { OrganizationPolicy } from '../policies/organization/organization.policy';

export const getOrganizationPolicies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You cannot view this organization policies.' });
      return;
    }

    const { search, status } = req.query;
    const policies = await PolicyService.getOrganizationPolicies(
      orgId,
      search as string,
      status as string
    );
    res.status(200).json({ policies });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch policies.' });
  }
};

export const createPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can create policies.' });
      return;
    }

    const createdById = req.user!.userId;
    const policy = await PolicyService.createPolicy(orgId, createdById, req.body);
    res.status(201).json({ message: 'Policy created successfully.', policy });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create policy.' });
  }
};

export const getPolicyDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    const policyId = req.params.policyId as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You cannot view this policy.' });
      return;
    }

    const policy = await PolicyService.getPolicyDetails(orgId, policyId);
    res.status(200).json({ policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch policy details.' });
  }
};

export const updatePolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    const policyId = req.params.policyId as string;
    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can update policies.' });
      return;
    }

    const policy = await PolicyService.updatePolicy(orgId, policyId, req.body);
    res.status(200).json({ message: 'Policy updated successfully.', policy });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update policy.' });
  }
};

export const updatePolicyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    const policyId = req.params.policyId as string;
    const { status } = req.body;

    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can change policy status.' });
      return;
    }

    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      res.status(400).json({ message: 'Invalid status. Must be ACTIVE or INACTIVE.' });
      return;
    }

    const policy = await PolicyService.updatePolicyStatus(orgId, policyId, status);
    res.status(200).json({ message: `Policy status updated to ${status}.`, policy });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update policy status.' });
  }
};

export const assignPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    const policyId = req.params.policyId as string;
    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can assign policies.' });
      return;
    }

    const assignedById = req.user!.userId;
    const result = await PolicyService.assignPolicy(orgId, policyId, assignedById, req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to assign policy.' });
  }
};

export const revokePolicyAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    const assignmentId = req.params.assignmentId as string;
    if (!OrganizationPolicy.canManagePolicies(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. Only organization administrators can revoke policies.' });
      return;
    }

    const revokedById = req.user!.userId;
    const result = await PolicyService.revokePolicyAssignment(orgId, assignmentId, revokedById);
    res.status(200).json({ message: 'Policy assignment revoked successfully.', assignment: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to revoke policy assignment.' });
  }
};

export const getPolicyAssignmentHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id as string;
    if (!OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
      res.status(403).json({ message: 'Access denied. You cannot view this organization policy history.' });
      return;
    }

    const { search, status } = req.query;
    const history = await PolicyService.getPolicyAssignmentHistory(
      orgId,
      search as string,
      status as string
    );
    res.status(200).json({ history });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch policy assignment history.' });
  }
};

export const getMyPolicies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const policies = await PolicyService.getUserPolicies(userId);
    res.status(200).json({ policies });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch your policies.' });
  }
};
