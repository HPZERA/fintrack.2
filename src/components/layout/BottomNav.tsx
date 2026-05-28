import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, Settings, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { differenceInDays, parseISO } from 'date-fns';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/pierre', icon: Sparkles, label: 'Pierre' },
  { to: '/subscriptions', icon: CreditCard, label: 'Plano' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export function BottomNav() {
  const { subscription } = useApp();
  const subDaysLeft = subscription ? differenceInDays(parseISO(subscription.renewalDate), new Date()) : null;
  const showSubAlert = subscription?.status === 'active' && subDaysLeft !== null && subDaysLeft <= 3;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6"
      style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="relative flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 py-2">
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 mx-0.5 rounded-xl bg-blue-500/10 border border-blue-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className="w-[18px] h-[18px] relative z-10 transition-colors duration-200"
                    style={{ color: isActive ? (to === '/pierre' ? '#a78bfa' : '#3b82f6') : '#475569' }}
                  />
                  {to === '/subscriptions' && showSubAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse z-20" />
                  )}
                </div>
                <span
                  className="text-[9px] font-medium relative z-10 transition-colors duration-200"
                  style={{ color: isActive ? (to === '/pierre' ? '#a78bfa' : '#3b82f6') : '#475569' }}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
