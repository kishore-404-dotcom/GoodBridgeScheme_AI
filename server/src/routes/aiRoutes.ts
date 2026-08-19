import { Router } from 'express';
import { AIController } from '../controllers/aiController';

const router = Router();

// POST /api/ai/chat - Multilingual Gemini RAG Conversational Guidance
router.post('/chat', AIController.chatAssistant);

// POST /api/ai/draft - Generate pre-filled application draft
router.post('/draft', AIController.generateDraft);

export default router;
