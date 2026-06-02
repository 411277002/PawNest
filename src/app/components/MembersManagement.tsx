import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Crown,
  Edit3,
  Eye,
  Loader2,
  PawPrint,
  Phone,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { adminApi, apiFetch } from '../services/api';

interface MembersManagementProps {
  role: 'admin' | 'staff';
}

type MemberRow = {
  id?: number;
  name: string;
  email?: string;
  username: string;
  phone?: string;
  membership_tier?: 'general' | 'vip';
  membership_points?: number;
  vip_expires_at?: string | null;
  status?: 'active' | 'inactive';
  pet_count?: number;
  password?: string;
  annual_spending?: number;
};

type TransactionRow = {
  id: number;
  booking_id: number;
  customer_id: number;
  staff_id?: number | null;

  original_amount: number;
  discount_points_used: number;
  discount_amount: number;
  final_amount: number;
  points_earned: number;

  note?: string | null;
  paid_at?: string;
  created_at?: string;

  booking_date?: string;
  start_time?: string;
  booking_status?: string;

  pet_name?: string;
  service_name?: string;
  store_name?: string;
  staff_name?: string;
};

type TransactionSummary = {
  annual_spending: number;
  vip_threshold: number;
  remaining_to_vip: number;
};

const emptyMember: MemberRow = {
  name: '',
  email: '',
  username: '',
  phone: '',
  membership_tier: 'general',
  membership_points: 0,
  vip_expires_at: '',
  status: 'active',
  password: '123456',
};

function formatDate(value?: string | null) {
  if (!value) return '無';
  return String(value).slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) return '無';
  return String(value).replace('T', ' ').slice(0, 16);
}

function currency(value?: number | string | null) {
  return `NT$${Number(value || 0).toLocaleString()}`;
}

function getAnnualSpending(member: MemberRow) {
  return Number(member.annual_spending || 0);
}

function getRemainingToVip(member: MemberRow) {
  return Math.max(10000 - getAnnualSpending(member), 0);
}

async function getMemberTransactions(memberId: number) {
  return apiFetch<{
    transactions: TransactionRow[];
    summary: TransactionSummary;
  }>(`/admin/members/${memberId}/transactions`);
}

