import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Info, Loader2, MapPin, PawPrint, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvailabilitySlot, BookingOptions, createBooking, getAvailability, getBookingOptions } from '../../services/bookingApi';

type BookingForm = { pet_id: number; service_ids: number[]; store_id: number; booking_date: string; start_time: string; note: string };
function todayDateString() { return new Date().toISOString().slice(0, 10); }
function tomorrowDateString() { const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); }
function formatPrice(value?: number | null) { return `NT$${Number(value || 0).toLocaleString()} 起`; }
function targetLabel(value?: string) { if (value === 'dog') return '狗狗專屬'; if (value === 'cat') return '貓咪專屬'; return '貓狗皆可'; }
function serviceAllowedForPet(serviceTarget: string | undefined, petType: string | undefined) { return !serviceTarget || serviceTarget === 'all' || serviceTarget === petType; }

export function BookingPage() {
  const [options, setOptions] = useState<BookingOptions>({ pets: [], services: [], stores: [] });
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [form, setForm] = useState<BookingForm>({ pet_id: 0, service_ids: [], store_id: 0, booking_date: tomorrowDateString(), start_time: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOptions() {
      setLoading(true); setError('');
      try {
        const data = await getBookingOptions();
        setOptions(data);
        const firstPet = data.pets[0];
        const firstService = data.services.find((service) => serviceAllowedForPet(service.target_pet_type, firstPet?.type));
        setForm((prev) => ({ ...prev, pet_id: firstPet?.id || 0, service_ids: firstService?.id ? [firstService.id] : [], store_id: data.stores[0]?.id || 0 }));
      } catch (err) { setError(err instanceof Error ? err.message : '讀取預約資料失敗'); }
      finally { setLoading(false); }
    }
    loadOptions();
  }, []);

  const selectedPet = options.pets.find((pet) => pet.id === form.pet_id);
  const availableServices = useMemo(() => options.services.filter((service) => serviceAllowedForPet(service.target_pet_type, selectedPet?.type)), [options.services, selectedPet?.type]);
  const selectedServices = useMemo(() => availableServices.filter((service) => form.service_ids.includes(service.id)), [availableServices, form.service_ids]);
  const selectedStore = options.stores.find((store) => store.id === form.store_id);
  const referencePrice = useMemo(() => selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0), [selectedServices]);
  const referenceDuration = useMemo(() => selectedServices.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0), [selectedServices]);
  const selectedServiceNames = selectedServices.length > 0 ? selectedServices.map((service) => service.name).join('、') : '-';

  useEffect(() => {
    if (!selectedPet) return;
    setForm((prev) => ({ ...prev, service_ids: prev.service_ids.filter((id) => availableServices.some((service) => service.id === id)) }));
  }, [selectedPet?.id, availableServices]);

  useEffect(() => {
    async function loadAvailability() {
      if (!form.store_id || !form.booking_date) return;
      setSlotsLoading(true);
      try {
        const data = await getAvailability(form.store_id, form.booking_date, form.service_ids);
        setSlots(data.slots);
        const current = data.slots.find((slot) => slot.time === form.start_time);
        if (!current?.available) {
          const first = data.slots.find((slot) => slot.available);
          setForm((prev) => ({ ...prev, start_time: first?.time || '' }));
        }
      } catch (err) { setError(err instanceof Error ? err.message : '讀取可預約時段失敗'); }
      finally { setSlotsLoading(false); }
    }
    loadAvailability();
  }, [form.store_id, form.booking_date, form.service_ids.join(',')]);

  const toggleService = (serviceId: number) => {
    setForm((prev) => {
      const exists = prev.service_ids.includes(serviceId);
      return { ...prev, service_ids: exists ? prev.service_ids.filter((id) => id !== serviceId) : [...prev.service_ids, serviceId] };
    });
  };

  const handlePetChange = (petId: number) => {
    const pet = options.pets.find((item) => item.id === petId);
    const allowed = options.services.filter((service) => serviceAllowedForPet(service.target_pet_type, pet?.type));
    setForm((prev) => ({ ...prev, pet_id: petId, service_ids: prev.service_ids.filter((id) => allowed.some((service) => service.id === id)) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setSubmitted(false); setError('');
    try {
      if (form.service_ids.length === 0) throw new Error('請至少選擇一個服務項目');
      if (!form.start_time) throw new Error('請選擇可預約時段');
      await createBooking(form);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { setError(err instanceof Error ? err.message : '建立預約失敗'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="rounded-[2.5rem] border border-[#e7d6be] bg-gradient-to-br from-[#fffaf3] via-[#ead8ba] to-[#ead8ba] p-8 shadow-sm md:p-12">
        <p className="font-black tracking-[0.25em] text-[#b68655]">BOOKING</p><h1 className="mt-3 text-4xl font-black text-[#4f4032] md:text-5xl">線上預約</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">選擇毛孩、服務、門市與可預約時段。服務項目可複選，例如住宿時順便洗澡，或洗澡加購藥浴。</p>
        <div className="mt-6 rounded-3xl border border-[#e7d6be] bg-white/70 px-5 py-4"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-[#b68655]" /><p className="text-sm font-bold leading-7 text-[#7b6349]">系統會依毛孩種類自動篩選服務項目，也會在包含住宿或安親時檢查該門市房間數是否足夠。線上顯示為參考價格，實際金額以現場評估後結帳為準。</p></div></div>
      </section>

      {submitted && <div className="mt-8 rounded-[2rem] border border-green-200 bg-green-50 p-6 text-green-900 shadow-sm"><div className="flex items-start gap-4"><CheckCircle2 className="mt-1 h-7 w-7 text-green-600" /><div><h2 className="text-2xl font-black">預約已建立！</h2><p className="mt-2 leading-7">已送出 {selectedPet?.name} 的 {selectedServiceNames} 預約。你可以在「我的預約」查看服務進度。</p><Link to="/my-bookings" className="mt-4 inline-flex rounded-full bg-[#7b6349] px-5 py-2.5 text-sm font-black text-white">前往我的預約</Link></div></div></div>}
      {error && <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 font-bold text-red-700">{error}</div>}

      {loading ? <div className="mt-8 flex items-center gap-3 rounded-3xl border border-[#e7d6be] bg-white p-6 font-bold text-[#7b6349]"><Loader2 className="h-5 w-5 animate-spin" /> 正在讀取可預約項目...</div> : options.pets.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[#e7d6be] bg-white p-8 text-center"><PawPrint className="mx-auto h-10 w-10 text-[#b68655]" /><h2 className="mt-4 text-2xl font-black text-[#4f4032]">尚未建立寵物資料</h2><p className="mt-2 text-[#7b6349]">請先到寵物資料頁建立毛孩，才能新增預約。</p><Link to="/pets" className="mt-5 inline-flex rounded-full bg-[#b68655] px-6 py-3 font-black text-white">前往寵物資料</Link></div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"><div className="grid gap-6">
          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><PawPrint className="h-5 w-5 text-[#b68655]" /><h2 className="text-xl font-black text-[#4f4032]">1. 選擇毛孩</h2></div><div className="grid gap-4 md:grid-cols-3">{options.pets.map((pet) => <label key={pet.id} className={`cursor-pointer overflow-hidden rounded-3xl border transition ${form.pet_id === pet.id ? 'border-[#b68655] bg-[#f7efe2] shadow-sm' : 'border-[#e7d6be] bg-white hover:bg-[#f7efe2]'}`}><input type="radio" name="pet_id" value={pet.id} checked={form.pet_id === pet.id} onChange={(e) => handlePetChange(Number(e.target.value))} className="sr-only" />{pet.photo_url ? <img src={pet.photo_url} alt={pet.name} className="h-32 w-full object-cover" /> : <div className="grid h-32 place-items-center text-5xl">{pet.type === 'cat' ? '🐈' : '🐕'}</div>}<div className="p-5"><div className="font-black text-[#4f4032]">{pet.name}</div><div className="text-sm text-[#9c8b78]">{pet.type === 'cat' ? '貓咪' : pet.type === 'dog' ? '狗狗' : '其他'}・{pet.breed || '未填品種'}</div><p className="mt-3 text-xs leading-5 text-[#7b6349]">{pet.note || '尚未填寫照護備註'}</p></div></label>)}</div></section>

          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#b68655]" /><div><h2 className="text-xl font-black text-[#4f4032]">2. 選擇服務</h2><p className="mt-1 text-sm font-bold text-[#9c8b78]">可複選，系統已依目前毛孩種類過濾不適用項目。</p></div></div><div className="grid gap-4 md:grid-cols-2">{availableServices.map((service) => { const checked = form.service_ids.includes(service.id); return <label key={service.id} className={`cursor-pointer rounded-3xl border p-5 transition ${checked ? 'border-[#b68655] bg-[#f7efe2] shadow-sm' : 'border-[#e7d6be] bg-white hover:bg-[#f7efe2]'}`}><input type="checkbox" value={service.id} checked={checked} onChange={() => toggleService(service.id)} className="sr-only" /><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-black ${checked ? 'border-[#7b6349] bg-[#7b6349] text-white' : 'border-[#d8c5aa] bg-white text-transparent'}`}>✓</span><h3 className="font-black text-[#4f4032]">{service.name}</h3></div><p className="mt-2 text-sm leading-6 text-[#7b6349]">{service.description}</p><p className="mt-3 text-xs font-bold leading-5 text-[#9c8b78]">{targetLabel(service.target_pet_type)}｜實際金額依現場評估。</p></div><div className="shrink-0 rounded-full bg-[#ead8ba] px-3 py-1 text-sm font-black text-[#7b6349]">{formatPrice(service.price)}</div></div></label>; })}</div>{availableServices.length === 0 && <div className="rounded-2xl bg-white px-4 py-5 text-sm font-bold text-[#9c8b78]">目前沒有適合此毛孩種類的服務。</div>}</section>

          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><MapPin className="h-5 w-5 text-[#b68655]" /><h2 className="text-xl font-black text-[#4f4032]">3. 選擇門市與時段</h2></div><div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[#4f4032]">門市<select value={form.store_id} onChange={(e) => setForm({ ...form, store_id: Number(e.target.value) })} className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 outline-none focus:border-[#b68655]">{options.stores.map((store) => <option key={store.id} value={store.id}>{store.name}｜狗狗房 {store.dog_room_capacity || 0}｜貓咪房 {store.cat_room_capacity || 0}｜安親 {store.daycare_capacity || 0}</option>)}</select></label><label className="grid gap-2 text-sm font-black text-[#4f4032]">日期<input min={todayDateString()} type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 outline-none focus:border-[#b68655]" /></label></div><div className="mt-5"><div className="mb-3 flex items-center gap-2 text-sm font-black text-[#4f4032]"><Clock className="h-4 w-4 text-[#b68655]" />可預約時段 {slotsLoading && <Loader2 className="h-4 w-4 animate-spin" />}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{slots.map((slot) => <button key={slot.time} type="button" disabled={!slot.available} onClick={() => setForm({ ...form, start_time: slot.time })} className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${form.start_time === slot.time ? 'border-[#7b6349] bg-[#7b6349] text-white' : slot.available ? 'border-[#e7d6be] bg-white text-[#4f4032] hover:bg-[#f7efe2]' : 'cursor-not-allowed border-[#eadfd0] bg-[#f2ece3] text-[#b8aa98]'}`} title={slot.reason || ''}>{slot.time}<div className="mt-1 text-[11px] font-bold opacity-80">{slot.available ? '可預約' : slot.reason}</div></button>)}</div></div></section>
          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-sm"><label className="grid gap-2 text-sm font-black text-[#4f4032]">備註<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} placeholder="例如：容易緊張、需要慢慢安撫、住宿需餵藥..." className="rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 outline-none focus:border-[#b68655]" /></label></section>
        </div>
        <aside className="h-fit rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-sm lg:sticky lg:top-28"><p className="font-black tracking-[0.2em] text-[#b68655]">SUMMARY</p><h2 className="mt-2 text-2xl font-black text-[#4f4032]">預約摘要</h2><div className="mt-6 grid gap-4 text-sm"><SummaryRow icon={<PawPrint className="h-4 w-4" />} label="毛孩" value={selectedPet?.name || '-'} /><SummaryRow icon={<Sparkles className="h-4 w-4" />} label="服務" value={selectedServiceNames} /><SummaryRow icon={<Clock className="h-4 w-4" />} label="參考時長" value={referenceDuration > 0 ? `${referenceDuration} 分鐘` : '依現場評估'} /><SummaryRow icon={<MapPin className="h-4 w-4" />} label="門市" value={selectedStore?.name || '-'} /><SummaryRow icon={<Calendar className="h-4 w-4" />} label="時間" value={`${form.booking_date} ${form.start_time || '未選擇'}`} /></div><div className="mt-6 rounded-3xl bg-[#f7efe2] p-5"><div className="flex items-center justify-between gap-4"><span className="font-bold text-[#7b6349]">合計參考價格</span><span className="text-3xl font-black text-[#4f4032]">{formatPrice(referencePrice)}</span></div><div className="mt-4 rounded-2xl bg-white px-4 py-3"><div className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#b68655]" /><p className="text-xs font-bold leading-6 text-[#7b6349]">此價格僅供預約前參考，實際結帳金額會由員工依現場評估後輸入，並依實收金額計算會員點數與 VIP 累積消費。</p></div></div></div><button disabled={submitting || !form.start_time || form.service_ids.length === 0} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white transition hover:bg-[#6b543d] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}送出預約</button><p className="mt-4 text-center text-xs font-bold leading-6 text-[#9c8b78]">送出後可於「我的預約」查看狀態。服務完成後，實際金額、點數與完成照片會由員工更新。</p></aside>
        </form>
      )}
    </div></div>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3"><div className="flex items-center gap-2 font-bold text-[#9c8b78]">{icon}{label}</div><div className="max-w-[58%] text-right font-black text-[#4f4032]">{value}</div></div>;
}
