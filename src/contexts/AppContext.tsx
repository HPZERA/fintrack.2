import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Transaction, Category, Goal, BankrollSession, User, Subscription, PierreSettings } from '@/types';
import { subDays, addDays, format } from 'date-fns';

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Salário', icon: 'briefcase', color: '#00d26a', type: 'income', createdAt: fmt(today) },
  { id: 'cat-2', name: 'Freelance', icon: 'laptop', color: '#10b981', type: 'income', createdAt: fmt(today) },
  { id: 'cat-3', name: 'Investimentos', icon: 'trending-up', color: '#3b82f6', type: 'income', createdAt: fmt(today) },
  { id: 'cat-4', name: 'Alimentação', icon: 'utensils', color: '#f97316', type: 'expense', createdAt: fmt(today) },
  { id: 'cat-5', name: 'Transporte', icon: 'car', color: '#8b5cf6', type: 'expense', createdAt: fmt(today) },
  { id: 'cat-6', name: 'Lazer', icon: 'gamepad-2', color: '#ec4899', type: 'expense', createdAt: fmt(today) },
  { id: 'cat-7', name: 'Cassino', icon: 'dice-5', color: '#f59e0b', type: 'both', createdAt: fmt(today) },
  { id: 'cat-8', name: 'Roleta', icon: 'circle-dot', color: '#ef4444', type: 'both', createdAt: fmt(today) },
  { id: 'cat-9', name: 'Moradia', icon: 'home', color: '#06b6d4', type: 'expense', createdAt: fmt(today) },
  { id: 'cat-10', name: 'Saúde', icon: 'heart-pulse', color: '#d946ef', type: 'expense', createdAt: fmt(today) },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 't-1', title: 'Salário Março', amount: 5500, type: 'income', categoryId: 'cat-1', date: fmt(subDays(today, 2)), description: 'Salário mensal', paymentMethod: 'transfer', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-2', title: 'Freelance App', amount: 1200, type: 'income', categoryId: 'cat-2', date: fmt(subDays(today, 5)), description: 'Desenvolvimento de aplicativo', paymentMethod: 'pix', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-3', title: 'Rendimento Invest.', amount: 340, type: 'income', categoryId: 'cat-3', date: fmt(subDays(today, 8)), paymentMethod: 'transfer', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-4', title: 'Supermercado', amount: 420, type: 'expense', categoryId: 'cat-4', date: fmt(subDays(today, 1)), paymentMethod: 'debit_card', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-5', title: 'Uber', amount: 45, type: 'expense', categoryId: 'cat-5', date: fmt(today), paymentMethod: 'credit_card', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-6', title: 'Netflix + Spotify', amount: 75, type: 'expense', categoryId: 'cat-6', date: fmt(subDays(today, 3)), paymentMethod: 'credit_card', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-7', title: 'Cassino Online', amount: 300, type: 'income', categoryId: 'cat-7', date: fmt(subDays(today, 4)), notes: 'Boa sessão de roleta', paymentMethod: 'pix', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-8', title: 'Perda Roleta', amount: 150, type: 'expense', categoryId: 'cat-8', date: fmt(subDays(today, 6)), notes: 'Perda na sessão noturna', paymentMethod: 'pix', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-9', title: 'Aluguel', amount: 1500, type: 'expense', categoryId: 'cat-9', date: fmt(subDays(today, 10)), paymentMethod: 'transfer', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-10', title: 'Farmácia', amount: 85, type: 'expense', categoryId: 'cat-10', date: fmt(subDays(today, 7)), paymentMethod: 'cash', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-11', title: 'Freelance Design', amount: 800, type: 'income', categoryId: 'cat-2', date: fmt(subDays(today, 12)), paymentMethod: 'pix', createdAt: fmt(today), updatedAt: fmt(today) },
  { id: 't-12', title: 'Restaurante', amount: 120, type: 'expense', categoryId: 'cat-4', date: fmt(subDays(today, 9)), paymentMethod: 'credit_card', createdAt: fmt(today), updatedAt: fmt(today) },
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'g-1', title: 'Reserva de Emergência', targetAmount: 15000, currentAmount: 8500, deadline: '2026-12-31', icon: 'shield', color: '#3b82f6', description: 'Fundo de emergência para 6 meses', createdAt: fmt(today) },
  { id: 'g-2', title: 'Banca Cassino R$5.000', targetAmount: 5000, currentAmount: 2200, deadline: '2026-09-30', icon: 'dice-5', color: '#f59e0b', description: 'Aumentar banca de jogo', createdAt: fmt(today) },
  { id: 'g-3', title: 'Viagem Europa', targetAmount: 12000, currentAmount: 3100, deadline: '2027-06-30', icon: 'plane', color: '#00d26a', description: 'Viagem de férias para a Europa', createdAt: fmt(today) },
];

