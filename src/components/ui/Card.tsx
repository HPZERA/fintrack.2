import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'green' | 'red' | 'blue' | 'gold' | 'none';
}

const glowMap = {
  green: 'shadow-[0_0_30px_rgba(0,230,118,0.12),0_0_1px_rgba(0,230,118,0.3)]',
  red: 'shadow-[0_0_30px_rgba(255,90,95,0.12),0_0_1px_rgba(255,90,95,0.3)]',
  blue: 'shadow-[0_0_30px_rgba(59,130,246,0.12),0_0_1px_rgba(59,130,246,0.3)]',
  gold: 'shadow-[0_0_30px_rgba(245,158,11,0.12),0_0_1px_rgba(245,158,11,0.3)]',
  none: '',
};

export function Card({ children, className, onClick, glow = 'none' }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      className={cn(
        'rounded-2xl border border-white/[0.07] transition-all duration-200',
        'bg-[rgba(15,23,42,0.6)]',
        onClick && 'cursor-pointer hover:border-white/[0.12] hover:-translate-y-0.5 hover:bg-[rgba(15,23,42,0.75)] hover:shadow-lg',
        glow !== 'none' && glowMap[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
