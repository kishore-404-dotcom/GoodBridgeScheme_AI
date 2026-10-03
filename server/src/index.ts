// Load .env before any module reads process.env (e.g. config/gemini.ts)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase, isDatabaseConnected } from './config/database';
import { syncSchemes } from './scripts/seedSchemes';
import { syncTranslationsWithDb } from './services/translationService';
import schemeRoutes from './routes/schemeRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
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
    database: isDatabaseConnected() ? 'connected' : 'not connected (using built-in data)',
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
app.use('/api', feedbackRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Bootstrap Server & Connect DB
const startServer = async () => {
  const isDbConnected = await connectDatabase();
  if (isDbConnected) {
    await syncSchemes();
    await syncTranslationsWithDb();
  }

  app.listen(PORT, () => {
    console.log(`🚀 GoodBridgeScheme AI Backend REST API Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
