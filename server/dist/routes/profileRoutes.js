"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const profileController_1 = require("../controllers/profileController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files (JPG, PNG, JPEG) are allowed.'), false);
        }
    },
});
// Protect all profile endpoints with JWT verification middleware
router.use(authMiddleware_1.authenticateToken);
router.post('/create', profileController_1.createProfile);
router.get('/me', profileController_1.getProfile);
router.put('/update', profileController_1.updateProfile);
router.post('/upload-photo', upload.single('photo'), profileController_1.uploadPhoto);
router.delete('/photo', profileController_1.deletePhoto);
exports.default = router;
