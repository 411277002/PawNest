import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { publicApi, type ActivityItem } from '../../services/api';

const COLORS = {
  cream: '#fffaf3',
  beige: '#f7efe2',
  wood: '#b68655',
  deep: '#3b2d26',
  border: '#e6d9c8',
  milkTea: '#efe0c8',
};

function period(item: ActivityItem) {
  if (item.start_date && item.end_date) return `${item.start_date.replaceAll('-', '/')}–${item.end_date.replaceAll('-', '/')}`;
  if (item.start_date) return `${item.start_date.replaceAll('-', '/')} 起`;
  return '期間限定';
}

export function ActivitiesPage() {
  const { id } = useParams();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      publicApi.activity(Number(id)).then((data) => setActivity(data.activity)).catch(() => setActivity(null)).finally(() => setLoading(false));
      return;
    }
    publicApi.activities().then((data) => setActivities(data.activities)).catch(() => setActivities([]));
  }, [id]);

  const otherActivities = useMemo(() => activities.filter((item) => item.id !== Number(id)).slice(0, 3), [activities, id]);

  if (id) {
    return (
      <div style={{ background: COLORS.beige, color: COLORS.deep }} className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link to="/activities" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-black shadow-sm transition" style={{ color: COLORS.deep, border: `1px solid ${COLORS.border}` }}><ArrowLeft className="h-4 w-4" />回活動列表</Link>
          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center font-bold" style={{ color: '#9c8b78', border: `1px solid ${COLORS.border}` }}>
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />讀取活動中...
            </div>
          ) : activity ? (
            <article className="overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 6px 20px rgba(40,30,20,0.04)' }}>
              <img src={activity.image_url} alt={activity.title} className="h-[480px] w-full object-cover" />
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-3">
                  <span className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: activity.is_banner ? COLORS.milkTea : 'white', color: COLORS.deep, border: `1px solid ${COLORS.border}` }}>{activity.category || '活動'}</span>
                  {activity.status && <span className="text-sm" style={{ color: '#8b7a6b' }}>{activity.status === 'active' ? '進行中' : '已下架'}</span>}
                </div>
                <h1 className="mt-6 text-3xl font-extrabold" style={{ color: COLORS.deep }}>{activity.title}</h1>
                <p className="mt-4 inline-flex items-center gap-2 font-semibold" style={{ color: '#8b7a6b' }}><CalendarDays className="h-5 w-5" />{period(activity)}</p>
                <p className="mt-6 whitespace-pre-line text-lg leading-8" style={{ color: '#6d5d52' }}>{activity.description}</p>
              </div>
            </article>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center font-bold" style={{ color: '#9c8b78', border: `1px solid ${COLORS.border}` }}>找不到活動資料</div>
          )}

          {otherActivities.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-5 text-2xl font-extrabold" style={{ color: COLORS.deep }}>其他活動</h2>
              <div className="grid gap-6 md:grid-cols-3">{otherActivities.map((item) => <ActivityCard key={item.id} activity={item} />)}</div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.beige, color: COLORS.deep }} className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className=" grid gap-8 md:grid-cols-2">
          {activities.map((item) => (
            <ActivityCard key={item.id} activity={item} />
          ))}
        </div>

        <section className="mx-auto mt-12 max-w-3xl rounded-2xl bg-white p-8 text-center" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="text-2xl font-extrabold" style={{ color: COLORS.deep }}>想參加或詢問活動細節？</h3>
          <p className="mt-3 text-sm" style={{ color: '#6d5d52' }}>我們的門市團隊樂意協助您安排，或直接線上預約參加。</p>
          <div className="mt-6">
            <a href="/contact" className="inline-block rounded-md px-8 py-3 text-sm font-bold text-white" style={{ background: COLORS.deep }}>聯絡門市 / 預約</a>
          </div>
        </section>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  return (
    <Link to={`/activities/${activity.id}`} className="block overflow-hidden rounded-xl bg-white transition" style={{ border: `1px solid ${COLORS.border}`, boxShadow: '0 6px 18px rgba(40,30,20,0.03)' }}>
      <div className="relative h-72 w-full overflow-hidden">
        <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" />
        <div className="absolute left-4 top-4 flex items-center gap-3">
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: activity.is_banner ? COLORS.milkTea : 'white', color: COLORS.deep, border: `1px solid ${COLORS.border}` }}>{activity.category || '活動'}</span>
          {activity.status && <span className="text-xs" style={{ color: '#8b7a6b' }}>{activity.status === 'active' ? '進行中' : '已下架'}</span>}
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-extrabold" style={{ color: COLORS.deep }}>{activity.title}</h2>
        <p className="mt-3 text-sm leading-6" style={{ color: '#6d5d52' }}>{activity.summary?.trim() || activity.description}</p>
        <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: COLORS.border }}>
          <div className="text-sm" style={{ color: '#8b7a6b' }}><CalendarDays className="inline-block h-4 w-4 mr-2" />{period(activity)}</div>
          <div>
            <span className="inline-block rounded-md px-4 py-2 text-sm font-bold text-white" style={{ background: COLORS.deep }}>了解詳情</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
