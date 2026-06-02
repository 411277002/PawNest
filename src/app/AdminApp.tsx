import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearAuth, getStoredUser } from './services/api';
import {
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  PawPrint,
  Search,
  Sparkles,
} from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AppointmentsManagement } from './components/AppointmentsManagement';
import { MembersManagement } from './components/MembersManagement';
import { ServicesManagement } from './components/ServicesManagement';
import { ActivitiesManagement } from './components/ActivitiesManagement';
import { StoresManagement } from './components/StoresManagement';
import { MessagesManagement } from './components/MessagesManagement';
import { ServiceProgress } from './components/ServiceProgress';
import { ContactMessagesManagement } from './components/ContactMessagesManagement';

type AdminRole = 'admin' | 'staff';

const adminRoles = ['admin', 'staff', 'groomer', 'reception'];

function isAdminUser(role?: string) {
  return adminRoles.includes(role || '');
}

function getDisplayRole(role: AdminRole) {
  return role === 'admin' ? '管理員' : '美容師 / 員工';
}

export default function AdminApp() {
  const storedUser = getStoredUser('admin');
  const initialAdminLoggedIn = storedUser
    ? isAdminUser(storedUser.role)
    : false;

  const [isLoggedIn, setIsLoggedIn] = useState(initialAdminLoggedIn);
  const [userRole, setUserRole] = useState<AdminRole>(
    storedUser?.role === 'admin' ? 'admin' : 'staff',
  );
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const pageTitles: Record<string, string> = {
    dashboard: '營運總覽',
    appointments: userRole === 'admin' ? '預約管理' : '今日預約',
    members: '會員與毛孩',
    services: '服務項目',
    activities: '活動管理',
    stores: '門市資訊',
    messages: '訊息與評論',
    contactMessages: '聯絡留言',
    progress: '服務進度',
  };

  const handleLogin = (role: AdminRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    setAccountMenuOpen(false);
  };

  const handleLogout = () => {
    clearAuth('admin');

    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setIsLoggedIn(false);
    setActiveTab('dashboard');
    setAccountMenuOpen(false);
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const sync = () => {
      const user = getStoredUser('admin');
      const ok = user ? isAdminUser(user.role) : false;

      setIsLoggedIn(ok);

      if (ok) {
        setUserRole(user?.role === 'admin' ? 'admin' : 'staff');
      }
    };

    window.addEventListener('pawnest-auth-change', sync);

    return () => {
      window.removeEventListener('pawnest-auth-change', sync);
    };
  }, []);

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;

      case 'appointments':
        return <AppointmentsManagement role={userRole} />;

      case 'members':
        return <MembersManagement role={userRole} />;

      case 'services':
        return <ServicesManagement />;

      case 'activities':
        return <ActivitiesManagement />;

      case 'stores':
        return <StoresManagement />;

      case 'messages':
        return <MessagesManagement />;

      case 'contactMessages':
        return <ContactMessagesManagement />;

      case 'progress':
        return <ServiceProgress />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7efe2] text-[#4f4032]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(217,185,143,0.38),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(246,217,200,0.38),transparent_30%),linear-gradient(180deg,#f7efe2_0%,#fffaf3_45%,#f7efe2_100%)]" />

      <div className="flex min-h-screen">
        <Sidebar
          role={userRole}
          activeTab={activeTab}
          onTabChange={changeTab}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {sidebarOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            aria-label="關閉選單"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <section className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-[#e7d6be]/80 bg-white/90 px-4 py-4 shadow-sm shadow-[#ead8ba]/40 backdrop-blur-xl sm:px-5 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e7d6be] bg-white text-[#7b6349] shadow-sm lg:hidden"
                  aria-label="開啟後台選單"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#b68655]">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">PawNest Staff Console</span>
                  </div>

                  <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-[#4f4032] md:text-3xl">
                    {pageTitles[activeTab]}
                  </h1>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 self-center items-center justify-end gap-3">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((value) => !value)}
                    className="flex items-center gap-3 rounded-full border border-[#e7d6be] bg-white py-1 pl-1 pr-4 shadow-sm transition hover:bg-[#fffaf3]"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#b68655] via-[#d9b98f] to-[#c99787] text-white">
                      <PawPrint className="h-5 w-5" />
                    </div>

                    <div className="hidden text-left leading-tight sm:block">
                      <div className="text-sm font-bold text-[#4f4032]">
                        {getDisplayRole(userRole)}
                      </div>
                      <div className="text-xs text-[#9c8b78]">
                        已登入後台
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-[#7b6349] transition ${
                        accountMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-3xl border border-[#e7d6be] bg-white p-2 shadow-xl shadow-[#ead8ba]/60">
                      <Link
                        to="/"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[#7b6349] transition hover:bg-[#fffaf3]"
                      >
                        <Home className="h-4 w-4 text-[#b68655]" />
                        回到前台
                      </Link>

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
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderContent()}
          </main>
        </section>
      </div>
    </div>
  );
}