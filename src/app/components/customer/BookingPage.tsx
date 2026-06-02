import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MapPin,
  PawPrint,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AvailabilitySlot,
  BookingOptions,
  createBooking,
  getAvailability,
  getBookingOptions,
} from '../../services/bookingApi';

const COLORS = {
  cream: '#fffaf3',
  beige: '#f7efe2',
  wood: '#b68655',
  deep: '#3b2d26',
  border: '#e6d9c8',
};

type BookingForm = {
  pet_id: number;
  service_ids: number[];
  store_id: number;

  booking_date: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;

  note: string;
};

type TimeMode = 'grooming' | 'daycare' | 'boarding';

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function tomorrowDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatPrice(value?: number | null) {
  return `NT$${Number(value || 0).toLocaleString()} 起`;
}

function targetLabel(value?: string) {
  if (value === 'dog') return '狗狗專屬';
  if (value === 'cat') return '貓咪專屬';
  return '貓狗皆可';
}

function serviceAllowedForPet(serviceTarget: string | undefined, petType: string | undefined) {
  return !serviceTarget || serviceTarget === 'all' || serviceTarget === petType;
}

function diffDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 1;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(diff, 1);
}

function diffHours(startDate: string, startTime: string, endDate: string, endTime: string) {
  if (!startDate || !startTime || !endDate || !endTime) return 1;

  const start = new Date(`${startDate}T${normalizeTime(startTime)}`);
  const end = new Date(`${endDate}T${normalizeTime(endTime)}`);

  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60),
  );

  return Math.max(diff, 1);
}

function normalizeTime(time: string) {
  if (!time) return '00:00:00';
  return time.length === 5 ? `${time}:00` : time;
}

function getTimeMode(selectedServices: BookingOptions['services']): TimeMode {
  if (selectedServices.some((service) => service.category === 'boarding')) {
    return 'boarding';
  }

  if (selectedServices.some((service) => service.category === 'daycare')) {
    return 'daycare';
  }

  return 'grooming';
}

function formatBookingTime(form: BookingForm, mode: TimeMode) {
  if (mode === 'boarding') {
    return `${form.start_date} ${form.start_time || '未選擇'}－${form.end_date || '未選擇'} ${form.start_time || '未選擇'}`;
  }

  if (mode === 'daycare') {
    return `${form.start_date} ${form.start_time || '未選擇'}－${form.end_time || '未選擇'}`;
  }

  return `${form.start_date} ${form.start_time || '未選擇'}`;
}