export function MembersManagement({ role }: MembersManagementProps) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [transactionSummary, setTransactionSummary] =
    useState<TransactionSummary | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);

  const vipMembers = useMemo(
    () => members.filter((member) => member.membership_tier === 'vip').length,
    [members],
  );

  const totalAnnualSpending = useMemo(
    () =>
      members.reduce(
        (sum, member) => sum + Number(member.annual_spending || 0),
        0,
      ),
    [members],
  );

  const load = async () => {
    setLoading(true);

    try {
      const data = await adminApi.members();
      setMembers(data.members as MemberRow[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取會員資料失敗');
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
        await adminApi.updateMember(editing.id, editing);
      } else {
        await adminApi.createMember(editing);
      }

      setEditing(null);
      setMessage('會員資料已儲存');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '儲存失敗');
    }
  };

  const remove = async (id?: number) => {
    if (
      !id ||
      !window.confirm('確定要刪除此會員嗎？此會員的寵物與預約關聯資料也可能受到影響。')
    ) {
      return;
    }

    try {
      await adminApi.deleteMember(id);
      setMessage('會員已刪除');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '刪除失敗');
    }
  };

  const openTransactions = async (member: MemberRow) => {
    if (!member.id) return;

    setSelectedMember(member);
    setTransactions([]);
    setTransactionSummary(null);
    setTransactionLoading(true);

    try {
      const data = await getMemberTransactions(member.id);
      setTransactions(data.transactions);
      setTransactionSummary(data.summary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取消費紀錄失敗');
    } finally {
      setTransactionLoading(false);
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
                  Member editor
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
                  {editing.id ? '編輯會員' : '新增會員'}
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
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="姓名"
                  value={editing.name || ''}
                  onChange={(value) => setEditing({ ...editing, name: value })}
                />

                <Field
                  label="帳號"
                  value={editing.username || ''}
                  onChange={(value) =>
                    setEditing({ ...editing, username: value })
                  }
                />

                <Field
                  label="Email"
                  value={editing.email || ''}
                  onChange={(value) => setEditing({ ...editing, email: value })}
                />

                <Field
                  label="電話"
                  value={editing.phone || ''}
                  onChange={(value) => setEditing({ ...editing, phone: value })}
                />

                <Field
                  type="number"
                  label="會員點數"
                  value={String(editing.membership_points ?? 0)}
                  onChange={(value) =>
                    setEditing({
                      ...editing,
                      membership_points: Number(value || 0),
                    })
                  }
                />

                <Field
                  type="date"
                  label="VIP 到期日"
                  value={
                    editing.vip_expires_at
                      ? String(editing.vip_expires_at).slice(0, 10)
                      : ''
                  }
                  onChange={(value) =>
                    setEditing({ ...editing, vip_expires_at: value })
                  }
                />

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  會員等級
                  <select
                    value={editing.membership_tier || 'general'}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        membership_tier: event.target.value as 'general' | 'vip',
                      })
                    }
                    className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                  >
                    <option value="general">一般會員</option>
                    <option value="vip">VIP 會員</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black text-[#4f4032]">
                  狀態
                  <select
                    value={editing.status || 'active'}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        status: event.target.value as 'active' | 'inactive',
                      })
                    }
                    className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
                  >
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                  </select>
                </label>

                <Field
                  label={editing.id ? '新密碼（不填則不修改）' : '密碼'}
                  value={editing.password || ''}
                  onChange={(value) =>
                    setEditing({ ...editing, password: value })
                  }
                />
              </div>

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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#3b2d26] px-6 py-3 font-black text-white transition hover:bg-[#7b6349]"
                >
                  <Save className="h-5 w-5" />
                  儲存會員
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
              Members
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              會員列表
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setEditing(emptyMember)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#3b2d26] px-5 py-3 font-black text-white transition hover:bg-[#7b6349]"
          >
            <Plus className="h-5 w-5" />
            新增會員
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
          </div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#fffaf3] text-left text-xs font-black uppercase tracking-[0.12em] text-[#9c8b78]">
                  <th className="whitespace-nowrap px-6 py-4">會員 / 帳號</th>
                  <th className="whitespace-nowrap px-6 py-4">聯絡資訊</th>
                  <th className="whitespace-nowrap px-6 py-4">毛孩 / 點數</th>
                  <th className="whitespace-nowrap px-6 py-4">最近一年消費</th>
                  <th className="whitespace-nowrap px-6 py-4">會員等級</th>
                  <th className="whitespace-nowrap px-6 py-4 text-right">操作</th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => {
                  const annualSpending = getAnnualSpending(member);
                  const remainingToVip = getRemainingToVip(member);
                  const isVip = member.membership_tier === 'vip';

                  return (
                    <tr
                      key={member.id}
                      className="border-t border-[#f1e6d6] transition hover:bg-[#fffaf3]"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">

                          <div>
                            <p className="whitespace-nowrap font-black text-[#3b2d26]">
                              {member.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <p className="text-sm font-bold text-[#4f4032]">
                          {member.email || '未填 Email'}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#7b6349]">
                          <Phone className="h-4 w-4 text-[#b68655]" />
                          {member.phone || '未填電話'}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="flex whitespace-nowrap items-center gap-1.5 text-sm font-bold text-[#4f4032]">
                          <PawPrint className="h-4 w-4 shrink-0 text-[#b68655]" />
                          {member.pet_count || 0} 隻毛孩
                        </p>

                        <p className="mt-1 flex whitespace-nowrap items-center gap-1.5 text-sm font-bold text-[#7b6349]">
                          <ReceiptText className="h-4 w-4 shrink-0 text-[#b68655]" />
                          {member.membership_points || 0} 點
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-[#3b2d26]">
                          {currency(annualSpending)}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#9c8b78]">
                          {isVip
                            ? `VIP 到期：${formatDate(member.vip_expires_at)}`
                            : `距離 VIP 還差 ${currency(remainingToVip)}`}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                              isVip
                                ? 'bg-[#fff4da] text-[#9a744f]'
                                : 'bg-[#f7efe2] text-[#7b6349]'
                            }`}
                          >
                            {isVip && <Crown className="h-3 w-3" />}
                            {isVip ? 'VIP' : '一般會員'}
                          </span>

                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
                              member.status === 'inactive'
                                ? 'bg-[#fff1ec] text-[#9a5c50]'
                                : 'bg-[#e8f3df] text-[#5f7f4f]'
                            }`}
                          >
                            {member.status === 'inactive' ? '停用' : '啟用'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-nowrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openTransactions(member)}
                            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#e8f3df] px-3 py-2 text-sm font-black text-[#5f7f4f] transition hover:bg-[#d9eacb]"
                          >
                            <Eye className="h-4 w-4 shrink-0" />
                            消費
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditing({ ...member, password: '' })}
                            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#fffaf3] px-3 py-2 text-sm font-black text-[#7b6349] transition hover:bg-[#f7efe2]"
                          >
                            <Edit3 className="h-4 w-4 shrink-0" />
                            編輯
                          </button>

                          {role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => remove(member.id)}
                              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#fff1ec] px-3 py-2 text-sm font-black text-[#9a5c50] transition hover:bg-[#ffe6dc]"
                            >
                              <Trash2 className="h-4 w-4 shrink-0" />
                              刪除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-10 text-center font-bold text-[#9c8b78]">
              目前沒有會員資料
            </div>
          </div>
        )}
      </section>

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2d26]/45 p-4 backdrop-blur-sm">
          <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-2xl shadow-[#3b2d26]/25">
            <div className="flex items-start justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
                  Transactions
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
                  {selectedMember.name} 的消費紀錄
                </h2>

                <p className="mt-1 text-sm font-bold text-[#9c8b78]">
                  最近一年消費：
                  {currency(transactionSummary?.annual_spending || 0)}
                  ｜距離 VIP 還差：
                  {currency(transactionSummary?.remaining_to_vip || 0)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#e7d6be] bg-white text-[#7b6349] transition hover:bg-[#f7efe2]"
                aria-label="關閉消費紀錄"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(86vh-112px)] overflow-y-auto p-6">
              {transactionLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#b68655]" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto rounded-[1.75rem] border border-[#e7d6be]">
                  <table className="w-full min-w-[820px] border-collapse">
                    <thead>
                      <tr className="bg-[#fffaf3] text-left text-xs font-black uppercase tracking-[0.12em] text-[#9c8b78]">
                        <th className="px-5 py-4">訂單 / 服務</th>
                        <th className="px-5 py-4">日期</th>
                        <th className="px-5 py-4">實際金額</th>
                        <th className="px-5 py-4">使用點數</th>
                        <th className="px-5 py-4">實收金額</th>
                        <th className="px-5 py-4">獲得點數</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-t border-[#f1e6d6] transition hover:bg-[#fffaf3]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-xs font-black text-[#b68655]">
                              #{String(transaction.booking_id).padStart(3, '0')}
                            </p>

                            <p className="mt-1 font-black text-[#3b2d26]">
                              {transaction.pet_name || '毛孩'}・
                              {transaction.service_name || '服務項目'}
                            </p>

                            <p className="mt-1 text-sm font-bold text-[#9c8b78]">
                              {transaction.store_name || '門市'}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-[#7b6349]">
                            <CalendarDays className="mr-1 inline h-4 w-4 text-[#b68655]" />
                            {formatDateTime(transaction.paid_at)}
                          </td>

                          <td className="px-5 py-4 text-sm font-black text-[#3b2d26]">
                            {currency(transaction.original_amount)}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-[#7b6349]">
                            {transaction.discount_points_used || 0} 點
                          </td>

                          <td className="px-5 py-4 text-sm font-black text-[#3b2d26]">
                            {currency(transaction.final_amount)}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-[#7b6349]">
                            {transaction.points_earned || 0} 點
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-[#e7d6be] bg-[#fffaf3] p-10 text-center font-bold text-[#9c8b78]">
                  目前沒有消費紀錄
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#e7d6be] bg-[#fffaf3] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#b68655]">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black text-[#9c8b78]">{label}</p>
          <p className="mt-1 text-2xl font-black text-[#3b2d26]">{value}</p>
        </div>
      </div>
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
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#e7d6be] bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#b68655] focus:bg-white focus:ring-2 focus:ring-[#ead8ba]"
      />
    </label>
  );
}