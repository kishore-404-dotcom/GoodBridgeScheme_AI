import { Router } from 'express';
import { SchemeController } from '../controllers/schemeController';

const router = Router();

// GET /api/schemes - Search & Filter all verified schemes
router.get('/', SchemeController.getAllSchemes);

// GET /api/schemes/:schemeId - Get single scheme details
router.get('/:schemeId', SchemeController.getSchemeById);

export default router;
