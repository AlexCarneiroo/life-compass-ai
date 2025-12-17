import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { notificationsService, AppNotification } from '@/lib/firebase/notifications';
import { logger } from '@/lib/utils/logger';

// Re-export para compatibilidade
export type Notification = AppNotification;

export function useNotifications() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Subscribe para atualizações em tempo real
    unsubscribeRef.current = notificationsService.subscribe(userId, (newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await notificationsService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      logger.error('Erro ao marcar todas como lidas:', error);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      logger.error('Erro ao deletar notificação:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const all = await notificationsService.getAll(userId);
      setNotifications(all);
    } catch (error) {
      logger.error('Erro ao recarregar notificações:', error);
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}
