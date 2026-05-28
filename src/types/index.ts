export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'transfer'
  | 'other';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
  createdAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  description?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  description?: string;
  createdAt: string;
}

export interface BankrollSession {
  id: string;
  date: string;
  startBalance: number;
  endBalance: number;
  profit: number;
  duration?: number;
  notes?: string;
  createdAt: string;
}

export interface Bankroll {
  id: string;
  currentBalance: number;
  initialBalance: number;
  totalProfit: number;
  totalLoss: number;
  sessions: BankrollSession[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  currency: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  savingsRate: number;
  expenseRate: number;
}

export interface FilterOptions {
  period: 'today' | '7days' | '30days' | '3months' | '6months' | '1year' | 'custom';
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
  categoryId?: string;
  search?: string;
}

export interface PierreSettings {
  enabled: boolean;
  popupEnabled: boolean;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'monthly';
  amount: number;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate: string;
  lastPaymentDate?: string;
  createdAt: string;
}
