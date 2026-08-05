"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.post('/', projectController_1.createProject);
router.get('/', projectController_1.getProjects);
router.get('/:id', projectController_1.getProjectById);
router.put('/:id', projectController_1.updateProject);
router.put('/:id/archive', projectController_1.archiveProject);
router.delete('/:id', projectController_1.deleteProject);
router.post('/:id/members', projectController_1.inviteMember);
// Task Management Endpoints
router.post('/:id/tasks', projectController_1.createTask);
router.put('/:id/tasks/:taskId', projectController_1.updateTask);
router.delete('/:id/tasks/:taskId', projectController_1.deleteTask);
// Simulated AI Innovation & Diagnostics endpoints
router.post('/:id/ai/innovation', aiController_1.generateInnovationAi);
router.get('/:id/ai/similarity', aiController_1.getSimilarityAnalysis);
router.get('/:id/ai/novelty', aiController_1.getNoveltyAssessment);
router.post('/:id/ai/drawing', aiController_1.generatePatentDrawing);
exports.default = router;
