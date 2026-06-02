import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Calendar,
  Edit3,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { adminApi, type ActivityItem } from '../services/api';

const fallbackImage =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop';

const emptyActivity: Partial<ActivityItem> = {
  title: '',
  category: '',
  description: '',
  start_date: '',
  end_date: '',
  image_url: '',
  cta_label: '查看活動',
  cta_link: '/activities',
  is_banner: 1,
  sort_order: 0,
  status: 'active',
};

function readImageFile(file: File, callback: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result || ''));
  reader.readAsDataURL(file);
}

export function ActivitiesManagement() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [editing, setEditing] = useState<Partial<ActivityItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);

    try {
      const data = await adminApi.activities();
      setActivities(data.activities);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取活動失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !editing) return;

    readImageFile(file, (imageUrl) =>
      setEditing({ ...editing, image_url: imageUrl }),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editing) return;

    try {
      if (editing.id) {
        await adminApi.updateActivity(editing.id, editing);
      } else {
        await adminApi.createActivity(editing);
      }

      setEditing(null);
      setMessage('活動資料已儲存');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '儲存失敗');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('確定要刪除此活動嗎？')) return;

    try {
      await adminApi.deleteActivity(id);
      setMessage('活動已刪除');
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2d26]/45 px-4 py-6 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-2xl shadow-[#3b2d26]/25"
          >
            <div className="flex items-center justify-between border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
                  Activity editor
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
                  {editing.id ? '編輯活動' : '新增活動'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#e7d6be] bg-white text-[#7b6349] transition hover:bg-[#f7efe2]"
                aria-label="關閉表單"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
              <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3]">
                <img
                  src={editing.image_url || fallbackImage}
                  alt="活動圖片預覽"
                  className="h-52 w-full object-cover"
                />

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-[#3b2d26]">活動圖片</p>
                    <p className="mt-1 text-sm font-semibold text-[#9c8b78]">
                      建議使用橫式圖片，前台顯示會比較完整。
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#b68655] px-5 py-3 font-black text-white shadow-sm transition hover:bg-[#7b6349]">
                    <UploadCloud className="h-5 w-5" />
                    上傳圖片
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="活動標題"
                  value={editing.title || ''}
                  onChange={(v) => setEditing({ ...editing, title: v })}
                />

                <Field
                  label="分類"
                  value={editing.category || ''}
                  onChange={(v) => setEditing({ ...editing, category: v })}
                />

                <Field
                  label="開始日期"
                  type="date"
                  value={
                    editing.start_date
                      ? String(editing.start_date).slice(0, 10)
                      : ''
                  }
                  onChange={(v) => setEditing({ ...editing, start_date: v })}
                />

                <Field
                  label="結束日期"
                  type="date"
                  value={
                    editing.end_date ? String(editing.end_date).slice(0, 10) : ''
                  }
                  onChange={(v) => setEditing({ ...editing, end_date: v })}
                />

                <Field
                  label="排序"
                  type="number"
                  value={String(editing.sort_order ?? 0)}
                  onChange={(v) =>
                    setEditing({ ...editing, sort_order: Number(v) })
                  }
                />

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  狀態
                  <select
                    value={editing.status || 'active'}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                  >
                    <option value="active">顯示</option>
                    <option value="inactive">隱藏</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  首頁輪播
                  <select
                    value={editing.is_banner ? '1' : '0'}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        is_banner: e.target.value === '1' ? 1 : 0,
                      })
                    }
                    className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                  >
                    <option value="1">是</option>
                    <option value="0">否</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-black text-[#4f4032]">
                活動簡短介紹
                <textarea
                  value={editing.summary || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, summary: e.target.value })
                  }
                  placeholder="例如：指定美容與住宿方案享限定優惠"
                  className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                />
              </label>

              <label className="mt-4 grid gap-2 text-sm font-black text-[#4f4032]">
                活動描述
                <textarea
                  rows={4}
                  value={editing.description || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                />
              </label>

              <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-[#ead8ba] bg-white/95 pt-5 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="cursor-pointer rounded-2xl border border-[#e7d6be] bg-white px-6 py-3 font-black text-[#7b6349] transition hover:bg-[#fffaf3]"
                >
                  取消
                </button>

                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#3b2d26] px-6 py-3 font-black text-white shadow-sm transition hover:bg-[#7b6349]"
                >
                  <Save className="h-5 w-5" />
                  儲存活動
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm shadow-[#ead8ba]/40">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
              Activities
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              活動列表
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setEditing(emptyActivity)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-5 py-3 font-black text-white shadow-sm transition hover:bg-[#7b6349]"
          >
            <Plus className="h-5 w-5" />
            新增活動
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
            </div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {activities.map((activity) => (
                <article
                  key={activity.id}
                  className="grid overflow-hidden rounded-[1.5rem] border border-[#e7d6be] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[180px_1fr]"
                >
                  <img
                    src={activity.image_url || fallbackImage}
                    alt={activity.title}
                    className="h-40 w-full object-cover md:h-full"
                  />

                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-1 text-lg font-black text-[#3b2d26]">
                          {activity.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              activity.status === 'inactive'
                                ? 'bg-[#fff1ec] text-[#9a5c50]'
                                : 'bg-[#f7efe2] text-[#7b6349]'
                            }`}
                          >
                            {activity.status === 'inactive' ? '隱藏' : '顯示中'}
                          </span>

                          {activity.is_banner ? (
                            <span className="rounded-full bg-[#fff4da] px-3 py-1 text-xs font-black text-[#9a744f]">
                              首頁輪播
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#7b6349]">
                      {activity.summary || activity.description || '尚未填寫活動介紹'}
                    </p>

                    <div className="mt-3 grid gap-1.5 text-xs font-bold text-[#7b6349]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#b68655]" />
                        <span>
                          {activity.start_date || '未設定'} ~{' '}
                          {activity.end_date || '長期'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#b68655]" />
                        <span>{activity.category || '未分類'}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(activity)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#fffaf3] px-3 py-2 text-sm font-black text-[#7b6349] transition hover:bg-[#f7efe2]"
                      >
                        <Edit3 className="h-4 w-4" />
                        編輯
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(activity.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#fff1ec] px-3 py-2 text-sm font-black text-[#9a5c50] transition hover:bg-[#ffe6dc]"
                      >
                        <Trash2 className="h-4 w-4" />
                        刪除
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-10 text-center font-bold text-[#9c8b78]">
              目前沒有活動資料
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#4f4032]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
      />
    </label>
  );
}