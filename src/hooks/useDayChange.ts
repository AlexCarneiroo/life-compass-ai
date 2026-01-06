import { useEffect } from 'react';

/**
 * Hook para detectar mudança de dia e disparar eventos
 * Quando o dia muda (meia-noite), dispara um evento 'day-changed'
 * que pode ser ouvido por outros componentes para resetar estados
 */
export function useDayChange() {
  useEffect(() => {
    const getTodayString = () => new Date().toISOString().split('T')[0];
    
    // Armazena o dia atual
    let currentDay = getTodayString();
    
    // Função para verificar se o dia mudou
    const checkDayChange = () => {
      const today = getTodayString();
      if (today !== currentDay) {
        currentDay = today;
        // Dispara evento global quando o dia muda
        window.dispatchEvent(new CustomEvent('day-changed', { detail: { newDay: today } }));
      }
    };
    
    // Verifica a cada minuto se o dia mudou
    const interval = setInterval(checkDayChange, 60000); // 1 minuto
    
    // Verifica imediatamente ao montar
    checkDayChange();
    
    // Também verifica quando a página ganha foco (usuário volta ao app)
    const handleFocus = () => {
      checkDayChange();
    };
    window.addEventListener('focus', handleFocus);
    
    // Verifica quando a visibilidade da página muda
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkDayChange();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

/**
 * Hook para reagir a mudanças de dia
 * Útil para componentes que precisam recarregar dados quando o dia muda
 */
export function useOnDayChange(callback: () => void) {
  useEffect(() => {
    const handleDayChange = () => {
      callback();
    };
    
    window.addEventListener('day-changed', handleDayChange);
    
    return () => {
      window.removeEventListener('day-changed', handleDayChange);
    };
  }, [callback]);
}



