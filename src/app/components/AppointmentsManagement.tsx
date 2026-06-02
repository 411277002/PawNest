import { useEffect, useMemo, useState } from 'react';
import {
  CalendarOff,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { adminApi, type StoreItem } from '../services/api';
import {
  Booking,
  createTimeBlock,
  deleteBooking as deleteBookingApi,
  deleteTimeBlock,
  getAllBookings,
  getTimeBlocks,
  hasServiceStarted,
  statusText,
  TimeBlock,
} from '../services/bookingApi';

interface AppointmentsManagementProps {
  role: 'admin' | 'staff';
}

const defaultTimes = [
  '10:00',
  '10:30',
  '11:00',
  '13:30',
  '14:00',
  '15:30',
  '16:00',
  '18:30',
];

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled';

const appointmentStatusOptions: BookingStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
];

const bookingStatusStyles: Record<BookingStatus, string> = {
  pending: 'bg-[#fff4da] text-[#9a744f] border-[#ead8ba]',
  confirmed: 'bg-[#f7efe2] text-[#7b6349] border-[#e7d6be]',
  checked_in: 'bg-[#fffaf3] text-[#7b6349] border-[#e7d6be]',
  in_service: 'bg-[#ead8ba] text-[#4f4032] border-[#d8c5aa]',
  completed: 'bg-[#e8f3df] text-[#5f7f4f] border-[#cfe5bf]',
  cancelled: 'bg-[#fff1ec] text-[#9a5c50] border-[#f4c7b8]',
};

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDate(value?: string) {
  return value?.slice(0, 10) || '';
}

function toTime(value?: string) {
  return value?.slice(0, 5) || '';
}

function getAdminToken() {
  const adminKeys = [
    { tokenKey: 'admin_token', userKey: 'admin_user' },
    { tokenKey: 'pawnest_admin_token', userKey: 'pawnest_admin_user' },
    { tokenKey: 'pawpalace_admin_token', userKey: 'pawpalace_admin_user' },
    { tokenKey: 'token', userKey: 'user' },
  ];

  for (const item of adminKeys) {
    const token = sessionStorage.getItem(item.tokenKey);
    const userRaw = sessionStorage.getItem(item.userKey);

    if (!token || !userRaw) continue;

    try {
      const user = JSON.parse(userRaw);

      if (['admin', 'staff', 'groomer', 'reception'].includes(user.role)) {
        return token;
      }
    } catch {
      if (
        item.tokenKey === 'admin_token' ||
        item.tokenKey === 'pawnest_admin_token'
      ) {
        return token;
      }
    }
  }

  return '';
}

function isLockedInAppointmentPage(status: BookingStatus) {
  return ['checked_in', 'in_service', 'completed', 'cancelled'].includes(status);
}

function appointmentLockMessage(status: BookingStatus) {
  if (status === 'completed') {
    return '已完成，請至服務進度查看紀錄';
  }

  if (status === 'cancelled') {
    return '此預約已取消';
  }

  if (status === 'checked_in' || status === 'in_service') {
    return '已進入服務流程，請至服務進度更新';
  }

  return '';
}

function statusSortValue(status: BookingStatus) {
  const order: Record<BookingStatus, number> = {
    pending: 1,
    confirmed: 2,
    checked_in: 3,
    in_service: 4,
    completed: 5,
    cancelled: 6,
  };

  return order[status] ?? 99;
}

function formatBookingNumber(id: number | string) {
  return `#${String(id).padStart(3, '0')}`;
}

