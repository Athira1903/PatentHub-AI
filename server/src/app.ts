import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import profileRoutes from './routes/profileRoutes';
import userRoutes from './routes/userRoutes';
import collaborationRoutes from './routes/collaborationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import documentRoutes from './routes/documentRoutes';
import adminRoutes from './routes/adminRoutes';
import organizationRoutes from './routes/organizationRoutes';
import policyRoutes from './routes/policyRoutes';
import billingRoutes from './routes/billingRoutes';

const app = express();

app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Serve local static uploaded profile pictures and documents
const uploadsDir = path.join(__dirname, '../public/uploads');
const documentsDir = path.join(uploadsDir, 'documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

import { searchIPC } from './controllers/patentEngineController';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ipc', searchIPC);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'PatentHub AI Backend Service',
    timestamp: new Date().toISOString(),
  });
});

// 404 Catch-All Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

export default app;
