import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Camera,
  HeartPulse,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Star,
  Store as StoreIcon,
} from 'lucide-react';
import { publicApi, type PublicHomeData, type ActivityItem } from '../../services/api';

const fallbackHome: PublicHomeData = { activities: [], services: [], stores: [], reviews: [] };

function formatPeriod(item: ActivityItem) {
  if (item.start_date && item.end_date) return `${item.start_date.replaceAll('-', '/')}–${item.end_date.replaceAll('-', '/')}`;
  if (item.start_date) return `${item.start_date.replaceAll('-', '/')} 起`;
  return '期間限定';
}

const COLORS = {
  cream: '#fffaf3',
  beige: '#f6f0e6',
  wood: '#b68655',
  deep: '#3b2d26',
  border: '#e6d9c8',
};

export function HomePage() {
  const [data, setData] = useState<PublicHomeData>(fallbackHome);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    publicApi.home().then(setData).catch(() => setData(fallbackHome));
  }, []);

  const heroSlides = useMemo(() => data.activities.filter((item) => item.is_banner), [data.activities]);
  const slides = heroSlides.length ? heroSlides : data.activities;
  const currentSlide = slides[activeSlide % Math.max(slides.length, 1)];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goPrev = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  const goNext = () => setActiveSlide((current) => (current + 1) % slides.length);

  const featuredStores = useMemo(
    () => data.stores.slice(0, 3),
    [data.stores],
  );

  const mainStore = featuredStores[0];

  const curatedReviews = useMemo(() => {
    return data.reviews
      .filter((review) => {
        const comment = String(review.comment || '').trim();
        return comment.length >= 8 && comment.toLowerCase() !== 'test';
      })
      .slice(0, 3);
  }, [data.reviews]);

  function getRatingStars(rating?: number) {
    const value = Math.max(1, Math.min(5, Math.round(Number(rating || 5))));
    return Array.from({ length: 5 }).map((_, index) => index < value);
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.cream, color: COLORS.deep }}>
      {/* Hero */}
      <section className="relative">
        <div className="h-[520px] sm:h-[640px] lg:h-[720px]">
          {slides.map((slide, index) => (
            <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}>
              <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ))}

          {currentSlide && (
            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 lg:px-8">
              <div className="w-full max-w-2xl text-left">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold tracking-widest" style={{ color: COLORS.wood }}>
                  精選活動
                </div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">{currentSlide.title}</h1>
                <p className="mt-4 text-base font-medium text-white/90">{formatPeriod(currentSlide)}</p>
                <p className="mt-6 max-w-lg text-sm text-white/85">{currentSlide.summary?.trim() || currentSlide.description}</p>

                <div className="mt-8 flex gap-4">
                  <Link to="/booking" className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white" style={{ background: COLORS.deep }}>
                    立即預約
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/services" className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold" style={{ borderColor: COLORS.border, color: COLORS.deep, background: '#fffdf9' }}>
                    服務目錄
                  </Link>
                </div>
              </div>
            </div>
          )}

          {slides.length > 1 && (
            <>
              <button type="button" onClick={goPrev} className="absolute left-6 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[color:var(--deep)] shadow md:flex" aria-label="上一張活動"><ArrowLeft className="h-4 w-4" /></button>
              <button type="button" onClick={goNext} className="absolute right-6 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[color:var(--deep)] shadow md:flex" aria-label="下一張活動"><ArrowRight className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </section>

      {/* Brand features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold tracking-widest" style={{ color: COLORS.wood }}>BRAND</p>
          <h2 className="mt-4 text-3xl font-extrabold" style={{ color: COLORS.deep }}>高級自然系寵物生活品牌</h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm" style={{ color: '#6d5d52' }}>沉穩的材質、純粹的照護。來自木質與手工選物的靈感，呈現簡約且信任的日常。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: '安心照護', desc: '專業訓練人員與完整健康紀錄' },
            { icon: CalendarCheck, title: '透明預約', desc: '清楚時間與細項，安心掌握' },
            { icon: Camera, title: '專業美容', desc: '精品級造型與天然產品' },
            { icon: HeartPulse, title: '舒適住宿', desc: '木質調設計的安穩睡眠環境' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex flex-col gap-4 rounded-md border bg-white p-6" style={{ borderColor: COLORS.border }}>
                <div className="h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#faf6f0] text-[color:var(--deep)] flex" style={{ ['--deep' as any]: COLORS.deep }}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.deep }}>{item.title}</h3>
                <p className="text-sm" style={{ color: '#6d5d52' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: COLORS.wood }}>SERVICE</p>
            <h3 className="mt-2 text-2xl font-extrabold" style={{ color: COLORS.deep }}>精選服務</h3>
          </div>
          <Link to="/services" className="text-sm font-semibold" style={{ color: COLORS.deep }}>查看全部</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {data.services.map((service) => (
            <Link key={service.id} to="/services" className="group overflow-hidden rounded-md border bg-white p-4 transition hover:-translate-y-1" style={{ borderColor: COLORS.border }}>
              <div className="relative h-44 w-full overflow-hidden rounded-sm bg-[#efebe6]">
                <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-bold" style={{ color: COLORS.deep }}>{service.name}</h4>
                <p className="mt-2 text-sm" style={{ color: '#6d5d52' }}>{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-extrabold" style={{ color: COLORS.wood }}>NT${service.price}</div>
                  <div className="text-sm" style={{ color: '#8b7a6b' }}>{service.duration_minutes} 分鐘</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stores horizontal brand section */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div
          className="overflow-hidden rounded-md border bg-white shadow-sm"
          style={{ borderColor: COLORS.border }}
        >
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[320px] bg-[#efe7dc]">
              {mainStore?.image_url ? (
                <img
                  src={mainStore.image_url}
                  alt={mainStore.name}
                  className="h-full min-h-[320px] w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full min-h-[320px] w-full items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, #efe2cf 0%, #fffaf3 50%, #d8c0a1 100%)',
                    color: COLORS.wood,
                  }}
                >
                  <StoreIcon className="h-16 w-16" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="flex flex-col justify-center p-8 md:p-10">
              <p
                className="text-xs font-bold tracking-widest"
                style={{ color: COLORS.wood }}
              >
                VISIT OUR STORES
              </p>

              <h3
                className="mt-3 text-3xl font-extrabold leading-tight"
                style={{ color: COLORS.deep }}
              >
                溫暖安心的照護空間
              </h3>

              <p
                className="mt-4 text-sm leading-7"
                style={{ color: '#6d5d52' }}
              >
                在安靜舒適的門市環境中，讓毛孩享受美容、住宿與安親照護。
                PawNest 以清楚透明的流程，陪伴每一次安心預約。
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {featuredStores.length > 0 ? (
                  featuredStores.map((store) => (
                    <span
                      key={store.id}
                      className="inline-flex items-center gap-2 rounded-full border bg-[#fffaf3] px-4 py-2 text-xs font-bold"
                      style={{ borderColor: COLORS.border, color: COLORS.deep }}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {store.name}
                    </span>
                  ))
                ) : (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border bg-[#fffaf3] px-4 py-2 text-xs font-bold"
                    style={{ borderColor: COLORS.border, color: COLORS.deep }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    門市資訊準備中
                  </span>
                )}
              </div>

              {mainStore && (
                <div
                  className="mt-5 flex flex-wrap gap-4 text-sm font-semibold"
                  style={{ color: '#6d5d52' }}
                >
                  {mainStore.area && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {mainStore.area}
                    </span>
                  )}

                  {mainStore.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {mainStore.phone}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-8">
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: COLORS.deep }}
                >
                  查看門市
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews horizontal section */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 text-center">
          <p
            className="text-xs font-bold tracking-widest"
            style={{ color: COLORS.wood }}
          >
            LOVED BY MEMBERS
          </p>

          <h3
            className="mt-2 text-3xl font-extrabold"
            style={{ color: COLORS.deep }}
          >
            來自毛孩家人的真實回饋
          </h3>

          <p
            className="mx-auto mt-3 max-w-2xl text-sm leading-7"
            style={{ color: '#6d5d52' }}
          >
            每一次美容、住宿與安親服務，都是 PawNest 與家人建立信任的開始。
          </p>
        </div>

        {curatedReviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {curatedReviews.map((review) => (
              <article
                key={review.id}
                className="flex min-h-[230px] flex-col rounded-md border bg-white p-6 shadow-sm"
                style={{ borderColor: COLORS.border }}
              >
                <div
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: '#faf6f0', color: COLORS.wood }}
                >
                  <Quote className="h-5 w-5" />
                </div>

                <div className="flex gap-1" style={{ color: COLORS.wood }}>
                  {getRatingStars(review.rating).map((filled, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${filled ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>

                <p
                  className="mt-4 flex-1 text-sm leading-7"
                  style={{ color: '#6d5d52' }}
                >
                  「{review.comment}」
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div
            className="rounded-md border bg-white p-10 text-center shadow-sm"
            style={{ borderColor: COLORS.border }}
          >
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: '#faf6f0', color: COLORS.wood }}
            >
              <Quote className="h-6 w-6" />
            </div>

            <p
              className="mx-auto mt-5 max-w-xl text-sm leading-7"
              style={{ color: '#6d5d52' }}
            >
              每一次預約，都是為毛孩準備的一次安心照護。PawNest
              期待累積更多來自家人的真實回饋。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
