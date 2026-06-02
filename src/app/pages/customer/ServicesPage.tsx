import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { services, ServiceCategory } from '../../data/petData';

const categories: Array<ServiceCategory | '全部'> = ['全部', '美容', '住宿', '安親', '加購'];

export function ServicesPage() {
  const [category, setCategory] = useState<ServiceCategory | '全部'>('全部');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return services.filter((service) => {
      const matchCategory = category === '全部' || service.category === category;
      const matchQuery = `${service.name}${service.tagline}${service.features.join('')}`.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [category, query]);

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e7d6be] bg-[#f7efe2] p-8 shadow-sm md:p-12">
          <p className="font-black tracking-[0.22em] text-[#b68655]">SERVICES</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">服務項目與價格</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">依照美容、住宿、安親與加購服務分類瀏覽，快速比較價格、時間與照護內容。</p>
        </section>

        <div className="mt-8 rounded-[2rem] border border-[#e7d6be] bg-white p-4 shadow-lg shadow-[#ead8ba]/40 md:flex md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${category === item ? 'bg-[#7b6349] text-white' : 'bg-[#f7efe2] text-[#7b6349] hover:bg-[#ead8ba]'}`}>{item}</button>
            ))}
          </div>
          <div className="relative mt-4 md:mt-0">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9c8b78]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋服務或特色" className="w-full rounded-full border border-[#e7d6be] bg-[#f7efe2] py-3 pl-11 pr-4 text-[#4f4032] outline-none transition focus:border-[#b68655] focus:bg-white md:w-72" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.id} className="relative overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-lg shadow-[#ead8ba]/40 transition hover:-translate-y-1">
                <img src={service.image} alt={service.name} className="h-52 w-full object-cover" />
                <div className="p-7">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7efe2] text-[#b68655]"><Icon className="h-7 w-7" /></div>
                    {service.popular && <span className="rounded-full bg-[#f6e1d5] px-3 py-1 text-xs font-black text-[#9a6b55]">人氣推薦</span>}
                  </div>
                  <div className="mb-2 text-sm font-bold text-[#b68655]">{service.category}</div>
                  <h2 className="text-2xl font-black text-[#4f4032]">{service.name}</h2>
                  <p className="mt-2 leading-7 text-[#7b6349]">{service.tagline}</p>
                  <div className="mt-5 flex items-end justify-between border-y border-[#e7d6be] py-5">
                    <div className="text-3xl font-black text-[#4f4032]">{service.priceLabel}</div>
                    <div className="rounded-full bg-[#f7efe2] px-3 py-1 text-sm font-bold text-[#7b6349]">{service.duration}</div>
                  </div>
                  <ul className="mt-5 grid gap-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-[#7b6349]"><Check className="h-4 w-4 rounded-full bg-[#e8f3df] p-0.5 text-[#5f7f4f]" />{feature}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
