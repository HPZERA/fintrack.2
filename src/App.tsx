import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/pages/Auth/AuthPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { TransactionsPage } from '@/pages/Transactions/TransactionsPage';
import { ExtractPage } from '@/pages/Extract/ExtractPage';
import { CategoriesPage } from '@/pages/Categories/CategoriesPage';
import { GoalsPage } from '@/pages/Goals/GoalsPage';
import { BankrollPage } from '@/pages/Bankroll/BankrollPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { SubscriptionsPage } from '@/pages/Subscriptions/SubscriptionsPage';
import { PierrePage } from '@/pages/Pierre/PierrePage';
import { RenewalAlert } from '@/components/common/RenewalAlert';
import { ExpiredScreen } from '@/components/common/ExpiredScreen';

function AppRoutes() {
  const { isAuthenticated, subscription } = useApp();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const isBlocked = subscription?.status === 'expired' || subscription?.status === 'cancelled';

  if (isBlocked) {
    return <ExpiredScreen />;
  }

  return (
    <>
      <RenewalAlert />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/extract" element={<ExtractPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/bankroll" element={<BankrollPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/pierre" element={<PierrePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
