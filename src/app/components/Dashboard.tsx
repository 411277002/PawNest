import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  PawPrint,
  Users,
} from 'lucide-react';
import { apiFetch } from '../services/api';

type DashboardData = {
  stats: {
    todayBookings: number;
    members: number;
    pets: number;
    pending: number;
  };
  recentBookings: Array<{
    id: number;
    booking_date: string;
    start_time: string;
    status: string;
    customer_name: string;
    pet_name: string;
    service_name: string;
  }>;
};

const statusLabels: Record<string, string> = {
  pending: '待確認',
  confirmed: '已確認',
  checked_in: '已報到',
  in_service: '進行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-[#fff4da] text-[#9a744f]',
  confirmed: 'bg-[#f7efe2] text-[#7b6349]',
  checked_in: 'bg-[#fffaf3] text-[#7b6349]',
  in_service: 'bg-[#ead8ba] text-[#4f4032]',
  completed: 'bg-[#e8f3df] text-[#5f7f4f]',
  cancelled: 'bg-[#fff1ec] text-[#9a5c50]',
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const stats = [
    {
      label: '今日預約',
      value: data?.stats.todayBookings ?? 0,
      icon: Calendar,
      hint: 'Today bookings',
    },
    {
      label: '會員數',
      value: data?.stats.members ?? 0,
      icon: Users,
      hint: 'Members',
    },
    {
      label: '毛孩資料',
      value: data?.stats.pets ?? 0,
      icon: PawPrint,
      hint: 'Pet profiles',
    },
    {
      label: '待確認',
      value: data?.stats.pending ?? 0,
      icon: Clock,
      hint: 'Pending requests',
    },
  ];

  return (
    <div className="space-y-8 text-[#4f4032]">
      {/* Stats */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="group rounded-[1.75rem] border border-[#e7d6be] bg-white p-6 shadow-sm shadow-[#ead8ba]/40 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-[#7b6349]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#9c8b78]">
                    {stat.hint}
                  </p>
                </div>

                <div className="grid h-13 w-13 place-items-center rounded-2xl bg-[#fffaf3] text-[#b68655] transition">
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <p className="text-4xl font-black tracking-tight text-[#3b2d26]">
                {stat.value}
              </p>
            </article>
          );
        })}
      </section>

      {/* Recent bookings */}
      <section className="overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm shadow-[#ead8ba]/40">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ead8ba] bg-[#fffaf3] px-6 py-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b68655]">
              Recent bookings
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#3b2d26]">
              最近預約
            </h2>
          </div>
        </div>

        {data?.recentBookings?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-[#fffaf3] text-left text-xs font-black uppercase tracking-[0.12em] text-[#9c8b78]">
                  <th className="px-6 py-4">毛孩 / 服務</th>
                  <th className="px-6 py-4">會員</th>
                  <th className="px-6 py-4">日期</th>
                  <th className="px-6 py-4">時間</th>
                  <th className="px-6 py-4 text-right">狀態</th>
                </tr>
              </thead>

              <tbody>
                {data.recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-t border-[#f1e6d6] transition hover:bg-[#fffaf3]"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f7efe2] text-[#b68655]">
                          <PawPrint className="h-6 w-6" />
                        </div>

                        <div>
                          <p className="font-black text-[#3b2d26]">
                            {booking.pet_name}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#7b6349]">
                            {booking.service_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm font-bold text-[#4f4032]">
                      {booking.customer_name}
                    </td>

                    <td className="px-6 py-5 text-sm font-bold text-[#7b6349]">
                      {booking.booking_date}
                    </td>

                    <td className="px-6 py-5 text-sm font-bold text-[#7b6349]">
                      {String(booking.start_time).slice(0, 5)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-xs font-black ${
                          statusStyles[booking.status] ||
                          'bg-[#f7efe2] text-[#7b6349]'
                        }`}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#fffaf3] text-[#b68655]">
              <Calendar className="h-8 w-8" />
            </div>
            <p className="mt-5 font-black text-[#9c8b78]">
              目前沒有預約資料
            </p>
          </div>
        )}
      </section>
    </div>
  );
}