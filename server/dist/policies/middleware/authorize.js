"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
/**
   * Generic functional authorization middleware.
   * Receives a policy evaluator function and checks it against the authenticated user and request.
   */
const authorize = (policyEvaluator) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Access denied. Unauthorized.' });
                return;
            }
            const isAllowed = await policyEvaluator(req.user, req);
            if (!isAllowed) {
                res.status(403).json({ message: 'Access denied. Forbidden by policy.' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(403).json({ message: error.message || 'Access denied.' });
        }
    };
};
exports.authorize = authorize;
