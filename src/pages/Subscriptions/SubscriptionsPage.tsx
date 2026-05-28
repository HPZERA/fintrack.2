import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, RefreshCw,
  Shield, Zap, BarChart3, Target, AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { openCaktoCheckout, CAKTO_CHECKOUT_URL, hasCaktoSuccessParam, clearCaktoSuccessParam } from '@/lib/cakto';
import { verifyAndClearCheckoutNonce } from '@/utils/security';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const FEATURES = [
  { icon: BarChart3, label: 'Dashboard financeiro completo' },
  { icon: RefreshCw, label: 'Transações ilimitadas' },
  { icon: Target, label: 'Metas e objetivos financeiros' },
  { icon: Zap, label: 'Relatórios e gráficos avançados' },
  { icon: Shield, label: 'Dados protegidos e seguros' },
];

type PayStep = 'idle' | 'awaiting' | 'success';

export function SubscriptionsPage() {
  const { subscription, renewSubscription, cancelSubscription, user } = useApp();
  const [payStep, setPayStep] = useState<PayStep>('idle');
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Auto-activate when CAKTO redirects back with ?cakto_payment=success.
  // Also requires the nonce set in localStorage when checkout was opened —
  // prevents subscription activation by manually typing the callback URL.
  useEffect(() => {
    if (hasCaktoSuccessParam()) {
      clearCaktoSuccessParam();
      if (verifyAndClearCheckoutNonce()) {
        renewSubscription();
        setPayStep('success');
        setTimeout(() => setPayStep('idle'), 3000);
      }
    }
  }, [renewSubscription]);

  if (!subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0f' }}>
        <p className="text-slate-500 text-sm">Nenhuma assinatura encontrada.</p>
      </div>
    );
  }

  const daysLeft = differenceInDays(parseISO(subscription.renewalDate), new Date());
  const renewalFormatted = format(parseISO(subscription.renewalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const lastPaymentFormatted = subscription.lastPaymentDate
    ? format(parseISO(subscription.lastPaymentDate), 'dd/MM/yyyy', { locale: ptBR })
    : '—';

  const isActive = subscription.status === 'active';
  const isExpired = subscription.status === 'expired';
  const isCancelled = subscription.status === 'cancelled';
  const isUrgent = isActive && daysLeft <= 3;
  const needsRenewal = isExpired || isCancelled || isUrgent;

  function handleOpenCakto() {
    openCaktoCheckout({ email: user?.email, name: user?.name });
    setPayStep('awaiting');
  }

  async function handleConfirmPayment() {
    setIsConfirming(true);
    await new Promise(r => setTimeout(r, 900));
    renewSubscription();
    setIsConfirming(false);
    setPayStep('success');
    setTimeout(() => setPayStep('idle'), 3000);
  }

  async function handleCancel() {
    setCancelling(true);
    await new Promise(r => setTimeout(r, 800));
    cancelSubscription();
    setCancelling(false);
    setShowCancelConfirm(false);
  }

  const statusConfig = {
    active: { label: 'Ativa', variant: 'green' as const, icon: CheckCircle2 },
    expired: { label: 'Expirada', variant: 'red' as const, icon: XCircle },
    cancelled: { label: 'Cancelada', variant: 'red' as const, icon: XCircle },
  }[subscription.status];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-2 md:px-6 md:pt-8">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Conta</p>
        <h1 className="text-xl font-bold text-slate-100">Assinatura</h1>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 pb-6 space-y-4 md:px-6"
      >
        {/* Success banner */}
        <AnimatePresence>
          {payStep === 'success' && (
            <motion.div
              variants={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(0,210,106,0.1)', border: '1px solid rgba(0,210,106,0.25)' }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-300 font-medium">
                  Assinatura renovada com sucesso! Acesso estendido por 30 dias.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Urgent warning banner */}
        {isUrgent && payStep === 'idle' && (
          <motion.div variants={item}>
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                {daysLeft <= 0
                  ? 'Sua assinatura vence hoje! Renove para manter o acesso.'
                  : `Sua assinatura vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}. Renove em breve.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Plan card */}
        <motion.div variants={item}>
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 100%)',
              border: '1px solid rgba(59,130,246,0.18)',
            }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Plano atual</p>
                <p className="text-lg font-bold text-slate-100">FinTrack Premium</p>
                <p className="text-xs text-slate-500 mt-0.5">Mensal · via CAKTO</p>
              </div>
              <Badge variant={statusConfig.variant}>
                <statusConfig.icon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex items-end gap-1 mb-4">
              <span className="text-3xl font-black text-slate-100">R$ 29</span>
              <span className="text-lg font-bold text-slate-400 mb-0.5">,90</span>
              <span className="text-xs text-slate-500 mb-1">/mês</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-slate-500 mb-0.5">Último pagamento</p>
                <p className="font-semibold text-slate-300">{lastPaymentFormatted}</p>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-slate-500 mb-0.5">
                  {isActive ? 'Próxima renovação' : 'Vencimento'}
                </p>
                <p className={`font-semibold ${isUrgent ? 'text-amber-400' : 'text-slate-300'}`}>
                  {renewalFormatted}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Days remaining bar */}
        {isActive && (
          <motion.div variants={item}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dias restantes</p>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: daysLeft <= 3 ? '#f59e0b' : daysLeft <= 7 ? '#3b82f6' : '#00d26a' }}
                >
                  {Math.max(0, daysLeft)} dia{daysLeft !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, (daysLeft / 30) * 100))}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: daysLeft <= 3
                      ? 'linear-gradient(90deg, #f59e0b88, #f59e0b)'
                      : daysLeft <= 7
                      ? 'linear-gradient(90deg, #3b82f688, #3b82f6)'
                      : 'linear-gradient(90deg, #00d26a88, #00d26a)',
                  }}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Awaiting payment card */}
        <AnimatePresence>
          {payStep === 'awaiting' && (
            <motion.div
              variants={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                  <p className="text-sm font-semibold text-slate-200">Aguardando pagamento</p>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Checkout CAKTO aberto em nova aba. Conclua o pagamento lá e confirme abaixo.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="success"
                    size="md"
                    className="w-full"
                    loading={isConfirming}
                    onClick={handleConfirmPayment}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Já realizei o pagamento
                  </Button>
                  <button
                    onClick={handleOpenCakto}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors py-1 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir CAKTO novamente
                  </button>
                  <button
                    onClick={() => setPayStep('idle')}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
                  >
                    Cancelar
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA for renewal */}
        {needsRenewal && payStep === 'idle' && (
          <motion.div variants={item}>
            {CAKTO_CHECKOUT_URL ? (
              <Button variant="primary" size="lg" className="w-full" onClick={handleOpenCakto}>
                <ExternalLink className="w-4 h-4" />
                {isActive ? 'Renovar' : 'Reativar'} via CAKTO — R$ 29,90
              </Button>
            ) : (
              <div
                className="text-center text-xs text-amber-400 rounded-xl px-4 py-3"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                Configure VITE_CAKTO_CHECKOUT_URL no .env para habilitar o checkout.
              </div>
            )}
          </motion.div>
        )}

        {/* Features list */}
        <motion.div variants={item}>
          <Card className="p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Incluso no plano
            </p>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Cancel subscription */}
        {isActive && payStep === 'idle' && !showCancelConfirm && (
          <motion.div variants={item}>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full text-xs text-slate-600 hover:text-red-400 transition-colors py-2"
            >
              Cancelar assinatura
            </button>
          </motion.div>
        )}

        {showCancelConfirm && (
          <motion.div variants={item}>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-slate-200">Cancelar assinatura?</p>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Seu acesso será bloqueado no vencimento. Seus dados não serão apagados e poderão ser
                acessados ao reativar via CAKTO.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                >
                  Manter plano
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  loading={cancelling}
                  onClick={handleCancel}
                >
                  Confirmar cancelamento
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
