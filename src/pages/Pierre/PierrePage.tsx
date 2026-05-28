import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { generateResponse, getInitialMessage, getMonthlySummary } from '@/services/pierre';
import { formatCurrency } from '@/utils/formatters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Resumo do mês',
  'Maiores gastos',
  'Minhas metas',
  'Dicas financeiras',
  'Saldo atual',
  'Minhas receitas',
];

function MessageText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold text-slate-100">{part}</strong> : part
            )}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

export function PierrePage() {
  const { user, transactions, categories, goals, bankrollSessions, bankrollBalance } = useApp();
  const data = { transactions, categories, goals, bankrollSessions, bankrollBalance, user };

  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: getInitialMessage(user?.name),
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const summary = getMonthlySummary(data);
  const capitalMonth = summary.monthName.charAt(0).toUpperCase() + summary.monthName.slice(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));

    const response = generateResponse(text, data);
    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100svh - 5rem)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/6 flex-shrink-0"
        style={{ background: 'rgba(10,10,15,0.98)' }}
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100">Pierre AI</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] text-slate-500">Assistente Financeiro Pessoal</p>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div
        className="px-4 pt-3 flex-shrink-0 border-b border-white/4"
        style={{ background: 'rgba(10,10,15,0.98)' }}
      >
        <button
          onClick={() => setShowSummary(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-2"
        >
          <span>📊 Resumo de {capitalMonth}</span>
          {showSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence initial={false}>
          {showSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 pb-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] text-slate-500">Receitas</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">{formatCurrency(summary.income)}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-[9px] text-slate-500">Despesas</span>
                  </div>
                  <p className="text-xs font-bold text-red-400">{formatCurrency(summary.expenses)}</p>
                </div>
                <div className={`border rounded-xl p-2.5 ${summary.balance >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <Wallet className={`w-3 h-3 ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                    <span className="text-[9px] text-slate-500">Saldo</span>
                  </div>
                  <p className={`text-xs font-bold ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
              </div>
              <div className="pb-3">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-slate-500">Taxa de poupança</span>
                  <span className={summary.savingsRate >= 20 ? 'text-emerald-400' : summary.savingsRate >= 10 ? 'text-amber-400' : 'text-red-400'}>
                    {summary.savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, summary.savingsRate))}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${summary.savingsRate >= 20 ? 'bg-emerald-500' : summary.savingsRate >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-500/20 border border-blue-500/30 text-slate-200 rounded-tr-sm'
                  : 'bg-white/5 border border-white/8 text-slate-400 rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-line">
                <MessageText content={msg.content} />
              </p>
              <p className="text-[9px] text-slate-600 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      <div
        className="px-4 pb-2 flex-shrink-0"
        style={{ background: 'rgba(10,10,15,0.98)' }}
      >
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isTyping}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/4 border border-white/10 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/8 hover:border-violet-500/30 transition-all duration-200 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div
        className="px-4 pb-4 flex-shrink-0"
        style={{ background: 'rgba(10,10,15,0.98)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte ao Pierre..."
            disabled={isTyping}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/6 transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-violet-500/20"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
