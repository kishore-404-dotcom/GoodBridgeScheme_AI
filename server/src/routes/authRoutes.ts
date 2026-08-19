import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

// POST /api/auth/register - Register citizen profile
router.post('/register', AuthController.register);

// POST /api/auth/login - Login citizen profile
router.post('/login', AuthController.login);

export default router;
