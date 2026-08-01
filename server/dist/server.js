"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const authService_1 = require("./services/authService");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Seed default roles
        await (0, authService_1.seedRoles)();
        console.log('✅ Default roles (Inventor, Guide, CoInventor, PatentExpert, Admin) verified in DB.');
        app_1.default.listen(PORT, () => {
            console.log(`🚀 PatentHub AI Backend server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
