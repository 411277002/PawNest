import { Router } from 'express';
import {
  getActivities,
  getActivity,
  getHome,
  getReviews,
  getServices,
  getStores,
  submitContactMessage,
} from '../controllers/publicController.js';

const router = Router();

router.get('/home', getHome);
router.get('/services', getServices);
router.get('/activities', getActivities);
router.get('/activities/:id', getActivity);
router.get('/stores', getStores);
router.get('/reviews', getReviews);

router.post('/contact', submitContactMessage);

export default router;