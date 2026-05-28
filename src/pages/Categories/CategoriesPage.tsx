import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon, AVAILABLE_ICONS } from '@/components/common/CategoryIcon';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { Category } from '@/types';

const COLOR_OPTIONS = [
  '#00d26a', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#06b6d4',
  '#84cc16', '#14b8a6', '#a855f7', '#d946ef', '#475569',
];

function CategoryForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Category>;
  onSave: (c: Omit<Category, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    icon: initial?.icon || 'tag',
    color: initial?.color || '#3b82f6',
    type: (initial?.type || 'expense') as Category['type'],
  });

  const handleSave = () => {
    if (!form.name) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center justify-center py-4">
        <div className="flex flex-col items-center gap-2">
          <CategoryIcon icon={form.icon} color={form.color} size="lg" />
          <p className="text-sm font-medium text-slate-300">{form.name || 'Prévia'}</p>
        </div>
      </div>

      <Input
        label="Nome"
        placeholder="Ex: Alimentação"
        value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
      />

      <Select
        label="Tipo"
        value={form.type}
        onChange={e => setForm(p => ({ ...p, type: e.target.value as Category['type'] }))}
        options={[
          { value: 'income', label: 'Receita' },
          { value: 'expense', label: 'Despesa' },
          { value: 'both', label: 'Ambos' },
        ]}
      />

      {/* Color picker */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setForm(p => ({ ...p, color: c }))}
              className="w-7 h-7 rounded-lg transition-all"
              style={{
                background: c,
                border: form.color === c ? '2px solid white' : '2px solid transparent',
                outline: form.color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ícone</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {AVAILABLE_ICONS.map(icon => (
            <button
              key={icon}
              onClick={() => setForm(p => ({ ...p, icon }))}
              className="transition-all rounded-lg"
              style={{
                background: form.icon === icon ? `${form.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.icon === icon ? form.color + '40' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <CategoryIcon icon={icon} color={form.icon === icon ? form.color : '#475569'} size="sm" className="border-none bg-transparent" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} disabled={!form.name}>Salvar</Button>
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = categories.filter(c =>
    tab === 'all' ? true : tab === 'income' ? c.type === 'income' || c.type === 'both' : c.type === 'expense' || c.type === 'both'
  );

  const handleSave = (data: Omit<Category, 'id' | 'createdAt'>) => {
    if (editTarget) {
      updateCategory(editTarget.id, data);
      toast('Categoria atualizada!', 'success');
    } else {
      addCategory(data);
      toast('Categoria criada!', 'success');
    }
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget);
    toast('Categoria excluída', 'success');
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="px-4 pt-6 pb-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-100">Categorias</h1>
          <Button size="sm" onClick={() => { setEditTarget(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              style={tab === t
                ? { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {t === 'all' ? 'Todas' : t === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 md:px-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Sem categorias"
            description="Crie categorias para organizar suas transações."
            action={
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" /> Criar categoria
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {filtered.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="flex items-center gap-4 px-4 py-3.5 group">
                    <CategoryIcon icon={cat.icon} color={cat.color} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200">{cat.name}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        {cat.type === 'income' ? 'Receita' : cat.type === 'expense' ? 'Despesa' : 'Ambos'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditTarget(cat); setShowModal(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null); }}
        title={editTarget ? 'Editar categoria' : 'Nova categoria'}
      >
        <CategoryForm
          initial={editTarget || undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir categoria"
        message="Ao excluir, as transações desta categoria ficarão sem categoria."
      />
    </div>
  );
}
