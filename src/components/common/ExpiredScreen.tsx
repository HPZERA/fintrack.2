import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ExternalLink, Shield, CheckCircle2, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { openCaktoCheckout, CAKTO_CHECKOUT_URL } from '@/lib/cakto';

type Step = 'idle' | 'awaiting' | 'confirming';

export function ExpiredScreen() {
  const { subscription, renewSubscription, logout, user } = useApp();
  const [step, setStep] = useState<Step>('idle');

  const isCancelled = subscription?.status === 'cancelled';

  function handleOpenCakto() {
    openCaktoCheckout({ email: user?.email, name: user?.name });
    setStep('awaiting');
  }

  async function handleConfirmPayment() {
    setStep('confirming');
    await new Promise(r => setTimeout(r, 900));
    renewSubscription();
    // renewSubscription sets status back to active — App.tsx will unmount this screen
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: '#0a0a0f' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <AnimatePresence mode="wait">

          {/* AWAITING / CONFIRMING */}
          {(step === 'awaiting' || step === 'confirming') && (
            <motion.div
              key="awaiting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <RefreshCw
                  className="w-9 h-9 text-blue-400"
                  style={{ animation: step === 'confirming' ? 'spin 1s linear infinite' : 'spin 2s linear infinite' }}
                />
              </div>

              <h1 className="text-xl font-black text-slate-100 mb-2">
                {step === 'confirming' ? 'Verificando pagamento...' : 'Aguardando pagamento'}
              </h1>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {step === 'confirming'
                  ? 'Estamos confirmando seu pagamento. Aguarde um momento.'
                  : 'Conclua o pagamento na aba do CAKTO e clique abaixo para confirmar.'}
              </p>

              <div
                className="w-full rounded-2xl px-4 py-3 mb-6 text-xs text-slate-400 leading-relaxed text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 font-medium">Seus dados estão preservados</span>
                </div>
                Após confirmar o pagamento seu acesso será restaurado imediatamente.
              </div>

              <Button
                variant="success"
                size="lg"
                className="w-full mb-3"
                loading={step === 'confirming'}
                onClick={handleConfirmPayment}
              >
                <CheckCircle2 className="w-4 h-4" />
                {step === 'confirming' ? 'Confirmando...' : 'Já realizei o pagamento'}
              </Button>

              <button
                onClick={handleOpenCakto}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors py-1 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir CAKTO novamente
              </button>

              <button
                onClick={() => setStep('idle')}
                className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
              >
                Voltar
              </button>
            </motion.div>
          )}

          {/* IDLE */}
          {step === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Lock icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    boxShadow: '0 0 40px rgba(239,68,68,0.08)',
                  }}
                >
                  <Lock className="w-9 h-9 text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-black text-slate-100 text-center mb-2">
                {isCancelled ? 'Assinatura Cancelada' : 'Acesso Bloqueado'}
              </h1>
              <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
                {isCancelled
                  ? 'Você cancelou sua assinatura. Reative para voltar a usar o FinTrack.'
                  : 'Sua assinatura expirou. Renove para continuar acessando seus dados financeiros.'}
              </p>

              {/* Data safe notice */}
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5"
                style={{ background: 'rgba(0,210,106,0.08)', border: '1px solid rgba(0,210,106,0.15)' }}
              >
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400 leading-relaxed">
                  Seus dados estão seguros e intactos. Nada foi alterado.
                </p>
              </div>

              {/* Price card */}
              <div
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06))',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">FinTrack Premium</p>
                    <p className="text-xs text-slate-500 mt-0.5">via CAKTO · Pagamento seguro</p>
                  </div>
                  <div className="flex items-end gap-0.5">
                    <span className="text-xl font-black text-slate-100">R$ 29</span>
                    <span className="text-sm font-bold text-slate-400 mb-0.5">,90</span>
                    <span className="text-xs text-slate-500 mb-0.5">/mês</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {['Dashboard completo', 'Transações ilimitadas', 'Metas financeiras', 'Relatórios avançados'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-slate-400">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {CAKTO_CHECKOUT_URL ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mb-2"
                  onClick={handleOpenCakto}
                >
                  <ExternalLink className="w-4 h-4" />
                  {isCancelled ? 'Reativar via CAKTO — R$ 29,90' : 'Renovar via CAKTO — R$ 29,90'}
                </Button>
              ) : (
                <div
                  className="text-center text-xs text-amber-400 rounded-xl px-4 py-3 mb-2"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  Configure VITE_CAKTO_CHECKOUT_URL no .env para habilitar o checkout.
                </div>
              )}

              <button
                onClick={logout}
                className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-2"
              >
                Sair da conta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