export function AppointmentsManagement({ role }: AppointmentsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [showAllDates, setShowAllDates] = useState(false);

  const [blockForm, setBlockForm] = useState({
    store_id: 0,
    block_date: todayDateString(),
    start_time: '10:00',
    reason: '此時段已滿',
  });

  const loadAll = async () => {
    setLoading(true);

    try {
      const [bookingData, blockData, storeData] = await Promise.all([
        getAllBookings(),
        getTimeBlocks(),
        adminApi.stores(),
      ]);

      setBookings(bookingData.bookings);
      setBlocks(blockData.blocks);
      setStores(storeData.stores);

      setBlockForm((prev) => ({
        ...prev,
        store_id: prev.store_id || storeData.stores[0]?.id || 0,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取預約失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const searchedBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return bookings;

    return bookings.filter((booking) =>
      `${booking.id} ${booking.pet_name || ''} ${booking.customer_name || ''} ${
        booking.phone || ''
      } ${booking.service_names || booking.service_name || ''} ${
        booking.store_name || ''
      } ${booking.status || ''}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [bookings, searchTerm]);

  const pendingBookings = useMemo(() => {
    return searchedBookings
      .filter((booking) => booking.status === 'pending')
      .sort((a, b) => {
        const dateA = `${toDate(a.booking_date)} ${toTime(a.start_time)}`;
        const dateB = `${toDate(b.booking_date)} ${toTime(b.start_time)}`;
        return dateA.localeCompare(dateB);
      });
  }, [searchedBookings]);

  const dateBookings = useMemo(() => {
    return searchedBookings
      .filter((booking) => {
        if (booking.status === 'pending') return false;
        if (showAllDates) return true;
        return toDate(booking.booking_date) === selectedDate;
      })
      .sort((a, b) => {
        const dateCompare = `${toDate(a.booking_date)} ${toTime(
          a.start_time,
        )}`.localeCompare(`${toDate(b.booking_date)} ${toTime(b.start_time)}`);

        if (dateCompare !== 0) return dateCompare;

        return (
          statusSortValue(a.status as BookingStatus) -
          statusSortValue(b.status as BookingStatus)
        );
      });
  }, [searchedBookings, selectedDate, showAllDates]);

  const activeBlocks = useMemo(() => {
    const now = new Date();

    return blocks
      .filter((block) => {
        const blockDate = toDate(block.block_date);
        const blockTime = toTime(block.start_time) || '00:00';

        if (!blockDate) return false;

        const blockDateTime = new Date(`${blockDate}T${blockTime}:00`);

        return blockDateTime >= now;
      })
      .sort((a, b) => {
        const dateA = `${toDate(a.block_date)} ${toTime(a.start_time)}`;
        const dateB = `${toDate(b.block_date)} ${toTime(b.start_time)}`;

        return dateA.localeCompare(dateB);
      });
  }, [blocks]);

  const updateBookingStatus = async (
    booking: Booking,
    status: BookingStatus,
  ) => {
    const token = getAdminToken();

    if (!token) {
      setMessage('後台登入已失效，請重新登入後台。');
      return;
    }

    setUpdatingId(booking.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/bookings/${booking.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setMessage('後台登入已過期或 token 無效，請登出後重新登入。');
          return;
        }

        if (res.status === 403) {
          setMessage('此帳號沒有更新預約狀態的權限，請使用管理員或員工帳號。');
          return;
        }

        setMessage(data.message || '更新狀態失敗');
        return;
      }

      setMessage(
        `預約 ${formatBookingNumber(booking.id)} 已更新為「${
          statusText[status]
        }」`,
      );

      await loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '更新狀態失敗，請確認後端是否啟動',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteBooking = async (booking: Booking) => {
    if (
      hasServiceStarted(
        toDate(booking.booking_date),
        toTime(booking.start_time),
      )
    ) {
      setMessage('服務時間已開始，管理員與員工不可刪除此預約。');
      return;
    }

    if (!window.confirm(`確定刪除 ${booking.customer_name || '會員'} 的預約嗎？`)) {
      return;
    }

    setUpdatingId(booking.id);

    try {
      await deleteBookingApi(booking.id);
      setMessage('預約已刪除');
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '刪除失敗');
    } finally {
      setUpdatingId(null);
    }
  };

  const addBlock = async () => {
    if (!blockForm.store_id) {
      setMessage('請先選擇門市');
      return;
    }

    try {
      await createTimeBlock(blockForm);
      setMessage('時段已關閉，會員預約時不可選擇。');
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '關閉時段失敗');
    }
  };

  const removeBlock = async (id: number) => {
    try {
      await deleteTimeBlock(id);
      setMessage('時段已重新開放');
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '開放時段失敗');
    }
  };

  const selectedDateTitle = showAllDates
    ? '全部已安排預約'
    : `${selectedDate} 當日預約`;

  return (
    <div className="space-y-8 text-[#4f4032]">
      {message && (
        <div className="rounded-[1.5rem] border border-[#e7d6be] bg-[#fffaf3] px-5 py-3 text-sm font-black text-[#7b6349] shadow-sm shadow-[#ead8ba]/30">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm shadow-[#ead8ba]/40">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
              Appointment Control
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              預約管理工作台
            </h2>
          </div>
        </div>

        <div className="border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-[#b68655]" />
            <h3 className="text-lg font-black text-[#3b2d26]">
              預約時段控管
            </h3>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_1.1fr_auto]">
            <select
              value={blockForm.store_id}
              onChange={(event) =>
                setBlockForm({
                  ...blockForm,
                  store_id: Number(event.target.value),
                })
              }
              className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-bold text-[#4f4032] outline-none transition focus:border-[#b68655] focus:ring-2 focus:ring-[#ead8ba]"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              min={todayDateString()}
              value={blockForm.block_date}
              onChange={(event) =>
                setBlockForm({ ...blockForm, block_date: event.target.value })
              }
              className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-bold text-[#4f4032] outline-none transition focus:border-[#b68655] focus:ring-2 focus:ring-[#ead8ba]"
            />

            <select
              value={blockForm.start_time}
              onChange={(event) =>
                setBlockForm({ ...blockForm, start_time: event.target.value })
              }
              className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-bold text-[#4f4032] outline-none transition focus:border-[#b68655] focus:ring-2 focus:ring-[#ead8ba]"
            >
              {defaultTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <input
              value={blockForm.reason}
              onChange={(event) =>
                setBlockForm({ ...blockForm, reason: event.target.value })
              }
              className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-bold text-[#4f4032] outline-none transition focus:border-[#b68655] focus:ring-2 focus:ring-[#ead8ba]"
              placeholder="原因，例如已滿、內部保留"
            />

            <button
              type="button"
              onClick={addBlock}
              className="cursor-pointer rounded-2xl bg-[#3b2d26] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7b6349]"
            >
              關閉時段
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {activeBlocks.slice(0, 12).map((block) => (
              <span
                key={block.id}
                className="inline-flex items-center gap-2 rounded-full border border-[#e7d6be] bg-white px-4 py-2 text-sm font-bold text-[#7b6349]"
              >
                {block.store_name}｜{toDate(block.block_date)}{' '}
                {toTime(block.start_time)}｜{block.reason}

                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="cursor-pointer text-[#9a5c50] transition hover:scale-110"
                  aria-label="移除此關閉時段"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white px-6 py-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b68655]" />

              <input
                type="text"
                placeholder="搜尋寵物名稱、飼主姓名、電話、服務或門市..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-[#e7d6be] bg-[#fffaf3] py-3 pl-12 pr-4 text-sm font-bold text-[#4f4032] outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayDateString());
                  setShowAllDates(false);
                }}
                className={`cursor-pointer rounded-2xl px-5 py-3 text-sm font-black transition ${
                  !showAllDates && selectedDate === todayDateString()
                    ? 'bg-[#3b2d26] text-white'
                    : 'border border-[#e7d6be] bg-white text-[#7b6349] hover:bg-[#fffaf3]'
                }`}
              >
                今天
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setShowAllDates(false);
                }}
                className="rounded-2xl border border-[#e7d6be] bg-white px-5 py-3 text-sm font-black text-[#7b6349] outline-none focus:border-[#b68655]"
              />

              <button
                type="button"
                onClick={() => setShowAllDates(true)}
                className={`cursor-pointer rounded-2xl px-5 py-3 text-sm font-black transition ${
                  showAllDates
                    ? 'bg-[#3b2d26] text-white'
                    : 'border border-[#e7d6be] bg-white text-[#7b6349] hover:bg-[#fffaf3]'
                }`}
              >
                全部預約
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
          </div>
        ) : (
          <div className="grid gap-8 p-6">
            <BookingTableSection
              title="待確認預約"
              subtitle="請先確認是否可接單，確認後預約才會進入服務流程。"
              emptyText="目前沒有待確認預約"
              bookings={pendingBookings}
              updatingId={updatingId}
              onDelete={deleteBooking}
              onUpdateStatus={updateBookingStatus}
            />

            <BookingTableSection
              title={selectedDateTitle}
              subtitle="已確認後的預約會依日期顯示；若已進入服務流程，請至服務進度頁更新。"
              emptyText={
                showAllDates ? '目前沒有已安排預約' : '這一天目前沒有預約'
              }
              bookings={dateBookings}
              updatingId={updatingId}
              onDelete={deleteBooking}
              onUpdateStatus={updateBookingStatus}
            />
          </div>
        )}

        {!loading &&
          searchedBookings.length === 0 &&
          searchTerm.trim().length > 0 && (
            <div className="px-6 pb-6">
              <div className="rounded-[1.75rem] bg-[#fffaf3] p-10 text-center font-bold text-[#9c8b78]">
                沒有符合搜尋條件的預約
              </div>
            </div>
          )}
      </section>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black text-[#9c8b78]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#3b2d26]">{value}</p>
    </div>
  );
}

function BookingTableSection({
  title,
  subtitle,
  emptyText,
  bookings,
  updatingId,
  onDelete,
  onUpdateStatus,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  bookings: Booking[];
  updatingId: number | string | null;
  onDelete: (booking: Booking) => void;
  onUpdateStatus: (booking: Booking, status: BookingStatus) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#e7d6be] bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b68655]">
            Bookings
          </p>

          <h3 className="mt-1 text-xl font-black text-[#3b2d26]">
            {title}
          </h3>

          <p className="mt-1 text-sm font-bold text-[#9c8b78]">
            {subtitle}
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#e7d6be] bg-white px-4 py-2 text-sm font-black text-[#7b6349]">
          共 {bookings.length} 筆
        </span>
      </div>

      {bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead>
              <tr className="bg-[#fffaf3] text-left text-xs font-black uppercase tracking-[0.12em] text-[#9c8b78]">
                <th className="whitespace-nowrap px-6 py-4">預約 / 服務</th>
                <th className="whitespace-nowrap px-6 py-4">會員</th>
                <th className="whitespace-nowrap px-6 py-4">門市</th>
                <th className="whitespace-nowrap px-6 py-4">日期時間</th>
                <th className="whitespace-nowrap px-6 py-4">金額</th>
                <th className="whitespace-nowrap px-6 py-4">狀態</th>
                <th className="whitespace-nowrap px-6 py-4 text-right">操作</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <BookingTableRow
                  key={booking.id}
                  booking={booking}
                  updating={updatingId === booking.id}
                  onDelete={() => onDelete(booking)}
                  onUpdateStatus={(status) => onUpdateStatus(booking, status)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6">
          <div className="rounded-[1.5rem] p-8 text-center font-bold text-[#9c8b78]">
            {emptyText}
          </div>
        </div>
      )}
    </section>
  );
}

function BookingTableRow({
  booking,
  updating,
  onDelete,
  onUpdateStatus,
}: {
  booking: Booking;
  updating: boolean;
  onDelete: () => void;
  onUpdateStatus: (status: BookingStatus) => void;
}) {
  const locked = isLockedInAppointmentPage(booking.status as BookingStatus);
  const lockedMessage = appointmentLockMessage(booking.status as BookingStatus);
  const serviceStarted = hasServiceStarted(
    toDate(booking.booking_date),
    toTime(booking.start_time),
  );

  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(
    booking.status as BookingStatus,
  );

  useEffect(() => {
    setSelectedStatus(booking.status as BookingStatus);
  }, [booking.status]);

  const canDelete = !serviceStarted && !locked;
  const canUpdate = selectedStatus !== booking.status;

  return (
    <tr className="border-t border-[#f1e6d6] align-middle transition hover:bg-[#fffaf3]">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="min-w-0">

            <p className="mt-1 whitespace-nowrap font-black text-[#3b2d26]">
              {booking.pet_name || '毛孩'}
            </p>

            <p className="mt-1 max-w-[320px] truncate text-sm font-bold text-[#7b6349]">
              {booking.service_names || booking.service_name || '服務項目'}
            </p>
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-5">
        <p className="font-black text-[#3b2d26]">
          {booking.customer_name || '會員'}
        </p>

        <p className="mt-1 text-sm font-bold text-[#9c8b78]">
          {booking.phone || '未留電話'}
        </p>
      </td>

      <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-[#7b6349]">
        {booking.store_name || '門市'}
      </td>

      <td className="whitespace-nowrap px-6 py-5">
        <p className="font-black text-[#3b2d26]">
          {toDate(booking.booking_date)}
        </p>

        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#7b6349]">
          <Clock3 className="h-4 w-4 text-[#b68655]" />
          {toTime(booking.start_time)}
        </p>
      </td>

      <td className="whitespace-nowrap px-6 py-5 text-sm font-black text-[#7b6349]">
        NT${booking.service_total_price || booking.service_price || 0}
      </td>

      <td className="whitespace-nowrap px-6 py-5">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
            bookingStatusStyles[booking.status as BookingStatus] ||
            'border-[#e7d6be] bg-[#fffaf3] text-[#7b6349]'
          }`}
        >
          {statusText[booking.status] || booking.status}
        </span>

        {lockedMessage && (
          <p className="mt-2 max-w-[180px] whitespace-normal text-xs font-bold leading-5 text-[#9c8b78]">
            {lockedMessage}
          </p>
        )}
      </td>

      <td className="px-6 py-5 text-right">
        <div className="inline-flex flex-col items-stretch gap-2">
          {!locked && (
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as BookingStatus)
                }
                disabled={updating}
                className="w-28 rounded-xl border border-[#e7d6be] bg-white px-3 py-2 text-sm font-black text-[#7b6349] outline-none transition focus:border-[#b68655] disabled:cursor-not-allowed disabled:bg-[#f7efe2] disabled:text-[#9c8b78]"
              >
                {appointmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusText[status]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onUpdateStatus(selectedStatus)}
                disabled={updating || !canUpdate}
                className="inline-flex w-20 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#3b2d26] px-3 py-2 text-sm font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                更新
              </button>
            </div>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={updating}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#fff1ec] px-3 py-2 text-sm font-black text-[#9a5c50] transition hover:bg-[#ffe6dc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              刪除
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}