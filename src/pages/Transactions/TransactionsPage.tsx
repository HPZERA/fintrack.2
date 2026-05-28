import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, TrendingUp, TrendingDown,
  Pencil, Trash2, ChevronDown,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { Transaction, TransactionType } from '@/types';
import { format } from 'date-fns';

type SortKey = 'date' | 'amount' | 'title';

const PAY_METHODS = [
  { value: '', label: 'Método de pagamento' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'debit_card', label: 'Cartão de débito' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'other', label: 'Outro' },
];

const PAY_LABEL: Record<string, string> = {
  cash: 'Dinheiro', pix: 'Pix', credit_card: 'Crédito',
  debit_card: 'Débito', transfer: 'Transferência', other: 'Outro',
};

function TransactionForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Transaction>;
  onSave: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const { categories } = useApp();
  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial?.amount?.toString() || '',
    type: (initial?.type || 'expense') as TransactionType,
    categoryId: initial?.categoryId || '',
    date: initial?.date || format(new Date(), 'yyyy-MM-dd'),
    description: initial?.description || '',
    paymentMethod: initial?.paymentMethod || '',
    notes: initial?.notes || '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'both');

  const handleSave = () => {
    if (!form.title || !form.amount || !form.categoryId) return;
    onSave({
      title: form.title,
      amount: parseFloat(form.amount),
      type: form.type,
      categoryId: form.categoryId,
      date: form.date,
      description: form.description || undefined,
      paymentMethod: form.paymentMethod as Transaction['paymentMethod'] || undefined,
      notes: form.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['income', 'expense'] as TransactionType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setForm(prev => ({ ...prev, type: t, categoryId: '' }))}
            className={`py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${form.type === t ? 'text-white shadow-lg' : 'text-slate-500'}`}
            style={form.type === t ? {
              background: t === 'income' ? 'linear-gradient(135deg,#00d26a,#10b981)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
              boxShadow: `0 4px 12px ${t === 'income' ? 'rgba(0,210,106,0.3)' : 'rgba(239,68,68,0.3)'}`,
            } : {}}
          >
            {t === 'income' ? '▲ Receita' : '▼ Despesa'}
          </button>
        ))}
      </div>

      <Input label="Título" placeholder="Ex: Salário, Mercado..." value={form.title} onChange={set('title')} />
      <Input label="Valor (R$)" type="number" placeholder="0,00" value={form.amount} onChange={set('amount')} step="0.01" min="0" />

      <Select
        label="Categoria"
        value={form.categoryId}
        onChange={set('categoryId') as React.ChangeEventHandler<HTMLSelectElement>}
        options={[
          { value: '', label: 'Selecione a categoria' },
          ...filteredCats.map(c => ({ value: c.id, label: c.name })),
        ]}
      />

      <Input label="Data" type="date" value={form.date} onChange={set('date')} />

      <Select
        label="Método de pagamento"
        value={form.paymentMethod}
        onChange={set('paymentMethod') as React.ChangeEventHandler<HTMLSelectElement>}
        options={PAY_METHODS}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</label>
        <textarea
          placeholder="Descrição opcional..."
          value={form.description}
          onChange={set('description')}
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={!form.title || !form.amount || !form.categoryId}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}

export function TransactionsPage() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortKey === 'date') return b.date.localeCompare(a.date);
      if (sortKey === 'amount') return b.amount - a.amount;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [transactions, filterType, search, sortKey, categories]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTransaction(deleteTarget);
    toast('Transação excluída', 'success');
    setDeleteTarget(null);
  };

  const openEdit = (t: Transaction) => {
    setEditTarget(t);
    setShowModal(true);
  };

  const handleSave = (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateTransaction(editTarget.id, data);
      toast('Transação atualizada', 'success');
    } else {
      addTransaction(data);
      toast('Transação adicionada!', 'success');
    }
    setEditTarget(null);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-100">Transações</h1>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </div>

        {/* Summary mini */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(0,210,106,0.08)', border: '1px solid rgba(0,210,106,0.15)' }}>
            <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-0.5">Entradas</p>
            <p className="text-base font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[10px] text-red-500 uppercase tracking-wider mb-0.5">Saídas</p>
            <p className="text-base font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${showFilters ? 'text-blue-400' : 'text-slate-500'}`}
            style={{ background: showFilters ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showFilters ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}` }}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-3 flex-wrap">
                {(['all', 'income', 'expense'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterType === t ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    style={filterType === t ? {
                      background: t === 'all' ? 'rgba(59,130,246,0.2)' : t === 'income' ? 'rgba(0,210,106,0.2)' : 'rgba(239,68,68,0.2)',
                      border: `1px solid ${t === 'all' ? 'rgba(59,130,246,0.3)' : t === 'income' ? 'rgba(0,210,106,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: t === 'all' ? '#3b82f6' : t === 'income' ? '#00d26a' : '#ef4444',
                    } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {t === 'all' ? 'Todos' : t === 'income' ? '▲ Receitas' : '▼ Despesas'}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-xs text-slate-500">Ordenar:</span>
                  <button
                    onClick={() => setSortKey(s => s === 'date' ? 'amount' : s === 'amount' ? 'title' : 'date')}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {sortKey === 'date' ? 'Data' : sortKey === 'amount' ? 'Valor' : 'Nome'}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-6 md:px-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={search ? Search : TrendingUp}
            title={search ? 'Nenhum resultado' : 'Sem transações'}
            description={search ? `Nenhuma transação para "${search}"` : 'Adicione sua primeira transação clicando em Nova.'}
            action={
              !search && (
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4" /> Adicionar transação
                </Button>
              )
            }
          />
        ) : (
          <Card>
            <AnimatePresence>
              {filtered.map((t, i) => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-3 px-4 py-3.5 group ${i < filtered.length - 1 ? 'border-b border-white/4' : ''}`}
                  >
                    <CategoryIcon icon={cat?.icon || 'tag'} color={cat?.color || '#475569'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200 truncate">{t.title}</p>
                        {t.paymentMethod && (
                          <Badge variant="gray" size="sm">{PAY_LABEL[t.paymentMethod]}</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatDate(t.date)} · {cat?.name || 'Sem categoria'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? (
                          <><TrendingUp className="w-3 h-3 inline mr-0.5" />+</>
                        ) : (
                          <><TrendingDown className="w-3 h-3 inline mr-0.5" />-</>
                        )}
                        {formatCurrency(t.amount)}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(t)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null); }}
        title={editTarget ? 'Editar transação' : 'Nova transação'}
      >
        <TransactionForm
          initial={editTarget || undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Deseja excluir esta transação? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
