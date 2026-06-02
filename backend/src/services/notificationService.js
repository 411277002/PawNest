export async function notifyBookingCompleted({ customerId, bookingId }) {
  // In the deployment diagram this corresponds to NotifyService.
  // Current implementation uses an internal system notification hook.
  // It can be replaced later by Email Gateway, LINE, SMS, or push notification.
  console.log(
    `[NotifyService] booking completed: customer=${customerId}, booking=${bookingId}`,
  );

  return {
    type: 'booking_completed',
    customer_id: customerId,
    booking_id: bookingId,
    delivered: true,
  };
}
