import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, FileText, FolderOpen,
  Target, Dice5, Settings, TrendingUp, LogOut, CreditCard, Sparkles,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/extract', icon: FileText, label: 'Extrato' },
  { to: '/categories', icon: FolderOpen, label: 'Categorias' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/bankroll', icon: Dice5, label: 'Banca' },
  { to: '/pierre', icon: Sparkles, label: 'Pierre AI', accent: true },
];

export function Sidebar() {
  const { user, logout, subscription } = useApp();
  const subDaysLeft = subscription ? differenceInDays(parseISO(subscription.renewalDate), new Date()) : null;
  const showSubAlert = subscription?.status === 'active' && subDaysLeft !== null && subDaysLeft <= 3;

  return (
    <aside
      className="hidden md:flex flex-col w-64 border-r border-white/6 h-screen sticky top-0"
      style={{ background: 'rgba(10,10,15,0.98)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100">FinTrack</p>
          <p className="text-[10px] text-slate-500">Gestão Financeira</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, accent }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? accent
                      ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className={`ml-auto w-1.5 h-1.5 rounded-full ${accent ? 'bg-violet-400' : 'bg-blue-400'}`}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/6 space-y-1">
        <NavLink to="/subscriptions">
          {({ isActive }) => (
            <motion.div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Assinatura</span>
              {showSubAlert && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </motion.div>
          )}
        </NavLink>
        <NavLink to="/settings">
          {({ isActive }) => (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'}`}>
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Configurações</span>
            </div>
          )}
        </NavLink>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-slate-600 hover:text-red-400 transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
