import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { seedRoles } from './services/authService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Seed default roles
    await seedRoles();
    console.log('✅ Default roles (Inventor, Guide, CoInventor, PatentExpert, Admin) verified in DB.');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 PatentHub AI Backend server running on port ${PORT} (0.0.0.0)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
