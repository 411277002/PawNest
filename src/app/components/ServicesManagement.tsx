import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Clock,
  Edit3,
  Loader2,
  Plus,
  Save,
  Scissors,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { adminApi, type ServiceItem } from '../services/api';

const labels: Record<string, string> = {
  grooming: '美容服務',
  boarding: '住宿服務',
  daycare: '安親服務',
  addon: '加購服務',
};

const targetLabels: Record<string, string> = {
  all: '貓狗皆可',
  dog: '狗狗專屬',
  cat: '貓咪專屬',
};

const fallbackImage =
  'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1200&auto=format&fit=crop';

const emptyService: Partial<ServiceItem> = {
  name: '',
  category: 'grooming',
  price: 0,
  duration_minutes: 60,
  description: '',
  image_url: '',
  badge: '',
  target_pet_type: 'all',
  status: 'active',
};

function readImageFile(file: File, callback: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result || ''));
  reader.readAsDataURL(file);
}

export function ServicesManagement() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [editing, setEditing] = useState<Partial<ServiceItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const openEditor = (service?: ServiceItem) => {
    setEditing(service ? { ...service } : emptyService);
  };

  const load = async () => {
    setLoading(true);

    try {
      const data = await adminApi.services();
      setServices(data.services);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取服務失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editing) return;

    try {
      if (editing.id) {
        await adminApi.updateService(editing.id, editing);
      } else {
        await adminApi.createService(editing);
      }

      setEditing(null);
      setMessage('服務資料已儲存');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '儲存失敗');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('確定要刪除此服務嗎？')) return;

    try {
      await adminApi.deleteService(id);
      setMessage('服務已刪除');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '刪除失敗');
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !editing) return;

    readImageFile(file, (imageUrl) =>
      setEditing({ ...editing, image_url: imageUrl }),
    );
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
                  Service editor
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
                  {editing.id ? '編輯服務' : '新增服務'}
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
                  alt="服務圖片預覽"
                  className="h-52 w-full object-cover"
                />

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-[#3b2d26]">服務圖片</p>
                    <p className="mt-1 text-sm font-semibold text-[#9c8b78]">
                      建議使用橫式圖片，前台服務卡片會顯示得更完整。
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
                  label="服務名稱"
                  value={editing.name || ''}
                  onChange={(v) => setEditing({ ...editing, name: v })}
                />

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  類別
                  <select
                    value={editing.category || 'grooming'}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        category: e.target.value as ServiceItem['category'],
                      })
                    }
                    className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                  >
                    <option value="grooming">美容</option>
                    <option value="boarding">住宿</option>
                    <option value="daycare">安親</option>
                    <option value="addon">加購</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  適用對象
                  <select
                    value={editing.target_pet_type || 'all'}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        target_pet_type: e.target.value as
                          | 'all'
                          | 'dog'
                          | 'cat',
                      })
                    }
                    className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                  >
                    <option value="all">貓狗皆可</option>
                    <option value="dog">狗狗專屬</option>
                    <option value="cat">貓咪專屬</option>
                  </select>
                </label>

                <Field
                  type="number"
                  label="價格"
                  value={String(editing.price ?? 0)}
                  onChange={(v) => setEditing({ ...editing, price: Number(v) })}
                />

                <Field
                  type="number"
                  label="服務分鐘"
                  value={String(editing.duration_minutes ?? 0)}
                  onChange={(v) =>
                    setEditing({ ...editing, duration_minutes: Number(v) })
                  }
                />

                <Field
                  label="推薦標籤"
                  value={editing.badge || ''}
                  onChange={(v) => setEditing({ ...editing, badge: v })}
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
              </div>

              <label className="mt-4 grid gap-2 text-sm font-black text-[#4f4032]">
                服務描述
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
                  儲存服務
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
              Services
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              服務列表
            </h2>
          </div>

          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-5 py-3 font-black text-white shadow-sm transition hover:bg-[#7b6349]"
          >
            <Plus className="h-5 w-5" />
            新增服務
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="grid overflow-hidden rounded-[1.5rem] border border-[#e7d6be] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[180px_1fr]"
                >
                  <img
                    src={service.image_url || fallbackImage}
                    alt={service.name}
                    className="h-40 w-full object-cover md:h-full"
                  />

                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] text-[#b68655]">
                          <Scissors className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="line-clamp-1 text-lg font-black text-[#3b2d26]">
                            {service.name}
                          </h3>

                          <p className="mt-1 text-xs font-bold text-[#9c8b78]">
                            {labels[service.category]}・
                            {targetLabels[service.target_pet_type || 'all']}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          service.status === 'inactive'
                            ? 'bg-[#fff1ec] text-[#9a5c50]'
                            : 'bg-[#f7efe2] text-[#7b6349]'
                        }`}
                      >
                        {service.status === 'inactive' ? '隱藏' : '顯示中'}
                      </span>
                    </div>

                    <p className="line-clamp-2 min-h-[48px] text-sm font-semibold leading-6 text-[#7b6349]">
                      {service.description || '尚未填寫服務描述'}
                    </p>

                    <div className="mt-3 grid gap-1.5 text-xs font-bold text-[#7b6349]">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#b68655]" />
                        <span>{service.badge || labels[service.category]}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#b68655]" />
                        <span>{service.duration_minutes} 分鐘</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-lg font-black text-[#b68655]">
                        NT${service.price}
                      </span>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditor(service)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#fffaf3] px-3 py-2 text-sm font-black text-[#7b6349] transition hover:bg-[#f7efe2]"
                        >
                          <Edit3 className="h-4 w-4" />
                          編輯
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(service.id)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#fff1ec] px-3 py-2 text-sm font-black text-[#9a5c50] transition hover:bg-[#ffe6dc]"
                        >
                          <Trash2 className="h-4 w-4" />
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-10 text-center font-bold text-[#9c8b78]">
              目前沒有服務資料
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