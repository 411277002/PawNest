import { FormEvent, useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { adminApi, type ReviewItem } from '../services/api';

export function MessagesManagement() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<Record<number, 'visible' | 'hidden'>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);

    try {
      const data = await adminApi.reviews();

      setReviews(data.reviews);

      const replies: Record<number, string> = {};
      const statuses: Record<number, 'visible' | 'hidden'> = {};

      data.reviews.forEach((review) => {
        replies[review.id] = review.reply || '';
        statuses[review.id] = review.status || 'visible';
      });

      setReplyText(replies);
      setStatus(statuses);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取評論失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveReply = async (event: FormEvent, id: number) => {
    event.preventDefault();

    try {
      setSavingId(id);

      await adminApi.replyReview(id, {
        reply: replyText[id] || '',
        status: status[id] || 'visible',
      });

      setMessage('評論回覆已儲存');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '回覆失敗');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('確定要刪除此評論嗎？')) return;

    try {
      await adminApi.deleteReview(id);
      setMessage('評論已刪除');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '刪除失敗');
    }
  };

  return (
    <div className="space-y-8 text-[#4f4032]">
      {message && (
        <div className="rounded-[1.5rem] border border-[#e7d6be] bg-[#fffaf3] px-5 py-3 text-sm font-black text-[#7b6349] shadow-sm shadow-[#ead8ba]/30">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm shadow-[#ead8ba]/40">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
              Reviews
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              評論列表
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#e7d6be] bg-white px-4 py-3 text-sm font-black text-[#7b6349] shadow-sm">
            <MessageSquare className="h-5 w-5 text-[#b68655]" />
            共 {reviews.length} 則評論
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="bg-[#fffaf3] text-left text-xs font-black uppercase tracking-[0.12em] text-[#9c8b78]">
                  <th className="whitespace-nowrap px-6 py-4">會員 / 服務</th>
                  <th className="whitespace-nowrap px-6 py-4">評分</th>
                  <th className="whitespace-nowrap px-6 py-4">評論內容</th>
                  <th className="whitespace-nowrap px-6 py-4">狀態</th>
                  <th className="whitespace-nowrap px-6 py-4">店家回覆</th>
                  <th className="whitespace-nowrap px-6 py-4 text-right">操作</th>
                </tr>
              </thead>

              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-t border-[#f1e6d6] align-top transition hover:bg-[#fffaf3]"
                  >
                    <td className="px-6 py-5">
                      <div className="flex gap-4">
                        <div className="min-w-0">
                          <p className="whitespace-nowrap font-black text-[#3b2d26]">
                            {review.customer_name || '匿名會員'}
                          </p>

                          <p className="mt-1 whitespace-nowrap text-sm font-semibold text-[#7b6349]">
                            {review.service_name || '無指定服務'}
                          </p>

                          <p className="mt-1 whitespace-nowrap text-xs font-bold text-[#9c8b78]">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleString(
                                  'zh-TW',
                                )
                              : ''}
                          </p>
                        </div>
                      </div>

                      {review.photo_url && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e7d6be] bg-[#fffaf3]">
                          <img
                            src={review.photo_url}
                            alt="評論照片"
                            className="h-28 w-44 object-cover"
                          />
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <p className="mt-2 text-sm font-black text-[#7b6349]">
                        {review.rating || 0} / 5
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[260px] text-sm font-semibold leading-7 text-[#7b6349]">
                        {review.comment || '未填寫評論內容'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <select
                        value={status[review.id] || 'visible'}
                        onChange={(event) =>
                          setStatus({
                            ...status,
                            [review.id]: event.target.value as
                              | 'visible'
                              | 'hidden',
                          })
                        }
                        className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 text-sm font-black text-[#7b6349] outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                      >
                        <option value="visible">前台顯示</option>
                        <option value="hidden">隱藏評論</option>
                      </select>
                    </td>

                    <td className="px-6 py-5">
                      <form
                        onSubmit={(event) => saveReply(event, review.id)}
                        className="min-w-[280px]"
                      >
                        <textarea
                          rows={3}
                          value={replyText[review.id] || ''}
                          onChange={(event) =>
                            setReplyText({
                              ...replyText,
                              [review.id]: event.target.value,
                            })
                          }
                          placeholder="輸入店家回覆..."
                          className="w-full rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 text-sm font-semibold text-[#4f4032] outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                        />
                      </form>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fakeEvent = {
                              preventDefault: () => {},
                            } as FormEvent;

                            saveReply(fakeEvent, review.id);
                          }}
                          disabled={savingId === review.id}
                          className="inline-flex w-24 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#3b2d26] px-3 py-2 text-sm font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === review.id ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 shrink-0" />
                          )}
                          儲存
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(review.id)}
                          className="inline-flex w-24 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#fff1ec] px-3 py-2 text-sm font-black text-[#9a5c50] transition hover:bg-[#ffe6dc]"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-10 text-center font-bold text-[#9c8b78]">
              目前沒有評論資料
            </div>
          </div>
        )}
      </section>
    </div>
  );
}