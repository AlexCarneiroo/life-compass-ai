import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  cancelThreshold?: number; // Se puxar de volta antes desse ponto, cancela
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 100,
  cancelThreshold = 40, // Puxe de volta acima desse ponto para cancelar
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [willRefresh, setWillRefresh] = useState(false);
  const startY = useRef(0);
  const maxPullReached = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    // Só ativa se estiver no topo da página
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      maxPullReached.current = 0;
      setIsPulling(true);
      setWillRefresh(false);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && window.scrollY === 0) {
      // Aplica resistência para dar sensação natural
      const distance = Math.min(diff * 0.4, threshold * 1.8);
      setPullDistance(distance);
      
      // Rastreia o máximo atingido
      if (distance > maxPullReached.current) {
        maxPullReached.current = distance;
      }
      
      // Verifica se passou do threshold
      if (distance >= threshold) {
        setWillRefresh(true);
      } else if (maxPullReached.current >= threshold && distance < cancelThreshold) {
        // Usuário passou do threshold mas voltou - cancela
        setWillRefresh(false);
      }
      
      // Previne scroll normal quando puxando
      if (distance > 10) {
        e.preventDefault();
      }
    } else {
      // Se começou a rolar para cima, reseta
      if (isPulling && diff < 0) {
        setIsPulling(false);
        setPullDistance(0);
        setWillRefresh(false);
      }
    }
  }, [isPulling, isRefreshing, threshold, cancelThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    // Só recarrega se willRefresh ainda estiver true
    // (usuário não puxou de volta para cancelar)
    if (willRefresh && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Mantém no threshold durante refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setIsPulling(false);
    setWillRefresh(false);
    maxPullReached.current = 0;
  }, [isPulling, willRefresh, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current || document;
    
    container.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    container.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    container.addEventListener('touchend', handleTouchEnd as any, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart as any);
      container.removeEventListener('touchmove', handleTouchMove as any);
      container.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    willRefresh, // Indica se vai recarregar ao soltar
    progress: Math.min(pullDistance / threshold, 1),
  };
}

