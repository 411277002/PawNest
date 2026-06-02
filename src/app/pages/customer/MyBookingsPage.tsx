import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, CheckCircle2, Edit3, Image as ImageIcon, Loader2, PawPrint, Save, Trash2, X } from 'lucide-react';
import { Booking, BookingOptions, canModifyBooking, deleteBooking, getAvailability, getBookingOptions, getMyBookings, progressSteps, statusText, updateBooking } from '../../services/bookingApi';

type EditForm = { pet_id: number; service_ids: number[]; store_id: number; booking_date: string; start_time: string; note: string };
function toDateInput(value: string) { return value?.slice(0, 10) || ''; }
function toTimeInput(value: string) { return value?.slice(0, 5) || ''; }

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [options, setOptions] = useState<BookingOptions>({ pets: [], services: [], stores: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [bookingRes, optionRes] = await Promise.all([getMyBookings(), getBookingOptions()]);
      setBookings(bookingRes.bookings); setOptions(optionRes);
    } catch (err) { setError(err instanceof Error ? err.message : '讀取預約資料失敗'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    async function loadSlots() {
      if (!form?.store_id || !form.booking_date) return;
      const data = await getAvailability(form.store_id, form.booking_date, form.service_ids);
      const times = data.slots.filter((slot) => slot.available || slot.time === form.start_time).map((slot) => slot.time);
      setAvailableTimes(times);
    }
    loadSlots().catch(() => setAvailableTimes([]));
  }, [form?.store_id, form?.booking_date, form?.service_ids?.join(',')]);

  const upcoming = useMemo(() => bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status)), [bookings]);
  const finished = useMemo(() => bookings.filter((booking) => ['completed', 'cancelled'].includes(booking.status)), [bookings]);
  const completedWithPhoto = useMemo(() => bookings.find((booking) => booking.status === 'completed' && booking.photo_url), [bookings]);

  const startEdit = (booking: Booking) => {
    if (!booking.can_modify && !canModifyBooking(toDateInput(booking.booking_date), booking.start_time)) { alert('服務開始前 4 小時內不可修改預約'); return; }
    setEditing(booking);
    setForm({ pet_id: booking.pet_id, service_ids: booking.service_ids ? booking.service_ids.split(',').map(Number).filter(Boolean) : [booking.service_id], store_id: booking.store_id, booking_date: toDateInput(booking.booking_date), start_time: toTimeInput(booking.start_time), note: booking.note || '' });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault(); if (!editing || !form) return;
    setSaving(true);
    try { await updateBooking(editing.id, form); setEditing(null); setForm(null); await loadData(); }
    catch (err) { alert(err instanceof Error ? err.message : '修改預約失敗'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (booking: Booking) => {
    if (!booking.can_modify && !canModifyBooking(toDateInput(booking.booking_date), booking.start_time)) { alert('服務開始前 4 小時內不可取消或刪除預約'); return; }
    if (!window.confirm(`確定要刪除 ${booking.pet_name || '毛孩'} 的 ${booking.service_names || booking.service_name || '服務'} 預約嗎？`)) return;
    try { await deleteBooking(booking.id); await loadData(); }
    catch (err) { alert(err instanceof Error ? err.message : '刪除預約失敗'); }
  };

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2.5rem] border border-[#e7d6be] bg-gradient-to-br from-[#fffaf3] via-[#ead8ba] to-[#ead8ba] p-8 shadow-sm md:p-12">
          <p className="font-black tracking-[0.25em] text-[#b68655]">MY BOOKINGS</p>
          <h1 className="mt-3 text-4xl font-black text-[#4f4032] md:text-5xl">我的預約紀錄</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">可查看服務進度、完成照片與服務完成通知；會員可在服務開始前 4 小時以前修改或刪除預約。</p>
        </section>

        {completedWithPhoto && <div className="mt-8 rounded-[2rem] border border-green-200 bg-green-50 p-6 text-green-900 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex flex-1 items-start gap-4"><BellRing className="mt-1 h-8 w-8 text-green-600" /><div><h2 className="text-2xl font-black">服務完成通知</h2><p className="mt-2 leading-7">{completedWithPhoto.pet_name} 的 {completedWithPhoto.service_names || completedWithPhoto.service_name} 已完成，門市已上傳完成照片。</p></div></div><img src={completedWithPhoto.photo_url || ''} alt="服務完成照片" className="h-32 w-full rounded-3xl object-cover md:w-56" /></div></div>}
        {loading && <div className="mt-8 flex items-center gap-3 rounded-3xl border border-[#e7d6be] bg-white p-6 font-bold text-[#7b6349]"><Loader2 className="h-5 w-5 animate-spin" /> 正在讀取預約資料...</div>}
        {error && <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 font-bold text-red-700">{error}</div>}
        {!loading && !error && <div className="mt-8 grid gap-8"><BookingSection title="即將到來" bookings={upcoming} onEdit={startEdit} onDelete={handleDelete} /><BookingSection title="歷史紀錄" bookings={finished} onEdit={startEdit} onDelete={handleDelete} /></div>}
      </div>

      {editing && form && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 px-4 py-8 backdrop-blur-sm"><form onSubmit={handleUpdate} className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black tracking-[0.18em] text-[#b68655]">EDIT BOOKING</p><h2 className="mt-1 text-2xl font-black text-[#4f4032]">編輯預約</h2><p className="mt-2 text-sm text-[#9c8b78]">只能修改服務開始前 4 小時以上的預約。</p></div><button type="button" onClick={() => setEditing(null)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f7efe2] text-[#7b6349]"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[#4f4032]">毛孩<select value={form.pet_id} onChange={(e) => setForm({ ...form, pet_id: Number(e.target.value) })} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655]">{options.pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label><div className="grid gap-2 text-sm font-black text-[#4f4032]">服務<div className="grid max-h-48 gap-2 overflow-auto rounded-2xl border border-[#e7d6be] bg-[#f7efe2] p-3">{options.services.map((service) => { const checked = form.service_ids.includes(service.id); return <label key={service.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 ${checked ? 'bg-white text-[#4f4032]' : 'text-[#7b6349]'}`}><span>{service.name}｜NT${service.price}</span><input type="checkbox" checked={checked} onChange={() => setForm({ ...form, service_ids: checked ? form.service_ids.filter((id) => id !== service.id) : [...form.service_ids, service.id] })} /></label>; })}</div></div><label className="grid gap-2 text-sm font-black text-[#4f4032]">門市<select value={form.store_id} onChange={(e) => setForm({ ...form, store_id: Number(e.target.value) })} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655]">{options.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label><label className="grid gap-2 text-sm font-black text-[#4f4032]">日期<input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655]" /></label><label className="grid gap-2 text-sm font-black text-[#4f4032]">時間<select value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655]">{availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select></label></div><label className="mt-5 grid gap-2 text-sm font-black text-[#4f4032]">備註<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655]" /></label><button disabled={saving} type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white transition hover:bg-[#6b543d] disabled:opacity-60">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}儲存修改</button></form></div>}
    </div>
  );
}

function BookingSection({ title, bookings, onEdit, onDelete }: { title: string; bookings: Booking[]; onEdit: (booking: Booking) => void; onDelete: (booking: Booking) => void }) {
  return <section className="rounded-[2rem] border border-[#e7d6be] bg-[#fffaf3] p-6 shadow-sm"><h2 className="text-2xl font-black text-[#4f4032]">{title}</h2>{bookings.length === 0 ? <div className="mt-5 rounded-3xl bg-[#f7efe2] p-6 text-[#7b6349]">目前沒有資料。</div> : <div className="mt-5 grid gap-5">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} onEdit={onEdit} onDelete={onDelete} />)}</div>}</section>;
}

function BookingCard({ booking, onEdit, onDelete }: { booking: Booking; onEdit: (booking: Booking) => void; onDelete: (booking: Booking) => void }) {
  const canModify = booking.can_modify ?? canModifyBooking(toDateInput(booking.booking_date), booking.start_time);
  const progressIndex = Math.max(0, progressSteps.indexOf(booking.status));
  const progressPercent = booking.status === 'cancelled' ? 0 : ((progressIndex + 1) / progressSteps.length) * 100;
  return <article className="rounded-[1.7rem] border border-[#e7d6be] bg-white p-5"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div className="flex flex-1 gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7efe2] text-[#b68655]"><PawPrint className="h-7 w-7" /></div><div className="flex-1"><div className="mb-2 inline-flex rounded-full bg-[#ead8ba] px-3 py-1 text-xs font-black text-[#7b6349]">{statusText[booking.status] || booking.status}</div><h3 className="text-xl font-black text-[#4f4032]">{booking.pet_name || '毛孩'}・{booking.service_names || booking.service_name || '服務'}</h3><p className="mt-2 text-sm leading-6 text-[#7b6349]">{booking.store_name || '門市'}｜{toDateInput(booking.booking_date)} {toTimeInput(booking.start_time)}</p><div className="mt-4"><div className="mb-2 flex justify-between text-xs font-black text-[#9c8b78]"><span>服務進度</span><span>{statusText[booking.status]}</span></div><div className="h-2 rounded-full bg-[#f7efe2]"><div className="h-2 rounded-full bg-[#b68655]" style={{ width: `${progressPercent}%` }} /></div><div className="mt-2 grid grid-cols-5 gap-1 text-[11px] font-bold text-[#9c8b78]">{progressSteps.map((step) => <span key={step} className={progressSteps.indexOf(step) <= progressIndex ? 'text-[#7b6349]' : ''}>{statusText[step]}</span>)}</div></div>{booking.photo_url && <div className="mt-4 overflow-hidden rounded-3xl border border-[#e7d6be]"><img src={booking.photo_url} alt="服務完成照片" className="h-48 w-full object-cover" /><div className="flex items-center gap-2 bg-[#fffaf3] px-4 py-3 text-sm font-black text-[#7b6349]"><ImageIcon className="h-4 w-4" />服務完成照片</div></div>}{booking.note && <p className="mt-3 text-sm text-[#9c8b78]">備註：{booking.note}</p>}{!canModify && !['completed', 'cancelled'].includes(booking.status) && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-black text-[#9a5c50]"><CalendarClock className="h-4 w-4" /> 服務開始前 4 小時內不可修改或刪除</p>}</div></div><div className="flex gap-2 md:flex-col"><button type="button" disabled={!canModify || ['completed', 'cancelled'].includes(booking.status)} onClick={() => onEdit(booking)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#b68655] px-4 py-3 text-sm font-black text-white transition hover:bg-[#9a744f] disabled:cursor-not-allowed disabled:bg-[#e7d6be]"><Edit3 className="h-4 w-4" /> 編輯</button><button type="button" disabled={!canModify || ['completed', 'cancelled'].includes(booking.status)} onClick={() => onDelete(booking)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-black text-[#9a5c50] transition hover:bg-[#fff1ec] disabled:cursor-not-allowed disabled:text-[#cdbfb2]"><Trash2 className="h-4 w-4" /> 刪除</button></div></div></article>;
}
