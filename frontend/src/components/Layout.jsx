import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, MessageSquare, Users, FileText,
  BarChart3, Settings, LogOut, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chats', icon: MessageSquare, label: 'Chats' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children, title }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* ─── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col shrink-0 z-20">
        
        {/* Brand Header */}
        <div className="h-[72px] px-6 flex items-center gap-3 border-b border-gray-100 shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-600">
            💬
          </div>
          <div>
            <h2 className="font-semibold text-[15px] leading-tight text-gray-900">EngageAI</h2>
            <span className="text-[11px] text-gray-500 font-medium">Admin Dashboard</span>
          </div>
        </div>

        {/* User Profile Selector (Optional/Premium Touch) */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-xl p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[12px] font-semibold text-gray-700 truncate">{admin?.name || 'Admin'}</span>
                <span className="text-[10px] text-gray-400 capitalize truncate">{admin?.role || 'Super Admin'}</span>
              </div>
            </div>
            <div className="flex flex-col text-gray-400 shrink-0">
              <ChevronUp size={12} className="-mb-1" />
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-1 custom-scrollbar">
          <div className="px-3 py-2 mt-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Main Menu</span>
          </div>
          
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                ${isActive 
                  ? 'bg-gray-50 text-indigo-600 font-medium shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <Icon size={18} />
              <span className="text-[13.5px]">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN WRAPPER ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Topbar */}
        <header className="h-[72px] px-8 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 z-10">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h1>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <Zap size={14} className="text-indigo-600 fill-indigo-600/20" />
            <span className="text-xs font-semibold text-indigo-600">Powered by Groq AI</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}