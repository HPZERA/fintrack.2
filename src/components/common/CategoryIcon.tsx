import {
  Briefcase, Laptop, TrendingUp, Utensils, Car, Gamepad2, CircleDot,
  Home, HeartPulse, Tag, Plane, Shield, DollarSign, ShoppingCart,
  Coffee, Dumbbell, BookOpen, Music, Gift, Zap, Wifi, Phone,
  Dice5, Wallet, PiggyBank, BarChart2, Star,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  utensils: Utensils,
  car: Car,
  'gamepad-2': Gamepad2,
  'circle-dot': CircleDot,
  home: Home,
  'heart-pulse': HeartPulse,
  tag: Tag,
  plane: Plane,
  shield: Shield,
  'dollar-sign': DollarSign,
  'shopping-cart': ShoppingCart,
  coffee: Coffee,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  music: Music,
  gift: Gift,
  zap: Zap,
  wifi: Wifi,
  phone: Phone,
  'dice-5': Dice5,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'bar-chart-2': BarChart2,
  star: Star,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

export function CategoryIcon({ icon, color = '#3b82f6', size = 'md', className }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] || Tag;
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center flex-shrink-0 ${className || ''}`}
      style={{ background: `${color}20`, border: `1px solid ${color}30` }}
    >
      <Icon className={iconSizes[size]} style={{ color }} />
    </div>
  );
}
