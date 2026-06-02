import {
  Activity,
  Calendar,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PawPrint,
  Scissors,
  Settings,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'staff';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  role,
  activeTab,
  onTabChange,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const adminMenuItems = [
    { id: 'dashboard', label: '營運總覽', icon: LayoutDashboard },
    { id: 'appointments', label: '預約管理', icon: Calendar },
    { id: 'progress', label: '服務進度', icon: Settings },
    { id: 'activities', label: '活動管理', icon: Activity },
    { id: 'services', label: '服務項目', icon: Scissors },
    { id: 'stores', label: '門市資訊', icon: Store },
    { id: 'members', label: '會員與毛孩', icon: Users },
    { id: 'messages', label: '訊息與評論', icon: MessageSquare },
    { id: 'contactMessages', label: '聯絡留言', icon: Mail },
  ];

  const staffMenuItems = [
    { id: 'dashboard', label: '今日工作台', icon: LayoutDashboard },
    { id: 'appointments', label: '預約查詢', icon: Calendar },
    { id: 'progress', label: '服務進度', icon: Settings },
    { id: 'members', label: '會員與毛孩', icon: Users },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : staffMenuItems;

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    onClose?.();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col border-r border-[#e7d6be] bg-white shadow-2xl shadow-[#ead8ba]/40 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-13 w-13 place-items-center rounded-[1.35rem] bg-[#b68655] text-white shadow-lg shadow-[#ead8ba]">
            <PawPrint className="h-6 w-6" />
            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-[#fff4da]" />
          </div>

          <div>
            <div className="text-xl font-black tracking-tight text-[#3b2d26]">
              PawNest
            </div>
            <div className="mt-0.5 text-xs font-bold tracking-[0.12em] text-[#b68655]">
              後台管理中心
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#e7d6be] bg-white text-[#7b6349] transition hover:bg-[#fffaf3] lg:hidden"
          aria-label="關閉選單"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-5 pt-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left text-base font-black transition-all ${
                isActive
                  ? 'bg-[#7b6349] text-white shadow-lg shadow-[#ead8ba]/60'
                  : 'text-[#7b6349] hover:bg-[#fffaf3] hover:text-[#3b2d26]'
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-[#fffaf3] text-[#b68655] group-hover:bg-white group-hover:text-[#7b6349]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}