const DEFAULT_SESSIONS = [
  { id: 'bs-1', date: fmt(subDays(today, 1)), startBalance: 2000, endBalance: 2300, profit: 300, duration: 90, notes: 'Boa sessão, foco na roleta europeia', createdAt: fmt(today) },
  { id: 'bs-2', date: fmt(subDays(today, 3)), startBalance: 2300, endBalance: 2100, profit: -200, duration: 60, notes: 'Má fase no início', createdAt: fmt(today) },
  { id: 'bs-3', date: fmt(subDays(today, 7)), startBalance: 1800, endBalance: 2300, profit: 500, duration: 120, notes: 'Melhor sessão do mês', createdAt: fmt(today) },
  { id: 'bs-4', date: fmt(subDays(today, 10)), startBalance: 2100, endBalance: 1800, profit: -300, duration: 45, notes: 'Parei cedo para limitar perdas', createdAt: fmt(today) },
  { id: 'bs-5', date: fmt(subDays(today, 14)), startBalance: 1500, endBalance: 2100, profit: 600, duration: 150, notes: 'Excelente gerenciamento de banca', createdAt: fmt(today) },
];

const DEFAULT_USER: User = {
  id: 'user-1',
  email: 'usuario@fintrack.app',
  name: 'João Silva',
  currency: 'BRL',
  emailVerified: true,
  createdAt: fmt(subDays(today, 90)),
};

const DEFAULT_PIERRE_SETTINGS: PierreSettings = {
  enabled: true,
  popupEnabled: true,
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'sub-1',
  userId: 'user-1',
  plan: 'monthly',
  amount: 29.90,
  status: 'active',
  startDate: fmt(subDays(today, 27)),
  renewalDate: fmt(addDays(today, 2)),
  lastPaymentDate: fmt(subDays(today, 27)),
  createdAt: fmt(subDays(today, 27)),
};

interface PendingVerification {
  email: string;
  name: string;
  code: string;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  pendingVerification: PendingVerification | null;
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  bankrollSessions: BankrollSession[];
  bankrollBalance: number;
  subscription: Subscription | null;
  pierreSettings: PierreSettings;

  login: (email: string, _password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, _password: string, name: string) => Promise<string>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: () => string;
  renewSubscription: () => void;
  cancelSubscription: () => void;
  updatePierreSettings: (s: Partial<PierreSettings>) => void;

  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (c: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, g: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addBankrollSession: (s: Omit<BankrollSession, 'id' | 'createdAt'>) => void;
  deleteBankrollSession: (id: string) => void;
  updateBankrollBalance: (balance: number) => void;

  updateUser: (u: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bankrollSessions, setBankrollSessions] = useState<BankrollSession[]>([]);
  const [bankrollBalance, setBankrollBalance] = useState(2200);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pierreSettings, setPierreSettings] = useState<PierreSettings>(DEFAULT_PIERRE_SETTINGS);

