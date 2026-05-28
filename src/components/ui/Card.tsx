import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'green' | 'red' | 'blue' | 'gold' | 'none';
}

const glowMap = {
  green: 'shadow-[0_0_30px_rgba(0,210,106,0.1)]',
  red: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]',
  blue: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
  gold: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]',
  none: '',
};

export function Card({ children, className, onClick, glow = 'none' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-white/6 transition-all duration-200',
        'bg-[rgba(255,255,255,0.03)]',
        onClick && 'cursor-pointer hover:border-white/10 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]',
        glow !== 'none' && glowMap[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
