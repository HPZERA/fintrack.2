import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getMonthlySummary } from '@/services/pierre';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  isVisible: boolean;
  onDismiss: () => void;
}

export function PierrePopup({ isVisible, onDismiss }: Props) {
  const navigate = useNavigate();
  const { transactions, categories, goals, bankrollSessions, bankrollBalance, user } = useApp();
  const summary = getMonthlySummary({ transactions, categories, goals, bankrollSessions, bankrollBalance, user });

  const monthName = format(new Date(), 'MMMM', { locale: ptBR });
  const capitalMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const firstName = user?.name?.split(' ')[0] || 'você';

  const handleOpen = () => {
    onDismiss();
    navigate('/pierre');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop leve para fechar ao clicar fora */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onDismiss}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[22rem] z-50"
          >
            <div
              className="rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-500/10 overflow-hidden"
              style={{ background: 'rgba(12,8,22,0.97)', backdropFilter: 'blur(24px)' }}
            >
              {/* Barra decorativa superior */}
              <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">Pierre AI</p>
                    <p className="text-[9px] text-violet-400">Resumo de {capitalMonth} disponível</p>
                  </div>
                </div>
                <button
                  onClick={onDismiss}
                  className="text-slate-600 hover:text-slate-400 transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mensagem */}
              <div className="px-4 pb-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Oi, <span className="text-slate-200 font-medium">{firstName}</span>! Preparei uma análise das suas finanças. Dá uma olhada 👇
                </p>
              </div>

              {/* Mini cards do resumo */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                  <TrendingUp className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[8px] text-slate-500 mb-0.5">Receitas</p>
                  <p className="text-[10px] font-bold text-emerald-400 leading-none">{formatCurrency(summary.income)}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
                  <TrendingDown className="w-3 h-3 text-red-400 mx-auto mb-1" />
                  <p className="text-[8px] text-slate-500 mb-0.5">Despesas</p>
                  <p className="text-[10px] font-bold text-red-400 leading-none">{formatCurrency(summary.expenses)}</p>
                </div>
                <div className={`border rounded-xl p-2.5 text-center ${summary.balance >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                  <Wallet className={`w-3 h-3 mx-auto mb-1 ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                  <p className="text-[8px] text-slate-500 mb-0.5">Saldo</p>
                  <p className={`text-[10px] font-bold leading-none ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
              </div>

              {/* Taxa de poupança */}
              <div className="px-4 pb-3">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-slate-500">Taxa de poupança</span>
                  <span className={summary.savingsRate >= 20 ? 'text-emerald-400' : summary.savingsRate >= 10 ? 'text-amber-400' : 'text-red-400'}>
                    {summary.savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/6 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, summary.savingsRate))}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full ${summary.savingsRate >= 20 ? 'bg-emerald-500' : summary.savingsRate >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>

              {/* Botão CTA */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleOpen}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-700 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20"
                >
                  <span>Ver análise completa com Pierre</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
