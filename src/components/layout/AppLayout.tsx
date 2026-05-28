import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { PierrePopup } from '@/components/common/PierrePopup';
import { usePierrePopup } from '@/hooks/usePierrePopup';

export function AppLayout() {
  const { isVisible, dismiss } = usePierrePopup();

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-20 md:pb-0">
        <Outlet />
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
      <PierrePopup isVisible={isVisible} onDismiss={dismiss} />
    </div>
  );
}
