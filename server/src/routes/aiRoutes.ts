import { Router } from 'express';
import { AIController } from '../controllers/aiController';

const router = Router();

// POST /api/ai/chat - Multilingual Gemini RAG Conversational Guidance
router.post('/chat', AIController.chatAssistant);

// POST /api/ai/translate - Translate scheme text into a regional language (cached)
router.post('/translate', AIController.translateSchemes);

// POST /api/ai/tts - Read text aloud in a regional language (WAV audio)
router.post('/tts', AIController.textToSpeech);

// POST /api/ai/draft - Generate pre-filled application draft
router.post('/draft', AIController.generateDraft);

export default router;
