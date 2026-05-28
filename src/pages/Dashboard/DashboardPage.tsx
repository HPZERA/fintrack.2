import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Target, Eye, EyeOff,
  Plus, ArrowRight, Sparkles, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/utils/formatters';
import { calculateSummary, groupByMonth, getHealthScore } from '@/utils/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { subMonths, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } } };

function useChartData(transactions: ReturnType<typeof useApp>['transactions']) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return format(d, 'yyyy-MM');
  });
  const grouped = groupByMonth(transactions);
  return months.map(m => ({
    name: format(new Date(m + '-01'), 'MMM', { locale: ptBR }),
    income: grouped[m]?.income || 0,
    expense: grouped[m]?.expense || 0,
    profit: (grouped[m]?.income || 0) - (grouped[m]?.expense || 0),
  }));
}

function MiniSparkline({ trendUp, color }: { trendUp: boolean; color: string }) {
  const vals = trendUp ? [35, 50, 42, 65, 58, 75, 90] : [88, 72, 78, 58, 68, 48, 38];
  return (
    <div className="flex items-end gap-[2px] h-6">
      {vals.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
          className="flex-1 rounded-sm"
          style={{ background: `${color}99` }}
        />
      ))}
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (isToday(d)) return 'Hoje';
    if (isYesterday(d)) return 'Ontem';
    return format(d, "d 'de' MMM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function DashboardPage() {
  const { user, transactions, categories, goals } = useApp();
  const navigate = useNavigate();
  const [hideValues, setHideValues] = useState(false);

  const summary = calculateSummary(transactions);
  const health = getHealthScore(summary);
  const chartData = useChartData(transactions);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const mask = (v: number) => hideValues ? '••••' : formatCurrencyCompact(v);

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory)
    .map(([catId, amount]) => ({
      name: categories.find(c => c.id === catId)?.name || 'Outros',
      value: amount,
      color: categories.find(c => c.id === catId)?.color || '#475569',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const statsCards = [
    {
      label: 'Entradas',
      value: summary.monthlyIncome,
      icon: TrendingUp,
      color: '#00E676',
      bg: 'rgba(0,230,118,0.1)',
      border: 'rgba(0,230,118,0.18)',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Saídas',
      value: summary.monthlyExpenses,
      icon: TrendingDown,
      color: '#FF5A5F',
      bg: 'rgba(255,90,95,0.1)',
      border: 'rgba(255,90,95,0.18)',
      trend: '-3%',
      trendUp: false,
    },
    {
      label: 'Economias',
      value: Math.max(0, summary.monthlyProfit),
      icon: Wallet,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.18)',
      trend: formatPercent(summary.savingsRate),
      trendUp: summary.savingsRate > 0,
    },
    {
      label: 'Metas ativas',
      value: goals.length,
      icon: Target,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.18)',
      isCount: true,
      trend: `${goals.filter(g => g.currentAmount >= g.targetAmount).length} concluída${goals.filter(g => g.currentAmount >= g.targetAmount).length !== 1 ? 's' : ''}`,
      trendUp: true,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div
        className="rounded-2xl p-4 text-xs"
        style={{
          background: 'rgba(7, 11, 20, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <p className="text-slate-400 font-semibold mb-3 uppercase tracking-wider text-[10px]">{label}</p>
        {payload.map((p, i) => {
          const isIncome = p.dataKey === 'income';
          return (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: isIncome ? '#00E676' : '#FF5A5F' }} />
              <span className="text-slate-400">{isIncome ? 'Entradas' : 'Saídas'}</span>
              <span className="font-bold ml-auto" style={{ color: isIncome ? '#00E676' : '#FF5A5F' }}>
                {formatCurrency(p.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const isPositive = summary.monthlyProfit >= 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-7 pb-2 md:px-6 md:pt-9">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Visão geral</p>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Olá, {user?.name.split(' ')[0]} 👋
          </h1>
        </div>
        <button
          onClick={() => setHideValues(v => !v)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 pb-8 space-y-4 md:px-6"
      >
        {/* ── Balance Hero Card ── */}
        <motion.div variants={item}>
          <div
            className="rounded-3xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(0,230,118,0.13) 0%, rgba(15,23,42,0.95) 45%, rgba(59,130,246,0.08) 100%)',
              border: '1px solid rgba(0,230,118,0.22)',
              padding: '28px 24px 24px',
              minHeight: '172px',
              boxShadow: '0 0 40px rgba(0,230,118,0.07), 0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Ambient glows */}
            <div
              className="absolute -top-8 -right-8 w-56 h-56 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.09) 0%, transparent 65%)' }}
            />
            <div
              className="absolute -bottom-12 -left-8 w-48 h-48 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)' }}
            />

            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5 relative">
              Saldo Total
            </p>

            <motion.p
              key={hideValues ? 'hidden' : 'shown'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-black text-slate-50 leading-none mb-5 relative"
              style={{
                fontSize: 'clamp(2.75rem, 9vw, 4rem)',
                textShadow: hideValues
                  ? 'none'
                  : '0 0 40px rgba(0,230,118,0.45), 0 0 80px rgba(0,230,118,0.18)',
              }}
            >
              {mask(summary.totalBalance)}
            </motion.p>

            <div className="flex items-center gap-2 relative">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: isPositive ? 'rgba(0,230,118,0.14)' : 'rgba(255,90,95,0.14)',
                  border: `1px solid ${isPositive ? 'rgba(0,230,118,0.3)' : 'rgba(255,90,95,0.3)'}`,
                  color: isPositive ? '#00E676' : '#FF5A5F',
                }}
              >
                {isPositive
                  ? <ArrowUpRight className="w-3.5 h-3.5" />
                  : <ArrowDownRight className="w-3.5 h-3.5" />
                }
                {mask(Math.abs(summary.monthlyProfit))} este mês
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          {statsCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(15,23,42,0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${s.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: s.bg,
                    boxShadow: `0 0 20px ${s.color}22`,
                  }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: s.trendUp ? 'rgba(0,230,118,0.1)' : 'rgba(255,90,95,0.1)',
                    color: s.trendUp ? '#00E676' : '#FF5A5F',
                  }}
                >
                  {s.trend}
                </span>
              </div>

              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl font-black text-slate-50 mb-3">
                {s.isCount ? s.value : mask(s.value)}
              </p>

              <MiniSparkline trendUp={s.trendUp} color={s.color} />
            </div>
          ))}
        </motion.div>

        {/* ── Health Score ── */}
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Saúde Financeira</p>
              <Badge variant={health.score >= 70 ? 'green' : health.score >= 50 ? 'gold' : 'red'}>
                {health.label}
              </Badge>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <p className="text-4xl font-black leading-none" style={{ color: health.color }}>{health.score}</p>
              <p className="text-sm text-slate-600 mb-1 font-medium">/ 100</p>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${health.score}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${health.color}80, ${health.color})`,
                  boxShadow: `0 0 12px ${health.color}60`,
                }}
              />
            </div>
            <div className="flex justify-between mt-3">
              <p className="text-[10px] font-medium text-slate-500">Taxa de economia: <span className="text-slate-400">{formatPercent(summary.savingsRate)}</span></p>
              <p className="text-[10px] font-medium text-slate-500">Comprometido: <span className="text-slate-400">{formatPercent(summary.expenseRate)}</span></p>
            </div>
          </Card>
        </motion.div>

        {/* ── Area Chart ── */}
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Evolução Mensal</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00E676' }} />
                  <span className="text-[10px] text-slate-500 font-medium">Entradas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#FF5A5F' }} />
                  <span className="text-[10px] text-slate-500 font-medium">Saídas</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E676" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#00E676" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#00E676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A5F" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#FF5A5F" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#FF5A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#00E676"
                  strokeWidth={2}
                  fill="url(#gIncome)"
                  dot={{ fill: '#00E676', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#00E676', stroke: '#070B14', strokeWidth: 2, r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#FF5A5F"
                  strokeWidth={2}
                  fill="url(#gExpense)"
                  dot={{ fill: '#FF5A5F', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#FF5A5F', stroke: '#070B14', strokeWidth: 2, r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* ── Pie Chart ── */}
        {pieData.length > 0 && (
          <motion.div variants={item}>
            <Card className="p-5">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">Gastos por Categoria</p>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <PieChart width={108} height={108}>
                    <Pie
                      data={pieData}
                      cx={50}
                      cy={50}
                      innerRadius={32}
                      outerRadius={50}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="rgba(7,11,20,0.8)"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div className="flex-1 space-y-2.5">
                  {pieData.map((d, i) => {
                    const total = pieData.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <p className="text-xs font-medium text-slate-400 flex-1 truncate">{d.name}</p>
                        <p className="text-[10px] text-slate-600 mr-1">{pct}%</p>
                        <p className="text-xs font-bold text-slate-300">{mask(d.value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Recent Transactions ── */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Recentes</p>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recent.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm font-medium text-slate-500">Nenhuma transação ainda</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/transactions')}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {recent.map((t, i) => {
                const cat = categories.find(c => c.id === t.categoryId);
                const isIncome = t.type === 'income';
                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ x: 5, backgroundColor: isIncome ? 'rgba(0,230,118,0.04)' : 'rgba(255,90,95,0.04)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`flex items-center gap-3.5 px-4 py-4 cursor-pointer ${i < recent.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isIncome ? 'rgba(0,230,118,0.1)' : 'rgba(255,90,95,0.1)',
                        border: `1px solid ${isIncome ? 'rgba(0,230,118,0.2)' : 'rgba(255,90,95,0.2)'}`,
                      }}
                    >
                      <CategoryIcon icon={cat?.icon || 'tag'} color={cat?.color || '#475569'} size="sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-medium text-slate-500">{formatRelativeDate(t.date)}</p>
                        {cat && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `${cat.color}22`,
                              color: cat.color,
                              border: `1px solid ${cat.color}33`,
                            }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount pill */}
                    <div
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-black"
                      style={{
                        background: isIncome ? 'rgba(0,230,118,0.12)' : 'rgba(255,90,95,0.12)',
                        color: isIncome ? '#00E676' : '#FF5A5F',
                      }}
                    >
                      {isIncome ? '+' : '-'}{mask(t.amount)}
                    </div>
                  </motion.div>
                );
              })}
            </Card>
          )}
        </motion.div>

        {/* ── Goals Preview ── */}
        {goals.length > 0 && (
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3.5">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Metas Financeiras</p>
              <button
                onClick={() => navigate('/goals')}
                className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {goals.slice(0, 2).map(g => {
                const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                const goalColor = g.color || '#3B82F6';
                return (
                  <Card key={g.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-slate-200">{g.title}</p>
                      <span
                        className="text-xs font-black px-2.5 py-1 rounded-full"
                        style={{
                          background: `${goalColor}18`,
                          color: goalColor,
                          border: `1px solid ${goalColor}30`,
                        }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="font-semibold text-slate-400">{mask(g.currentAmount)}</span>
                      <span className="font-medium text-slate-600">{mask(g.targetAmount)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${goalColor}80, ${goalColor})`,
                          boxShadow: `0 0 10px ${goalColor}50`,
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
