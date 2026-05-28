import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Target, Eye, EyeOff,
  Plus, ArrowRight, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatCurrencyCompact, formatDate, formatPercent } from '@/utils/formatters';
import { calculateSummary, groupByMonth, getHealthScore } from '@/utils/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

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

export function DashboardPage() {
  const { user, transactions, categories, goals } = useApp();
  const navigate = useNavigate();
  const [hideValues, setHideValues] = useState(false);

  const summary = calculateSummary(transactions);
  const health = getHealthScore(summary);
  const chartData = useChartData(transactions);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const mask = (v: number) => hideValues ? '••••' : formatCurrencyCompact(v);

  // Pie chart for expenses by category
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
      color: '#00d26a',
      bg: 'rgba(0,210,106,0.1)',
      border: 'rgba(0,210,106,0.2)',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Saídas',
      value: summary.monthlyExpenses,
      icon: TrendingDown,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.2)',
      trend: '-3%',
      trendUp: false,
    },
    {
      label: 'Economias',
      value: Math.max(0, summary.monthlyProfit),
      icon: Wallet,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
      trend: formatPercent(summary.savingsRate),
      trendUp: summary.savingsRate > 0,
    },
    {
      label: 'Metas ativas',
      value: goals.length,
      icon: Target,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.2)',
      isCount: true,
      trend: `${goals.filter(g => g.currentAmount >= g.targetAmount).length} concluída${goals.filter(g => g.currentAmount >= g.targetAmount).length !== 1 ? 's' : ''}`,
      trendUp: true,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-xl border border-white/8 p-3 text-xs" style={{ background: '#13131f' }}>
        <p className="text-slate-400 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.dataKey === 'income' ? '#00d26a' : '#ef4444' }}>
            {p.dataKey === 'income' ? 'Entrada' : 'Saída'}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2 md:px-6 md:pt-8">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-slate-500 font-medium">Visão geral</p>
          </div>
          <h1 className="text-xl font-bold text-slate-100">
            Olá, {user?.name.split(' ')[0]} 👋
          </h1>
        </div>
        <button
          onClick={() => setHideValues(v => !v)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 pb-6 space-y-4 md:px-6"
      >
        {/* Balance Card */}
        <motion.div variants={item}>
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 50%, rgba(139,92,246,0.08) 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Saldo Total</p>
            <p className="text-4xl font-black text-slate-100 mb-1">
              {mask(summary.totalBalance)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant={summary.monthlyProfit >= 0 ? 'green' : 'red'}>
                {summary.monthlyProfit >= 0 ? '▲' : '▼'} {mask(Math.abs(summary.monthlyProfit))} este mês
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          {statsCards.map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className={`text-[10px] font-semibold ${s.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.trend}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{s.label}</p>
              <p className="text-lg font-bold text-slate-100">
                {s.isCount ? s.value : mask(s.value)}
              </p>
            </Card>
          ))}
        </motion.div>

        {/* Health Score */}
        <motion.div variants={item}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Saúde Financeira</p>
              <Badge variant={health.score >= 70 ? 'green' : health.score >= 50 ? 'gold' : 'red'}>
                {health.label}
              </Badge>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-3xl font-black" style={{ color: health.color }}>{health.score}</p>
              <p className="text-sm text-slate-500 mb-1">/ 100</p>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${health.score}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${health.color}88, ${health.color})` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-[10px] text-slate-500">Taxa de economia: {formatPercent(summary.savingsRate)}</p>
              <p className="text-[10px] text-slate-500">Gasto: {formatPercent(summary.expenseRate)}</p>
            </div>
          </Card>
        </motion.div>

        {/* Area Chart */}
        <motion.div variants={item}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Evolução Mensal</p>
              <Badge variant="blue">6 meses</Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d26a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d26a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#00d26a" strokeWidth={2} fill="url(#gIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-slate-500">Saídas</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <motion.div variants={item}>
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Gastos por Categoria</p>
              <div className="flex items-center gap-4">
                <PieChart width={100} height={100}>
                  <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex-1 space-y-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <p className="text-xs text-slate-400 flex-1 truncate">{d.name}</p>
                      <p className="text-xs font-semibold text-slate-300">{mask(d.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recentes</p>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recent.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-slate-500">Nenhuma transação ainda</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/transactions')}
              >
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </Card>
          ) : (
            <Card>
              {recent.map((t, i) => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < recent.length - 1 ? 'border-b border-white/4' : ''}`}
                  >
                    <CategoryIcon icon={cat?.icon || 'tag'} color={cat?.color || '#475569'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(t.date)} · {cat?.name || 'Sem categoria'}</p>
                    </div>
                    <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{mask(t.amount)}
                    </p>
                  </div>
                );
              })}
            </Card>
          )}
        </motion.div>

        {/* Goals preview */}
        {goals.length > 0 && (
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Metas Financeiras</p>
              <button
                onClick={() => navigate('/goals')}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {goals.slice(0, 2).map(g => {
                const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                return (
                  <Card key={g.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-200">{g.title}</p>
                      <span className="text-xs font-semibold" style={{ color: g.color || '#3b82f6' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>{mask(g.currentAmount)}</span>
                      <span>{mask(g.targetAmount)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: g.color || '#3b82f6' }}
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
