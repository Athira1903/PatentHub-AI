"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPolicies = exports.getPolicyAssignmentHistory = exports.revokePolicyAssignment = exports.assignPolicy = exports.updatePolicyStatus = exports.updatePolicy = exports.getPolicyDetails = exports.createPolicy = exports.getOrganizationPolicies = void 0;
const policyService_1 = require("../services/policyService");
const organization_policy_1 = require("../policies/organization/organization.policy");
const getOrganizationPolicies = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You cannot view this organization policies.' });
            return;
        }
        const { search, status } = req.query;
        const policies = await policyService_1.PolicyService.getOrganizationPolicies(orgId, search, status);
        res.status(200).json({ policies });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch policies.' });
    }
};
exports.getOrganizationPolicies = getOrganizationPolicies;
const createPolicy = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can create policies.' });
            return;
        }
        const createdById = req.user.userId;
        const policy = await policyService_1.PolicyService.createPolicy(orgId, createdById, req.body);
        res.status(201).json({ message: 'Policy created successfully.', policy });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create policy.' });
    }
};
exports.createPolicy = createPolicy;
const getPolicyDetails = async (req, res) => {
    try {
        const orgId = req.params.id;
        const policyId = req.params.policyId;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You cannot view this policy.' });
            return;
        }
        const policy = await policyService_1.PolicyService.getPolicyDetails(orgId, policyId);
        res.status(200).json({ policy });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch policy details.' });
    }
};
exports.getPolicyDetails = getPolicyDetails;
const updatePolicy = async (req, res) => {
    try {
        const orgId = req.params.id;
        const policyId = req.params.policyId;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can update policies.' });
            return;
        }
        const policy = await policyService_1.PolicyService.updatePolicy(orgId, policyId, req.body);
        res.status(200).json({ message: 'Policy updated successfully.', policy });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update policy.' });
    }
};
exports.updatePolicy = updatePolicy;
const updatePolicyStatus = async (req, res) => {
    try {
        const orgId = req.params.id;
        const policyId = req.params.policyId;
        const { status } = req.body;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can change policy status.' });
            return;
        }
        if (status !== 'ACTIVE' && status !== 'INACTIVE') {
            res.status(400).json({ message: 'Invalid status. Must be ACTIVE or INACTIVE.' });
            return;
        }
        const policy = await policyService_1.PolicyService.updatePolicyStatus(orgId, policyId, status);
        res.status(200).json({ message: `Policy status updated to ${status}.`, policy });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update policy status.' });
    }
};
exports.updatePolicyStatus = updatePolicyStatus;
const assignPolicy = async (req, res) => {
    try {
        const orgId = req.params.id;
        const policyId = req.params.policyId;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can assign policies.' });
            return;
        }
        const assignedById = req.user.userId;
        const result = await policyService_1.PolicyService.assignPolicy(orgId, policyId, assignedById, req.body);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to assign policy.' });
    }
};
exports.assignPolicy = assignPolicy;
const revokePolicyAssignment = async (req, res) => {
    try {
        const orgId = req.params.id;
        const assignmentId = req.params.assignmentId;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can revoke policies.' });
            return;
        }
        const revokedById = req.user.userId;
        const result = await policyService_1.PolicyService.revokePolicyAssignment(orgId, assignmentId, revokedById);
        res.status(200).json({ message: 'Policy assignment revoked successfully.', assignment: result });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to revoke policy assignment.' });
    }
};
exports.revokePolicyAssignment = revokePolicyAssignment;
const getPolicyAssignmentHistory = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You cannot view this organization policy history.' });
            return;
        }
        const { search, status } = req.query;
        const history = await policyService_1.PolicyService.getPolicyAssignmentHistory(orgId, search, status);
        res.status(200).json({ history });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch policy assignment history.' });
    }
};
exports.getPolicyAssignmentHistory = getPolicyAssignmentHistory;
const getMyPolicies = async (req, res) => {
    try {
        const userId = req.user.userId;
        const policies = await policyService_1.PolicyService.getUserPolicies(userId);
        res.status(200).json({ policies });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch your policies.' });
    }
};
exports.getMyPolicies = getMyPolicies;
