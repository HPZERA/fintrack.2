import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { openCaktoCheckout, CAKTO_CHECKOUT_URL } from '@/lib/cakto';

const DISMISSED_KEY = 'renewal_alert_dismissed_date';

type Step = 'alert' | 'awaiting' | 'success';

export function RenewalAlert() {
  const { subscription, renewSubscription, user } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('alert');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!subscription || subscription.status !== 'active') return;
    const daysLeft = differenceInDays(parseISO(subscription.renewalDate), new Date());
    if (daysLeft > 3) return;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === new Date().toDateString()) return;
    setVisible(true);
  }, [subscription]);

  if (!visible || !subscription) return null;

  const daysLeft = differenceInDays(parseISO(subscription.renewalDate), new Date());
  const isToday = daysLeft <= 0;

  function handleDismiss() {
    if (step === 'awaiting') return; // não fecha enquanto aguarda
    localStorage.setItem(DISMISSED_KEY, new Date().toDateString());
    setVisible(false);
    setStep('alert');
  }

  function handleOpenCakto() {
    openCaktoCheckout({ email: user?.email, name: user?.name });
    setStep('awaiting');
  }

  async function handleConfirmPayment() {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 800));
    renewSubscription();
    setStep('success');
    setConfirming(false);
    setTimeout(() => {
      setVisible(false);
      setStep('alert');
    }, 2200);
  }

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={step !== 'awaiting' ? handleDismiss : undefined}
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden z-10"
            style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Top accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background: step === 'success'
                  ? 'linear-gradient(90deg, #00d26a, #10b981)'
                  : isToday
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #f59e0b, #d97706)',
              }}
            />

            <div className="p-6">
              {/* SUCCESS state */}
              <AnimatePresence mode="wait">
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-4 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(0,210,106,0.15)', border: '1px solid rgba(0,210,106,0.3)' }}
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-base font-bold text-slate-100 mb-1">Assinatura renovada!</p>
                    <p className="text-sm text-slate-500">Seu acesso foi estendido por mais 30 dias.</p>
                  </motion.div>
                )}

                {/* AWAITING state */}
                {step === 'awaiting' && (
                  <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                      >
                        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100">Aguardando pagamento</p>
                        <p className="text-xs text-slate-500 mt-0.5">Checkout CAKTO aberto em nova aba</p>
                      </div>
                    </div>

                    <div
                      className="rounded-xl px-4 py-3 mb-5 text-xs text-slate-400 leading-relaxed"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      Conclua o pagamento na aba do CAKTO. Após confirmar, clique no botão abaixo para ativar seu acesso.
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="success"
                        size="lg"
                        className="w-full"
                        loading={confirming}
                        onClick={handleConfirmPayment}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {confirming ? 'Verificando...' : 'Já realizei o pagamento'}
                      </Button>
                      <button
                        onClick={handleOpenCakto}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors py-1 flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Abrir CAKTO novamente
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ALERT state */}
                {step === 'alert' && (
                  <motion.div key="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isToday ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            border: isToday ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
                          }}
                        >
                          <AlertTriangle
                            className="w-5 h-5"
                            style={{ color: isToday ? '#ef4444' : '#f59e0b' }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">
                            {isToday ? 'Assinatura vence hoje!' : `Renove em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">FinTrack Premium</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                      {isToday
                        ? 'Sua assinatura vence hoje. Renove agora para não perder o acesso aos seus dados.'
                        : `Sua assinatura vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}. Renove antes do vencimento para manter o acesso.`}
                    </p>

                    {/* Price info */}
                    <div
                      className="flex items-center justify-between rounded-xl px-4 py-3 mb-5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Plano Mensal · via CAKTO</span>
                      </div>
                      <p className="text-base font-bold text-slate-100">
                        R$ 29<span className="text-slate-400 text-sm font-medium">,90</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {CAKTO_CHECKOUT_URL ? (
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full"
                          onClick={handleOpenCakto}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Renovar via CAKTO — R$ 29,90
                        </Button>
                      ) : (
                        <div
                          className="text-center text-xs text-amber-400 rounded-xl px-4 py-3"
                          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
                        >
                          Configure VITE_CAKTO_CHECKOUT_URL no .env para habilitar o checkout.
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="md"
                        className="w-full text-slate-500"
                        onClick={handleDismiss}
                      >
                        Lembrar depois
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
