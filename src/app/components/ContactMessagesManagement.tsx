import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Search,
  User,
  MailOpen,
  Archive,
  ListFilter,
} from 'lucide-react';
import { adminApi, ContactMessageItem } from '../services/api';

type MessageStatus = 'all' | 'new' | 'read' | 'closed';

const statusText: Record<ContactMessageItem['status'], string> = {
  new: '新留言',
  read: '已讀',
  closed: '已處理',
};

const statusClass: Record<ContactMessageItem['status'], string> = {
  new: 'bg-[#fff1ec] text-[#b45f4d] border-[#f4c7b8]',
  read: 'bg-[#fffaf3] text-[#9a744f] border-[#ead8ba]',
  closed: 'bg-[#e8f3df] text-[#5f7f4f] border-[#cfe5bf]',
};

function formatDateTime(value?: string) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 19).replace('T', ' ');
  }

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ContactMessagesManagement() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<MessageStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadMessages = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await adminApi.contactMessages(
        statusFilter === 'all' ? undefined : statusFilter,
      );

      setMessages(result.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '讀取聯絡留言失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredMessages = useMemo(() => {
    const text = keyword.trim().toLowerCase();

    if (!text) return messages;

    return messages.filter((item) => {
      return [
        item.name,
        item.email,
        item.phone || '',
        item.subject || '',
        item.message,
        statusText[item.status],
      ]
        .join(' ')
        .toLowerCase()
        .includes(text);
    });
  }, [messages, keyword]);

  const counts = useMemo(() => {
    return messages.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      {
        total: 0,
        new: 0,
        read: 0,
        closed: 0,
      },
    );
  }, [messages]);

  const updateStatus = async (
    id: number,
    nextStatus: ContactMessageItem['status'],
  ) => {
    setUpdatingId(id);
    setNotice('');
    setError('');

    try {
      const result = await adminApi.updateContactMessageStatus(id, nextStatus);

      setMessages((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      );

      setNotice(result.message || '留言狀態已更新');
      window.setTimeout(() => setNotice(''), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新留言狀態失敗');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 text-[#4f4032]">
      {notice && (
        <div className="rounded-[1.5rem] border border-green-200 bg-green-50 px-5 py-3 text-sm font-black text-green-700 shadow-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 px-6 pb-2 pt-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="目前列表"
          value={counts.total}
          icon={<Inbox className="h-5 w-5" />}
          helper="All messages"
        />

        <SummaryCard
          label="新留言"
          value={counts.new}
          icon={<MessageCircle className="h-5 w-5" />}
          helper="Need review"
          tone="alert"
        />

        <SummaryCard
          label="已讀"
          value={counts.read}
          icon={<MailOpen className="h-5 w-5" />}
          helper="Opened"
          tone="warm"
        />

        <SummaryCard
          label="已處理"
          value={counts.closed}
          icon={<Archive className="h-5 w-5" />}
          helper="Closed"
          tone="success"
        />
      </div>


        

      <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm shadow-[#ead8ba]/40">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
              Contact Messages
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              聯絡留言列表
            </h2>
          </div>
        </div>

        <div className="border-b border-[#ead8ba] bg-white px-6 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b68655]" />

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜尋姓名、Email、電話、主旨或留言內容..."
                className="w-full rounded-2xl border border-[#e7d6be] bg-[#fffaf3] py-3 pl-12 pr-4 text-sm font-bold text-[#4f4032] outline-none transition placeholder:text-[#b8aa98] focus:border-[#b68655] focus:bg-white focus:ring-4 focus:ring-[#ead8ba]/45"
              />
            </div>

            <div className="inline-flex w-fit flex-wrap items-center gap-1.5 rounded-2xl border border-[#e7d6be] bg-[#fffaf3] p-1.5">
              <FilterButton
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                全部
              </FilterButton>

              <FilterButton
                active={statusFilter === 'new'}
                onClick={() => setStatusFilter('new')}
              >
                新留言
              </FilterButton>

              <FilterButton
                active={statusFilter === 'read'}
                onClick={() => setStatusFilter('read')}
              >
                已讀
              </FilterButton>

              <FilterButton
                active={statusFilter === 'closed'}
                onClick={() => setStatusFilter('closed')}
              >
                已處理
              </FilterButton>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="bg-[#fffaf3] text-left text-xs font-black uppercase tracking-[0.12em] text-[#9c8b78]">
                  <th className="whitespace-nowrap px-6 py-4">留言者 / 聯絡</th>
                  <th className="whitespace-nowrap px-6 py-4">主旨</th>
                  <th className="whitespace-nowrap px-6 py-4">留言內容</th>
                  <th className="whitespace-nowrap px-6 py-4">狀態</th>
                  <th className="whitespace-nowrap px-6 py-4">時間</th>
                  <th className="whitespace-nowrap px-6 py-4 text-right">操作</th>
                </tr>
              </thead>

              <tbody>
                {filteredMessages.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[#f1e6d6] align-top transition hover:bg-[#fffaf3]"
                  >
                    <td className="px-6 py-5">
                      <div className="flex gap-4">
                        <div className="min-w-0">
                          <p className="whitespace-nowrap font-black text-[#3b2d26]">
                            {item.name || '未填姓名'}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-[#7b6349]">
                            <Mail className="h-4 w-4 shrink-0 text-[#b68655]" />
                            {item.email}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-[#7b6349]">
                            <Phone className="h-4 w-4 shrink-0 text-[#b68655]" />
                            {item.phone || '未填電話'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[180px] font-black leading-6 text-[#3b2d26]">
                        {item.subject || '未填寫主旨'}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[320px] whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-[#7b6349]">
                        {item.message}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                          statusClass[item.status]
                        }`}
                      >
                        {statusText[item.status]}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7b6349]">
                        <Clock3 className="h-4 w-4 shrink-0 text-[#b68655]" />
                        {formatDateTime(item.created_at)}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex flex-col items-stretch gap-2">
                        {item.status !== 'read' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'read')}
                            disabled={updatingId === item.id}
                            className="inline-flex w-28 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#fffaf3] px-3 py-2 text-sm font-black text-[#7b6349] transition hover:bg-[#f7efe2] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === item.id ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 shrink-0" />
                            )}
                            已讀
                          </button>
                        )}

                        {item.status !== 'closed' ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'closed')}
                            disabled={updatingId === item.id}
                            className="inline-flex w-28 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#3b2d26] px-3 py-2 text-sm font-black text-white transition hover:bg-[#7b6349] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === item.id ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                            )}
                            已處理
                          </button>
                        ) : (
                          <span className="w-28 rounded-xl bg-[#e8f3df] px-3 py-2 text-center text-sm font-black text-[#5f7f4f]">
                            完成
                          </span>
                        )}
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
              目前沒有符合條件的留言
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  helper,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  helper: string;
  tone?: 'default' | 'alert' | 'warm' | 'success';
}) {
  const toneClass = {
    default: {
      card: 'border-[#e7d6be] bg-white',
      icon: 'bg-[#fffaf3] text-[#b68655]',
      badge: 'bg-[#f7efe2] text-[#7b6349]',
    },
    alert: {
      card: 'border-[#f4c7b8] bg-[#fff8f5]',
      icon: 'bg-[#fff1ec] text-[#b45f4d]',
      badge: 'bg-[#fff1ec] text-[#b45f4d]',
    },
    warm: {
      card: 'border-[#ead8ba] bg-[#fffdf8]',
      icon: 'bg-[#fff4da] text-[#9a744f]',
      badge: 'bg-[#fff4da] text-[#9a744f]',
    },
    success: {
      card: 'border-[#cfe5bf] bg-[#fbfff7]',
      icon: 'bg-[#e8f3df] text-[#5f7f4f]',
      badge: 'bg-[#e8f3df] text-[#5f7f4f]',
    },
  }[tone];

  return (
    <div
      className={`group rounded-[1.75rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[#7b6349]">{label}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#b8aa98]">
            {helper}
          </p>
        </div>

        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl transition group-hover:scale-105 ${toneClass.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <p className="text-4xl font-black tracking-tight text-[#3b2d26]">
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-black transition ${
        active
          ? 'bg-[#3b2d26] text-white shadow-sm'
          : 'text-[#7b6349] hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}