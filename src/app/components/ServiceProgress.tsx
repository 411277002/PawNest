import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Loader2,
  Save,
  UploadCloud,
} from 'lucide-react';
import {
  Booking,
  BookingStatus,
  completeBookingPayment,
  getAllBookings,
  progressSteps,
  statusText,
  updateBookingStatus,
} from '../services/bookingApi';

function toDate(value?: string) {
  return value?.slice(0, 10) || '';
}

function toTime(value?: string) {
  return value?.slice(0, 5) || '';
}

const statusOptions: BookingStatus[] = [
  'checked_in',
  'in_service',
  'completed',
];

type PaymentDraft = {
  original_amount: string;
  discount_points_used: string;
  note: string;
};

function getCustomerPoints(booking: Booking) {
  const value =
    (booking as any).customer_membership_points ??
    (booking as any).membership_points ??
    0;

  return Number(value || 0);
}

function getTransactionFinalAmount(booking: Booking) {
  const value =
    (booking as any).transaction_final_amount ??
    (booking as any).final_amount ??
    null;

  return value === null || value === undefined ? null : Number(value);
}

function getTransactionOriginalAmount(booking: Booking) {
  const value =
    (booking as any).transaction_original_amount ??
    (booking as any).actual_amount ??
    null;

  return value === null || value === undefined ? null : Number(value);
}

function getTransactionPointsEarned(booking: Booking) {
  const value = (booking as any).transaction_points_earned ?? null;

  return value === null || value === undefined ? null : Number(value);
}

function getTransactionPointsUsed(booking: Booking) {
  const value =
    (booking as any).transaction_discount_points_used ??
    (booking as any).discount_points_used ??
    null;

  return value === null || value === undefined ? null : Number(value);
}

function isServiceProgressVisible(booking: Booking) {
  return ['confirmed', 'checked_in', 'in_service', 'completed'].includes(
    booking.status,
  );
}

function hasTransaction(booking: Booking) {
  return Boolean(
    (booking as any).transaction_id ||
      (booking as any).transaction_final_amount ||
      (booking as any).final_amount,
  );
}

function getInitialDraftStatus(booking: Booking): BookingStatus {
  if (booking.status === 'confirmed') return 'checked_in';
  return booking.status;
}

