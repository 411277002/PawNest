import { Router } from 'express';
import {
  login,
  register,
  me,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { authRequired } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authRequired, me);

router.put('/profile', authRequired, updateProfile);
router.put('/change-password', authRequired, changePassword);

export default router;