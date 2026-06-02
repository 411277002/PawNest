import { FormEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarCheck, HeartPulse, Mail, MapPin, PawPrint, Phone, Save, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../../services/api';

type ProfileForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
};

export function ProfilePage() {
  const storedUser = useMemo(() => getStoredUser(), []);

  const [profile, setProfile] = useState<ProfileForm>({
    name: storedUser?.name || '王小美',
    username: storedUser?.username || 'customer',
    email: storedUser?.email || 'customer@pawnest.demo',
    phone: storedUser?.phone || '0912-345-678',
    address: '台北市信義區松仁路 88 號',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextUser = {
      ...(storedUser || {}),
      name: profile.name,
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
      role: storedUser?.role || 'customer',
    };

    localStorage.setItem('user', JSON.stringify(nextUser));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e7d6be] bg-gradient-to-br from-[#fffaf3] via-[#ead8ba] to-[#ead8ba] p-8 shadow-sm md:p-12">
          <p className="font-black tracking-[0.25em] text-[#b68655]">MEMBER PROFILE</p>
          <h1 className="mt-3 text-4xl font-black text-[#4f4032] md:text-5xl">編輯個人資料</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">
            管理會員基本資料與聯絡方式，方便門市在美容或住宿期間即時聯繫。
          </p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#f7efe2] p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-[#ead8ba] text-[#4f4032]">
                <User className="h-9 w-9" />
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-[#b68655]">CUSTOMER</p>
                <h2 className="mt-1 text-2xl font-black text-[#4f4032]">{profile.name}</h2>
                <p className="mt-1 text-sm text-[#9c8b78]">@{profile.username}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="電話" value={profile.phone} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="地址" value={profile.address} />
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[#f7efe2] p-5">
              <div className="flex items-start gap-3">
                <HeartPulse className="mt-1 h-5 w-5 text-[#b68655]" />
                <div>
                  <h3 className="font-black text-[#4f4032]">照護提醒</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7b6349]">
                    完整填寫聯絡方式，門市在美容或住宿期間能更快速聯繫。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link to="/pets" className="rounded-2xl bg-[#b68655] px-5 py-3 text-center font-black text-white shadow-sm transition hover:bg-[#9a744f]">
                管理寵物資料
              </Link>
              <Link to="/my-bookings" className="rounded-2xl border border-[#e7d6be] bg-white px-5 py-3 text-center font-black text-[#4f4032] transition hover:bg-[#f7efe2]">
                查看預約紀錄
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#e7d6be] bg-[#f7efe2] p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-[#b68655]">EDIT</p>
                <h2 className="mt-1 text-2xl font-black text-[#4f4032]">會員資料</h2>
              </div>
              {saved && <span className="rounded-full bg-[#e8f3df] px-4 py-2 text-sm font-black text-[#5f7f4f]">已儲存</span>}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="姓名" value={profile.name} onChange={(value) => setProfile({ ...profile, name: value })} />
                <Field label="帳號" value={profile.username} onChange={(value) => setProfile({ ...profile, username: value })} />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Email" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
                <Field label="電話" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
              </div>

              <Field label="地址" value={profile.address} onChange={(value) => setProfile({ ...profile, address: value })} />
              <button type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#6b543d]">
                <Save className="h-5 w-5" />
                儲存會員資料
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#e7d6be] bg-[#f7efe2] p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <Feature icon={<PawPrint className="h-6 w-6" />} title="寵物資料" text="紀錄品種、體重、習性與照護提醒。" to="/pets" />
            <Feature icon={<CalendarCheck className="h-6 w-6" />} title="預約紀錄" text="查看、修改或取消尚未開始的預約。" to="/my-bookings" />
            <Feature icon={<HeartPulse className="h-6 w-6" />} title="照護偏好" text="讓美容師與住宿人員提前了解毛孩狀況。" to="/booking" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#4f4032]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 font-medium text-[#4f4032] outline-none transition placeholder:text-[#b8aa98] focus:border-[#c9a77a] focus:bg-white"
      />
    </label>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f7efe2] px-4 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#b68655]">{icon}</div>
      <div>
        <p className="text-xs font-black tracking-wide text-[#9c8b78]">{label}</p>
        <p className="text-sm font-bold text-[#4f4032]">{value}</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, text, to }: { icon: ReactNode; title: string; text: string; to: string }) {
  return (
    <Link to={to} className="rounded-3xl bg-[#f7efe2] p-5 transition hover:-translate-y-1 hover:shadow-md">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#b68655]">{icon}</div>
      <h3 className="mt-4 font-black text-[#4f4032]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#7b6349]">{text}</p>
    </Link>
  );
}
