import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import type { Transaction, FinancialSummary } from '@/types';

export function getMonthTransactions(transactions: Transaction[], date = new Date()): Transaction[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return transactions.filter(t => {
    try {
      return isWithinInterval(parseISO(t.date), { start, end });
    } catch {
      return false;
    }
  });
}

export function calculateSummary(transactions: Transaction[]): FinancialSummary {
  const monthly = getMonthTransactions(transactions);
  const monthlyIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;
  const monthlyProfit = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const expenseRate = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
  return { totalBalance, monthlyIncome, monthlyExpenses, monthlyProfit, savingsRate, expenseRate };
}

export function getHealthScore(summary: FinancialSummary): { score: number; label: string; color: string } {
  const { savingsRate } = summary;
  if (savingsRate >= 30) return { score: 95, label: 'Excelente', color: '#00d26a' };
  if (savingsRate >= 20) return { score: 78, label: 'Boa', color: '#10b981' };
  if (savingsRate >= 10) return { score: 60, label: 'Regular', color: '#f59e0b' };
  if (savingsRate >= 0) return { score: 40, label: 'Atenção', color: '#f97316' };
  return { score: 20, label: 'Crítica', color: '#ef4444' };
}

export function groupByMonth(transactions: Transaction[]): Record<string, { income: number; expense: number }> {
  const result: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const key = t.date.substring(0, 7); // YYYY-MM
    if (!result[key]) result[key] = { income: 0, expense: 0 };
    if (t.type === 'income') result[key].income += t.amount;
    else result[key].expense += t.amount;
  });
  return result;
}

export function groupByCategory(transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {};
  transactions.forEach(t => {
    result[t.categoryId] = (result[t.categoryId] || 0) + t.amount;
  });
  return result;
}
