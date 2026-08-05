"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const aiController_1 = require("../controllers/aiController");
const router = (0, express_1.Router)();
// Protect all AI actions with authentication
router.use(authMiddleware_1.authenticateToken);
router.post('/:id/innovation', aiController_1.generateInnovationAi);
router.get('/:id/similarity', aiController_1.getSimilarityAnalysis);
router.get('/:id/novelty', aiController_1.getNoveltyAssessment);
router.post('/:id/drawing', aiController_1.generatePatentDrawing);
exports.default = router;
