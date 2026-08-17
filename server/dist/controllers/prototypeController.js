"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFigureSheetPdf = exports.analyzeFigureImageVision = exports.updateFigureComponents = exports.deleteFigure = exports.updateFigure = exports.createFigure = exports.getFigures = exports.deletePrototype = exports.updatePrototype = exports.getPrototypeById = exports.createPrototype = exports.getPrototypes = void 0;
const prototypeService_1 = require("../services/prototypeService");
const aiService_1 = require("../services/aiService");
const pdfService_1 = require("../services/pdfService");
const db_1 = require("../config/db");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getPrototypes = async (req, res) => {
    try {
        const projectId = req.params.id;
        const prototypes = await prototypeService_1.PrototypeService.getProjectPrototypes(projectId);
        res.status(200).json({ success: true, prototypes });
    }
    catch (error) {
        console.error('getPrototypes Error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch prototypes.' });
    }
};
exports.getPrototypes = getPrototypes;
const createPrototype = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { title, description, status, sourceDocumentId } = req.body;
        const prototype = await prototypeService_1.PrototypeService.createPrototype(projectId, { title, description, status, sourceDocumentId }, req.user?.userId);
        res.status(201).json({ success: true, prototype });
    }
    catch (error) {
        console.error('createPrototype Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create prototype.' });
    }
};
exports.createPrototype = createPrototype;
const getPrototypeById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const prototypeId = req.params.prototypeId;
        const prototype = await prototypeService_1.PrototypeService.getPrototypeById(projectId, prototypeId);
        res.status(200).json({ success: true, prototype });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Prototype not found.' });
    }
};
exports.getPrototypeById = getPrototypeById;
const updatePrototype = async (req, res) => {
    try {
        const projectId = req.params.id;
        const prototypeId = req.params.prototypeId;
        const { title, description, status } = req.body;
        const updated = await prototypeService_1.PrototypeService.updatePrototype(projectId, prototypeId, { title, description, status });
        res.status(200).json({ success: true, prototype: updated });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update prototype.' });
    }
};
exports.updatePrototype = updatePrototype;
const deletePrototype = async (req, res) => {
    try {
        const projectId = req.params.id;
        const prototypeId = req.params.prototypeId;
        await prototypeService_1.PrototypeService.deletePrototype(projectId, prototypeId);
        res.status(200).json({ success: true, message: 'Prototype deleted successfully.' });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to delete prototype.' });
    }
};
exports.deletePrototype = deletePrototype;
const getFigures = async (req, res) => {
    try {
        const projectId = req.params.id;
        const figures = await prototypeService_1.PrototypeService.getProjectFigures(projectId);
        res.status(200).json({ success: true, figures });
    }
    catch (error) {
        console.error('getFigures Error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch drawing figures.' });
    }
};
exports.getFigures = getFigures;
const createFigure = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { prototypeId, figureNumber, title, description, sourceDocumentId } = req.body;
        const figure = await prototypeService_1.PrototypeService.createDrawingFigure(projectId, {
            prototypeId,
            figureNumber,
            title,
            description,
            sourceDocumentId
        });
        res.status(201).json({ success: true, figure });
    }
    catch (error) {
        console.error('createFigure Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create drawing figure.' });
    }
};
exports.createFigure = createFigure;
const updateFigure = async (req, res) => {
    try {
        const projectId = req.params.id;
        const figureId = req.params.figureId;
        const { figureNumber, title, description, analysisStatus, confidence, disclaimer } = req.body;
        const updated = await prototypeService_1.PrototypeService.updateDrawingFigure(projectId, figureId, {
            figureNumber,
            title,
            description,
            analysisStatus,
            confidence,
            disclaimer
        });
        res.status(200).json({ success: true, figure: updated });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update drawing figure.' });
    }
};
exports.updateFigure = updateFigure;
const deleteFigure = async (req, res) => {
    try {
        const projectId = req.params.id;
        const figureId = req.params.figureId;
        await prototypeService_1.PrototypeService.deleteDrawingFigure(projectId, figureId);
        res.status(200).json({ success: true, message: 'Drawing figure deleted successfully.' });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to delete drawing figure.' });
    }
};
exports.deleteFigure = deleteFigure;
const updateFigureComponents = async (req, res) => {
    try {
        const projectId = req.params.id;
        const figureId = req.params.figureId;
        const { components } = req.body;
        if (!Array.isArray(components)) {
            res.status(400).json({ message: 'Components array is required.' });
            return;
        }
        const updatedComponents = await prototypeService_1.PrototypeService.updateFigureComponents(projectId, figureId, components);
        res.status(200).json({ success: true, components: updatedComponents });
    }
    catch (error) {
        console.error('updateFigureComponents Error:', error);
        res.status(400).json({ message: error.message || 'Failed to update figure components.' });
    }
};
exports.updateFigureComponents = updateFigureComponents;
const analyzeFigureImageVision = async (req, res) => {
    try {
        const projectId = req.params.id;
        const figureId = req.params.figureId;
        const figure = await prototypeService_1.PrototypeService.getFigureById(projectId, figureId);
        const project = req.project;
        if (!project || !project.title || !project.innovationIdea || !project.proposedSolution) {
            res.status(400).json({ message: 'Project title, innovation idea, and proposed solution are required for Gemini Vision analysis.' });
            return;
        }
        // Locate source document image
        let imageBuffer = null;
        let mimeType = 'image/png';
        if (figure.sourceDocumentId) {
            const doc = await db_1.prisma.document.findUnique({ where: { id: figure.sourceDocumentId } });
            if (doc && doc.fileUrl) {
                const relativePath = doc.fileUrl.replace('/uploads/documents/', '');
                const physicalPath = path_1.default.join(__dirname, '../../public/uploads/documents', relativePath);
                if (fs_1.default.existsSync(physicalPath)) {
                    imageBuffer = fs_1.default.readFileSync(physicalPath);
                    mimeType = doc.fileType || 'image/png';
                }
            }
        }
        if (!imageBuffer) {
            // Create lightweight placeholder drawing buffer for analysis
            const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="16">Technical Blueprint View - ${figure.figureNumber}</text></svg>`;
            imageBuffer = Buffer.from(placeholderSvg);
            mimeType = 'image/svg+xml';
        }
        const visionResult = await aiService_1.AiService.analyzePrototypeImageVision(imageBuffer, mimeType, {
            title: project.title,
            innovationIdea: project.innovationIdea,
            proposedSolution: project.proposedSolution
        });
        // Persist components to database
        const savedComponents = await prototypeService_1.PrototypeService.updateFigureComponents(projectId, figure.id, visionResult.components.map((c) => ({
            referenceNumber: c.referenceNumber,
            componentName: c.name,
            description: c.description
        })));
        // Update DrawingFigure analysis status & confidence
        const updatedFigure = await prototypeService_1.PrototypeService.updateDrawingFigure(projectId, figure.id, {
            description: visionResult.figureDescription,
            analysisStatus: 'ANALYZED',
            confidence: visionResult.confidence,
            disclaimer: visionResult.disclaimer
        });
        res.status(200).json({
            success: true,
            figure: updatedFigure,
            components: savedComponents,
            confidence: visionResult.confidence,
            disclaimer: visionResult.disclaimer
        });
    }
    catch (error) {
        console.error('analyzeFigureImageVision Error:', error);
        res.status(502).json({ message: error.message || 'Google Gemini Vision analysis is currently unavailable.' });
    }
};
exports.analyzeFigureImageVision = analyzeFigureImageVision;
const generateFigureSheetPdf = async (req, res) => {
    try {
        const projectId = req.params.id;
        const figureId = req.params.figureId;
        const document = await pdfService_1.PdfService.generatePatentFigureSheetPdf(projectId, figureId, req.user?.userId);
        res.status(201).json({ success: true, message: 'Technical figure sheet PDF generated successfully.', document });
    }
    catch (error) {
        console.error('generateFigureSheetPdf Error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate figure sheet PDF.' });
    }
};
exports.generateFigureSheetPdf = generateFigureSheetPdf;
