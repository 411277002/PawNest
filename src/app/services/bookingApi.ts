import { apiFetch } from './api';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled';

export type PetType = 'dog' | 'cat' | 'other' | string;

export type ServiceCategory =
  | 'grooming'
  | 'boarding'
  | 'daycare'
  | 'addon'
  | string;

export type TargetPetType = 'all' | 'dog' | 'cat';

export type BookingServiceDetail = {
  id: number;
  name: string;
  price: number;
  duration_minutes?: number;
  category?: ServiceCategory;
  target_pet_type?: TargetPetType;
};

export type Booking = {
  id: number;
  customer_id: number;
  pet_id: number;
  service_id: number;
  store_id: number;
  staff_id?: number | null;

  // 舊版相容欄位：目前很多頁面仍會使用 booking_date。
  booking_date: string;

  // 新版完整預約區間：
  // 美容：start_date/start_time，end_date/end_time 可同日或由服務時長推算
  // 安親：start_date/start_time 到 end_date/end_time，以小時計
  // 住宿：start_date/start_time 到 end_date/end_time，以天數計
  start_date?: string | null;
  start_time: string;
  end_date?: string | null;
  end_time?: string | null;

  status: BookingStatus;
  note?: string | null;
  photo_url?: string | null;

  actual_amount?: number | null;
  discount_points_used?: number;
  final_amount?: number | null;
  payment_note?: string | null;

  completed_at?: string | null;
  created_at?: string;

  customer_name?: string;
  customer_email?: string;
  phone?: string;
  customer_membership_tier?: 'general' | 'vip';
  customer_membership_points?: number;

  pet_name?: string;
  pet_type?: PetType;
  pet_breed?: string;
  pet_photo_url?: string;

  service_name?: string;
  service_category?: ServiceCategory;
  service_price?: number;
  duration_minutes?: number;

  service_ids?: string;
  service_names?: string;
  service_total_price?: number;
  service_total_duration?: number;
  requires_boarding?: number;
  requires_daycare?: number;
  services?: BookingServiceDetail[];

  store_name?: string;
  store_area?: string;
  store_address?: string;
  store_dog_room_capacity?: number;
  store_cat_room_capacity?: number;
  store_daycare_capacity?: number;

  groomer_name?: string | null;
  staff_name?: string | null;

  transaction_id?: number | null;
  transaction_original_amount?: number | null;
  transaction_discount_points_used?: number | null;
  transaction_discount_amount?: number | null;
  transaction_final_amount?: number | null;
  transaction_points_earned?: number | null;
  transaction_note?: string | null;
  transaction_paid_at?: string | null;

  can_modify?: boolean;
};

export type BookingOptionPet = {
  id: number;
  name: string;
  type: PetType;
  breed?: string;
  gender?: string;
  age?: number;
  weight?: number;
  note?: string;
  photo_url?: string;
};

export type BookingOptionService = {
  id: number;
  name: string;
  category: ServiceCategory;
  price: number;
  duration_minutes?: number;
  description?: string;
  target_pet_type?: TargetPetType;
};

export type BookingOptionStore = {
  id: number;
  name: string;
  area?: string;
  address?: string;
  phone?: string;
  open_time?: string;
  close_time?: string;
  dog_room_capacity?: number;
  cat_room_capacity?: number;
  daycare_capacity?: number;
};

export type BookingOptions = {
  pets: BookingOptionPet[];
  services: BookingOptionService[];
  stores: BookingOptionStore[];
};

export type CreateBookingPayload = {
  pet_id: number;
  service_ids: number[];
  store_id: number;

  // 舊版相容欄位：送出時建議 booking_date = start_date
  booking_date: string;

  // 新版完整預約區間
  start_date?: string;
  start_time: string;
  end_date?: string;
  end_time?: string;

  note?: string;
};

export type UpdateBookingPayload = Partial<CreateBookingPayload>;

export type TimeBlock = {
  id: number;
  store_id: number;
  store_name?: string;
  block_date: string;
  start_time: string;
  reason?: string;
  created_at?: string;
};

export type AvailabilitySlot = {
  time: string;
  available: boolean;
  reason?: string;
  dog_rooms_left?: number;
  cat_rooms_left?: number;
  daycare_left?: number;
};

export type CompletePaymentPayload = {
  original_amount: number;
  discount_points_used?: number;
  note?: string;
  photo_url?: string | null;
};

export type CompletePaymentResult = {
  message: string;
  transaction: {
    booking_id: number;
    customer_id: number;
    original_amount: number;
    discount_points_used: number;
    discount_amount: number;
    final_amount: number;
    points_earned: number;
  };
  membership: {
    membership_tier: 'general' | 'vip';
    membership_points: number;
    vip_expires_at?: string | null;
    annual_spending: number;
  };
};

function isAdminPage() {
  return window.location.pathname.startsWith('/admin');
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : '';
}

