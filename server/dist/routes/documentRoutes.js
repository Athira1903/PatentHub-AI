"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const documentController_1 = require("../controllers/documentController");
const router = (0, express_1.Router)();
// Configure Multer for project files
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Supported file types: PDF, DOC, DOCX, PNG, JPG, JPEG, TXT'), false);
        }
    },
});
// Authenticate all document operations
router.use(authMiddleware_1.authenticateToken);
router.post('/upload', upload.single('document'), documentController_1.uploadDocument);
router.delete('/:id', documentController_1.deleteDocument);
exports.default = router;
