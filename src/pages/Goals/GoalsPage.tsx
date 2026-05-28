import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Target, CheckCircle2, Plus as PlusIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon, AVAILABLE_ICONS } from '@/components/common/CategoryIcon';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { Goal } from '@/types';
import { format } from 'date-fns';

const COLOR_OPTIONS = [
  '#00d26a', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
  '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

function GoalForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Goal>;
  onSave: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    targetAmount: initial?.targetAmount?.toString() || '',
    currentAmount: initial?.currentAmount?.toString() || '0',
    deadline: initial?.deadline || '',
    icon: initial?.icon || 'target',
    color: initial?.color || '#3b82f6',
    description: initial?.description || '',
  });

  const handleSave = () => {
    if (!form.title || !form.targetAmount) return;
    onSave({
      title: form.title,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      deadline: form.deadline || undefined,
      icon: form.icon,
      color: form.color,
      description: form.description || undefined,
    });
    onClose();
  };

  const pct = form.targetAmount ? Math.min(100, (parseFloat(form.currentAmount) / parseFloat(form.targetAmount)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex flex-col items-center py-3">
        <CategoryIcon icon={form.icon} color={form.color} size="lg" />
        <p className="text-sm font-medium text-slate-300 mt-2">{form.title || 'Prévia da meta'}</p>
        {form.targetAmount && (
          <div className="w-full mt-3 max-w-xs">
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: form.color }} />
            </div>
            <p className="text-xs text-center text-slate-500 mt-1">{pct.toFixed(0)}% concluída</p>
          </div>
        )}
      </div>

      <Input label="Título" placeholder="Ex: Reserva de emergência" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor alvo (R$)" type="number" placeholder="0,00" value={form.targetAmount} onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))} min="0" step="0.01" />
        <Input label="Já guardado (R$)" type="number" placeholder="0,00" value={form.currentAmount} onChange={e => setForm(p => ({ ...p, currentAmount: e.target.value }))} min="0" step="0.01" />
      </div>
      <Input label="Prazo (opcional)" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />

      {/* Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
              className="w-7 h-7 rounded-lg transition-all"
              style={{ background: c, border: form.color === c ? '2px solid white' : '2px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ícone</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {AVAILABLE_ICONS.slice(0, 16).map(icon => (
            <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))}
              className="transition-all rounded-lg"
              style={{ background: form.icon === icon ? `${form.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${form.icon === icon ? form.color + '40' : 'rgba(255,255,255,0.08)'}` }}
            >
              <CategoryIcon icon={icon} color={form.icon === icon ? form.color : '#475569'} size="sm" className="border-none bg-transparent" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} disabled={!form.title || !form.targetAmount}>Salvar</Button>
      </div>
    </div>
  );
}

function AddAmountModal({
  goal,
  onAdd,
  onClose,
}: {
  goal: Goal;
  onAdd: (amount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-slate-400">Faltam ainda</p>
        <p className="text-2xl font-bold text-slate-100">{formatCurrency(Math.max(0, remaining))}</p>
      </div>
      <Input
        label="Valor a adicionar (R$)"
        type="number"
        placeholder="0,00"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        min="0"
        step="0.01"
        autoFocus
      />
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button
          className="flex-1"
          onClick={() => { if (amount) { onAdd(parseFloat(amount)); onClose(); } }}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}

export function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useApp();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addAmountGoal, setAddAmountGoal] = useState<Goal | null>(null);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleSave = (data: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editTarget) {
      updateGoal(editTarget.id, data);
      toast('Meta atualizada!', 'success');
    } else {
      addGoal(data);
      toast('Meta criada!', 'success');
    }
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGoal(deleteTarget);
    toast('Meta excluída', 'success');
    setDeleteTarget(null);
  };

  const handleAddAmount = (goal: Goal, amount: number) => {
    const newAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
    updateGoal(goal.id, { currentAmount: newAmount });
    if (newAmount >= goal.targetAmount) toast(`🎉 Meta "${goal.title}" concluída!`, 'success');
    else toast(`+${formatCurrency(amount)} adicionado à meta`, 'success');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="px-4 pt-6 pb-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-100">Metas</h1>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Nova meta
          </Button>
        </div>

        {goals.length > 0 && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progresso geral</p>
              <span className="text-sm font-bold text-blue-400">{overallPct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{formatCurrency(totalSaved)} guardados</span>
              <span>{formatCurrency(totalTarget)} total</span>
            </div>
          </Card>
        )}
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4 md:px-6">
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma meta criada"
            description="Defina objetivos financeiros para acompanhar seu progresso."
            action={
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" /> Criar primeira meta
              </Button>
            }
          />
        ) : (
          <AnimatePresence>
            {goals.map((g, i) => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              const completed = pct >= 100;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <CategoryIcon icon={g.icon || 'target'} color={g.color || '#3b82f6'} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">{g.title}</p>
                          {completed && (
                            <Badge variant="green" size="sm">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Concluída
                            </Badge>
                          )}
                        </div>
                        {g.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{g.description}</p>}
                        {g.deadline && <p className="text-xs text-slate-500 mt-0.5">Prazo: {formatDateShort(g.deadline)}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {!completed && (
                          <button
                            onClick={() => setAddAmountGoal(g)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditTarget(g); setShowModal(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(g.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span style={{ color: g.color || '#3b82f6' }}>{formatCurrency(g.currentAmount)}</span>
                      <span className="font-semibold">{pct.toFixed(0)}%</span>
                      <span>{formatCurrency(g.targetAmount)}</span>
                    </div>

                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{
                          background: completed
                            ? 'linear-gradient(90deg, #00d26a, #10b981)'
                            : `linear-gradient(90deg, ${g.color || '#3b82f6'}88, ${g.color || '#3b82f6'})`,
                        }}
                      />
                    </div>

                    {!completed && (
                      <p className="text-xs text-slate-600 mt-1.5">
                        Faltam {formatCurrency(g.targetAmount - g.currentAmount)}
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null); }}
        title={editTarget ? 'Editar meta' : 'Nova meta'}
        size="lg"
      >
        <GoalForm
          initial={editTarget || undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      </Modal>

      <Modal
        open={!!addAmountGoal}
        onClose={() => setAddAmountGoal(null)}
        title="Adicionar valor à meta"
        size="sm"
      >
        {addAmountGoal && (
          <AddAmountModal
            goal={addAmountGoal}
            onAdd={(amount) => handleAddAmount(addAmountGoal, amount)}
            onClose={() => setAddAmountGoal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir meta"
        message="Deseja excluir esta meta financeira?"
      />
    </div>
  );
}
