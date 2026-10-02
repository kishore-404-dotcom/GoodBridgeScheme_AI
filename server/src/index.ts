// Load .env before any module reads process.env (e.g. config/gemini.ts)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { seedDatabase } from './scripts/seedSchemes';
import schemeRoutes from './routes/schemeRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'GoodBridgeScheme AI API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/schemes', schemeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Bootstrap Server & Connect DB
const startServer = async () => {
  const isDbConnected = await connectDatabase();
  if (isDbConnected) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`🚀 GoodBridgeScheme AI Backend REST API Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
