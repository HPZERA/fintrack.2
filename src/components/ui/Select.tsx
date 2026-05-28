import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full h-11 rounded-xl px-3 py-2 text-sm border transition-all duration-200',
            'focus:outline-none focus:border-blue-500/50',
            'appearance-none cursor-pointer',
            error && 'border-red-500/50',
            className
          )}
          style={{ background: 'rgba(255,255,255,0.04)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' }}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#13131f', color: '#f1f5f9' }}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