export function BookingPage() {
  const defaultDate = tomorrowDateString();

  const [options, setOptions] = useState<BookingOptions>({
    pets: [],
    services: [],
    stores: [],
  });

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [form, setForm] = useState<BookingForm>({
    pet_id: 0,
    service_ids: [],
    store_id: 0,
    booking_date: defaultDate,
    start_date: defaultDate,
    start_time: '',
    end_date: defaultDate,
    end_time: '',
    note: '',
  });

  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setError('');

      try {
        const data = await getBookingOptions();
        setOptions(data);

        const firstPet = data.pets[0];
        const firstService = data.services.find((service) =>
          serviceAllowedForPet(service.target_pet_type, firstPet?.type),
        );

        setForm((prev) => ({
          ...prev,
          pet_id: firstPet?.id || 0,
          service_ids: firstService?.id ? [firstService.id] : [],
          store_id: data.stores[0]?.id || 0,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : '讀取預約資料失敗');
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  const selectedPet = options.pets.find((pet) => pet.id === form.pet_id);

  const availableServices = useMemo(
    () =>
      options.services.filter((service) =>
        serviceAllowedForPet(service.target_pet_type, selectedPet?.type),
      ),
    [options.services, selectedPet?.type],
  );

  const selectedServices = useMemo(
    () => availableServices.filter((service) => form.service_ids.includes(service.id)),
    [availableServices, form.service_ids],
  );

  const selectedStore = options.stores.find((store) => store.id === form.store_id);
  const timeMode = getTimeMode(selectedServices);

  const boardingDays = timeMode === 'boarding' ? diffDays(form.start_date, form.end_date) : 1;

  const daycareHours =
    timeMode === 'daycare'
      ? diffHours(form.start_date, form.start_time, form.end_date, form.end_time)
      : 1;

  const referencePrice = useMemo(() => {
    return selectedServices.reduce((sum, service) => {
      const price = Number(service.price || 0);

      if (service.category === 'boarding') {
        return sum + price * boardingDays;
      }

      if (service.category === 'daycare') {
        return sum + price * daycareHours;
      }

      return sum + price;
    }, 0);
  }, [selectedServices, boardingDays, daycareHours]);

  const referenceDuration = useMemo(() => {
    return selectedServices.reduce((sum, service) => {
      const duration = Number(service.duration_minutes || 0);

      if (service.category === 'daycare') {
        return sum + daycareHours * 60;
      }

      if (service.category === 'boarding') {
        return sum;
      }

      return sum + duration;
    }, 0);
  }, [selectedServices, daycareHours]);

  const selectedServiceNames =
    selectedServices.length > 0
      ? selectedServices.map((service) => service.name).join('、')
      : '-';

  useEffect(() => {
    if (!selectedPet) return;

    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.filter((id) =>
        availableServices.some((service) => service.id === id),
      ),
    }));
  }, [selectedPet?.id, availableServices]);

  useEffect(() => {
    setForm((prev) => {
      if (timeMode === 'daycare') {
        return {
          ...prev,
          end_date: prev.start_date,
        };
      }

      if (timeMode === 'grooming') {
        return {
          ...prev,
          end_date: prev.start_date,
          end_time: '',
        };
      }

      return {
        ...prev,
        end_date: prev.end_date < prev.start_date ? prev.start_date : prev.end_date,
      };
    });
  }, [timeMode, form.start_date]);

  useEffect(() => {
    async function loadAvailability() {
      if (!form.store_id || !form.start_date) return;

      setSlotsLoading(true);

      try {
        const data = await getAvailability(
          form.store_id,
          form.start_date,
          form.service_ids,
          {
            pet_id: form.pet_id,
            end_date: form.end_date,
            end_time: timeMode === 'boarding' ? form.start_time : form.end_time,
          },
        );

        setSlots(data.slots);

        const current = data.slots.find((slot) => slot.time === form.start_time);

        if (!current?.available) {
          const first = data.slots.find((slot) => slot.available);

          setForm((prev) => ({
            ...prev,
            start_time: first?.time || '',
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '讀取可預約時段失敗');
      } finally {
        setSlotsLoading(false);
      }
    }

    loadAvailability();
    }, [
    form.store_id,
    form.start_date,
    form.end_date,
    form.end_time,
    form.pet_id,
    form.service_ids.join(','),
    timeMode,
  ]);

  const toggleService = (serviceId: number) => {
    setForm((prev) => {
      const exists = prev.service_ids.includes(serviceId);

      return {
        ...prev,
        service_ids: exists
          ? prev.service_ids.filter((id) => id !== serviceId)
          : [...prev.service_ids, serviceId],
      };
    });
  };

  const handlePetChange = (petId: number) => {
    const pet = options.pets.find((item) => item.id === petId);
    const allowed = options.services.filter((service) =>
      serviceAllowedForPet(service.target_pet_type, pet?.type),
    );

    setForm((prev) => ({
      ...prev,
      pet_id: petId,
      service_ids: prev.service_ids.filter((id) =>
        allowed.some((service) => service.id === id),
      ),
    }));
  };

  const handleStartDateChange = (date: string) => {
    setForm((prev) => ({
      ...prev,
      booking_date: date,
      start_date: date,
      end_date: timeMode === 'boarding'
        ? prev.end_date < date
          ? date
          : prev.end_date
        : date,
    }));
  };

  const validateBeforeSubmit = () => {
    if (form.service_ids.length === 0) {
      throw new Error('請至少選擇一個服務項目');
    }

    if (!form.start_date || !form.start_time) {
      throw new Error('請選擇開始日期與開始時間');
    }

    if (timeMode === 'boarding') {
      if (!form.end_date) {
        throw new Error('住宿預約請選擇退房日期');
      }

      const start = new Date(`${form.start_date}T${normalizeTime(form.start_time)}`);
      const end = new Date(`${form.end_date}T${normalizeTime(form.start_time)}`);

      if (end <= start) {
        throw new Error('退房日期必須晚於入住日期');
      }
    }

    if (timeMode === 'daycare') {
      if (!form.end_time) {
        throw new Error('安親預約請選擇結束時間');
      }

      const start = new Date(`${form.start_date}T${normalizeTime(form.start_time)}`);
      const end = new Date(`${form.end_date}T${normalizeTime(form.end_time)}`);

      if (end <= start) {
        throw new Error('安親結束時間必須晚於開始時間');
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSubmitting(true);
    setSubmitted(false);
    setError('');

    try {
      validateBeforeSubmit();

      await createBooking({
        pet_id: form.pet_id,
        service_ids: form.service_ids,
        store_id: form.store_id,
        booking_date: form.start_date,
        start_date: form.start_date,
        start_time: form.start_time,
        end_date: timeMode === 'grooming' ? form.start_date : form.end_date,
        end_time:
          timeMode === 'grooming'
            ? undefined
            : timeMode === 'boarding'
              ? form.start_time
              : form.end_time,
        note: form.note,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立預約失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    !form.start_time ||
    form.service_ids.length === 0 ||
    (timeMode === 'boarding' && !form.end_date) ||
    (timeMode === 'daycare' && !form.end_time);

  return (
    <div style={{ background: COLORS.beige, color: COLORS.deep }} className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {submitted && (
          <div className="rounded-2xl bg-white p-6 text-green-900 shadow-sm" style={{ border: `1px solid #e6f5ea` }}>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 h-7 w-7 text-green-600" />
              <div>
                <h2 className="text-2xl font-extrabold">預約已建立！</h2>
                <p className="mt-2 leading-7">
                  已送出 {selectedPet?.name} 的 {selectedServiceNames} 預約。你可以在「我的預約」查看服務進度。
                </p>
                <Link
                  to="/my-bookings"
                  className="mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-black text-white"
                  style={{ background: COLORS.deep }}
                >
                  前往我的預約
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl p-6 font-bold text-red-700" style={{ background: '#fff5f5', border: '1px solid #f7d6d6' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white p-6 font-bold" style={{ border: `1px solid ${COLORS.border}` }}>
            <Loader2 className="h-5 w-5 animate-spin" />
            正在讀取可預約項目...
          </div>
        ) : options.pets.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center" style={{ border: `1px solid ${COLORS.border}` }}>
            <PawPrint className="mx-auto h-10 w-10" style={{ color: COLORS.wood }} />
            <h2 className="mt-4 text-2xl font-extrabold text-current">
              尚未建立寵物資料
            </h2>
            <p className="mt-2" style={{ color: '#7b6349' }}>
              請先到寵物資料頁建立毛孩，才能新增預約。
            </p>
            <Link
              to="/pets"
              className="mt-5 inline-flex rounded-full px-6 py-3 font-black text-white"
              style={{ background: COLORS.wood }}
            >
              前往寵物資料
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
          <section className="rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.cream }}>
            <div className="mb-5 flex items-center gap-3">
              <PawPrint className="h-5 w-5" style={{ color: COLORS.wood }} />
              <h2 className="text-xl font-extrabold text-current">1. 選擇毛孩</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {options.pets.map((pet) => (
                <label key={pet.id} className={`cursor-pointer overflow-hidden rounded-xl border transition`} style={form.pet_id === pet.id ? { borderColor: COLORS.wood, background: COLORS.beige, boxShadow: '0 6px 12px rgba(40,30,20,0.04)' } : { borderColor: COLORS.border, background: 'white' }}>
                  <input type="radio" name="pet_id" value={pet.id} checked={form.pet_id === pet.id} onChange={(e) => handlePetChange(Number(e.target.value))} className="sr-only" />
                  {pet.photo_url ? <img src={pet.photo_url} alt={pet.name} className="h-32 w-full object-cover" /> : <div className="grid h-32 place-items-center text-3xl">{pet.type === 'cat' ? '🐈' : '🐕'}</div>}
                  <div className="p-5">
                    <div className="font-extrabold text-current">{pet.name}</div>
                    <div className="text-sm" style={{ color: '#9c8b78' }}>{pet.type === 'cat' ? '貓咪' : pet.type === 'dog' ? '狗狗' : '其他'}・{pet.breed || '未填品種'}</div>
                    <p className="mt-3 text-xs" style={{ color: '#7b6349' }}>{pet.note || '尚未填寫照護備註'}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.cream }}>
            <div className="mb-5 flex items-center gap-3">
              <Sparkles className="h-5 w-5" style={{ color: COLORS.wood }} />
              <div>
                <h2 className="text-xl font-extrabold">2. 選擇服務</h2>
                <p className="mt-1 text-sm font-semibold" style={{ color: '#9c8b78' }}>可複選，系統已依目前毛孩種類過濾不適用項目。</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {availableServices.map((service) => {
                const checked = form.service_ids.includes(service.id);
                return (
                  <label key={service.id} className={`cursor-pointer rounded-xl border p-5 transition`} style={checked ? { borderColor: COLORS.wood, background: COLORS.beige, boxShadow: '0 6px 12px rgba(40,30,20,0.04)' } : { borderColor: COLORS.border, background: 'white' }}>
                    <input type="checkbox" value={service.id} checked={checked} onChange={() => toggleService(service.id)} className="sr-only" />
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black`} style={checked ? { background: COLORS.deep, color: 'white' } : { border: `1px solid ${COLORS.border}`, color: 'transparent' }}>✓</span>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="break-words font-extrabold text-current">{service.name}</h3>

                          <div className="shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-black" style={{ background: COLORS.cream, color: '#7b6349', border: `1px solid ${COLORS.border}` }}>
                            {formatPrice(service.price)}
                          </div>
                        </div>

                        <p className="break-words text-sm leading-6" style={{ color: '#7b6349' }}>{service.description}</p>

                        <p className="mt-3 break-words text-xs font-bold leading-5" style={{ color: '#9c8b78' }}>{targetLabel(service.target_pet_type)}｜實際金額依現場評估。</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {availableServices.length === 0 && <div className="rounded-2xl bg-white px-4 py-5 text-sm font-bold" style={{ color: '#9c8b78' }}>目前沒有適合此毛孩種類的服務。</div>}
          </section>

          <section className="rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.cream }}>
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="h-5 w-5" style={{ color: COLORS.wood }} />
              <div>
                <h2 className="text-xl font-extrabold">3. 選擇門市與時間</h2>
                <p className="mt-1 text-sm font-semibold" style={{ color: '#9c8b78' }}>
                  {timeMode === 'boarding'
                    ? '住宿需選擇入住與退房時間。'
                    : timeMode === 'daycare'
                      ? '安親需選擇開始與結束時間。'
                      : '美容服務請選擇服務日期與可預約時段。'}
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-black">
                門市
                <select
                  value={form.store_id}
                  onChange={(e) => setForm({ ...form, store_id: Number(e.target.value) })}
                  className="rounded-2xl border px-4 py-3 outline-none"
                  style={{ background: 'white', borderColor: COLORS.border }}
                >
                  {options.stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-black">
                {timeMode === 'boarding' ? '入住日期' : timeMode === 'daycare' ? '安親日期' : '服務日期'}
                <input
                  min={todayDateString()}
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="rounded-2xl border px-4 py-3 outline-none"
                  style={{ background: 'white', borderColor: COLORS.border }}
                />
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-black">
                <Clock className="h-4 w-4" style={{ color: COLORS.wood }} />
                {timeMode === 'boarding' ? '入住時間' : timeMode === 'daycare' ? '開始時間' : '可預約時段'}
                {slotsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setForm({ ...form, start_time: slot.time })}
                    className="rounded-2xl border px-4 py-3 text-sm font-black transition"
                    style={form.start_time === slot.time ? { borderColor: COLORS.wood, background: COLORS.deep, color: 'white' } : slot.available ? { borderColor: COLORS.border, background: 'white', color: COLORS.deep } : { borderColor: '#eadfd0', background: '#f2ece3', color: '#b8aa98' }}
                    title={slot.reason || ''}
                  >
                    {slot.time}
                    <div className="mt-1 text-[11px] font-bold opacity-80">
                      {slot.available ? '可預約' : slot.reason}
                    </div>
                  </button>
                ))}
              </div>

              {!slotsLoading && slots.length === 0 && (
                <div className="mt-3 rounded-2xl px-4 py-3 text-sm font-bold" style={{ color: '#9c8b78' }}>
                  目前沒有可顯示的時段。
                </div>
              )}
            </div>

            {timeMode === 'boarding' && (
              <div className="mt-5 grid gap-5">
                <label className="grid gap-2 text-sm font-black">
                  退房日期
                  <input
                    min={form.start_date}
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="rounded-2xl border px-4 py-3 outline-none"
                    style={{ background: 'white', borderColor: COLORS.border }}
                  />
                </label>

                <div className="rounded-2xl px-4 py-3 text-sm font-bold leading-6" style={{ background: 'white', color: '#7b6349' }}>
                  <p>退房時間：{form.end_date + ' ' + form.start_time || '請先選擇入住時間'}</p>
                  <p className="mt-1" style={{ color: '#9c8b78' }}>預估住宿天數：{boardingDays} 天</p>
                </div>
              </div>
            )}

            {timeMode === 'daycare' && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-black">
                  結束時間
                  <select
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_date: form.start_date, end_time: e.target.value })}
                    className="rounded-2xl border px-4 py-3 outline-none"
                    style={{ background: 'white', borderColor: COLORS.border }}
                  >
                    <option value="">請選擇</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </label>

                <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: 'white', color: '#7b6349' }}>
                  預估安親時數：{daycareHours} 小時
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.cream }}>
            <label className="grid gap-2 text-sm font-black">備註
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} placeholder="例如：容易緊張、需要慢慢安撫、住宿需餵藥..." className="rounded-2xl border px-4 py-3 outline-none" style={{ background: 'white', borderColor: COLORS.border }} />
            </label>
          </section>
        </div>
        <aside className="h-fit rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.cream }}>
          <p className="font-bold tracking-widest" style={{ color: COLORS.wood }}>SUMMARY</p>
          <h2 className="mt-2 text-2xl font-extrabold">預約摘要</h2>
          <div className="mt-6 grid gap-4 text-sm">
            <SummaryRow icon={<PawPrint className="h-4 w-4" />} label="毛孩" value={selectedPet?.name || '-'} />
            <SummaryRow icon={<Sparkles className="h-4 w-4" />} label="服務" value={selectedServiceNames} />
            <SummaryRow icon={<Clock className="h-4 w-4" />} label="參考時長" value={timeMode === 'boarding' ? `${boardingDays} 天` : referenceDuration > 0 ? `${referenceDuration} 分鐘` : '依現場評估'} />
            <SummaryRow icon={<MapPin className="h-4 w-4" />} label="門市" value={selectedStore?.name || '-'} />
            <SummaryRow icon={<Calendar className="h-4 w-4" />} label="時間" value={formatBookingTime(form, timeMode)} />
          </div>
          <div className="mt-6 rounded-2xl p-5" style={{ background: 'white' }}>
            <div className="flex items-center justify-between gap-4"><span className="font-bold" style={{ color: '#7b6349' }}>合計參考價格</span><span className="text-3xl font-extrabold text-current">{formatPrice(referencePrice)}</span></div>
            <div className="mt-4 rounded-2xl px-4 py-3">
              <div className="flex gap-2"><Info className="mt-0.5 h-4 w-4" style={{ color: COLORS.wood }} /><p className="text-xs font-bold leading-6" style={{ color: '#7b6349' }}>此價格僅供預約前參考，實際結帳金額會由員工依現場評估後輸入，並依實收金額計算會員點數與 VIP 累積消費。</p></div>
            </div>
          </div>
          <button disabled={submitDisabled} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60" style={{ background: COLORS.deep }}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}送出預約
          </button>
          <p className="mt-4 text-center text-xs font-bold leading-6" style={{ color: '#9c8b78' }}>送出後可於「我的預約」查看狀態。服務完成後，實際金額、點數與完成照片會由員工更新。</p>
        </aside>
        </form>
      )}
    </div>
  </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3"><div className="flex items-center gap-2 font-bold text-[#9c8b78]">{icon}{label}</div><div className="max-w-[58%] text-right font-black text-[#4f4032]">{value}</div></div>;
}
