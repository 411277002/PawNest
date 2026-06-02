import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { publicApi, type ActivityItem } from '../../services/api';

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
      <div className="bg-[#f7efe2] py-12 text-[#4f4032]"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link to="/activities" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-black text-[#7b6349] shadow-sm transition hover:bg-[#fffaf3]"><ArrowLeft className="h-4 w-4" />回活動列表</Link>
        {loading ? <div className="rounded-3xl bg-white p-10 text-center font-bold text-[#9c8b78]"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />讀取活動中...</div> : activity ? (
          <article className="overflow-hidden rounded-[2.5rem] border border-[#e7d6be] bg-white shadow-sm">
            <img src={activity.image_url} alt={activity.title} className="h-[420px] w-full object-cover" />
            <div className="p-8 md:p-12"><span className="rounded-full bg-[#ead8ba] px-4 py-2 text-xs font-black text-[#7b6349]">{activity.category || '活動'}</span><h1 className="mt-6 text-4xl font-black md:text-5xl">{activity.title}</h1><p className="mt-5 inline-flex items-center gap-2 font-bold text-[#9c8b78]"><CalendarDays className="h-5 w-5" />{period(activity)}</p><p className="mt-6 whitespace-pre-line text-lg leading-9 text-[#7b6349]">{activity.description}</p></div>
          </article>
        ) : <div className="rounded-3xl bg-white p-10 text-center font-bold text-[#9c8b78]">找不到活動資料</div>}
        {otherActivities.length > 0 && <section className="mt-10"><h2 className="mb-5 text-2xl font-black">其他活動</h2><div className="grid gap-5 md:grid-cols-3">{otherActivities.map((item) => <ActivityCard key={item.id} activity={item} />)}</div></section>}
      </div></div>
    );
  }

  return (
    <div className="bg-[#f7efe2] py-12 text-[#4f4032]"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="rounded-[2.5rem] border border-[#e7d6be] bg-white/80 p-8 shadow-sm md:p-12"><p className="font-black tracking-[0.22em] text-[#b68655]">ACTIVITIES</p><h1 className="mt-3 text-4xl font-black md:text-5xl">活動資訊</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#7b6349]">點擊活動卡片可以查看詳細內容、活動期間與相關說明。</p></section>
      <div className="mt-8 grid gap-6 md:grid-cols-2">{activities.map((item) => <ActivityCard key={item.id} activity={item} />)}</div>
    </div></div>
  );
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  return <Link to={`/activities/${activity.id}`} className="block overflow-hidden rounded-[2rem] border border-[#e7d6be] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#e7d6be]/60"><img src={activity.image_url} alt={activity.title} className="h-64 w-full object-cover" /><div className="p-6"><span className="rounded-full bg-[#ead8ba] px-4 py-2 text-xs font-black text-[#7b6349]">{activity.category}</span><h2 className="mt-5 text-2xl font-black">{activity.title}</h2><p className="mt-3 line-clamp-3 leading-7 text-[#7b6349]">{activity.summary?.trim() || activity.description}</p><p className="mt-5 inline-flex items-center gap-2 font-bold text-[#9c8b78]"><CalendarDays className="h-5 w-5" />{period(activity)}</p></div></Link>;
}
