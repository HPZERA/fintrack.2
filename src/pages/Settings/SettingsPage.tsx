import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, DollarSign, Shield, Bell, LogOut, ChevronRight,
  Camera, Settings as SettingsIcon, Trash2,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const CURRENCIES = [
  { value: 'BRL', label: 'Real Brasileiro (R$)' },
  { value: 'USD', label: 'Dólar Americano ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Libra Esterlina (£)' },
];

function ProfileSection() {
  const { user, updateUser } = useApp();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = () => {
    updateUser({ name, email });
    toast('Perfil atualizado!', 'success');
    setEditing(false);
  };

  const initials = user?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#13131f] border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-slate-100">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
        <button
          onClick={() => setEditing(v => !v)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <Input label="Nome" value={name} onChange={e => setName(e.target.value)} leftIcon={<User className="w-4 h-4" />} />
          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail className="w-4 h-4" />} />
          <Button className="w-full" onClick={handleSave}>Salvar alterações</Button>
        </motion.div>
      )}
    </Card>
  );
}

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  iconBg?: string;
  label: string;
  description?: string;
  onClick?: () => void;
  rightContent?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon: Icon, iconColor, iconBg, label, description, onClick, rightContent, danger }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3.5 w-full text-left transition-colors hover:bg-white/3 first:rounded-t-2xl last:rounded-b-2xl"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg || 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor || '#94a3b8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-slate-200'}`}>{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {rightContent || (
        onClick && <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
      )}
    </button>
  );
}

export function SettingsPage() {
  const { user, updateUser, logout } = useApp();
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'BRL');

  const handleCurrencySave = () => {
    updateUser({ currency: selectedCurrency });
    toast('Moeda atualizada!', 'success');
    setShowCurrencyModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="px-4 pt-6 pb-4 md:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <SettingsIcon className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Configurações</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-6 md:px-6">
        {/* Profile */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Perfil</p>
          <ProfileSection />
        </div>

        {/* Preferences */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Preferências</p>
          <Card className="overflow-hidden divide-y divide-white/4">
            <SettingItem
              icon={DollarSign}
              iconColor="#f59e0b"
              iconBg="rgba(245,158,11,0.1)"
              label="Moeda"
              description={CURRENCIES.find(c => c.value === user?.currency)?.label || 'Real Brasileiro'}
              onClick={() => setShowCurrencyModal(true)}
            />
            <SettingItem
              icon={Bell}
              iconColor="#3b82f6"
              iconBg="rgba(59,130,246,0.1)"
              label="Notificações"
              description="Alertas e lembretes"
              onClick={() => toast('Em breve disponível', 'info')}
            />
          </Card>
        </div>

        {/* Security */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Segurança</p>
          <Card className="overflow-hidden divide-y divide-white/4">
            <SettingItem
              icon={Shield}
              iconColor="#10b981"
              iconBg="rgba(16,185,129,0.1)"
              label="Alterar senha"
              description="Conectar com Supabase Auth"
              onClick={() => toast('Disponível após conectar Supabase', 'info')}
            />
          </Card>
        </div>

        {/* Supabase integration info */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-xs font-semibold text-blue-400 mb-1">Integração Supabase</p>
          <p className="text-xs text-slate-500 mb-3">
            Configure as variáveis de ambiente para habilitar autenticação real, sincronização em nuvem e backup automático.
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-slate-500">VITE_SUPABASE_URL=...</p>
            <p className="text-[10px] font-mono text-slate-500">VITE_SUPABASE_ANON_KEY=...</p>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Conta</p>
          <Card className="overflow-hidden divide-y divide-white/4">
            <SettingItem
              icon={LogOut}
              iconColor="#ef4444"
              iconBg="rgba(239,68,68,0.1)"
              label="Sair da conta"
              danger
              onClick={() => setShowLogoutConfirm(true)}
            />
            <SettingItem
              icon={Trash2}
              iconColor="#ef4444"
              iconBg="rgba(239,68,68,0.1)"
              label="Excluir conta"
              description="Ação irreversível"
              danger
              onClick={() => toast('Disponível após conectar Supabase', 'info')}
            />
          </Card>
        </div>

        <p className="text-center text-xs text-slate-600">FinTrack v1.0.0 · 2026</p>
      </div>

      {/* Currency modal */}
      <Modal open={showCurrencyModal} onClose={() => setShowCurrencyModal(false)} title="Moeda padrão" size="sm">
        <div className="space-y-4">
          <Select
            label="Selecione a moeda"
            value={selectedCurrency}
            onChange={e => setSelectedCurrency(e.target.value)}
            options={CURRENCIES}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCurrencyModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleCurrencySave}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { logout(); setShowLogoutConfirm(false); }}
        title="Sair da conta"
        message="Tem certeza que deseja sair? Seus dados locais serão mantidos."
        confirmLabel="Sair"
      />
    </div>
  );
}
