import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, PawPrint, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#e7d6be] bg-[#7b6349] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b68655] text-white">
              <PawPrint className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-black">PawNest</div>
              <div className="text-sm text-[#ead8ba]">讓每隻毛孩都被溫柔照顧</div>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#f4e9d8]">
            提供寵物美容、住宿、安親與照護回報，支援線上預約、會員寵物資料、服務進度追蹤與門市管理。
          </p>
          <div className="mt-5 flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Instagram className="h-5 w-5" /></span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Facebook className="h-5 w-5" /></span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-[#ead8ba]">快速連結</h3>
          <div className="grid gap-3 text-sm text-[#f4e9d8]">
            <Link to="/services" className="hover:text-white">服務項目</Link>
            <Link to="/stores" className="hover:text-white">門市資訊</Link>
            <Link to="/booking" className="hover:text-white">線上預約</Link>
            <Link to="/profile" className="hover:text-white">會員中心</Link>
            <Link to="/admin" className="hover:text-white">員工/管理員入口</Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-[#ead8ba]">服務特色</h3>
          <div className="grid gap-3 text-sm text-[#f4e9d8]">
            <span>美容前健康確認</span>
            <span>住宿照片回報</span>
            <span>大型犬友善空間</span>
            <span>預約進度追蹤</span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-[#ead8ba]">聯絡資訊</h3>
          <div className="grid gap-3 text-sm text-[#f4e9d8]">
            <span className="flex gap-2"><Phone className="h-4 w-4 text-[#ead8ba]" />02-2720-8899</span>
            <span className="flex gap-2"><Mail className="h-4 w-4 text-[#ead8ba]" />hello@pawnest.demo</span>
            <span className="flex gap-2"><MapPin className="h-4 w-4 text-[#ead8ba]" />台北市信義區松仁路 88 號</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-[#ead8ba]">
        © 2026 PawNest Pet Care Reservation System
      </div>
    </footer>
  );
}
