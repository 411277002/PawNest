import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

export function FloatingBookingButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Link to={isLoggedIn ? '/booking' : '/login'} className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#7b6349] px-5 py-3 font-black text-white shadow-2xl shadow-[#d9c6aa] transition hover:-translate-y-1 hover:bg-[#6a523d]">
      <CalendarCheck className="h-5 w-5" />
      <span className="hidden sm:inline">立即預約</span>
    </Link>
  );
}
