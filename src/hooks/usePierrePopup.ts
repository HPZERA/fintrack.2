import { useState, useEffect, useCallback } from 'react';

const MAX_DAILY = 3;
const MIN_INTERVAL_MS = 90 * 60 * 1000; // 90 min entre exibições
const INITIAL_DELAY_MS = 12 * 1000;     // 12s após logar

function todayKey() {
  return `pierre_popup_${new Date().toISOString().slice(0, 10)}`;
}

function getDailyCount(): number {
  return parseInt(localStorage.getItem(todayKey()) || '0', 10);
}

function getLastShown(): number {
  return parseInt(localStorage.getItem('pierre_popup_last_shown') || '0', 10);
}

export function usePierrePopup() {
  const [isVisible, setIsVisible] = useState(false);

  const tryShow = useCallback(() => {
    if (getDailyCount() >= MAX_DAILY) return;
    if (Date.now() - getLastShown() < MIN_INTERVAL_MS) return;
    setIsVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    const count = getDailyCount();
    localStorage.setItem(todayKey(), String(count + 1));
    localStorage.setItem('pierre_popup_last_shown', String(Date.now()));
  }, []);

  useEffect(() => {
    // Exibição inicial após delay
    const initialTimer = setTimeout(tryShow, INITIAL_DELAY_MS);

    // Verificação periódica para as exibições seguintes
    const interval = setInterval(tryShow, MIN_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [tryShow]);

  return { isVisible, dismiss };
}
