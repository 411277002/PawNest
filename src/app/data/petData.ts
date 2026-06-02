import { Bath, BedDouble, Bone, Calendar, Camera, HeartPulse, Scissors, ShieldCheck, Sparkles } from 'lucide-react';

export type ServiceCategory = '美容' | '住宿' | '安親' | '加購';

export const services = [
  {
    id: 'groom-basic',
    category: '美容' as ServiceCategory,
    name: '基礎洗護美容',
    tagline: '溫和清潔、梳毛整理與日常保養',
    price: 800,
    priceLabel: 'NT$800 起',
    duration: '60 分鐘',
    icon: Bath,
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=900&auto=format&fit=crop',
    features: ['溫和洗毛精', '耳朵清潔', '指甲修剪', '足底毛整理'],
    popular: false,
  },
  {
    id: 'groom-style',
    category: '美容' as ServiceCategory,
    name: '精緻造型修剪',
    tagline: '依毛孩體型與個性打造清爽造型',
    price: 1600,
    priceLabel: 'NT$1,600 起',
    duration: '90–120 分鐘',
    icon: Scissors,
    image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=900&auto=format&fit=crop',
    features: ['造型諮詢', '全身修剪', '保濕護毛', '完成照拍攝'],
    popular: true,
  },
  {
    id: 'stay-comfort',
    category: '住宿' as ServiceCategory,
    name: '安心住宿房',
    tagline: '獨立休息空間與每日照護回報',
    price: 900,
    priceLabel: 'NT$900 / 晚',
    duration: '每日',
    icon: BedDouble,
    image: 'https://images.unsplash.com/photo-1601758177266-bc599de87707?w=900&auto=format&fit=crop',
    features: ['獨立休息區', '早晚散步', '照片回報', '餵食紀錄'],
    popular: true,
  },
  {
    id: 'stay-vip',
    category: '住宿' as ServiceCategory,
    name: 'VIP 舒壓套房',
    tagline: '適合敏感、長住或需要安靜環境的毛孩',
    price: 1500,
    priceLabel: 'NT$1,500 / 晚',
    duration: '每日',
    icon: ShieldCheck,
    image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=900&auto=format&fit=crop',
    features: ['大坪數套房', '舒壓香氛', '專屬照護員', '即時狀態回報'],
    popular: false,
  },
  {
    id: 'daycare',
    category: '安親' as ServiceCategory,
    name: '日間安親陪伴',
    tagline: '上班與短暫外出時的安心陪伴',
    price: 250,
    priceLabel: 'NT$250 / 小時',
    duration: '每小時',
    icon: Bone,
    image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=900&auto=format&fit=crop',
    features: ['分區活動', '遊戲陪伴', '喝水提醒', '異常即時通知'],
    popular: false,
  },
  {
    id: 'spa',
    category: '加購' as ServiceCategory,
    name: '舒敏 SPA 護理',
    tagline: '皮膚敏感與換季保養的加強護理',
    price: 500,
    priceLabel: 'NT$500 起',
    duration: '30 分鐘',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&auto=format&fit=crop',
    features: ['泥膜舒敏', '保濕護理', '毛髮柔順', '香氛放鬆'],
    popular: false,
  },
];

export const activities = [
  {
    id: 'spring-grooming',
    title: '春季美容 88 折',
    desc: '指定美容服務享 88 折，適合換季整理毛髮與皮膚保養。',
    date: '2026/05/01–2026/05/31',
    tag: '美容優惠',
    image: 'https://images.unsplash.com/photo-1601758063541-d2f50b4aafb2?w=1000&auto=format&fit=crop',
  },
  {
    id: 'boarding-gift',
    title: '住宿買三送一',
    desc: '連續住宿滿三晚，加贈一晚安心房，適合旅行與出差安排。',
    date: '2026/05/10–2026/06/15',
    tag: '住宿優惠',
    image: 'https://images.unsplash.com/photo-1537151672256-6caf2e9f8c95?w=1000&auto=format&fit=crop',
  },
  {
    id: 'new-member',
    title: '新會員首約禮',
    desc: '首次完成線上預約，加贈舒敏 SPA 小護理一次。',
    date: '即日起',
    tag: '會員限定',
    image: 'https://images.unsplash.com/photo-1558944351-c7340b2e8678?w=1000&auto=format&fit=crop',
  },
  {
    id: 'cat-daycare',
    title: '貓咪安親體驗日',
    desc: '貓咪專區半日安親體驗價，提供安靜分區與照護回報。',
    date: '每週二、四',
    tag: '貓咪專區',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&auto=format&fit=crop',
  },
];

