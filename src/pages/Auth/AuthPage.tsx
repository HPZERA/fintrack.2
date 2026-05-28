import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, ArrowRight, ChevronLeft, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/Toast';
import {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  isRateLimited,
  recordFailedAttempt,
  clearRateLimit,
  sanitizeName,
  type PasswordStrength,
} from '@/utils/security';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  weak:   { label: 'Fraca',  color: '#ef4444', width: '33%' },
  medium: { label: 'Média',  color: '#f59e0b', width: '66%' },
  strong: { label: 'Forte',  color: '#00d26a', width: '100%' },
};

const CODE_LENGTH = 6;

export function AuthPage() {
  const { login, register, verifyEmail, resendCode, pendingVerification } = useApp();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const [lockSecondsLeft, setLockSecondsLeft] = useState<number | false>(false);

  // Verification code state
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [codeError, setCodeError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Switch to verify mode automatically when pendingVerification is set
  useEffect(() => {
    if (pendingVerification) setMode('verify');
  }, [pendingVerification]);

  // Countdown timer while locked out
  useEffect(() => {
    const remaining = isRateLimited();
    setLockSecondsLeft(remaining);
    if (!remaining) return;
    const interval = setInterval(() => {
      const r = isRateLimited();
      setLockSecondsLeft(r);
      if (!r) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  function validate(): boolean {
    const emailErr = validateEmail(form.email);
    const passErr  = validatePassword(form.password, mode === 'register');
    const nameErr  = mode === 'register' && !form.name.trim() ? 'Nome obrigatório' : '';
    setErrors({ email: emailErr ?? '', password: passErr ?? '', name: nameErr });
    return !emailErr && !passErr && !nameErr;
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    const locked = isRateLimited();
    if (locked) { setLockSecondsLeft(locked); return; }
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
        clearRateLimit();
        toast('Bem-vindo de volta!', 'success');
      } else if (mode === 'register') {
        const code = await register(form.email.trim(), form.password, sanitizeName(form.name));
        clearRateLimit();
        // In production the code goes only by email. For demo, show in toast.
        toast(`Código de verificação enviado! (demo: ${code})`, 'success');
      }
    } catch {
      recordFailedAttempt();
      const remaining = isRateLimited();
      if (remaining) {
        setLockSecondsLeft(remaining);
        toast('Muitas tentativas. Aguarde 15 minutos.', 'error');
      } else {
        toast('E-mail ou senha incorretos.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const emailErr = validateEmail(form.email);
    if (emailErr) { setErrors(prev => ({ ...prev, email: emailErr })); return; }
    toast('Link de recuperação enviado para ' + form.email.trim(), 'success');
    setMode('login');
  };

  // ── Verification code handlers ──────────────────────────────────────────────

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setCodeError('');
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  const handleVerify = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setCodeError('Digite os 6 dígitos do código');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(code);
      toast('E-mail verificado! Bem-vindo ao FinTrack.', 'success');
    } catch {
      setCodeError('Código inválido. Verifique e tente novamente.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  function handleResend() {
    const newCode = resendCode();
    setResendCooldown(60);
    setDigits(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    toast(`Novo código enviado! (demo: ${newCode})`, 'success');
  }

  const strength = mode === 'register' && form.password
    ? getPasswordStrength(form.password)
    : null;

  const lockMinutes = lockSecondsLeft
    ? `${Math.floor(lockSecondsLeft / 60)}:${String(lockSecondsLeft % 60).padStart(2, '0')}`
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">FinTrack</h1>
          <p className="text-sm text-slate-500 mt-1">Gestão Financeira Inteligente</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(19,19,31,0.95)', backdropFilter: 'blur(20px)' }}>
          <AnimatePresence mode="wait">

            {/* ── VERIFY EMAIL ────────────────────────────────────── */}
            {mode === 'verify' && pendingVerification && (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleVerify}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center mb-2">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-100">Verifique seu e-mail</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Enviamos um código de 6 dígitos para{' '}
                    <span className="text-slate-300 font-medium">{pendingVerification.email}</span>
                  </p>
                </div>

                {/* 6-digit code input */}
                <div className="flex gap-2 justify-center">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={handleDigitPaste}
                      className="w-11 h-13 text-center text-lg font-bold rounded-xl outline-none transition-all duration-200"
                      style={{
                        height: '52px',
                        background: 'rgba(255,255,255,0.05)',
                        border: codeError
                          ? '1.5px solid rgba(239,68,68,0.6)'
                          : d
                          ? '1.5px solid rgba(59,130,246,0.6)'
                          : '1.5px solid rgba(255,255,255,0.1)',
                        color: '#f1f5f9',
                        caretColor: '#3b82f6',
                      }}
                    />
                  ))}
                </div>

                {/* Code error */}
                {codeError && (
                  <p className="text-xs text-red-400 text-center">{codeError}</p>
                )}

                <Button type="submit" loading={loading} className="w-full h-12">
                  <CheckCircle2 className="w-4 h-4" />
                  Verificar e-mail
                </Button>

                {/* Resend */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-slate-500">Não recebeu?</span>
                  {resendCooldown > 0 ? (
                    <span className="text-slate-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Reenviar em {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Reenviar código
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-white/6">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors mx-auto"
                  >
                    <ChevronLeft className="w-3 h-3" /> Voltar ao cadastro
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── LOGIN / REGISTER ─────────────────────────────────── */}
            {(mode === 'login' || mode === 'register') && (
              <motion.form
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {mode === 'login' ? 'Bem-vindo de volta' : 'Comece a controlar suas finanças'}
                  </p>
                </div>

                {/* Rate limit banner */}
                {lockMinutes && (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300">
                      Conta bloqueada por muitas tentativas. Tente em <span className="font-bold">{lockMinutes}</span>.
                    </p>
                  </div>
                )}

                {mode === 'register' && (
                  <Input
                    label="Nome completo"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={set('name')}
                    leftIcon={<User className="w-4 h-4" />}
                    autoComplete="name"
                    error={errors.name}
                  />
                )}

                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={set('email')}
                  leftIcon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  error={errors.email}
                />

                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Senha"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPass(s => !s)}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    error={errors.password}
                  />

                  {/* Password strength bar (register only) */}
                  {strength && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <motion.div
                          animate={{ width: STRENGTH_CONFIG[strength].width }}
                          transition={{ duration: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: STRENGTH_CONFIG[strength].color }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: STRENGTH_CONFIG[strength].color }}>
                        {STRENGTH_CONFIG[strength].label}
                      </span>
                    </div>
                  )}
                </div>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}

                <Button type="submit" loading={loading} disabled={!!lockSecondsLeft} className="w-full h-12">
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/6" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 text-slate-500" style={{ background: '#13131f' }}>ou</span>
                  </div>
                </div>

                <p className="text-center text-sm text-slate-500">
                  {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({ name: '', email: '', password: '' }); }}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {mode === 'login' ? 'Criar agora' : 'Fazer login'}
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── FORGOT PASSWORD ──────────────────────────────────── */}
            {mode === 'forgot' && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleForgot}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Recuperar senha</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Enviaremos um link de recuperação</p>
                </div>
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={set('email')}
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                />
                <Button type="submit" className="w-full h-12">
                  Enviar link de recuperação
                </Button>
              </motion.form>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          FinTrack © 2026 · Seguro e privado
        </p>
      </motion.div>
    </div>
  );
}
