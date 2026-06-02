import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  CalendarCheck,
  LogOut,
  Menu,
  PawPrint,
  User,
  X,
} from 'lucide-react';
import { getStoredUser } from '../../services/api';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const links = [
  { to: '/', label: '首頁' },
  { to: '/activities', label: '活動' },
  { to: '/services', label: '服務' },
  { to: '/stores', label: '門市' },
  { to: '/reviews', label: '評價' },
  { to: '/contact', label: '聯絡' },
];

export function Header({ isLoggedIn, onLogout }: HeaderProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);

  const user = useMemo(() => getStoredUser(), [isLoggedIn]);
  const displayName = user?.name || user?.username || '會員';

  const closeMenus = () => {
    setMobileOpen(false);
    setMemberMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    onLogout();
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-black transition-all ${
      isHome
        ? isActive
          ? 'bg-white text-[#3b2d26] shadow-sm'
          : 'text-white/85 hover:bg-white/15 hover:text-white'
        : isActive
          ? 'bg-[#3b2d26] text-white shadow-sm'
          : 'text-[#7b6349] hover:bg-[#f7efe2] hover:text-[#3b2d26]'
    }`;

  return (
    <header
      className={`left-0 right-0 top-0 z-50 px-4 sm:px-6 lg:px-8 ${
        isHome ? 'fixed pt-5' : 'sticky bg-[#f7efe2] py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className={`flex h-16 items-center justify-between rounded-full border px-4 shadow-[0_18px_55px_rgba(47,36,31,0.12)] backdrop-blur-2xl transition-all ${
            isHome
              ? 'border-white/25 bg-[#3b2d26]/42'
              : 'border-[#ead8ba] bg-[#fffaf3]/92'
          }`}
        >
          <Link
            to="/"
            onClick={closeMenus}
            className="group flex items-center gap-3"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-full shadow-sm transition group-hover:scale-105 ${
                isHome
                  ? 'bg-white text-[#3b2d26]'
                  : 'bg-[#3b2d26] text-white'
              }`}
            >
              <PawPrint className="h-5 w-5" />
            </div>

            <div className="hidden leading-tight sm:block">
              <div
                className={`text-base font-black tracking-tight ${
                  isHome ? 'text-white' : 'text-[#3b2d26]'
                }`}
              >
                PawNest
              </div>

              <div
                className={`text-[11px] font-bold tracking-wide ${
                  isHome ? 'text-white/65' : 'text-[#9c8b78]'
                }`}
              >
                Pet Care & Stay
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMemberMenuOpen((value) => !value)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
                    isHome
                      ? 'bg-white text-[#3b2d26] hover:bg-[#fffaf3]'
                      : 'border border-[#ead8ba] bg-white text-[#3b2d26] hover:bg-[#fffaf3]'
                  }`}
                  aria-label="會員選單"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[88px] truncate">{displayName}</span>
                </button>

                {memberMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-[1.5rem] border border-[#e7d6be] bg-white p-2 shadow-2xl shadow-[#3b2d26]/20">
                    <MenuLink
                      to="/profile"
                      icon={<User className="h-4 w-4" />}
                      label="會員中心"
                      close={() => setMemberMenuOpen(false)}
                    />

                    <MenuLink
                      to="/pets"
                      icon={<PawPrint className="h-4 w-4" />}
                      label="寵物資料"
                      close={() => setMemberMenuOpen(false)}
                    />

                    <MenuLink
                      to="/my-bookings"
                      icon={<CalendarCheck className="h-4 w-4" />}
                      label="我的預約"
                      close={() => setMemberMenuOpen(false)}
                    />

                    <div className="my-2 h-px bg-[#f1e6d6]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-[#9a5c50] transition hover:bg-[#fff1ec]"
                    >
                      <LogOut className="h-4 w-4" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
                  isHome
                    ? 'bg-white text-[#3b2d26] hover:bg-[#fffaf3]'
                    : 'bg-[#3b2d26] text-white hover:bg-[#7b6349]'
                }`}
              >
                登入
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className={`grid h-10 w-10 cursor-pointer place-items-center rounded-full shadow-sm md:hidden ${
              isHome
                ? 'bg-white text-[#3b2d26]'
                : 'border border-[#ead8ba] bg-white text-[#3b2d26]'
            }`}
            aria-label="開啟選單"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div
            className={`mt-3 overflow-hidden rounded-[1.5rem] border p-3 shadow-2xl backdrop-blur-2xl md:hidden ${
              isHome
                ? 'border-white/25 bg-[#3b2d26]/88 shadow-[#3b2d26]/25'
                : 'border-[#ead8ba] bg-[#fffaf3]/96 shadow-[#ead8ba]/40'
            }`}
          >
            <div className="grid gap-2">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              <div
                className={`my-2 h-px ${
                  isHome ? 'bg-white/15' : 'bg-[#ead8ba]'
                }`}
              />

              {isLoggedIn ? (
                <>
                  <MobileLink
                    to="/profile"
                    isHome={isHome}
                    onClick={() => setMobileOpen(false)}
                  >
                    會員中心
                  </MobileLink>

                  <MobileLink
                    to="/pets"
                    isHome={isHome}
                    onClick={() => setMobileOpen(false)}
                  >
                    寵物資料
                  </MobileLink>

                  <MobileLink
                    to="/my-bookings"
                    isHome={isHome}
                    onClick={() => setMobileOpen(false)}
                  >
                    我的預約
                  </MobileLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`rounded-2xl px-4 py-3 font-black ${
                      isHome
                        ? 'bg-white text-[#3b2d26]'
                        : 'bg-[#3b2d26] text-white'
                    }`}
                  >
                    登出
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-center font-black ${
                    isHome
                      ? 'bg-white text-[#3b2d26]'
                      : 'bg-[#3b2d26] text-white'
                  }`}
                >
                  登入會員
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuLink({
  to,
  icon,
  label,
  close,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  close: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={close}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[#4f4032] transition hover:bg-[#fffaf3]"
    >
      <span className="text-[#b68655]">{icon}</span>
      {label}
    </Link>
  );
}

function MobileLink({
  to,
  isHome,
  onClick,
  children,
}: {
  to: string;
  isHome: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 font-black transition ${
        isHome
          ? 'text-white/90 hover:bg-white/15'
          : 'text-[#7b6349] hover:bg-white'
      }`}
    >
      {children}
    </Link>
  );
}