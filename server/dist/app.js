"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const collaborationRoutes_1 = __importDefault(require("./routes/collaborationRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const organizationRoutes_1 = __importDefault(require("./routes/organizationRoutes"));
const policyRoutes_1 = __importDefault(require("./routes/policyRoutes"));
const billingRoutes_1 = __importDefault(require("./routes/billingRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
// Serve local static uploaded profile pictures and documents
const uploadsDir = path_1.default.join(__dirname, '../public/uploads');
const documentsDir = path_1.default.join(uploadsDir, 'documents');
if (!fs_1.default.existsSync(documentsDir)) {
    fs_1.default.mkdirSync(documentsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
const patentEngineController_1 = require("./controllers/patentEngineController");
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/collaboration', collaborationRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/organizations', organizationRoutes_1.default);
app.use('/api/policies', policyRoutes_1.default);
app.use('/api/billing', billingRoutes_1.default);
app.use('/api/ipc', patentEngineController_1.searchIPC);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'PatentHub AI Backend Service',
        timestamp: new Date().toISOString(),
    });
});
// 404 Catch-All Handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});
exports.default = app;
