import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { activities, reviews, serviceFlow, services, stores } from '../../data/petData';

const heroImage = 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=1200&auto=format&fit=crop';
const marqueeItems = activities.map((item) => `${item.title}｜${item.date}`);

export function HomePage() {
  const featuredServices = services.slice(0, 3);

  return (
    <div className="overflow-hidden bg-[#f7efe2] text-[#4f4032]">
      <section className="border-b border-[#e7d6be] bg-[#f7efe2] py-3">
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="animate-[marquee_24s_linear_infinite] text-sm font-bold tracking-wide text-[#7b6349]">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span key={`${item}-${index}`} className="mx-8 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#c69c6d]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#ead8ba_0,transparent_35%),radial-gradient(circle_at_bottom_right,#f6d9c8_0,transparent_32%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20 lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7d6be] bg-white/80 px-4 py-2 text-sm font-bold text-[#7b6349] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#c69c6d]" />
              美容・住宿・安親一次完成預約
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#4f4032] sm:text-5xl lg:text-6xl">
              給毛孩一個<br />
              <span className="text-[#b68655]">溫柔又安心</span>
              的照護日常
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#7b6349]">
              從線上預約、健康註記、門市時段到服務進度追蹤，讓飼主清楚掌握每一步，也讓店家管理更有效率。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7b6349] px-7 py-3.5 font-bold text-white shadow-xl shadow-[#e7d6be] transition hover:-translate-y-1 hover:bg-[#6a523d]">
                開始預約 <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/services" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9c6aa] bg-white px-7 py-3.5 font-bold text-[#4f4032] transition hover:-translate-y-1 hover:bg-[#f7efe2]">
                查看服務方案
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                ['4.9/5', '平均評價'],
                ['3,200+', '服務毛孩'],
                ['24hr', '住宿照護'],
              ].map(([num, label]) => (
                <div key={label} className="rounded-3xl border border-[#e7d6be] bg-white/80 p-4 shadow-sm">
                  <div className="text-2xl font-black text-[#4f4032]">{num}</div>
                  <div className="mt-1 text-sm text-[#9c8b78]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 z-10 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl shadow-[#e7d6be] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f3df] text-[#5f7f4f]"><ShieldCheck className="h-6 w-6" /></div>
                <div>
                  <div className="font-bold text-[#4f4032]">今日可預約</div>
                  <div className="text-sm text-[#9c8b78]">信義店剩 4 個時段</div>
                </div>
              </div>
            </div>
            <img src={heroImage} alt="寵物照護空間" className="h-[560px] w-full rounded-[2.5rem] object-cover shadow-2xl shadow-[#e7d6be]" />
            <div className="absolute -bottom-6 right-5 rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl shadow-[#e7d6be]">
              <div className="mb-2 flex items-center gap-1 text-[#d0a05c]">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <div className="font-bold text-[#4f4032]">美容完成照＋照護紀錄</div>
              <div className="text-sm text-[#9c8b78]">讓飼主放心接回毛孩</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-black tracking-[0.22em] text-[#b68655]">SERVICE</p>
            <h2 className="mt-2 text-3xl font-black text-[#4f4032] sm:text-4xl">熱門服務</h2>
            <p className="mt-3 max-w-2xl text-[#7b6349]">美容、住宿與安親服務皆可線上選時段，價格與照護內容清楚呈現。</p>
          </div>
          <Link to="/services" className="inline-flex items-center gap-2 font-bold text-[#7b6349]">全部服務 <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredServices.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.id} className="group overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-lg shadow-[#ead8ba]/40 transition hover:-translate-y-2">
                <img src={service.image} alt={service.name} className="h-48 w-full object-cover" />
                <div className="p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7efe2] text-[#b68655] transition group-hover:scale-110">
                      <Icon className="h-7 w-7" />
                    </div>
                    {service.popular && <span className="rounded-full bg-[#f6e1d5] px-3 py-1 text-xs font-bold text-[#9a6b55]">推薦</span>}
                  </div>
                  <h3 className="text-xl font-black text-[#4f4032]">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7b6349]">{service.tagline}</p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-black text-[#4f4032]">{service.priceLabel}</div>
                      <div className="text-sm text-[#9c8b78]">{service.duration}</div>
                    </div>
                    <Heart className="h-6 w-6 text-[#d6a99a]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f7efe2] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-black tracking-[0.22em] text-[#b68655]">FLOW</p>
            <h2 className="mt-2 text-3xl font-black text-[#4f4032] sm:text-4xl">清楚的預約與照護流程</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {serviceFlow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="relative rounded-[2rem] border border-[#e7d6be] bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7efe2] text-[#b68655]"><Icon className="h-6 w-6" /></div>
                    <span className="text-4xl font-black text-[#ead8ba]">0{index + 1}</span>
                  </div>
                  <h3 className="font-black text-[#4f4032]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7b6349]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[2rem] bg-[#7b6349] p-8 text-white shadow-2xl shadow-[#e7d6be]">
          <p className="font-black tracking-[0.22em] text-[#ead8ba]">STORE</p>
          <h2 className="mt-2 text-3xl font-black">今日推薦門市</h2>
          <div className="mt-8 grid gap-4">
            {stores.map((store) => (
              <div key={store.id} className="rounded-3xl bg-white/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{store.name}</h3>
                    <p className="mt-1 text-sm text-[#f4e9d8]">{store.address}</p>
                  </div>
                  <span className="rounded-full bg-[#e8f3df]/20 px-3 py-1 text-xs font-bold text-[#e8f3df]">{store.availability}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-[#e7d6be] bg-white p-8 shadow-xl shadow-[#ead8ba]/40">
          <p className="font-black tracking-[0.22em] text-[#b68655]">REVIEW</p>
          <h2 className="mt-2 text-3xl font-black text-[#4f4032]">飼主真實好評</h2>
          <div className="mt-8 grid gap-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.name} className="rounded-3xl bg-[#f7efe2] p-5">
                <div className="mb-2 flex items-center gap-1 text-[#d0a05c]">
                  {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="leading-7 text-[#7b6349]">「{review.comment}」</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#4f4032]"><CheckCircle2 className="h-4 w-4 text-[#6f8a5f]" />{review.name}・{review.pet}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
