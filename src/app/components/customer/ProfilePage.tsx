import { FormEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Crown,
  KeyRound,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authApi, getStoredUser, getToken, saveAuth } from '../../services/api';

type ProfileForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ActiveTab = 'overview' | 'edit' | 'password';

function normalizeTier(tier?: string) {
  return tier === 'vip' ? 'vip' : 'general';
}

function getAnnualSpending(user: any) {
  return Number(
    user?.annual_spending ??
      user?.annualSpending ??
      user?.yearly_spending ??
      user?.yearlySpending ??
      user?.total_spending ??
      user?.totalSpending ??
      user?.annual_consumption ??
      user?.annualConsumption ??
      0,
  );
}

export function ProfilePage() {
  const storedUser = useMemo(() => getStoredUser(), []);

  const membershipTier = normalizeTier(storedUser?.membership_tier);
  const points = Number(storedUser?.membership_points || 0);
  const annualSpending = getAnnualSpending(storedUser);
  const vipTarget = 10000;
  const progressPercent = Math.min(
    100,
    Math.round((annualSpending / vipTarget) * 100),
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState<ProfileForm>({
    name: storedUser?.name || '',
    username: storedUser?.username || 'customer',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    address: storedUser?.address || '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSavingProfile(true);

    try {
      const result = await authApi.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
      });

      const nextUser = {
        ...(storedUser || {}),
        ...result.user,
        role: result.user?.role || storedUser?.role || 'customer',
      };

      const token = getToken('customer');

      if (token) {
        saveAuth(token, nextUser, 'customer');
      } else {
        sessionStorage.setItem('pawnest_customer_user', JSON.stringify(nextUser));
        sessionStorage.setItem('customer_user', JSON.stringify(nextUser));
        sessionStorage.setItem('user', JSON.stringify(nextUser));

        localStorage.setItem('pawnest_customer_user', JSON.stringify(nextUser));
        localStorage.setItem('customer_user', JSON.stringify(nextUser));
        localStorage.setItem('user', JSON.stringify(nextUser));

        window.dispatchEvent(new Event('pawnest-auth-change'));
      }

      setProfile({
        name: nextUser.name || profile.name,
        username: nextUser.username || profile.username,
        email: nextUser.email || profile.email,
        phone: nextUser.phone || profile.phone,
        address: nextUser.address || profile.address,
      });

      setActiveTab('overview');
      showNotice(result.message || '會員資料已更新');
    } catch (err) {
      setError(err instanceof Error ? err.message : '會員資料更新失敗');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setError('');

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError('請輸入目前密碼');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密碼至少需要 6 個字元');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('新密碼與確認密碼不一致');
      return;
    }

    setSavingPassword(true);

    try {
      const result = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setActiveTab('overview');
      showNotice(result.message || '密碼已修改');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '密碼修改失敗');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7efe2] py-12 text-[#3b2d26]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {notice && (
          <div className="mb-6 rounded-2xl border border-[#cfe5bf] bg-[#e8f3df] px-5 py-3 text-sm font-black text-[#5f7f4f] shadow-sm">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-[#f4c7b8] bg-[#fff1ec] px-5 py-3 text-sm font-black text-[#9a5c50] shadow-sm">
            {error}
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
                    {profile.name || '會員'}
                  </h2>

                  <p className="mt-1 break-all text-sm font-semibold text-[#9c8b78]">
                    @{profile.username}
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
                <SidebarButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={<User className="h-4 w-4" />}
                  label="我的帳戶"
                />

                <SidebarButton
                  active={activeTab === 'edit'}
                  onClick={() => setActiveTab('edit')}
                  icon={<Mail className="h-4 w-4" />}
                  label="編輯資料"
                />

                <SidebarButton
                  active={activeTab === 'password'}
                  onClick={() => setActiveTab('password')}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="修改密碼"
                />

                <Link
                  to="/my-bookings"
                  className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-left text-[#7b6349] transition hover:bg-[#fffaf3]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fcf7f0] text-[#b68655]">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <span className="font-bold">我的預約</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#b9a38c]" />
                </Link>

                <Link
                  to="/pets"
                  className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-left text-[#7b6349] transition hover:bg-[#fffaf3]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fcf7f0] text-[#b68655]">
                      <PawPrint className="h-4 w-4" />
                    </span>
                    <span className="font-bold">我的毛孩</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#b9a38c]" />
                </Link>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-[0_18px_40px_rgba(123,99,73,0.08)]">
            {activeTab === 'overview' && (
              <div>
                <div className="border-b border-[#efe3d2] bg-[#fffaf3] px-8 py-6">
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-[#b68655]">
                    Account Overview
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#2f241f]">
                    我的帳戶
                  </h2>
                </div>

                <div className="space-y-6 p-8">
                  <div className="rounded-[1.75rem] border border-[#d8c29c] bg-[#f9f2e3] p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <Crown className="h-6 w-6 text-[#b68655]" />

                          <h3 className="text-2xl font-black text-[#2f241f]">
                            {membershipTier === 'vip' ? 'VIP 會員' : '一般會員'}
                          </h3>
                        </div>

                        <p className="mt-3 max-w-2xl leading-7 text-[#7b6349]">
                          {membershipTier === 'vip'
                            ? '你已達成最近一年消費門檻，享有 VIP 會員專屬優惠與服務權益。'
                            : '持續累積年度消費與會員點數，即可升級 VIP 會員並解鎖更多專屬服務。'}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full bg-[#b68655] px-5 py-2.5 text-base font-black text-white">
                        {points.toLocaleString()} 點
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm font-bold text-[#8d785f]">
                        <span>VIP 消費進度</span>
                        <span>
                          NT${annualSpending.toLocaleString()} / NT$
                          {vipTarget.toLocaleString()}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-[#ead8ba]">
                        <div
                          className="h-full rounded-full bg-[#b68655] transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard
                      icon={<Mail className="h-5 w-5" />}
                      label="Email"
                      value={profile.email}
                    />

                    <InfoCard
                      icon={<Phone className="h-5 w-5" />}
                      label="電話"
                      value={profile.phone}
                    />

                    <InfoCard
                      icon={<MapPin className="h-5 w-5" />}
                      label="地址"
                      value={profile.address}
                      wide
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="cursor-pointer rounded-2xl bg-[#3b2d26] px-6 py-4 font-black text-white transition hover:bg-[#4b3931]"
                    >
                      編輯資料
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('password')}
                      className="cursor-pointer rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-6 py-4 font-black text-[#3b2d26] transition hover:bg-[#f8f1e7]"
                    >
                      修改密碼
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div>
                <div className="border-b border-[#efe3d2] bg-[#fffaf3] px-8 py-6">
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-[#b68655]">
                    Edit Profile
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#2f241f]">
                    編輯資料
                  </h2>
                </div>

                <form onSubmit={handleProfileSubmit} className="p-8">
                  <div className="grid gap-5">
                    <Field
                      label="姓名"
                      value={profile.name}
                      onChange={(value) =>
                        setProfile({ ...profile, name: value })
                      }
                    />

                    <Field
                      label="Email"
                      type="email"
                      value={profile.email}
                      onChange={(value) =>
                        setProfile({ ...profile, email: value })
                      }
                    />

                    <Field
                      label="電話"
                      value={profile.phone}
                      onChange={(value) =>
                        setProfile({ ...profile, phone: value })
                      }
                    />

                    <Field
                      label="地址"
                      value={profile.address}
                      onChange={(value) =>
                        setProfile({ ...profile, address: value })
                      }
                    />

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-6 py-4 font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save className="h-5 w-5" />
                        {savingProfile ? '儲存中...' : '儲存會員資料'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="cursor-pointer rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-6 py-4 font-black text-[#3b2d26] transition hover:bg-[#f8f1e7]"
                      >
                        返回總覽
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <div className="border-b border-[#efe3d2] bg-[#fffaf3] px-8 py-6">
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-[#b68655]">
                    Security Settings
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#2f241f]">
                    修改密碼
                  </h2>
                </div>

                <form onSubmit={handlePasswordSubmit} className="p-8">
                  {passwordError && (
                    <div className="mb-5 rounded-2xl border border-[#f4c7b8] bg-[#fff1ec] px-4 py-3 text-sm font-black text-[#9a5c50]">
                      {passwordError}
                    </div>
                  )}

                  <div className="grid gap-5">
                    <Field
                      label="目前密碼"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(value) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: value,
                        })
                      }
                    />

                    <Field
                      label="新密碼"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(value) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: value,
                        })
                      }
                    />

                    <Field
                      label="確認新密碼"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(value) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: value,
                        })
                      }
                    />

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-6 py-4 font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <KeyRound className="h-5 w-5" />
                        {savingPassword ? '修改中...' : '儲存新密碼'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('overview');
                          setPasswordError('');
                        }}
                        className="cursor-pointer rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-6 py-4 font-black text-[#3b2d26] transition hover:bg-[#f8f1e7]"
                      >
                        返回總覽
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SidebarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#3b2d26]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 font-semibold text-[#3b2d26] outline-none transition placeholder:text-[#b8aa98] focus:border-[#b68655] focus:bg-white focus:ring-4 focus:ring-[#ead8ba]/45"
      />
    </label>
  );
}

function InfoCard({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-[1.5rem] bg-[#fcf8f2] px-5 py-5 ${
        wide ? 'md:col-span-2' : ''
      }`}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#b68655] shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-[#9c8b78]">{label}</p>
        <p className="mt-1 break-words text-lg font-bold text-[#3b2d26]">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}