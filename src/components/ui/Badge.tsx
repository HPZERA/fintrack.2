import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'green' | 'red' | 'blue' | 'gold' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  gold: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  gray: 'bg-white/5 text-slate-400 border-white/10',
};

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({ children, variant = 'gray', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium rounded-full border', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
