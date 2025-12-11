import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { notificationService, Notification } from '@/lib/firebase/notifications';
import { PatternDetector } from '@/lib/services/patternDetector';
import { toast } from 'sonner';

export function useNotifications() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      const allNotifications = await notificationService.getAll(userId);
      // Garante que read seja sempre booleano
      const normalizedNotifications = allNotifications.map(n => ({
        ...n,
        read: Boolean(n.read),
      }));
      const unread = normalizedNotifications.filter(n => !n.read);
      
      setNotifications(normalizedNotifications);
      setUnreadCount(unread.length);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setLoading(false);
    }
  }, [userId]);

  const checkPatterns = useCallback(async () => {
    if (!userId) return;

    try {
      // Detecta padrões
      const patterns = await PatternDetector.detectPatterns(userId);
      
      // Busca notificações existentes para evitar duplicatas
      const existingNotifications = await notificationService.getAll(userId);
      const existingPatternIds = new Set(
        existingNotifications
          .filter(n => n.data?.patternId)
          .map(n => n.data.patternId)
      );

      // Cria notificações para novos padrões
      for (const pattern of patterns) {
        // Verifica se já existe notificação para este padrão (últimas 24h)
        const patternId = `${pattern.category}-${pattern.type}-${pattern.id}`;
        const recentNotification = existingNotifications.find(
          n => n.data?.patternId === patternId &&
          new Date(n.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );

        if (!recentNotification) {
          // Cria nova notificação
          await notificationService.create({
            type: pattern.type,
            category: pattern.category,
            title: pattern.title,
            message: pattern.message,
            severity: pattern.severity,
            data: {
              patternId,
              ...pattern.data,
            },
          }, userId);

          // Mostra toast
          if (pattern.type === 'negative') {
            toast.warning(pattern.title, {
              description: pattern.message,
              duration: 5000,
            });
          } else {
            toast.success(pattern.title, {
              description: pattern.message,
              duration: 5000,
            });
          }
        }
      }

      // Recarrega notificações
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao verificar padrões:', error);
    }
  }, [userId, loadNotifications]);

  useEffect(() => {
    if (!userId) return;

    loadNotifications();
    
    // Verifica padrões a cada 5 minutos
    const patternCheckInterval = setInterval(() => {
      checkPatterns();
    }, 5 * 60 * 1000);

    // Carrega notificações a cada 5 minutos (aumentado para evitar conflitos com marcação como lida)
    const notificationInterval = setInterval(() => {
      loadNotifications();
    }, 5 * 60 * 1000);

    // Verifica padrões imediatamente ao montar
    checkPatterns();

    // Listener para verificar padrões quando um check-in é salvo
    const handleCheckinSaved = () => {
      // Aguarda um pouco para garantir que os dados foram salvos
      setTimeout(() => {
        checkPatterns();
      }, 1000);
    };

    window.addEventListener('checkin-saved', handleCheckinSaved);
    window.addEventListener('habit-completed', handleCheckinSaved);
    window.addEventListener('finance-entry-created', handleCheckinSaved);

    return () => {
      clearInterval(patternCheckInterval);
      clearInterval(notificationInterval);
      window.removeEventListener('checkin-saved', handleCheckinSaved);
      window.removeEventListener('habit-completed', handleCheckinSaved);
      window.removeEventListener('finance-entry-created', handleCheckinSaved);
    };
  }, [userId, loadNotifications, checkPatterns]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Atualiza o estado local primeiro para feedback imediato
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => {
        const updated = prev - 1;
        return updated >= 0 ? updated : 0;
      });
      
      // Atualiza no Firebase em background
      await notificationService.markAsRead(notificationId);
      
      // Recarrega após um pequeno delay para garantir sincronização
      setTimeout(() => {
        loadNotifications();
      }, 500);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      // Recarrega em caso de erro
      await loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Atualiza o estado local primeiro para feedback imediato
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Atualiza no Firebase em background
      await notificationService.markAllAsRead(userId);
      
      // Recarrega após um pequeno delay para garantir sincronização
      setTimeout(() => {
        loadNotifications();
      }, 500);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      // Recarrega em caso de erro
      await loadNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.delete(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };
}