export const stores = [
  { id: 'taipei-xinyi', name: '台北信義旗艦店', area: '台北市', address: '台北市信義區松仁路 88 號', phone: '02-2720-8899', hours: '10:00–21:00', tags: ['大型犬友善', '住宿房型多', '捷運 5 分鐘'], availability: '今日剩 4 個時段' },
  { id: 'taipei-zhongshan', name: '台北中山生活店', area: '台北市', address: '台北市中山區南京東路二段 120 號', phone: '02-2508-1688', hours: '09:30–20:30', tags: ['貓咪專區', '玻璃美容室', '停車方便'], availability: '明日可預約' },
  { id: 'newtaipei-banqiao', name: '新北板橋舒心店', area: '新北市', address: '新北市板橋區文化路一段 188 號', phone: '02-2255-2266', hours: '10:00–20:00', tags: ['安親空間', '住宿回報', '新手毛孩友善'], availability: '今日剩 2 個時段' },
];

export const reviews = [
  { name: '林小姐', pet: '布丁', service: '精緻造型修剪', rating: 5, date: '2026-04-28', comment: '美容師會先詢問毛孩個性與皮膚狀況，完成後還有照片紀錄，整體很安心。' },
  { name: '陳先生', pet: 'Coffee', service: '安心住宿房', rating: 5, date: '2026-04-21', comment: '住宿期間每天都有回報吃飯、散步和精神狀況，出差時放心很多。' },
  { name: '黃小姐', pet: '麻糬', service: '基礎洗護美容', rating: 5, date: '2026-04-12', comment: '環境乾淨，麻糬以前很怕洗澡，這次回家看起來很放鬆，會再預約。' },
  { name: '王先生', pet: 'Luna', service: '日間安親陪伴', rating: 4, date: '2026-03-30', comment: '臨時外出很方便，系統可以看到進度，也很喜歡照護人員的細心說明。' },
];

export const pets = [
  { id: 'pet-1', name: '小白', breed: '柴犬', age: '3 歲', note: '怕吹風機，需慢慢安撫', avatar: '🐕', photoUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop' },
  { id: 'pet-2', name: '咪咪', breed: '貴賓犬', age: '2 歲', note: '皮膚偏敏感，使用低敏洗劑', avatar: '🐩', photoUrl: 'https://images.unsplash.com/photo-1601758063541-d2f50b4aafb2?w=900&auto=format&fit=crop' },
  { id: 'pet-3', name: '奶茶', breed: '英短', age: '5 歲', note: '貓咪專區，不與狗狗混區', avatar: '🐈', photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&auto=format&fit=crop' },
];

export const bookingHistory = [
  { id: 'B202605001', pet: '小白', service: '精緻造型修剪', store: '台北信義旗艦店', date: '2026-05-14', time: '10:30', status: '已確認', groomer: '張美美', price: 'NT$1,600', progress: ['預約成立', '到店報到', '健康檢查', '洗護美容', '完成拍照', '等待接回'], currentStep: 1 },
  { id: 'B202604156', pet: '咪咪', service: '基礎洗護美容', store: '台北中山生活店', date: '2026-04-18', time: '15:00', status: '已完成', groomer: '陳師傅', price: 'NT$900', progress: ['預約成立', '到店報到', '健康檢查', '洗護美容', '完成拍照', '完成交付'], currentStep: 5 },
];

export const serviceFlow = [
  { icon: Calendar, title: '線上選時段', text: '選擇毛孩、服務、門市與日期時段。' },
  { icon: HeartPulse, title: '到店健康確認', text: '確認皮膚、情緒與特殊照護需求。' },
  { icon: Scissors, title: '服務進行中', text: '美容或住宿進度可於會員中心查看。' },
  { icon: Camera, title: '完成回報', text: '提供照片、注意事項與下次保養建議。' },
];
