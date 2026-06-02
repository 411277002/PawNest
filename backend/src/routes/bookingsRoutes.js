import { Router } from 'express';
import {
  createBooking,
  createTimeBlock,
  deleteBooking,
  deleteTimeBlock,
  getAvailability,
  getBookingOptions,
  listBookings,
  listMyBookings,
  listTimeBlocks,
  updateBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { allowRoles, authRequired } from '../middlewares/auth.js';

const router = Router();

router.get('/options', authRequired, allowRoles('customer'), getBookingOptions);
router.get('/availability', authRequired, getAvailability);
router.get(
  '/time-blocks',
  authRequired,
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  listTimeBlocks,
);
router.post(
  '/time-blocks',
  authRequired,
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  createTimeBlock,
);
router.delete(
  '/time-blocks/:id',
  authRequired,
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  deleteTimeBlock,
);
router.get('/my', authRequired, allowRoles('customer'), listMyBookings);
router.get('/', authRequired, listBookings);
router.post('/', authRequired, allowRoles('customer'), createBooking);
router.put('/:id', authRequired, updateBooking);
router.delete('/:id', authRequired, deleteBooking);
router.patch(
  '/:id/status',
  authRequired,
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  updateBookingStatus,
);

export default router;