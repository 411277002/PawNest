import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  LockKeyhole,
  LogIn,
  PawPrint,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { loginApi, saveAuth } from '../services/api';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'staff') => void;
}

type AdminRole = 'admin' | 'staff' | 'groomer' | 'reception';

function isAdminRole(role: string): role is AdminRole {
  return ['admin', 'staff', 'groomer', 'reception'].includes(role);
}

function saveAdminAuth(token: string, user: any) {
  sessionStorage.removeItem('customer_token');
  sessionStorage.removeItem('customer_user');
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');

  sessionStorage.setItem('admin_token', token);
  sessionStorage.setItem('admin_user', JSON.stringify(user));

  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginApi(username.trim(), password);

      if (!data?.token || !data?.user) {
        setError('登入回應格式不完整，請確認後端 auth API。');
        return;
      }

      if (data.user.role === 'customer') {
        setError('此入口僅供員工與管理員登入，會員請回前台登入。');
        return;
      }

      if (!isAdminRole(data.user.role)) {
        setError('此帳號沒有後台登入權限。');
        return;
      }

      saveAdminAuth(data.token, data.user);

      try {
        saveAuth(data.token, data.user);
      } catch {
        // 若 saveAuth 內部使用不同儲存方式，不影響本頁後台 sessionStorage 登入
      }

      onLogin(data.user.role === 'admin' ? 'admin' : 'staff');
    } catch (err) {
      setError(err instanceof Error ? err.message : '帳號或密碼錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7efe2] px-4 py-8 text-[#3b2d26]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(217,185,143,0.35),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(234,216,186,0.45),transparent_28%),linear-gradient(180deg,#fffaf3_0%,#f7efe2_48%,#fffdf8_100%)]" />

      

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-[#e7d6be] bg-white shadow-2xl shadow-[#ead8ba]/70 lg:grid-cols-2">
          {/* Left：登入表單 */}
          <section className="flex min-h-[620px] items-center justify-center bg-[#fffdf8] p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[#b68655] text-white shadow-lg shadow-[#ead8ba]">
                    <PawPrint className="h-7 w-7" />
                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-[#fff4da]" />
                  </div>

                  <div>
                    <p className="text-2xl font-black tracking-tight">
                      PawNest
                    </p>
                    <p className="text-sm font-bold text-[#b68655]">
                      後台管理中心
                    </p>
                  </div>
                </div>

                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b68655]">
                  Staff Console
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight text-[#3b2d26]">
                  登入後台
                </h1>

                <p className="mt-3 text-sm font-semibold leading-7 text-[#9c8b78]">
                  請使用管理員或員工帳號登入，進入預約、服務、門市與會員管理系統。
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-[#f4c7b8] bg-[#fff1ec] px-4 py-3 text-sm font-black text-[#9a5c50]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#7b6349]">
                    帳號
                  </span>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b68655]" />

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-2xl border border-[#e7d6be] bg-[#fffaf3] py-3.5 pl-12 pr-4 font-bold text-[#3b2d26] outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-4 focus:ring-[#ead8ba]/45"
                      placeholder="admin 或 staff"
                      autoComplete="username"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#7b6349]">
                    密碼
                  </span>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b68655]" />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-[#e7d6be] bg-[#fffaf3] py-3.5 pl-12 pr-4 font-bold text-[#3b2d26] outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-4 focus:ring-[#ead8ba]/45"
                      placeholder="請輸入密碼"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-5 py-4 font-black text-white shadow-lg shadow-[#ead8ba] transition hover:-translate-y-0.5 hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn className="h-5 w-5" />
                  {loading ? '登入中...' : '登入'}
                </button>
              </form>
            </div>
          </section>

          {/* Right：品牌資訊區 */}
          <section className="relative hidden min-h-[620px] overflow-hidden bg-[#3b2d26] p-10 text-white lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,185,143,0.35),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(255,250,243,0.12),transparent_30%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">

              <div className="max-w-md">
                <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-[#d9b98f] text-white shadow-xl shadow-black/20">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-[#fffaf3]">
                  <Sparkles className="h-4 w-4 text-[#fff4da]" />
                  PawNest Staff Console
                </p>

                <h2 className="text-4xl font-black leading-tight tracking-tight">
                  一站式管理預約、住宿、美容與會員服務
                </h2>

                <p className="mt-5 text-sm font-semibold leading-8 text-white/75">
                  後台以清楚的流程協助門市掌握每日預約、服務進度、會員點數與顧客回饋，讓每一次照護都更穩定。
                </p>

                <div className="mt-8 grid gap-3">
                  <FeatureText text="預約狀態與服務流程即時管理" />
                  <FeatureText text="會員、毛孩、消費與點數紀錄整合" />
                  <FeatureText text="活動、服務、門市與評論集中維護" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureText({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d9b98f] text-[#3b2d26]">
        ✓
      </span>
      {text}
    </div>
  );
}