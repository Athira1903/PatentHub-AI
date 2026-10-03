"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEntitlement = void 0;
const entitlementService_1 = require("../services/entitlementService");
const db_1 = require("../config/db");
const requireEntitlement = (featureCode) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ message: 'Authentication required.' });
                return;
            }
            // Platform Admins bypass organization entitlement gating
            if (user.role === 'Admin' || user.role === 'Administrator') {
                next();
                return;
            }
            let organizationId = user.organizationId;
            if (!organizationId) {
                // Fallback: check database for user's organizationId
                const dbUser = await db_1.prisma.user.findUnique({
                    where: { id: user.userId },
                    select: { organizationId: true },
                });
                organizationId = dbUser?.organizationId || null;
            }
            if (!organizationId) {
                // Also check if the project belongs to an organization if projectId is in req.params
                const rawParam = req.params.id || req.params.projectId;
                const projectId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
                if (projectId) {
                    const project = await db_1.prisma.patentProject.findUnique({
                        where: { id: projectId },
                        select: { organizationId: true },
                    });
                    organizationId = project?.organizationId || null;
                }
            }
            if (!organizationId) {
                res.status(403).json({
                    error: 'Subscription Required',
                    message: `The '${featureCode}' feature requires an active organization Free Trial or PRO subscription.`,
                    featureCode,
                    upgradeRequired: true,
                    availablePlansUrl: '/api/billing/plans',
                });
                return;
            }
            const hasAccess = await entitlementService_1.EntitlementService.hasFeature(organizationId, featureCode);
            if (!hasAccess) {
                res.status(403).json({
                    error: 'Feature Not Entitled',
                    message: `Your organization does not have an active entitlement for '${featureCode}'. Please upgrade to PatentHub Pro.`,
                    featureCode,
                    upgradeRequired: true,
                    availablePlansUrl: '/api/billing/plans',
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('[requireEntitlement] Error:', error.message);
            res.status(500).json({ message: 'Internal entitlement validation error.' });
        }
    };
};
exports.requireEntitlement = requireEntitlement;
