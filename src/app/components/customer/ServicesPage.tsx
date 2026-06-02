import { useEffect, useMemo, useState } from 'react';
import { Clock, Search, Sparkles } from 'lucide-react';
import { publicApi, type ServiceItem } from '../../services/api';

const COLORS = {
  cream: '#fffaf3',
  beige: '#f6f0e6',
  wood: '#b68655',
  deep: '#3b2d26',
  border: '#e6d9c8',
};

const categoryLabels: Record<string, string> = { all: '全部', grooming: '美容', boarding: '住宿', daycare: '安親', addon: '加購' };
const targetLabels: Record<string, string> = { all: '貓狗皆可', dog: '狗狗專屬', cat: '貓咪專屬' };

export function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    publicApi.services().then((data) => setServices(data.services)).catch(() => setServices([]));
  }, []);

  const filtered = useMemo(() => services.filter((service) => {
    const matchCategory = category === 'all' || service.category === category;
    const keyword = `${service.name} ${service.description} ${service.badge || ''}`.toLowerCase();
    return matchCategory && keyword.includes(query.trim().toLowerCase());
  }), [services, query, category]);

  const heroImage = services.length ? services[0].image_url : 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&auto=format&fit=crop';

  return (
    <div style={{ background: COLORS.cream, color: COLORS.deep }}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <section className="rounded-xl bg-white p-5" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9c8b78]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋服務名稱、特色或說明..." className="w-full rounded-2xl border py-3 pl-12 pr-4 outline-none" style={{ borderColor: COLORS.border, background: COLORS.cream, color: COLORS.deep }} />
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button key={key} onClick={() => setCategory(key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition`} style={category === key ? { background: COLORS.deep, color: 'white' } : { background: COLORS.cream, color: COLORS.deep, border: `1px solid ${COLORS.border}` }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <article key={service.id} className="overflow-hidden rounded-xl bg-white p-0" style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 12px rgba(40,30,20,0.04)' }}>
              <div className="relative h-48 w-full overflow-hidden">
                <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold" style={{ color: COLORS.deep }}>{service.badge || categoryLabels[service.category]}</span>
              </div>

              <div className="p-6">
                <h2 className="text-lg font-extrabold" style={{ color: COLORS.deep }}>{service.name}</h2>
                <p className="mt-3 min-h-[64px] text-sm" style={{ color: '#6d5d52' }}>{service.description}</p>

                <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: COLORS.border }}>
                  <div className="text-sm" style={{ color: '#8b7a6b' }}>{service.duration_minutes} 分鐘</div>
                  <div className="text-lg font-extrabold" style={{ color: COLORS.wood }}>NT${service.price}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-10 text-center font-bold" style={{ color: '#9c8b78' }}>
            <Sparkles className="mx-auto mb-3 h-8 w-8" />目前沒有符合條件的服務。
          </div>
        )}

        <section className="mx-auto mt-12 max-w-3xl rounded-xl bg-white p-8 text-center" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-2xl font-extrabold" style={{ color: COLORS.deep }}>準備好為毛孩安排下一次照護了嗎？</h3>
          <p className="mt-3 text-sm" style={{ color: '#6d5d52' }}>立即選擇合適的服務與時段，我們會協助您完成預約與照護紀錄。</p>
          <div className="mt-6">
            <a href="/booking" className="inline-block rounded-md px-8 py-3 text-sm font-bold text-white" style={{ background: COLORS.deep }}>立即預約</a>
          </div>
        </section>
      </div>
    </div>
  );
}
