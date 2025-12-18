import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  cancelThreshold?: number; // Se puxar de volta antes desse ponto, cancela
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 60, // Reduzido de 100 para 60 - mais sensível
  cancelThreshold = 30, // Reduzido de 40 para 30
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [willRefresh, setWillRefresh] = useState(false);
  const startY = useRef(0);
  const maxPullReached = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);

  // Verifica se está no topo da página
  const checkIfAtTop = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    isAtTopRef.current = scrollTop <= 5; // Tolerância de 5px
    return isAtTopRef.current;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    // Verifica se está no topo
    if (checkIfAtTop()) {
      startY.current = e.touches[0].clientY;
      maxPullReached.current = 0;
      setIsPulling(true);
      setWillRefresh(false);
      setPullDistance(0);
    }
  }, [isRefreshing, checkIfAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Verifica se ainda está no topo
    if (!checkIfAtTop() && diff < 0) {
      // Se não está no topo e está rolando para cima, cancela
      setIsPulling(false);
      setPullDistance(0);
      setWillRefresh(false);
      return;
    }
    
    if (diff > 0 && isAtTopRef.current) {
      // Aplica resistência mais suave (0.5 em vez de 0.4) - mais responsivo
      const distance = Math.min(diff * 0.5, threshold * 2);
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
      
      // Previne scroll normal quando puxando (mais cedo)
      if (distance > 5) {
        e.preventDefault();
      }
    } else if (diff < 0 && isPulling) {
      // Se começou a rolar para cima, reseta
      setIsPulling(false);
      setPullDistance(0);
      setWillRefresh(false);
    }
  }, [isPulling, isRefreshing, threshold, cancelThreshold, checkIfAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    const shouldRefresh = willRefresh && !isRefreshing;
    
    // Só recarrega se willRefresh ainda estiver true
    // (usuário não puxou de volta para cancelar)
    if (shouldRefresh) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Mantém no threshold durante refresh
      try {
        await onRefresh();
      } finally {
        // Pequeno delay antes de esconder para feedback visual
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animação suave de volta
      setPullDistance(0);
    }
    
    setIsPulling(false);
    setWillRefresh(false);
    maxPullReached.current = 0;
  }, [isPulling, willRefresh, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current || document;
    
    // Listener para verificar scroll
    const handleScroll = () => {
      checkIfAtTop();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    container.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    container.addEventListener('touchend', handleTouchEnd as any, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart as any);
      container.removeEventListener('touchmove', handleTouchMove as any);
      container.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, checkIfAtTop]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    willRefresh, // Indica se vai recarregar ao soltar
    progress: Math.min(pullDistance / threshold, 1),
  };
}

