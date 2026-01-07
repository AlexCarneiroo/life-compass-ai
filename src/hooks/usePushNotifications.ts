import { useState, useEffect, useCallback, useRef } from 'react';
import { pushNotificationService } from '@/lib/services/pushNotifications';
import { useAuth } from './useAuth';
import { habitsService } from '@/lib/firebase/habits';
import { Habit } from '@/types';
import { checkinService } from '@/lib/firebase/checkin';
import { userSettingsService } from '@/lib/firebase/userSettings';

interface ScheduledReminder {
  id: string;
  timeoutId: number;
  type: 'habit' | 'checkin';
  time: string;
}

export function usePushNotifications() {
  const { userId } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    setIsSupported(pushNotificationService.isSupported());
    setHasPermission(pushNotificationService.hasPermission());
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await pushNotificationService.requestPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const sendTestNotification = useCallback(async () => {
    return pushNotificationService.sendNotification({
      title: '🎉 LifeOS',
      body: 'Notificações ativadas com sucesso!',
      tag: 'test-notification',
    });
  }, []);

  /**
   * Agenda lembretes de hábitos
   */
  const scheduleHabitReminders = useCallback(async () => {
    if (!userId || !hasPermission) return;

    try {
      const habits = await habitsService.getAll(userId);
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Cancela lembretes anteriores
      scheduledReminders
        .filter(r => r.type === 'habit')
        .forEach(r => pushNotificationService.cancelScheduledNotification(r.timeoutId));

      const newReminders: ScheduledReminder[] = [];

      habits.forEach((habit: Habit) => {
        // Verifica se lembrete está ativado e tem horário
        if (!habit.reminderEnabled || !habit.reminderTime) return;

        // Não lembra se já completou hoje
        const isCompletedToday = habit.completedDates?.includes(today);
        if (isCompletedToday) return;

        // Parse do horário
        const [hours, minutes] = habit.reminderTime.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);

        // Se horário passou, agenda para amanhã
        if (reminderDate <= now) {
          reminderDate.setDate(reminderDate.getDate() + 1);
        }

        const timeoutId = pushNotificationService.scheduleNotification(
          {
            title: `⏰ Hora do hábito: ${habit.name}`,
            body: habit.description || 'Não esqueça de completar seu hábito!',
            tag: `habit-${habit.id}`,
            data: { type: 'habit', habitId: habit.id },
          },
          reminderDate
        );

        if (timeoutId > 0) {
          newReminders.push({
            id: habit.id,
            timeoutId,
            type: 'habit',
            time: habit.reminderTime,
          });
        }
      });

      setScheduledReminders(prev => [
        ...prev.filter(r => r.type !== 'habit'),
        ...newReminders,
      ]);
    } catch (error) {
      console.error('Erro ao agendar lembretes de hábitos:', error);
    }
  }, [userId, hasPermission, scheduledReminders]);

  /**
   * Agenda lembrete de check-in diário
   */
  const scheduleCheckinReminder = useCallback(async (time: string = '21:00') => {
    if (!userId || !hasPermission) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Verifica se já fez check-in hoje
      const todayCheckin = await checkinService.getByDate(userId, today);
      if (todayCheckin) return;

      // Cancela lembretes anteriores
      scheduledReminders
        .filter(r => r.type === 'checkin')
        .forEach(r => pushNotificationService.cancelScheduledNotification(r.timeoutId));

      const [hours, minutes] = time.split(':').map(Number);
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      // Se horário passou, agenda para amanhã
      if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      const timeoutId = pushNotificationService.scheduleNotification(
        {
          title: '📝 Hora do Check-in Diário',
          body: 'Como foi seu dia? Registre seu humor, energia e produtividade.',
          tag: 'daily-checkin',
          data: { type: 'checkin' },
          requireInteraction: true,
        },
        reminderDate
      );

      if (timeoutId > 0) {
        setScheduledReminders(prev => [
          ...prev.filter(r => r.type !== 'checkin'),
          { id: 'daily-checkin', timeoutId, type: 'checkin', time },
        ]);
      }
    } catch (error) {
      console.error('Erro ao agendar lembrete de check-in:', error);
    }
  }, [userId, hasPermission, scheduledReminders]);

  /**
   * Inicializa lembretes na primeira carga
   */
  useEffect(() => {
    if (!hasPermission || !userId || isInitializedRef.current) return;

    isInitializedRef.current = true;

    const initReminders = async () => {
      try {
        const settings = await userSettingsService.getNotificationSettings(userId);

        if (settings.habitRemindersEnabled) {
          scheduleHabitReminders();
        }

        if (settings.checkinReminderEnabled && settings.checkinReminderTime) {
          scheduleCheckinReminder(settings.checkinReminderTime);
        }
      } catch (error) {
        console.error('Erro ao inicializar lembretes:', error);
      }
    };

    initReminders();

    return () => {
      isInitializedRef.current = false;
    };
  }, [hasPermission, userId]);

  return {
    isSupported,
    hasPermission,
    requestPermission,
    sendTestNotification,
    scheduleHabitReminders,
    scheduleCheckinReminder,
    scheduledReminders,
  };
}



