import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Star } from 'lucide-react';
import { reviews } from '../../data/petData';
import { getStoredUser } from '../../services/api';

type ReviewItem = {
  name: string;
  pet: string;
  service: string;
  rating: number;
  date: string;
  comment: string;
};

export function ReviewsPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const user = useMemo(() => getStoredUser(), [isLoggedIn]);
  const [reviewList, setReviewList] = useState<ReviewItem[]>(reviews);
  const [form, setForm] = useState({
    pet: '',
    service: '基礎洗護美容',
    rating: 5,
    comment: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.pet.trim() || !form.comment.trim()) return;

    const today = new Date().toISOString().slice(0, 10);
    setReviewList((current) => [
      {
        name: user?.name || user?.username || '會員',
        pet: form.pet.trim(),
        service: form.service,
        rating: form.rating,
        date: today,
        comment: form.comment.trim(),
      },
      ...current,
    ]);
    setForm({ pet: '', service: '基礎洗護美容', rating: 5, comment: '' });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2.5rem] border border-[#e7d6be] bg-[#f7efe2] p-8 shadow-sm md:p-12">
          <p className="font-black tracking-[0.22em] text-[#b68655]">REVIEWS</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">飼主評價牆</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">查看飼主分享的美容、住宿與安親心得，也可以在登入後留下你的照護體驗。</p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {reviewList.map((review, index) => (
              <article key={`${review.name}-${review.pet}-${index}`} className="rounded-[2rem] border border-[#e7d6be] bg-white p-7 shadow-lg shadow-[#ead8ba]/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex gap-1 text-[#d0a05c]">
                      {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                    </div>
                    <h2 className="mt-4 text-2xl font-black text-[#4f4032]">{review.pet} 的照護體驗</h2>
                    <p className="mt-1 text-sm font-bold text-[#b68655]">{review.service}・{review.date}</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f7efe2] text-2xl">🐾</div>
                </div>
                <p className="mt-5 text-lg leading-8 text-[#7b6349]">「{review.comment}」</p>
                <div className="mt-5 border-t border-[#e7d6be] pt-4 font-bold text-[#4f4032]">{review.name}</div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[2rem] border border-[#e7d6be] bg-white p-7 shadow-lg shadow-[#ead8ba]/40">
            <h2 className="text-2xl font-black text-[#4f4032]">留下評價</h2>
            <p className="mt-2 leading-7 text-[#7b6349]">
              {isLoggedIn ? '分享你的服務體驗，讓其他飼主更安心選擇。' : '登入會員後即可留下評論。'}
            </p>

            {isLoggedIn ? (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  毛孩名稱
                  <input
                    value={form.pet}
                    onChange={(event) => setForm({ ...form, pet: event.target.value })}
                    className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655] focus:bg-white"
                    placeholder="例如：布丁"
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  服務項目
                  <select
                    value={form.service}
                    onChange={(event) => setForm({ ...form, service: event.target.value })}
                    className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655] focus:bg-white"
                  >
                    <option>基礎洗護美容</option>
                    <option>精緻造型修剪</option>
                    <option>安心住宿房</option>
                    <option>日間安親陪伴</option>
                    <option>舒敏 SPA 護理</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  評分
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setForm({ ...form, rating: score })}
                        className={`grid h-11 w-11 place-items-center rounded-full border transition ${score <= form.rating ? 'border-[#d0a05c] bg-[#fff4da] text-[#d0a05c]' : 'border-[#e7d6be] bg-white text-[#c8b9a4]'}`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  評論內容
                  <textarea
                    value={form.comment}
                    onChange={(event) => setForm({ ...form, comment: event.target.value })}
                    rows={5}
                    className="rounded-2xl border border-[#e7d6be] bg-[#f7efe2] px-4 py-3 outline-none focus:border-[#b68655] focus:bg-white"
                    placeholder="寫下服務感受、環境、照護細節或想推薦的地方"
                  />
                </label>

                {saved && <div className="rounded-2xl bg-[#e8f3df] px-4 py-3 text-sm font-black text-[#5f7f4f]">評論已送出</div>}

                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white transition hover:bg-[#6a523d]">
                  <Send className="h-5 w-5" />
                  送出評論
                </button>
              </form>
            ) : (
              <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white transition hover:bg-[#6a523d]">
                登入後評論
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
