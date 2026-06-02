import { Router } from 'express';
import { authRequired, allowRoles } from '../middlewares/auth.js';
import { createReview } from '../controllers/reviewsController.js';

const router = Router();
router.post('/', authRequired, allowRoles('customer'), createReview);
export default router;
