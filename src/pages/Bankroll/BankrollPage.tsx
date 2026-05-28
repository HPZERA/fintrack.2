import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Dice5,
  Trophy, AlertTriangle, Clock, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { BankrollSession } from '@/types';
import { format } from 'date-fns';

function SessionForm({
  currentBalance,
  onSave,
  onClose,
}: {
  currentBalance: number;
  onSave: (s: Omit<BankrollSession, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startBalance: currentBalance.toString(),
    endBalance: '',
    duration: '',
    notes: '',
  });

  const profit = form.endBalance ? parseFloat(form.endBalance) - parseFloat(form.startBalance || '0') : 0;

  const handleSave = () => {
    if (!form.startBalance || !form.endBalance) return;
    onSave({
      date: form.date,
      startBalance: parseFloat(form.startBalance),
      endBalance: parseFloat(form.endBalance),
      profit: parseFloat(form.endBalance) - parseFloat(form.startBalance),
      duration: form.duration ? parseInt(form.duration) : undefined,
      notes: form.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      {profit !== 0 && (
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: profit > 0 ? 'rgba(0,210,106,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${profit > 0 ? 'rgba(0,210,106,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <p className="text-xs text-slate-400 mb-0.5">Resultado da sessão</p>
          <p className={`text-xl font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {profit > 0 ? '+' : ''}{formatCurrency(profit)}
          </p>
        </div>
      )}

      <Input label="Data" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Banca inicial (R$)" type="number" value={form.startBalance} onChange={e => setForm(p => ({ ...p, startBalance: e.target.value }))} min="0" step="0.01" />
        <Input label="Banca final (R$)" type="number" placeholder="0,00" value={form.endBalance} onChange={e => setForm(p => ({ ...p, endBalance: e.target.value }))} min="0" step="0.01" />
      </div>
      <Input label="Duração (minutos, opcional)" type="number" placeholder="Ex: 90" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} min="0" />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Observações</label>
        <textarea
          placeholder="Como foi a sessão?"
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={!form.startBalance || !form.endBalance}
        >
          Registrar
        </Button>
      </div>
    </div>
  );
}

export function BankrollPage() {
  const { bankrollSessions, bankrollBalance, addBankrollSession, deleteBankrollSession, updateBankrollBalance } = useApp();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showSetBalance, setShowSetBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  const sessions = [...bankrollSessions].sort((a, b) => b.date.localeCompare(a.date));

  const totalProfit = sessions.filter(s => s.profit > 0).reduce((sum, s) => sum + s.profit, 0);
  const totalLoss = Math.abs(sessions.filter(s => s.profit < 0).reduce((sum, s) => sum + s.profit, 0));
  const netProfit = totalProfit - totalLoss;
  const bestSession = sessions.reduce((best, s) => s.profit > (best?.profit || -Infinity) ? s : best, sessions[0]);
  const worstSession = sessions.reduce((worst, s) => s.profit < (worst?.profit || Infinity) ? s : worst, sessions[0]);
  const avgProfit = sessions.length > 0 ? sessions.reduce((s, t) => s + t.profit, 0) / sessions.length : 0;
  const winSessions = sessions.filter(s => s.profit > 0).length;
  const winRate = sessions.length > 0 ? (winSessions / sessions.length) * 100 : 0;

  const chartData = sessions.slice(0, 10).reverse().map(s => ({
    date: s.date.slice(5),
    profit: s.profit,
  }));

  const handleSave = (data: Omit<BankrollSession, 'id' | 'createdAt'>) => {
    addBankrollSession(data);
    toast('Sessão registrada!', 'success');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBankrollSession(deleteTarget);
    toast('Sessão excluída', 'success');
    setDeleteTarget(null);
  };

  const handleSetBalance = () => {
    if (!newBalance) return;
    updateBankrollBalance(parseFloat(newBalance));
    toast('Banca atualizada!', 'success');
    setShowSetBalance(false);
    setNewBalance('');
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
      <div className="rounded-xl border border-white/8 p-3 text-xs" style={{ background: '#13131f' }}>
        <p className="text-slate-400 mb-1">{label}</p>
        <p style={{ color: v >= 0 ? '#00d26a' : '#ef4444' }}>
          {v >= 0 ? '+' : ''}{formatCurrency(v)}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Dice5 className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Banca</h1>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Sessão
          </Button>
        </div>

        {/* Main balance card */}
        <div
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <p className="text-xs text-amber-500 uppercase tracking-wider mb-1">Banca Atual</p>
          <p className="text-4xl font-black text-slate-100 mb-3">{formatCurrency(bankrollBalance)}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={netProfit >= 0 ? 'green' : 'red'}>
              {netProfit >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(netProfit))} líquido
            </Badge>
            {sessions.length > 0 && (
              <Badge variant="gold">{sessions.length} sessões · {winRate.toFixed(0)}% vitórias</Badge>
            )}
          </div>
          <button
            onClick={() => setShowSetBalance(true)}
            className="absolute top-4 right-4 text-xs text-amber-500/60 hover:text-amber-400 transition-colors"
          >
            Ajustar
          </button>
        </div>

        {/* Stats grid */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total ganhos</p>
              </div>
              <p className="text-base font-bold text-emerald-400">{formatCurrency(totalProfit)}</p>
            </Card>
            <Card className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total perdas</p>
              </div>
              <p className="text-base font-bold text-red-400">{formatCurrency(totalLoss)}</p>
            </Card>
            <Card className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Melhor sessão</p>
              </div>
              <p className="text-base font-bold text-emerald-400">
                {bestSession ? `+${formatCurrency(bestSession.profit)}` : '--'}
              </p>
            </Card>
            <Card className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pior sessão</p>
              </div>
              <p className="text-base font-bold text-red-400">
                {worstSession ? formatCurrency(worstSession.profit) : '--'}
              </p>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4 md:px-6">
        {/* Chart */}
        {chartData.length > 1 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Histórico de Sessões</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <BarChart3 className="w-3 h-3" /> últimas {chartData.length}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.profit >= 0 ? '#00d26a' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Average */}
        {sessions.length > 0 && (
          <Card className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Média por sessão</p>
              <p className={`text-lg font-bold ${avgProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {avgProfit >= 0 ? '+' : ''}{formatCurrency(avgProfit)}
              </p>
            </div>
          </Card>
        )}

        {/* Sessions list */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sessões</p>
          {sessions.length === 0 ? (
            <EmptyState
              icon={Dice5}
              title="Nenhuma sessão registrada"
              description="Registre suas sessões de jogo para acompanhar sua banca."
              action={
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4" /> Registrar sessão
                </Button>
              }
            />
          ) : (
            <Card>
              <AnimatePresence>
                {sessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-start gap-3 px-4 py-3.5 group ${i < sessions.length - 1 ? 'border-b border-white/4' : ''}`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: s.profit >= 0 ? 'rgba(0,210,106,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${s.profit >= 0 ? 'rgba(0,210,106,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      {s.profit >= 0
                        ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                        : <TrendingDown className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-200">{formatDate(s.date)}</p>
                        {s.duration && (
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-500">
                            <Clock className="w-2.5 h-2.5" /> {s.duration}min
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatCurrency(s.startBalance)} → {formatCurrency(s.endBalance)}
                      </p>
                      {s.notes && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{s.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.profit >= 0 ? '+' : ''}{formatCurrency(s.profit)}
                      </p>
                      <button
                        onClick={() => setDeleteTarget(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Card>
          )}
        </div>
      </div>

      {/* New session modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar sessão">
        <SessionForm
          currentBalance={bankrollBalance}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      </Modal>

      {/* Set balance modal */}
      <Modal open={showSetBalance} onClose={() => setShowSetBalance(false)} title="Ajustar banca" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Banca atual: <strong className="text-slate-200">{formatCurrency(bankrollBalance)}</strong></p>
          <Input
            label="Nova banca (R$)"
            type="number"
            placeholder="0,00"
            value={newBalance}
            onChange={e => setNewBalance(e.target.value)}
            min="0"
            step="0.01"
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowSetBalance(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSetBalance} disabled={!newBalance}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir sessão"
        message="Deseja excluir o registro desta sessão?"
      />
    </div>
  );
}
