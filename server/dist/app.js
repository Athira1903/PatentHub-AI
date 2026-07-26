"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'PatentHub AI API is running cleanly',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
