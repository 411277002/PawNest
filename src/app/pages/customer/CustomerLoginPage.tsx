import { FormEvent, useState } from 'react';
import { Lock, Mail, PawPrint } from 'lucide-react';
import { loginApi, saveAuth } from '../../services/api';

export function CustomerLoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [account, setAccount] = useState('customer');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        setError('目前請使用會員測試帳號 customer / 123456 登入。');
        return;
      }

      const data = await loginApi(account, password);
      if (data.user.role !== 'customer') {
        setError('此入口僅供會員登入，員工或管理員請使用 /admin');
        return;
      }
      saveAuth(data.token, data.user);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="rounded-[2.5rem] bg-[#7b6349] p-8 text-white md:p-12">
          <div className="mb-8 grid h-16 w-16 place-items-center rounded-3xl bg-[#7b6349]"><PawPrint className="h-8 w-8" /></div>
          <p className="font-black tracking-[0.18em] text-[#ead8ba]">MEMBER</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">會員登入</h1>
          <p className="mt-4 leading-8 text-[#f7efe2]">登入後可管理毛孩資料、預約紀錄、住宿狀態與評價。</p>
          <div className="mt-8 grid gap-4 text-sm text-[#f7efe2]">
            <span>✓ 毛孩健康註記</span>
            <span>✓ 預約進度追蹤</span>
            <span>✓ 服務開始前 4 小時可修改或刪除預約</span>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-[2.5rem] border border-[#e7d6be] bg-[#f7efe2] p-8 shadow-sm md:p-12">
          <div className="mb-6 flex rounded-full bg-[#f7efe2] p-1">
            <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-full px-5 py-3 font-black ${mode === 'login' ? 'bg-[#7b6349] text-white' : 'text-[#7b6349]'}`}>登入</button>
            <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-full px-5 py-3 font-black ${mode === 'register' ? 'bg-[#7b6349] text-white' : 'text-[#7b6349]'}`}>註冊</button>
          </div>
          <h2 className="text-2xl font-black text-[#4f4032]">{mode === 'login' ? '歡迎回來' : '建立新會員'}</h2>
          <p className="mt-2 text-[#9c8b78]">測試帳號：customer / 123456</p>

          {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          {mode === 'register' && (
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" className="mt-6 w-full rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#c9a77a]" />
          )}

          <label className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 focus-within:border-[#b68655]">
            <Mail className="h-5 w-5 text-[#b68655]" />
            <input required type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="帳號或 Email" className="w-full bg-transparent outline-none" />
          </label>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 focus-within:border-[#b68655]">
            <Lock className="h-5 w-5 text-[#b68655]" />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密碼" className="w-full bg-transparent outline-none" />
          </label>

          <button disabled={loading} className="mt-6 w-full rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white shadow-sm transition hover:bg-[#6a523d] disabled:opacity-60">
            {loading ? '處理中...' : mode === 'login' ? '登入系統' : '註冊並登入'}
          </button>
        </form>
      </div>
    </div>
  );
}
