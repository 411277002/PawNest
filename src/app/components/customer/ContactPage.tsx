import { FormEvent, useState } from 'react';
import { Loader2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { publicApi } from '../../services/api';

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

const COLORS = {
  cream: '#fffaf3',
  beige: '#f7efe2',
  wood: '#b68655',
  deep: '#3b2d26',
  border: '#e6d9c8',
};

export function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const updateField = (field: keyof ContactForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setNotice('');
    setError('');

    if (!form.name.trim()) {
      setError('請填寫姓名');
      return;
    }

    if (!form.email.trim()) {
      setError('請填寫 Email，方便我們回覆您');
      return;
    }

    if (!form.email.includes('@')) {
      setError('Email 格式不正確');
      return;
    }

    if (!form.message.trim()) {
      setError('請填寫留言內容');
      return;
    }

    try {
      setSubmitting(true);

      const result = await publicApi.contact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim() || '一般聯絡留言',
        message: form.message.trim(),
      });

      setNotice(result.message || '留言已送出，我們會盡快與您聯繫');
      setForm({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '送出留言失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: COLORS.beige, color: COLORS.deep }} className="py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="rounded-2xl bg-white p-8 md:p-12" style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 6px 18px rgba(40,30,20,0.04)' }}>
          <p className="text-xs font-bold" style={{ color: COLORS.wood }}>CONTACT</p>

          <h1 className="mt-2 text-4xl font-extrabold" style={{ color: COLORS.deep }}>
            聯絡 PawNest
          </h1>

          <p className="mt-4 leading-8" style={{ color: '#6d5d52' }}>
            有特殊照護需求、住宿問題或團體預約，都可以留下訊息與我們聯繫。
          </p>

          <div className="mt-8 grid gap-4">
            <Info icon={<Phone />} text="02-2720-8899" />
            <Info icon={<Mail />} text="hello@pawnest.demo" />
            <Info icon={<MapPin />} text="台北市信義區松仁路 88 號" />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 md:p-12" style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 6px 18px rgba(40,30,20,0.03)' }}>
          <div className="mb-6 flex items-center gap-3">
            <MessageCircle className="h-6 w-6" style={{ color: COLORS.wood }} />
            <h2 className="text-2xl font-extrabold" style={{ color: COLORS.deep }}>留言表單</h2>
          </div>

          {notice && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="姓名"
              className="rounded-2xl border px-4 py-3 outline-none"
              style={{ background: COLORS.cream, borderColor: COLORS.border }}
            />

            <input
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="電話"
              className="rounded-2xl border px-4 py-3 outline-none"
              style={{ background: COLORS.cream, borderColor: COLORS.border }}
            />
          </div>

          <input
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="Email"
            type="email"
            className="mt-5 w-full rounded-2xl border px-4 py-3 outline-none"
            style={{ background: COLORS.cream, borderColor: COLORS.border }}
          />

          <input
            value={form.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            placeholder="主旨，例如：想詢問貓咪住宿"
            className="mt-5 w-full rounded-2xl border px-4 py-3 outline-none"
            style={{ background: COLORS.cream, borderColor: COLORS.border }}
          />

          <textarea
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            placeholder="請輸入問題或特殊照護需求"
            rows={7}
            className="mt-5 w-full resize-none rounded-2xl border px-4 py-3 outline-none"
            style={{ background: COLORS.cream, borderColor: COLORS.border }}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: COLORS.deep }}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            送出留言
          </button>
        </form>
      </div>
    </div>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-4 font-bold" style={{ background: 'white', color: '#4f4032', border: `1px solid #efe7d6` }}>
      <span style={{ color: '#b68655' }} className="[&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      {text}
    </div>
  );
}