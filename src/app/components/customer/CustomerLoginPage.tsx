import { FormEvent, useState } from 'react';
import { Lock, Mail, PawPrint, Phone, User } from 'lucide-react';
import { loginApi, registerApi, saveAuth } from '../../services/api';

export function CustomerLoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [account, setAccount] = useState('customer');
  const [password, setPassword] = useState('123456');

  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError('');

    if (nextMode === 'login') {
      setAccount('customer');
      setPassword('123456');
    } else {
      setName('');
      setRegisterEmail('');
      setRegisterPhone('');
      setRegisterPassword('');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('請輸入姓名。');
          return;
        }

        if (!registerEmail.trim()) {
          setError('請輸入 Email。');
          return;
        }

        if (!registerEmail.includes('@')) {
          setError('請輸入正確的 Email 格式。');
          return;
        }

        if (registerPassword.length < 6) {
          setError('密碼至少需要 6 個字元。');
          return;
        }

        const data = await registerApi({
          name: name.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
          phone: registerPhone.trim() || undefined,
        });

        if (data.user.role !== 'customer') {
          setError('註冊帳號角色異常，請聯絡管理員。');
          return;
        }

        saveAuth(data.token, data.user, 'customer');
        onLogin();
        return;
      }

      const data = await loginApi(account.trim(), password);

      if (data.user.role !== 'customer') {
        setError('此入口僅供會員登入，員工或管理員請使用 /admin');
        return;
      }

      saveAuth(data.token, data.user, 'customer');
      onLogin();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'login'
            ? '登入失敗'
            : '註冊失敗',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7efe2] px-4 py-12 text-[#3b2d26] sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(217,185,143,0.32),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(255,250,243,0.9),transparent_35%),linear-gradient(135deg,#fffaf3_0%,#f7efe2_48%,#ead8ba_100%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-[#e6d9c8] bg-white shadow-2xl shadow-[#d8c0a1]/35">
          {/* 桌機版滑動面板 */}
          <div
            className={`pointer-events-none absolute inset-y-0 z-20 hidden w-1/2 overflow-hidden bg-[#7b6349] transition-transform duration-700 ease-in-out lg:block ${
              mode === 'login' ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,250,243,0.2),transparent_26%),linear-gradient(135deg,#b68655_0%,#7b6349_52%,#3b2d26_100%)]" />

            <div
              className={`absolute top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-white transition-all duration-700 ease-in-out ${
                mode === 'login' ? '-left-24' : '-right-24'
              }`}
            />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center text-white">
              <div className="mb-8 grid h-20 w-20 place-items-center rounded-[1.6rem] bg-white/15 backdrop-blur">
                <PawPrint className="h-10 w-10" />
              </div>

              <p className="text-xs font-black tracking-[0.35em] text-[#ead8ba]">
                PAWNEST MEMBER
              </p>

              <h2 className="mt-4 text-4xl font-black">
                {mode === 'login' ? '你好，朋友！' : '歡迎回來！'}
              </h2>

              <p className="mt-4 max-w-sm text-sm font-medium leading-7 text-[#fffaf3]/85">
                {mode === 'login'
                  ? '還不是會員嗎？建立帳號後即可管理毛孩資料、預約紀錄與服務回饋。'
                  : '已經有會員帳號了嗎？登入後即可查看預約進度與毛孩照護紀錄。'}
              </p>

              <button
                type="button"
                onClick={() =>
                  switchMode(mode === 'login' ? 'register' : 'login')
                }
                className="pointer-events-auto mt-8 rounded-full border border-white/55 px-10 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#3b2d26]"
              >
                {mode === 'login' ? '註冊' : '登入'}
              </button>
            </div>
          </div>

          <div className="grid min-h-[640px] lg:grid-cols-2">
            {/* 登入區：桌機在左 */}
            <section
              className={`flex items-center justify-center px-6 py-10 transition-all duration-700 ease-in-out sm:px-10 lg:px-14 ${
                mode === 'login'
                  ? 'opacity-100 lg:translate-x-0'
                  : 'hidden opacity-0 lg:flex lg:translate-x-0'
              }`}
            >
              <form onSubmit={submit} className="w-full max-w-sm">
                <div className="mb-8 text-center lg:text-left">
                  <p className="text-xs font-black tracking-[0.28em] text-[#b68655]">
                    LOGIN
                  </p>

                  <h1 className="mt-3 text-3xl font-black text-[#3b2d26]">
                    會員登入
                  </h1>

                  <p className="mt-3 text-sm font-semibold leading-6 text-[#8b7a6b]">
                    登入後可管理毛孩資料、預約紀錄、住宿狀態與評價。
                  </p>
                </div>

                <div className="grid gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] px-4 py-3 transition focus-within:border-[#b68655] focus-within:bg-white">
                    <Mail className="h-5 w-5 text-[#b68655]" />
                    <input
                      required
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="帳號或 Email"
                      className="w-full bg-transparent text-sm font-semibold text-[#3b2d26] outline-none placeholder:text-[#b8aa98]"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] px-4 py-3 transition focus-within:border-[#b68655] focus-within:bg-white">
                    <Lock className="h-5 w-5 text-[#b68655]" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="密碼"
                      className="w-full bg-transparent text-sm font-semibold text-[#3b2d26] outline-none placeholder:text-[#b8aa98]"
                    />
                  </label>
                </div>

                {error && mode === 'login' && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mode !== 'login'}
                  className="mt-6 w-full rounded-2xl bg-[#3b2d26] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#6a523d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && mode === 'login' ? '登入中...' : '登入'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="mt-5 w-full text-center text-sm font-black text-[#7b6349] transition hover:text-[#3b2d26] lg:hidden"
                >
                  還沒有帳號？立即註冊
                </button>
              </form>
            </section>

            {/* 註冊區：桌機在右 */}
            <section
              className={`flex items-center justify-center px-6 py-10 transition-all duration-700 ease-in-out sm:px-10 lg:px-14 ${
                mode === 'register'
                  ? 'opacity-100 lg:translate-x-0'
                  : 'hidden opacity-0 lg:flex lg:translate-x-0'
              }`}
            >
              <form onSubmit={submit} className="w-full max-w-sm">
                <div className="mb-8 text-center lg:text-left">
                  <p className="text-xs font-black tracking-[0.28em] text-[#b68655]">
                    REGISTER
                  </p>

                  <h1 className="mt-3 text-3xl font-black text-[#3b2d26]">
                    建立會員
                  </h1>

                  <p className="mt-3 text-sm font-semibold leading-6 text-[#8b7a6b]">
                    註冊後即可建立毛孩資料，並進行線上預約與照護紀錄管理。
                  </p>
                </div>

                <div className="grid gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] px-4 py-3 transition focus-within:border-[#b68655] focus-within:bg-white">
                    <User className="h-5 w-5 text-[#b68655]" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="姓名"
                      className="w-full bg-transparent text-sm font-semibold text-[#3b2d26] outline-none placeholder:text-[#b8aa98]"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] px-4 py-3 transition focus-within:border-[#b68655] focus-within:bg-white">
                    <Mail className="h-5 w-5 text-[#b68655]" />
                    <input
                      required
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full bg-transparent text-sm font-semibold text-[#3b2d26] outline-none placeholder:text-[#b8aa98]"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] px-4 py-3 transition focus-within:border-[#b68655] focus-within:bg-white">
                    <Phone className="h-5 w-5 text-[#b68655]" />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="手機號碼"
                      className="w-full bg-transparent text-sm font-semibold text-[#3b2d26] outline-none placeholder:text-[#b8aa98]"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] px-4 py-3 transition focus-within:border-[#b68655] focus-within:bg-white">
                    <Lock className="h-5 w-5 text-[#b68655]" />
                    <input
                      required
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="設定密碼，至少 6 個字元"
                      className="w-full bg-transparent text-sm font-semibold text-[#3b2d26] outline-none placeholder:text-[#b8aa98]"
                    />
                  </label>
                </div>

                {error && mode === 'register' && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mode !== 'register'}
                  className="mt-6 w-full rounded-2xl bg-[#3b2d26] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#6a523d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && mode === 'register' ? '註冊中...' : '註冊並登入'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="mt-5 w-full text-center text-sm font-black text-[#7b6349] transition hover:text-[#3b2d26] lg:hidden"
                >
                  已經有帳號？回到登入
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}