export function ServiceProgress() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [photoDrafts, setPhotoDrafts] = useState<Record<number, string>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<
    Record<number, PaymentDraft>
  >({});
  const [statusDrafts, setStatusDrafts] = useState<
    Record<number, BookingStatus>
  >({});
  const [expandedCompletedIds, setExpandedCompletedIds] = useState<
    Record<number, boolean>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [paymentSavingId, setPaymentSavingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>(
    'active',
  );

  const load = async () => {
    setLoading(true);

    try {
      const data = await getAllBookings();
      const serviceBookings = data.bookings.filter(isServiceProgressVisible);

      const photoMap: Record<number, string> = {};
      const paymentMap: Record<number, PaymentDraft> = {};
      const statusMap: Record<number, BookingStatus> = {};

      serviceBookings.forEach((booking) => {
        if (booking.photo_url) {
          photoMap[booking.id] = booking.photo_url;
        }

        const originalAmount = getTransactionOriginalAmount(booking);
        const pointsUsed = getTransactionPointsUsed(booking);

        paymentMap[booking.id] = {
          original_amount:
            originalAmount !== null
              ? String(originalAmount)
              : booking.service_total_price
                ? String(booking.service_total_price)
                : booking.service_price
                  ? String(booking.service_price)
                  : '',
          discount_points_used: pointsUsed !== null ? String(pointsUsed) : '0',
          note:
            (booking as any).transaction_note ||
            (booking as any).payment_note ||
            '',
        };

        statusMap[booking.id] = getInitialDraftStatus(booking);
      });

      setBookings(serviceBookings);
      setPhotoDrafts(photoMap);
      setPaymentDrafts(paymentMap);
      setStatusDrafts(statusMap);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取服務進度失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredBookings = useMemo(() => {
    if (filter === 'completed') {
      return bookings.filter(
        (booking) => booking.status === 'completed' && hasTransaction(booking),
      );
    }

    if (filter === 'active') {
      return bookings.filter((booking) => {
        if (booking.status === 'completed' && hasTransaction(booking)) {
          return false;
        }

        return true;
      });
    }

    return bookings;
  }, [bookings, filter]);

  const toggleCompletedDetail = (bookingId: number) => {
    setExpandedCompletedIds((current) => ({
      ...current,
      [bookingId]: !current[bookingId],
    }));
  };

  const updatePaymentDraft = (
    bookingId: number,
    field: keyof PaymentDraft,
    value: string,
  ) => {
    setPaymentDrafts((current) => ({
      ...current,
      [bookingId]: {
        original_amount: current[bookingId]?.original_amount || '',
        discount_points_used: current[bookingId]?.discount_points_used || '0',
        note: current[bookingId]?.note || '',
        [field]: value,
      },
    }));
  };

  const handlePhotoFile = (
    bookingId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('請選擇圖片檔案');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('圖片建議小於 2MB，請壓縮後再上傳。');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoDrafts((current) => ({
        ...current,
        [bookingId]: String(reader.result || ''),
      }));
    };

    reader.readAsDataURL(file);
  };

  const saveProgress = async (
    booking: Booking,
    nextStatus: BookingStatus,
    nextPhoto?: string | null,
  ) => {
    if (nextStatus === 'completed') {
      setMessage(
        '請使用下方「完成服務並結帳」按鈕完成服務，系統才會寫入實際消費、點數與 VIP 資格。',
      );
      return;
    }

    try {
      setSavingId(booking.id);

      await updateBookingStatus(booking.id, {
        status: nextStatus,
        photo_url: nextPhoto || booking.photo_url || null,
      });

      setMessage('服務進度已更新');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新失敗');
    } finally {
      setSavingId(null);
    }
  };

  const completePayment = async (booking: Booking) => {
    const draft = paymentDrafts[booking.id] || {
      original_amount: '',
      discount_points_used: '0',
      note: '',
    };

    const originalAmount = Number(draft.original_amount || 0);
    const pointsUsed = Number(draft.discount_points_used || 0);
    const availablePoints = getCustomerPoints(booking);
    const photo = photoDrafts[booking.id] || booking.photo_url || null;

    if (!originalAmount || originalAmount <= 0) {
      setMessage('請輸入實際消費金額。');
      return;
    }

    if (pointsUsed < 0) {
      setMessage('使用點數不可小於 0。');
      return;
    }

    if (pointsUsed > availablePoints) {
      setMessage(`會員目前只有 ${availablePoints} 點，無法折抵 ${pointsUsed} 點。`);
      return;
    }

    const confirmed = window.confirm(
      `確定完成服務並結帳嗎？\n\n實際金額：NT$${originalAmount}\n使用點數：${pointsUsed} 點\n實收金額：NT$${Math.max(
        originalAmount - pointsUsed,
        0,
      )}`,
    );

    if (!confirmed) return;

    try {
      setPaymentSavingId(booking.id);

      await completeBookingPayment(booking.id, {
        original_amount: originalAmount,
        discount_points_used: pointsUsed,
        note: draft.note,
        photo_url: photo,
      });

      setMessage('服務已完成並結帳');
      await load();
      setFilter('completed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '完成結帳失敗');
    } finally {
      setPaymentSavingId(null);
    }
  };

  return (
    <div className="space-y-3 text-[#4f4032]">
      <div className="inline-flex w-fit shrink-0 self-start rounded-full border border-[#e7d6be] bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-black transition ${
            filter === 'active'
              ? 'bg-[#3b2d26] text-white'
              : 'text-[#7b6349] hover:bg-[#fffaf3]'
          }`}
        >
          進行中
        </button>

        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-black transition ${
            filter === 'completed'
              ? 'bg-[#3b2d26] text-white'
              : 'text-[#7b6349] hover:bg-[#fffaf3]'
          }`}
        >
          已完成
        </button>

        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-black transition ${
            filter === 'all'
              ? 'bg-[#3b2d26] text-white'
              : 'text-[#7b6349] hover:bg-[#fffaf3]'
          }`}
        >
          全部
        </button>
      </div>

      {message && (
        <div className="rounded-[1.5rem] border border-[#e7d6be] bg-[#fffaf3] px-5 py-3 text-sm font-black text-[#7b6349] shadow-sm shadow-[#ead8ba]/30">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => {
            const current = progressSteps.indexOf(booking.status);
            const safeCurrent = current < 0 ? 1 : current;
            const draftPhoto = photoDrafts[booking.id] || '';
            const isCompleted = booking.status === 'completed';
            const transactionFinalAmount = getTransactionFinalAmount(booking);
            const transactionOriginalAmount =
              getTransactionOriginalAmount(booking);
            const transactionPointsEarned = getTransactionPointsEarned(booking);
            const transactionPointsUsed = getTransactionPointsUsed(booking);
            const availablePoints = getCustomerPoints(booking);

            const isCompletedWithTransaction =
              isCompleted && transactionFinalAmount !== null;

            const shouldCollapseCompleted =
              isCompletedWithTransaction &&
              (filter === 'completed' || filter === 'all');

            const isExpandedCompleted =
              !shouldCollapseCompleted || expandedCompletedIds[booking.id];

            const shouldShowDetails =
              !isCompletedWithTransaction || isExpandedCompleted;

            const draft = paymentDrafts[booking.id] || {
              original_amount: booking.service_total_price
                ? String(booking.service_total_price)
                : booking.service_price
                  ? String(booking.service_price)
                  : '',
              discount_points_used: '0',
              note: '',
            };

            const originalAmount = Number(draft.original_amount || 0);
            const pointsUsed = Number(draft.discount_points_used || 0);
            const finalAmount = Math.max(originalAmount - pointsUsed, 0);
            const pointsEarnedPreview = Math.floor(finalAmount / 100);

            const selectedDraftStatus =
              statusDrafts[booking.id] || getInitialDraftStatus(booking);

            return (
              <article
                key={booking.id}
                className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm shadow-[#ead8ba]/40 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 lg:flex-row lg:items-start">
                  <div>
                    <h2 className="mt-1 text-xl font-black text-[#3b2d26]">
                      {booking.pet_name || '毛孩'}・
                      {booking.service_names ||
                        booking.service_name ||
                        '服務項目'}
                    </h2>

                    <p className="mt-2 text-sm font-bold text-[#9c8b78]">
                      {booking.customer_name || '會員'}｜
                      {toDate(booking.booking_date)} {toTime(booking.start_time)}
                      ｜{booking.store_name || '門市'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:min-w-[360px] sm:flex-row sm:justify-end">
                    {!isCompletedWithTransaction && (
                      <div className="grid gap-3 sm:grid-cols-[190px_auto]">
                        <select
                          value={selectedDraftStatus}
                          onChange={(event) =>
                            setStatusDrafts((current) => ({
                              ...current,
                              [booking.id]:
                                event.target.value as BookingStatus,
                            }))
                          }
                          disabled={savingId === booking.id}
                          className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-black text-[#7b6349] outline-none transition focus:border-[#b68655] focus:ring-2 focus:ring-[#ead8ba] disabled:opacity-60"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusText[status]}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={savingId === booking.id}
                          onClick={() =>
                            saveProgress(
                              booking,
                              selectedDraftStatus,
                              draftPhoto || booking.photo_url || null,
                            )
                          }
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-5 py-3 font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === booking.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Save className="h-5 w-5" />
                          )}
                          儲存
                        </button>
                      </div>
                    )}

                    {isCompletedWithTransaction &&
                      (filter === 'completed' || filter === 'all') && (
                        <button
                          type="button"
                          onClick={() => toggleCompletedDetail(booking.id)}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 font-black text-[#7b6349] transition hover:bg-white"
                        >
                          {isExpandedCompleted ? (
                            <>
                              收合細節
                              <ChevronUp className="h-5 w-5" />
                            </>
                          ) : (
                            <>
                              查看細節
                              <ChevronDown className="h-5 w-5" />
                            </>
                          )}
                        </button>
                      )}
                  </div>
                </div>

                <div className="p-6">
                  {!isCompletedWithTransaction && (
                    <div className="grid gap-3 md:grid-cols-5">
                      {progressSteps.map((step, index) => {
                        const done = index <= safeCurrent;

                        return (
                          <div
                            key={step}
                            className={`rounded-2xl border px-4 py-4 ${
                              done
                                ? 'border-[#d8c5aa] bg-[#f7efe2]'
                                : 'border-[#e7d6be] bg-[#fffaf3]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {done ? (
                                <CheckCircle className="h-5 w-5 text-[#b68655]" />
                              ) : (
                                <Clock className="h-5 w-5 text-[#9c8b78]" />
                              )}

                              <span className="text-sm font-black text-[#7b6349]">
                                {statusText[step]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isCompletedWithTransaction &&
                    (filter === 'completed' || filter === 'all') && (
                      <div className="rounded-[1.5rem] border border-[#e7d6be] bg-[#fffaf3] px-5 py-4 text-sm font-bold text-[#7b6349]">
                        已完成結帳：實收 NT${transactionFinalAmount}，獲得{' '}
                        {transactionPointsEarned || 0} 點。
                      </div>
                    )}

                  {shouldShowDetails && (
                    <>
                      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
                        <div className="overflow-hidden rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3]">
                          {draftPhoto ? (
                            <img
                              src={draftPhoto}
                              alt="完成照片"
                              className="h-48 w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-48 place-items-center text-[#9c8b78]">
                              <Camera className="h-10 w-10" />
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-5">
                          <h3 className="font-black text-[#3b2d26]">
                            完成照片
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-[#7b6349]">
                            可先上傳完成照，但正式完成服務必須按下方「完成服務並結帳」。
                          </p>

                          {!isCompletedWithTransaction && (
                            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#b68655] px-5 py-3 font-black text-white shadow-sm transition hover:bg-[#7b6349]">
                              <UploadCloud className="h-5 w-5" />
                              上傳完成照
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  handlePhotoFile(booking.id, event)
                                }
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-[#b68655]" />
                          <h3 className="font-black text-[#3b2d26]">
                            實際消費與點數紀錄
                          </h3>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                          <span className="rounded-full border border-[#e7d6be] bg-white px-3 py-1 text-[#7b6349]">
                            可用點數：{availablePoints} 點
                          </span>

                          {(booking as any).customer_membership_tier && (
                            <span className="rounded-full border border-[#e7d6be] bg-white px-3 py-1 text-[#7b6349]">
                              會員等級：
                              {(booking as any).customer_membership_tier === 'vip'
                                ? 'VIP'
                                : '一般會員'}
                            </span>
                          )}
                        </div>

                        {transactionFinalAmount !== null ? (
                          <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#7b6349] md:grid-cols-4">
                            <div>
                              <p className="text-xs text-[#9c8b78]">實際金額</p>
                              <p className="mt-1 text-lg text-[#3b2d26]">
                                NT${transactionOriginalAmount || 0}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[#9c8b78]">使用點數</p>
                              <p className="mt-1 text-lg text-[#3b2d26]">
                                {transactionPointsUsed || 0} 點
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[#9c8b78]">實收金額</p>
                              <p className="mt-1 text-lg text-[#3b2d26]">
                                NT${transactionFinalAmount}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[#9c8b78]">獲得點數</p>
                              <p className="mt-1 text-lg text-[#3b2d26]">
                                {transactionPointsEarned || 0} 點
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid gap-3 md:grid-cols-3">
                              <label className="grid gap-2 text-sm font-black text-[#7b6349]">
                                實際消費金額
                                <input
                                  type="number"
                                  min="0"
                                  value={draft.original_amount}
                                  onChange={(event) =>
                                    updatePaymentDraft(
                                      booking.id,
                                      'original_amount',
                                      event.target.value,
                                    )
                                  }
                                  placeholder="例如 1200"
                                  className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-[#4f4032] outline-none focus:border-[#b68655]"
                                />
                              </label>

                              <label className="grid gap-2 text-sm font-black text-[#7b6349]">
                                使用點數折抵
                                <input
                                  type="number"
                                  min="0"
                                  max={availablePoints}
                                  value={draft.discount_points_used}
                                  onChange={(event) =>
                                    updatePaymentDraft(
                                      booking.id,
                                      'discount_points_used',
                                      event.target.value,
                                    )
                                  }
                                  placeholder="例如 100"
                                  className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-[#4f4032] outline-none focus:border-[#b68655]"
                                />
                              </label>

                              <div className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3">
                                <p className="text-sm font-black text-[#9c8b78]">
                                  結帳預覽
                                </p>
                                <p className="mt-1 text-sm font-bold text-[#7b6349]">
                                  實收 NT${finalAmount}
                                </p>
                                <p className="text-sm font-bold text-[#7b6349]">
                                  預計獲得 {pointsEarnedPreview} 點
                                </p>
                              </div>
                            </div>

                            <label className="mt-4 grid gap-2 text-sm font-black text-[#7b6349]">
                              結帳備註
                              <textarea
                                value={draft.note}
                                onChange={(event) =>
                                  updatePaymentDraft(
                                    booking.id,
                                    'note',
                                    event.target.value,
                                  )
                                }
                                placeholder="例如：現場加購深層護毛、毛量較多加價..."
                                rows={3}
                                className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-[#4f4032] outline-none focus:border-[#b68655]"
                              />
                            </label>

                            <button
                              type="button"
                              disabled={paymentSavingId === booking.id}
                              onClick={() => completePayment(booking)}
                              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#3b2d26] px-5 py-3 font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {paymentSavingId === booking.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <CreditCard className="h-5 w-5" />
                              )}
                              完成服務並結帳
                            </button>
                          </>
                        )}

                        {isCompleted && transactionFinalAmount === null && (
                          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#9c8b78]">
                            此預約目前狀態為已完成，但尚未建立實際消費紀錄。請補上金額後按「完成服務並結帳」。
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && filteredBookings.length === 0 && (
        <div className="rounded-[2rem] border border-[#e7d6be] bg-white p-10 text-center font-bold text-[#9c8b78] shadow-sm shadow-[#ead8ba]/40">
          目前沒有服務進度
        </div>
      )}
    </div>
  );
}