  const login = useCallback(async (_email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 800));
    setUser(DEFAULT_USER);
    setTransactions(DEFAULT_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setGoals(DEFAULT_GOALS);
    setBankrollSessions(DEFAULT_SESSIONS);
    setSubscription(DEFAULT_SUBSCRIPTION);
    setIsAuthenticated(true);
  }, []);

  // Returns the verification code (for demo — in production this goes only via email)
  const register = useCallback(async (_email: string, _password: string, name: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 800));
    const code = generateCode();
    setPendingVerification({ email: _email.trim(), name, code });
    return code;
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    if (!pendingVerification) throw new Error('Sem verificação pendente');
    await new Promise(r => setTimeout(r, 600));
    if (code.trim() !== pendingVerification.code) throw new Error('Código inválido');

    const newUser: User = {
      ...DEFAULT_USER,
      id: `user-${Date.now()}`,
      name: pendingVerification.name,
      email: pendingVerification.email,
      emailVerified: true,
      createdAt: fmt(today),
    };
    setUser(newUser);
    setCategories(DEFAULT_CATEGORIES);
    setTransactions([]);
    setGoals([]);
    setBankrollSessions([]);
    setSubscription({
      ...DEFAULT_SUBSCRIPTION,
      id: `sub-${Date.now()}`,
      userId: newUser.id,
      startDate: fmt(today),
      renewalDate: fmt(addDays(today, 30)),
      lastPaymentDate: fmt(today),
      createdAt: fmt(today),
    });
    setPendingVerification(null);
    setIsAuthenticated(true);
  }, [pendingVerification]);

  const resendCode = useCallback((): string => {
    const code = generateCode();
    setPendingVerification(prev => prev ? { ...prev, code } : null);
    return code;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setPendingVerification(null);
    setTransactions([]);
    setCategories([]);
    setGoals([]);
    setBankrollSessions([]);
    setSubscription(null);
    setPierreSettings(DEFAULT_PIERRE_SETTINGS);
  }, []);

  const renewSubscription = useCallback(() => {
    setSubscription(prev => {
      if (!prev) return prev;
      const base = prev.status === 'expired' ? today : new Date(prev.renewalDate);
      return {
        ...prev,
        status: 'active',
        renewalDate: fmt(addDays(base, 30)),
        lastPaymentDate: fmt(today),
      };
    });
  }, []);

  const cancelSubscription = useCallback(() => {
    setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : prev);
  }, []);

  const updatePierreSettings = useCallback((s: Partial<PierreSettings>) => {
    setPierreSettings(prev => ({ ...prev, ...s }));
  }, []);

  const genId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    setTransactions(prev => [{ ...t, id: genId(), createdAt: fmt(today), updatedAt: fmt(today) }, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    setTransactions(prev => prev.map(x => x.id === id ? { ...x, ...t, updatedAt: fmt(today) } : x));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
  }, []);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'createdAt'>) => {
    setCategories(prev => [...prev, { ...c, id: genId(), createdAt: fmt(today) }]);
  }, []);

  const updateCategory = useCallback((id: string, c: Partial<Category>) => {
    setCategories(prev => prev.map(x => x.id === id ? { ...x, ...c } : x));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals(prev => [...prev, { ...g, id: genId(), createdAt: fmt(today) }]);
  }, []);

  const updateGoal = useCallback((id: string, g: Partial<Goal>) => {
    setGoals(prev => prev.map(x => x.id === id ? { ...x, ...g } : x));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(x => x.id !== id));
  }, []);

  const addBankrollSession = useCallback((s: Omit<BankrollSession, 'id' | 'createdAt'>) => {
    setBankrollSessions(prev => [{ ...s, id: genId(), createdAt: fmt(today) }, ...prev]);
    setBankrollBalance(s.endBalance);
  }, []);

  const deleteBankrollSession = useCallback((id: string) => {
    setBankrollSessions(prev => prev.filter(x => x.id !== id));
  }, []);

  const updateBankrollBalance = useCallback((balance: number) => {
    setBankrollBalance(balance);
  }, []);

  const updateUser = useCallback((u: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...u } : prev);
  }, []);

  return (
    <AppContext.Provider value={{
      user, isAuthenticated, pendingVerification,
      transactions, categories, goals, bankrollSessions, bankrollBalance,
      subscription, pierreSettings,
      login, logout, register, verifyEmail, resendCode,
      renewSubscription, cancelSubscription, updatePierreSettings,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addGoal, updateGoal, deleteGoal,
      addBankrollSession, deleteBankrollSession, updateBankrollBalance,
      updateUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
