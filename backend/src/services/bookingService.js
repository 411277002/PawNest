import { findOne, withTransaction } from '../repositories/dataRepository.js';
import {
  insertServiceTransaction,
  lockBookingForPayment,
  lockTransactionByBookingId,
  updateBookingAsCompleted,
  updateServiceTransaction,
} from '../repositories/bookingRepository.js';
import {
  applyPointChange,
  calculatePoints,
  refreshMembershipTier,
  rollbackPreviousTransactionPoints,
} from './membershipService.js';
import { notifyBookingCompleted } from './notificationService.js';
import { normalizeImagePayload } from './imageStorageService.js';

function clean(value) {
  return value === undefined || value === '' ? null : value;
}

export async function completeBookingPaymentService({
  bookingId,
  originalAmount,
  pointsUsed,
  note,
  photoUrl,
  staffId,
}) {
  return withTransaction(async (connection) => {
    const booking = await lockBookingForPayment(bookingId, connection);

    if (!booking) {
      throw new Error('找不到預約資料');
    }

    const customerId = Number(booking.customer_id);
    const currentPoints = Number(booking.membership_points || 0);

    if (pointsUsed > currentPoints) {
      throw new Error(`會員目前只有 ${currentPoints} 點，無法折抵 ${pointsUsed} 點`);
    }

    const discountAmount = pointsUsed;
    const finalAmount = Math.max(originalAmount - discountAmount, 0);
    const pointsEarned = calculatePoints(finalAmount);
    const resolvedStaffId = staffId || booking.staff_id || null;
    const storedPhotoUrl = await normalizeImagePayload(photoUrl);

    const existingTransaction = await lockTransactionByBookingId(bookingId, connection);

    if (existingTransaction) {
      await rollbackPreviousTransactionPoints(
        {
          customerId,
          oldPointsUsed: Number(existingTransaction.discount_points_used || 0),
          oldPointsEarned: Number(existingTransaction.points_earned || 0),
        },
        connection,
      );

      await updateServiceTransaction(
        {
          bookingId,
          staffId: resolvedStaffId,
          originalAmount,
          pointsUsed,
          discountAmount,
          finalAmount,
          pointsEarned,
          note: clean(note),
        },
        connection,
      );
    } else {
      await insertServiceTransaction(
        {
          bookingId,
          customerId,
          staffId: resolvedStaffId,
          originalAmount,
          pointsUsed,
          discountAmount,
          finalAmount,
          pointsEarned,
          note: clean(note),
        },
        connection,
      );
    }

    await updateBookingAsCompleted(
      {
        bookingId,
        staffId: resolvedStaffId,
        photoUrl: storedPhotoUrl,
        originalAmount,
        pointsUsed,
        finalAmount,
        note: clean(note),
      },
      connection,
    );

    await applyPointChange({ customerId, pointsUsed, pointsEarned }, connection);

    const membershipResult = await refreshMembershipTier(customerId, connection);

    const updatedUser = await findOne(
      `
      SELECT
        id,
        name,
        membership_tier,
        membership_points,
        vip_expires_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [customerId],
      connection,
    );

    const notification = await notifyBookingCompleted({ customerId, bookingId });

    return {
      transaction: {
        booking_id: bookingId,
        customer_id: customerId,
        original_amount: originalAmount,
        discount_points_used: pointsUsed,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        points_earned: pointsEarned,
      },
      membership: {
        ...membershipResult,
        membership_tier: updatedUser.membership_tier,
        membership_points: updatedUser.membership_points,
        vip_expires_at: updatedUser.vip_expires_at,
      },
      notification,
    };
  });
}
