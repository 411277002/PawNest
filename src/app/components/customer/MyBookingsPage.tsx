import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Crown,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Mail,
  PawPrint,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  Booking,
  BookingOptions,
  canModifyBooking,
  deleteBooking,
  getAvailability,
  getBookingOptions,
  getMyBookings,
  progressSteps,
  statusText,
  updateBooking,
} from '../../services/bookingApi';
import { getStoredUser } from '../../services/api';

type EditForm = {
  pet_id: number;
  service_ids: number[];
  store_id: number;
  booking_date: string;
  start_time: string;
  note: string;
};

function toDateInput(value: string) {
  return value?.slice(0, 10) || '';
}

function toTimeInput(value: string) {
  return value?.slice(0, 5) || '';
}

function normalizeTier(tier?: string) {
  return tier === 'vip' ? 'vip' : 'general';
}

export function MyBookingsPage() {
  const user = useMemo(() => getStoredUser(), []);
  const displayName = user?.name || user?.username || '會員';
  const membershipTier = normalizeTier(user?.membership_tier);
  const points = Number(user?.membership_points || 0);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [options, setOptions] = useState<BookingOptions>({
    pets: [],
    services: [],
    stores: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [bookingRes, optionRes] = await Promise.all([
        getMyBookings(),
        getBookingOptions(),
      ]);

      setBookings(bookingRes.bookings);
      setOptions(optionRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '讀取預約資料失敗');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      if (!form?.store_id || !form.booking_date) return;

      const data = await getAvailability(
        form.store_id,
        form.booking_date,
        form.service_ids,
      );

      const times = data.slots
        .filter((slot) => slot.available || slot.time === form.start_time)
        .map((slot) => slot.time);

      setAvailableTimes(times);
    }

    loadSlots().catch(() => setAvailableTimes([]));
  }, [form?.store_id, form?.booking_date, form?.service_ids?.join(',')]);

  const upcoming = useMemo(
    () =>
      bookings.filter(
        (booking) => !['completed', 'cancelled'].includes(booking.status),
      ),
    [bookings],
  );

  const finished = useMemo(
    () =>
      bookings.filter((booking) =>
        ['completed', 'cancelled'].includes(booking.status),
      ),
    [bookings],
  );

  const completedWithPhoto = useMemo(
    () =>
      bookings.find(
        (booking) => booking.status === 'completed' && booking.photo_url,
      ),
    [bookings],
  );

  const startEdit = (booking: Booking) => {
    if (
      !booking.can_modify &&
      !canModifyBooking(toDateInput(booking.booking_date), booking.start_time)
    ) {
      alert('服務開始前 4 小時內不可修改預約');
      return;
    }

    setEditing(booking);
    setForm({
      pet_id: booking.pet_id,
      service_ids: booking.service_ids
        ? booking.service_ids.split(',').map(Number).filter(Boolean)
        : [booking.service_id],
      store_id: booking.store_id,
      booking_date: toDateInput(booking.booking_date),
      start_time: toTimeInput(booking.start_time),
      note: booking.note || '',
    });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();

    if (!editing || !form) return;

    setSaving(true);

    try {
      await updateBooking(editing.id, form);
      setEditing(null);
      setForm(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '修改預約失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (booking: Booking) => {
    if (
      !booking.can_modify &&
      !canModifyBooking(toDateInput(booking.booking_date), booking.start_time)
    ) {
      alert('服務開始前 4 小時內不可取消或刪除預約');
      return;
    }

    if (
      !window.confirm(
        `確定要刪除 ${booking.pet_name || '毛孩'} 的 ${
          booking.service_names || booking.service_name || '服務'
        } 預約嗎？`,
      )
    ) {
      return;
    }

    try {
      await deleteBooking(booking.id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除預約失敗');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7efe2] py-12 text-[#3b2d26]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {completedWithPhoto && (
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-[#cfe5bf] bg-[#e8f3df] p-6 text-[#4f6d43] shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex flex-1 items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/70 text-[#5f7f4f]">
                  <BellRing className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5f7f4f]">
                    Service Completed
                  </p>

                  <h2 className="mt-1 text-2xl font-black">服務完成通知</h2>

                  <p className="mt-2 leading-7">
                    {completedWithPhoto.pet_name} 的{' '}
                    {completedWithPhoto.service_names ||
                      completedWithPhoto.service_name}{' '}
                    已完成，門市已上傳完成照片。
                  </p>
                </div>
              </div>

              <img
                src={completedWithPhoto.photo_url || ''}
                alt="服務完成照片"
                className="h-32 w-full rounded-[1.5rem] object-cover shadow-sm md:w-56"
              />
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-[0_18px_40px_rgba(123,99,73,0.08)]">
            <div className="border-b border-[#efe3d2] bg-[#fffaf3] p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.75rem] bg-[#f4ead8] text-[#b68655]">
                  {membershipTier === 'vip' ? (
                    <Crown className="h-10 w-10" />
                  ) : (
                    <User className="h-10 w-10" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b68655]">
                    {membershipTier === 'vip' ? 'VIP MEMBER' : 'MEMBER'}
                  </p>

                  <h2 className="mt-2 break-words text-3xl font-black text-[#2f241f]">
                    {displayName}
                  </h2>

                  <p className="mt-1 break-all text-sm font-semibold text-[#9c8b78]">
                    @{user?.username || 'customer'}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#ead8ba] bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#8d785f]">
                    會員點數
                  </span>

                  <span className="text-base font-black text-[#3b2d26]">
                    {points.toLocaleString()} 點
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-2">
                <SidebarLink
                  to="/profile"
                  icon={<User className="h-4 w-4" />}
                  label="我的帳戶"
                />

                <SidebarLink
                  to="/profile"
                  icon={<Mail className="h-4 w-4" />}
                  label="編輯資料"
                />

                <SidebarLink
                  to="/profile"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="修改密碼"
                />

                <SidebarLink
                  to="/my-bookings"
                  active
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="我的預約"
                />

                <SidebarLink
                  to="/pets"
                  icon={<PawPrint className="h-4 w-4" />}
                  label="我的毛孩"
                />
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-[0_18px_40px_rgba(123,99,73,0.08)]">
            <div className="border-b border-[#efe3d2] bg-[#fffaf3] px-8 py-6">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#b68655]">
                Booking Records
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#2f241f]">
                預約紀錄
              </h2>
            </div>

            <div className="p-8">
              {loading && (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-[#e7d6be] bg-[#fffaf3] p-6 font-bold text-[#7b6349]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  正在讀取預約資料...
                </div>
              )}

              {error && (
                <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6 font-bold text-red-700">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="grid gap-8">
                  <BookingSection
                    title="即將到來"
                    subtitle="尚未完成或尚未取消的預約會顯示在這裡。"
                    bookings={upcoming}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />

                  <BookingSection
                    title="歷史紀錄"
                    subtitle="已完成或已取消的服務紀錄。"
                    bookings={finished}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {editing && form && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 px-4 py-8 backdrop-blur-sm">
          <form
            onSubmit={handleUpdate}
            className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[2rem] border border-[#e7d6be] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#ead8ba] pb-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b68655]">
                  Edit Booking
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#4f4032]">
                  編輯預約
                </h2>

                <p className="mt-2 text-sm font-semibold text-[#9c8b78]">
                  只能修改服務開始前 4 小時以上的預約。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-[#f7efe2] text-[#7b6349] transition hover:bg-[#ead8ba]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                毛孩
                <select
                  value={form.pet_id}
                  onChange={(e) =>
                    setForm({ ...form, pet_id: Number(e.target.value) })
                  }
                  className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none focus:border-[#b68655]"
                >
                  {options.pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2 text-sm font-black text-[#4f4032]">
                服務

                <div className="grid max-h-48 gap-2 overflow-auto rounded-2xl border border-[#e7d6be] bg-[#fffaf3] p-3">
                  {options.services.map((service) => {
                    const checked = form.service_ids.includes(service.id);

                    return (
                      <label
                        key={service.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                          checked
                            ? 'bg-white text-[#4f4032] shadow-sm'
                            : 'text-[#7b6349]'
                        }`}
                      >
                        <span>
                          {service.name}｜NT${service.price}
                        </span>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              service_ids: checked
                                ? form.service_ids.filter(
                                    (id) => id !== service.id,
                                  )
                                : [...form.service_ids, service.id],
                            })
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                門市
                <select
                  value={form.store_id}
                  onChange={(e) =>
                    setForm({ ...form, store_id: Number(e.target.value) })
                  }
                  className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none focus:border-[#b68655]"
                >
                  {options.stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                日期
                <input
                  type="date"
                  value={form.booking_date}
                  onChange={(e) =>
                    setForm({ ...form, booking_date: e.target.value })
                  }
                  className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none focus:border-[#b68655]"
                />
              </label>

              <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                時間
                <select
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none focus:border-[#b68655]"
                >
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-5 grid gap-2 text-sm font-black text-[#4f4032]">
              備註
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={4}
                className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none focus:border-[#b68655]"
              />
            </label>

            <button
              disabled={saving}
              type="submit"
              className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-6 py-4 font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              儲存修改
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  label,
  active = false,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
        active
          ? 'bg-[#3b2d26] text-white shadow-sm'
          : 'text-[#7b6349] hover:bg-[#fffaf3]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            active
              ? 'bg-white/15 text-[#ead8ba]'
              : 'bg-[#fcf7f0] text-[#b68655]'
          }`}
        >
          {icon}
        </span>

        <span className="font-bold">{label}</span>
      </div>

      <ChevronRight
        className={`h-4 w-4 ${active ? 'text-[#ead8ba]' : 'text-[#b9a38c]'}`}
      />
    </Link>
  );
}

function BookingSection({
  title,
  subtitle,
  bookings,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#e7d6be] bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b68655]">
            Bookings
          </p>

          <h3 className="mt-1 text-2xl font-black text-[#2f241f]">
            {title}
          </h3>

          <p className="mt-1 text-sm font-semibold text-[#9c8b78]">
            {subtitle}
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#e7d6be] bg-white px-4 py-2 text-sm font-black text-[#7b6349]">
          共 {bookings.length} 筆
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="p-6">
          <div className="rounded-[1.5rem] p-8 text-center font-bold text-[#9c8b78]">
            目前沒有資料。
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#f1e6d6]">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingCard({
  booking,
  onEdit,
  onDelete,
}: {
  booking: Booking;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}) {
  const canModify =
    booking.can_modify ??
    canModifyBooking(toDateInput(booking.booking_date), booking.start_time);

  const progressIndex = Math.max(0, progressSteps.indexOf(booking.status));
  const progressPercent =
    booking.status === 'cancelled'
      ? 0
      : ((progressIndex + 1) / progressSteps.length) * 100;

  const locked =
    !canModify && !['completed', 'cancelled'].includes(booking.status);

  const disabledAction =
    !canModify || ['completed', 'cancelled'].includes(booking.status);

  return (
    <article className="bg-white px-6 py-5 transition hover:bg-[#fffaf3]">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.2fr_auto] xl:items-start">
        <div className="flex gap-4">
          <div className="min-w-0">
            <div className="mb-2 inline-flex rounded-full bg-[#ead8ba] px-3 py-1 text-xs font-black text-[#7b6349]">
              {statusText[booking.status] || booking.status}
            </div>

            <h4 className="text-xl font-black leading-7 text-[#2f241f]">
              {booking.pet_name || '毛孩'}
            </h4>

            <p className="mt-1 text-sm font-bold leading-6 text-[#7b6349]">
              {booking.service_names || booking.service_name || '服務'}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#9c8b78]">
              {booking.store_name || '門市'}｜{toDateInput(booking.booking_date)}{' '}
              {toTimeInput(booking.start_time)}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs font-black text-[#9c8b78]">
            <span>服務進度</span>
          </div>

          <div className="h-2 rounded-full bg-[#f7efe2]">
            <div
              className="h-2 rounded-full bg-[#b68655]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 grid grid-cols-5 gap-1 text-[11px] font-bold text-[#9c8b78]">
            {progressSteps.map((step) => (
              <span
                key={step}
                className={
                  progressSteps.indexOf(step) <= progressIndex
                    ? 'text-[#7b6349]'
                    : ''
                }
              >
                {statusText[step]}
              </span>
            ))}
          </div>

          {booking.note && (
            <p className="mt-3 text-sm text-[#9c8b78]">
              備註：{booking.note}
            </p>
          )}

          {locked && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-black text-[#9a5c50]">
              <CalendarClock className="h-4 w-4" />
              服務開始前 4 小時內不可修改或刪除
            </p>
          )}

          {booking.photo_url && (
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#e7d6be]">
              <img
                src={booking.photo_url}
                alt="服務完成照片"
                className="h-48 w-full object-cover"
              />

              <div className="flex items-center gap-2 bg-[#fffaf3] px-4 py-3 text-sm font-black text-[#7b6349]">
                <ImageIcon className="h-4 w-4" />
                服務完成照片
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 xl:flex-col">
          <button
            type="button"
            disabled={disabledAction}
            onClick={() => onEdit(booking)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-4 py-3 text-sm font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:bg-[#e7d6be]"
          >
            <Edit3 className="h-4 w-4" />
            編輯
          </button>

          <button
            type="button"
            disabled={disabledAction}
            onClick={() => onDelete(booking)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-black text-[#9a5c50] transition hover:bg-[#fff1ec] disabled:cursor-not-allowed disabled:text-[#cdbfb2]"
          >
            <Trash2 className="h-4 w-4" />
            刪除
          </button>
        </div>
      </div>
    </article>
  );
}