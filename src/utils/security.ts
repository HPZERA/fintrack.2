const RATE_LIMIT_KEY = 'auth_rl';
const CHECKOUT_NONCE_KEY = 'co_nonce';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitState {
  attempts: number;
  lockedUntil: number;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'E-mail obrigatório';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return 'E-mail inválido';
  return null;
}

export function validatePassword(password: string, isRegister = false): string | null {
  if (!password) return 'Senha obrigatória';
  if (!isRegister) return null;
  if (password.length < 8) return 'Mínimo 8 caracteres';
  if (!/[a-zA-Z]/.test(password)) return 'Deve conter pelo menos uma letra';
  if (!/[0-9]/.test(password)) return 'Deve conter pelo menos um número';
  return null;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';
  const checks = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/[<>"';&`]/g, '').slice(0, 100);
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

function getState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (raw) return JSON.parse(raw) as RateLimitState;
  } catch { /* ignore */ }
  return { attempts: 0, lockedUntil: 0 };
}

function setState(s: RateLimitState): void {
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(s));
}

/** Returns seconds remaining if locked, false otherwise. */
export function isRateLimited(): number | false {
  const s = getState();
  if (s.lockedUntil > Date.now()) {
    return Math.ceil((s.lockedUntil - Date.now()) / 1000);
  }
  if (s.lockedUntil && s.lockedUntil <= Date.now()) {
    setState({ attempts: 0, lockedUntil: 0 });
  }
  return false;
}

export function recordFailedAttempt(): void {
  const s = getState();
  const attempts = s.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
  setState({ attempts, lockedUntil });
}

export function clearRateLimit(): void {
  sessionStorage.removeItem(RATE_LIMIT_KEY);
}

// ── CAKTO anti-bypass nonce ───────────────────────────────────────────────────
// Prevents activating subscription by manually typing ?cakto_payment=success
// without having gone through the actual checkout flow.

export function setCheckoutNonce(): void {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(CHECKOUT_NONCE_KEY, nonce);
}

/** Returns true only if a nonce was set (checkout was actually opened). */
export function verifyAndClearCheckoutNonce(): boolean {
  const nonce = localStorage.getItem(CHECKOUT_NONCE_KEY);
  if (!nonce) return false;
  localStorage.removeItem(CHECKOUT_NONCE_KEY);
  return true;
}
