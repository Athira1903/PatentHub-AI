"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationProjects = exports.addUserToOrganization = exports.getOrganizationUsers = exports.getOrganizationDashboard = exports.updateOrganization = exports.getOrganization = exports.getMyOrganization = void 0;
const organizationService_1 = require("../services/organizationService");
const organization_policy_1 = require("../policies/organization/organization.policy");
const getMyOrganization = async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            res.status(404).json({ message: 'User is not associated with an organization.' });
            return;
        }
        const org = await organizationService_1.OrganizationService.getOrganizationDetails(orgId);
        res.status(200).json({ organization: org });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch organization details.' });
    }
};
exports.getMyOrganization = getMyOrganization;
const getOrganization = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You do not belong to this organization.' });
            return;
        }
        const org = await organizationService_1.OrganizationService.getOrganizationDetails(orgId);
        res.status(200).json({ organization: org });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch organization.' });
    }
};
exports.getOrganization = getOrganization;
const updateOrganization = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can update organization settings.' });
            return;
        }
        const updated = await organizationService_1.OrganizationService.updateOrganizationDetails(orgId, req.body);
        res.status(200).json({ message: 'Organization updated successfully.', organization: updated });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update organization.' });
    }
};
exports.updateOrganization = updateOrganization;
const getOrganizationDashboard = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You cannot view this organization dashboard.' });
            return;
        }
        const data = await organizationService_1.OrganizationService.getOrganizationDashboardMetrics(orgId);
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch organization dashboard.' });
    }
};
exports.getOrganizationDashboard = getOrganizationDashboard;
const getOrganizationUsers = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You cannot view this organization users.' });
            return;
        }
        const { role, status, search } = req.query;
        const users = await organizationService_1.OrganizationService.getOrganizationUsers(orgId, role, status, search);
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch organization users.' });
    }
};
exports.getOrganizationUsers = getOrganizationUsers;
const addUserToOrganization = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canManagePolicies(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. Only organization administrators can add users.' });
            return;
        }
        const adminUserId = req.user.userId;
        const result = await organizationService_1.OrganizationService.addUserToOrganization(orgId, adminUserId, req.body);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to add user to organization.' });
    }
};
exports.addUserToOrganization = addUserToOrganization;
const getOrganizationProjects = async (req, res) => {
    try {
        const orgId = req.params.id;
        if (!organization_policy_1.OrganizationPolicy.canAccessOrganization(req.user, orgId)) {
            res.status(403).json({ message: 'Access denied. You cannot view this organization projects.' });
            return;
        }
        const { search, stage } = req.query;
        const projects = await organizationService_1.OrganizationService.getOrganizationProjects(orgId, search, stage);
        res.status(200).json({ projects });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch organization projects.' });
    }
};
exports.getOrganizationProjects = getOrganizationProjects;
