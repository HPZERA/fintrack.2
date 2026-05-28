import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { subDays, subMonths, subYears, parseISO, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDateFull } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { EmptyState } from '@/components/common/EmptyState';

type Period = 'today' | '7days' | '30days' | '3months' | '6months' | '1year' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: '7 dias' },
  { value: '30days', label: '30 dias' },
  { value: '3months', label: '3 meses' },
  { value: '6months', label: '6 meses' },
  { value: '1year', label: '1 ano' },
];

function getPeriodRange(period: Period, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case '7days': return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case '30days': return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case '3months': return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
    case '6months': return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
    case '1year': return { start: startOfDay(subYears(now, 1)), end: endOfDay(now) };
    case 'custom':
      return {
        start: customStart ? startOfDay(parseISO(customStart)) : startOfDay(subDays(now, 30)),
        end: customEnd ? endOfDay(parseISO(customEnd)) : endOfDay(now),
      };
  }
}

export function ExtractPage() {
  const { transactions, categories } = useApp();
  const [period, setPeriod] = useState<Period>('30days');
  const [search, setSearch] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const { start, end } = getPeriodRange(period, customStart, customEnd);

  const filtered = useMemo(() => {
    let list = transactions.filter(t => {
      try {
        return isWithinInterval(parseISO(t.date), { start, end });
      } catch { return false; }
    });
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, start, end, search, categories]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Group by date
  const grouped = paged.reduce<Record<string, typeof paged>>((acc, t) => {
    const key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="px-4 pt-6 pb-4 md:px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Extrato</h1>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-3">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => { setPeriod(p.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${period === p.value ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              style={period === p.value
                ? { background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => { setPeriod('custom'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all flex items-center gap-1 ${period === 'custom' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            style={period === 'custom'
              ? { background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            <Calendar className="w-3 h-3" /> Personalizado
          </button>
        </div>

        {period === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-3 mb-3"
          >
            <Input label="De" type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <Input label="Até" type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </motion.div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,210,106,0.08)', border: '1px solid rgba(0,210,106,0.15)' }}>
            <p className="text-[9px] text-emerald-500 uppercase tracking-wider mb-0.5">Entradas</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[9px] text-red-500 uppercase tracking-wider mb-0.5">Saídas</p>
            <p className="text-sm font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{
            background: balance >= 0 ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${balance >= 0 ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)'}`,
          }}>
            <p className="text-[9px] text-blue-500 uppercase tracking-wider mb-0.5">Saldo</p>
            <p className={`text-sm font-bold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Buscar no extrato..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4 md:px-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma movimentação"
            description="Não há transações no período selecionado."
          />
        ) : (
          <>
            {Object.entries(grouped).map(([date, txns]) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-400">
                    {formatDateFull(date)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {txns.length} transaç{txns.length !== 1 ? 'ões' : 'ão'}
                  </p>
                </div>
                <Card>
                  {txns.map((t, i) => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i < txns.length - 1 ? 'border-b border-white/4' : ''}`}
                      >
                        <CategoryIcon icon={cat?.icon || 'tag'} color={cat?.color || '#475569'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{t.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-slate-500">{cat?.name || 'Sem categoria'}</p>
                            {t.paymentMethod && (
                              <>
                                <span className="text-slate-600 text-[10px]">·</span>
                                <p className="text-[10px] text-slate-500">{t.paymentMethod.replace('_', ' ')}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                          {t.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5 max-w-[120px] truncate">{t.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Anterior
                </button>
                <p className="text-xs text-slate-500">
                  {page} / {totalPages}
                </p>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Próxima
                </button>
              </div>
            )}

            <p className="text-center text-xs text-slate-600 pb-2">
              {filtered.length} transação{filtered.length !== 1 ? 'ões' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
