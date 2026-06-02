import { findOne, execute } from './dataRepository.js';

export function lockBookingForPayment(bookingId, connection) {
  return findOne(
    `
    SELECT
      b.id,
      b.customer_id,
      b.staff_id,
      b.store_id,
      b.status,
      u.membership_points
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    WHERE b.id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [bookingId],
    connection,
  );
}

export function lockTransactionByBookingId(bookingId, connection) {
  return findOne(
    `
    SELECT id, discount_points_used, points_earned
    FROM service_transactions
    WHERE booking_id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [bookingId],
    connection,
  );
}

export function insertServiceTransaction(payload, connection) {
  return execute(
    `
    INSERT INTO service_transactions
      (
        booking_id,
        customer_id,
        staff_id,
        original_amount,
        discount_points_used,
        discount_amount,
        final_amount,
        points_earned,
        note
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.bookingId,
      payload.customerId,
      payload.staffId,
      payload.originalAmount,
      payload.pointsUsed,
      payload.discountAmount,
      payload.finalAmount,
      payload.pointsEarned,
      payload.note || null,
    ],
    connection,
  );
}

export function updateServiceTransaction(payload, connection) {
  return execute(
    `
    UPDATE service_transactions
    SET
      staff_id = ?,
      original_amount = ?,
      discount_points_used = ?,
      discount_amount = ?,
      final_amount = ?,
      points_earned = ?,
      note = ?,
      paid_at = NOW()
    WHERE booking_id = ?
    `,
    [
      payload.staffId,
      payload.originalAmount,
      payload.pointsUsed,
      payload.discountAmount,
      payload.finalAmount,
      payload.pointsEarned,
      payload.note || null,
      payload.bookingId,
    ],
    connection,
  );
}

export function updateBookingAsCompleted(payload, connection) {
  return execute(
    `
    UPDATE bookings
    SET
      status = 'completed',
      staff_id = COALESCE(?, staff_id),
      photo_url = CASE
        WHEN ? IS NOT NULL THEN ?
        ELSE photo_url
      END,
      actual_amount = ?,
      discount_points_used = ?,
      final_amount = ?,
      payment_note = ?,
      completed_at = NOW()
    WHERE id = ?
    `,
    [
      payload.staffId,
      payload.photoUrl || null,
      payload.photoUrl || null,
      payload.originalAmount,
      payload.pointsUsed,
      payload.finalAmount,
      payload.note || null,
      payload.bookingId,
    ],
    connection,
  );
}
