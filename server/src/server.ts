import dotenv from 'dotenv';
import app from './app';
import { seedRoles } from './services/authService';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Seed default roles
    await seedRoles();
    console.log('✅ Default roles (Inventor, Guide, CoInventor, PatentExpert, Admin) verified in DB.');

    app.listen(PORT, () => {
      console.log(`🚀 PatentHub AI Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
