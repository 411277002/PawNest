import { FormEvent, useEffect, useState } from 'react';
import { ImagePlus, Loader2, Send, Star, X } from 'lucide-react';
import { publicApi, reviewApi, type ReviewItem, type ServiceItem } from '../../services/api';

export function ReviewsPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [rating, setRating] = useState(5);
  const [serviceId, setServiceId] = useState('');
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const loadReviews = () => publicApi.reviews().then((data) => setReviews(data.reviews)).catch(() => setReviews([]));
  useEffect(() => { loadReviews(); publicApi.services().then((data) => setServices(data.services)).catch(() => setServices([])); }, []);
  const readPhoto = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setPhotoUrl(String(reader.result)); reader.readAsDataURL(file); };
  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn) { setMessage('請先登入會員後再留下評論'); return; }
    try { setSubmitting(true); setMessage(''); await reviewApi.create({ service_id: serviceId ? Number(serviceId) : null, rating, comment, photo_url: photoUrl }); setComment(''); setRating(5); setServiceId(''); setPhotoUrl(null); setMessage('評論已送出，謝謝你的分享'); await loadReviews(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '評論送出失敗'); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={submitReview}
            className="rounded-[2rem] border border-[#e7d6be] bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-black">留下評論</h2>

            <p className="mt-2 text-sm leading-6 text-[#7b6349]">
              會員登入後可以分享服務體驗。
            </p>

            <label className="mt-6 grid gap-2 text-sm font-black">
              服務項目

              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none"
              >
                <option value="">不指定服務</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5">
              <p className="mb-2 text-sm font-black">評分</p>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="text-[#d9a441]"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        value <= rating ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 grid gap-2 text-sm font-black">
              評論內容

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                placeholder="分享這次美容、住宿或安親體驗..."
                className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none"
              />
            </label>

            <div className="mt-5 rounded-2xl border border-dashed border-[#d9b98f] bg-[#fffaf3] p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 font-black text-[#7b6349] shadow-sm">
                  <ImagePlus className="h-5 w-5" />
                  選擇照片

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => readPhoto(e.target.files?.[0])}
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="rounded-xl bg-[#fff1ec] px-4 py-2 font-bold text-[#9a5c50]"
                  >
                    <X className="inline h-4 w-4" />
                    移除
                  </button>
                )}
              </div>

              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="評論預覽"
                  className="mt-4 h-48 w-full rounded-2xl object-cover"
                />
              ) : (
                <p className="mt-3 text-sm text-[#9c8b78]">
                  可選擇上傳服務照片，也可以不附照片直接送出。
                </p>
              )}
            </div>

            {message && (
              <p className="mt-4 rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#7b6349]">
                {message}
              </p>
            )}

            <button
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7b6349] px-6 py-4 font-black text-white disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}

              送出評論
            </button>
          </form>

          <div className="grid gap-5">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[2rem] border border-[#e7d6be] bg-white p-6 shadow-sm"
              >
                {review.photo_url && (
                  <img
                    src={review.photo_url}
                    alt="評論照片"
                    className="mb-5 h-56 w-full rounded-3xl object-cover"
                  />
                )}

                <div className="flex gap-1 text-[#d9a441]">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                <p className="mt-4 leading-7 text-[#7b6349]">
                  {review.comment}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="font-black">{review.customer_name}</p>

                    <p className="text-sm text-[#9c8b78]">
                      {review.service_name || 'PawNest 服務'}
                    </p>
                  </div>
                </div>

                {review.reply && (
                  <div className="mt-5 rounded-2xl bg-[#fffaf3] p-4">
                    <p className="text-sm font-black text-[#b68655]">
                      PawNest 回覆
                    </p>

                    <p className="mt-2 leading-7 text-[#7b6349]">
                      {review.reply}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