function normalizeCreateBookingPayload(payload: CreateBookingPayload) {
  const startDate = payload.start_date || payload.booking_date;
  const endDate = payload.end_date || startDate;

  return {
    ...payload,
    booking_date: startDate,
    start_date: startDate,
    end_date: endDate,
  };
}

function normalizeUpdateBookingPayload(payload: UpdateBookingPayload) {
  const startDate = payload.start_date || payload.booking_date;
  const endDate = payload.end_date || startDate;

  return {
    ...payload,
    ...(startDate
      ? {
          booking_date: startDate,
          start_date: startDate,
        }
      : {}),
    ...(endDate ? { end_date: endDate } : {}),
  };
}

export function getBookingOptions() {
  return apiFetch<BookingOptions>('/bookings/options');
}

export function getMyBookings() {
  return apiFetch<{ bookings: Booking[] }>('/bookings/my');
}

export function getAllBookings() {
  return apiFetch<{ bookings: Booking[] }>('/admin/bookings');
}

export function createBooking(payload: CreateBookingPayload) {
  return apiFetch<{ id: number; message: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(normalizeCreateBookingPayload(payload)),
  });
}

export function updateBooking(id: number, payload: UpdateBookingPayload) {
  return apiFetch<{ message: string }>(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(normalizeUpdateBookingPayload(payload)),
  });
}

export function deleteBooking(id: number) {
  const path = isAdminPage() ? `/admin/bookings/${id}` : `/bookings/${id}`;

  return apiFetch<{ message: string }>(path, {
    method: 'DELETE',
  });
}

export function updateBookingStatus(
  id: number,
  payload: {
    status: BookingStatus;
    staff_id?: number | null;
    photo_url?: string | null;
  },
) {
  if (isAdminPage()) {
    return apiFetch<{ message: string }>(`/admin/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  return apiFetch<{ message: string }>(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function completeBookingPayment(
  id: number,
  payload: CompletePaymentPayload,
) {
  return apiFetch<CompletePaymentResult>(
    `/admin/bookings/${id}/complete-payment`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function getAvailability(
  storeId: number,
  bookingDate: string,
  serviceIds: number[] = [],
  extra?: {
    pet_id?: number;
    end_date?: string;
    end_time?: string;
  },
) {
  return apiFetch<{ slots: AvailabilitySlot[] }>(
    `/bookings/availability${buildQuery({
      store_id: storeId,
      booking_date: bookingDate,
      service_ids: serviceIds.length ? serviceIds.join(',') : undefined,
      pet_id: extra?.pet_id,
      end_date: extra?.end_date,
      end_time: extra?.end_time,
    })}`,
  );
}

export function getTimeBlocks() {
  const path = isAdminPage() ? '/admin/time-blocks' : '/bookings/time-blocks';

  return apiFetch<{ blocks: TimeBlock[] }>(path);
}

export function createTimeBlock(payload: {
  store_id: number;
  block_date: string;
  start_time: string;
  reason?: string;
}) {
  const path = isAdminPage() ? '/admin/time-blocks' : '/bookings/time-blocks';

  return apiFetch<{ id: number; message: string }>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteTimeBlock(id: number) {
  const path = isAdminPage()
    ? `/admin/time-blocks/${id}`
    : `/bookings/time-blocks/${id}`;

  return apiFetch<{ message: string }>(path, {
    method: 'DELETE',
  });
}

export function getBookingStartDate(booking: Booking) {
  return booking.start_date || booking.booking_date;
}

export function getBookingEndDate(booking: Booking) {
  return booking.end_date || booking.start_date || booking.booking_date;
}

export function formatBookingPeriod(booking: Booking) {
  const startDate = getBookingStartDate(booking);
  const endDate = getBookingEndDate(booking);
  const startTime = booking.start_time?.slice(0, 5) || '';
  const endTime = booking.end_time?.slice(0, 5) || '';

  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} ${startTime}－${endDate} ${endTime || ''}`.trim();
  }

  if (endTime && endTime !== startTime) {
    return `${startDate} ${startTime}－${endTime}`;
  }

  return `${startDate} ${startTime}`.trim();
}

export function canModifyBooking(bookingDate: string, startTime: string) {
  const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;
  const start = new Date(`${bookingDate}T${normalizedTime}`);
  const diffHours = (start.getTime() - Date.now()) / (1000 * 60 * 60);

  return diffHours >= 4;
}

export function hasServiceStarted(bookingDate: string, startTime: string) {
  const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;
  const start = new Date(`${bookingDate}T${normalizedTime}`);

  return start.getTime() <= Date.now();
}

export function canModifyBookingItem(booking: Booking) {
  return canModifyBooking(getBookingStartDate(booking), booking.start_time);
}

export function hasBookingServiceStarted(booking: Booking) {
  return hasServiceStarted(getBookingStartDate(booking), booking.start_time);
}

export const statusText: Record<BookingStatus, string> = {
  pending: '待確認',
  confirmed: '已確認',
  checked_in: '已報到',
  in_service: '服務中',
  completed: '已完成',
  cancelled: '已取消',
};

export const progressSteps: BookingStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'in_service',
  'completed',
];