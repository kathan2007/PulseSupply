import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/profile', authenticateJWT, AuthController.getProfile);

export default router;

