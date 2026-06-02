import { Router } from 'express';
import { authRequired, allowRoles } from '../middlewares/auth.js';
import {
  createActivity,
  createMember,
  createService,
  createStore,
  deleteActivity,
  deleteMember,
  deleteReview,
  deleteService,
  deleteStore,
  getActivities,
  getDashboard,
  getMembers,
  getReviews,
  getServices,
  getStores,
  replyReview,
  updateActivity,
  updateMember,
  updateService,
  updateStore,

  // 預約管理
  getAdminBookings,
  updateBookingStatus,
  deleteAdminBooking,
  completeBookingPayment,

  // 預約時段控管
  getTimeBlocks,
  createTimeBlock,
  deleteTimeBlock,
  getMemberTransactions,

  // 聯絡留言
  getContactMessages,
  updateContactMessageStatus,
} from '../controllers/adminController.js';

const router = Router();

router.use(authRequired, allowRoles('admin', 'staff', 'groomer', 'reception'));

router.get('/dashboard', getDashboard);

router.get(
  '/bookings',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  getAdminBookings,
);

router.put(
  '/bookings/:id/status',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  updateBookingStatus,
);

router.post(
  '/bookings/:id/complete-payment',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  completeBookingPayment,
);

router.delete(
  '/bookings/:id',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  deleteAdminBooking,
);

/**
 * 預約時段控管
 */
router.get(
  '/time-blocks',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  getTimeBlocks,
);

router.post(
  '/time-blocks',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  createTimeBlock,
);

router.delete(
  '/time-blocks/:id',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  deleteTimeBlock,
);

/**
 * 會員管理
 */
router.get('/members', getMembers);

router.get(
  '/members/:id/transactions',
  allowRoles('admin', 'staff', 'groomer', 'reception'),
  getMemberTransactions,
);

router.post('/members', allowRoles('admin', 'staff', 'groomer', 'reception'), createMember);
router.put('/members/:id', allowRoles('admin', 'staff', 'groomer', 'reception'), updateMember);
router.delete('/members/:id', allowRoles('admin'), deleteMember);

/**
 * 活動管理
 */
router.get('/activities', getActivities);
router.post('/activities', allowRoles('admin'), createActivity);
router.put('/activities/:id', allowRoles('admin'), updateActivity);
router.delete('/activities/:id', allowRoles('admin'), deleteActivity);

/**
 * 服務管理
 */
router.get('/services', getServices);
router.post('/services', allowRoles('admin'), createService);
router.put('/services/:id', allowRoles('admin'), updateService);
router.delete('/services/:id', allowRoles('admin'), deleteService);

/**
 * 門市管理
 */
router.get('/stores', getStores);
router.post('/stores', allowRoles('admin'), createStore);
router.put('/stores/:id', allowRoles('admin'), updateStore);
router.delete('/stores/:id', allowRoles('admin'), deleteStore);

/**
 * 評論管理
 */
router.get('/reviews', getReviews);
router.put('/reviews/:id/reply', allowRoles('admin', 'staff'), replyReview);
router.delete('/reviews/:id', allowRoles('admin'), deleteReview);

/**
 * 聯絡留言管理
 */
router.get('/contact-messages', allowRoles('admin'), getContactMessages,);
router.put('/contact-messages/:id/status', allowRoles('admin'), updateContactMessageStatus,);
export default router;