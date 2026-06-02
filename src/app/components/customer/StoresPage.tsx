import { useEffect, useState } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';
import { publicApi, type StoreItem } from '../../services/api';

const COLORS = {
  cream: '#fffaf3',
  beige: '#f7efe2',
  wood: '#b68655',
  deep: '#3b2d26',
  border: '#e6d9c8',
};

export function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  useEffect(() => { publicApi.stores().then((data) => setStores(data.stores)).catch(() => setStores([])); }, []);
  return (
    <div style={{ background: COLORS.beige, color: COLORS.deep }} className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {stores.map((store) => (
            <article key={store.id} className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 6px 18px rgba(40,30,20,0.03)' }}>
              {store.image_url ? (
                <img src={store.image_url} alt={store.name} className="h-60 w-full object-cover" />
              ) : (
                <div className="h-60 w-full grid place-items-center text-2xl" style={{ background: COLORS.cream }}>{store.name}</div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-extrabold" style={{ color: COLORS.deep }}>{store.name}</h2>
                <p className="mt-3 leading-7 text-sm" style={{ color: '#6d5d52' }}>{store.description}</p>

                <div className="mt-5 grid gap-3 text-sm font-semibold" style={{ color: '#8b7a6b' }}>
                  <p className="flex gap-2 items-start"><MapPin className="h-5 w-5" style={{ color: COLORS.wood }} />{store.address}</p>
                  <p className="flex gap-2 items-start"><Phone className="h-5 w-5" style={{ color: COLORS.wood }} />{store.phone}</p>
                  <p className="flex gap-2 items-start"><Clock className="h-5 w-5" style={{ color: COLORS.wood }} />{String(store.open_time).slice(0,5)}–{String(store.close_time).slice(0,5)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mx-auto mt-12 max-w-3xl rounded-2xl bg-white p-8 text-center" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-2xl font-extrabold" style={{ color: COLORS.deep }}>想了解哪間門市最適合毛孩？</h3>
          <p className="mt-3 text-sm" style={{ color: '#6d5d52' }}>若需協助挑選或安排參觀，歡迎聯絡我們或直接預約到店體驗。</p>
          <div className="mt-6">
            <a href="/contact" className="inline-block rounded-md px-8 py-3 text-sm font-bold text-white" style={{ background: COLORS.deep }}>聯絡門市</a>
            <a href="/booking" className="ml-4 inline-block rounded-md px-8 py-3 text-sm font-bold text-white" style={{ background: COLORS.deep }}>線上預約</a>
          </div>
        </section>
      </div>
    </div>
  );
}
