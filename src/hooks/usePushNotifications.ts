import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/lib/services/pushNotifications';
import { useAuth } from './useAuth';
import { habitsService } from '@/lib/firebase/habits';
import { Habit } from '@/types';
import { checkinService } from '@/lib/firebase/checkin';
import { logger } from '@/lib/utils/logger';

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
   * Agenda lembretes para hábitos do dia
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
        if (!habit.reminderTime) return;

        // Verifica se o hábito já foi completado hoje
        const isCompletedToday = habit.completedDates?.includes(today);
        if (isCompletedToday) return;

        // Parse do horário do lembrete
        const [hours, minutes] = habit.reminderTime.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);

        // Se o horário já passou, não agenda
        if (reminderDate <= now) return;

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

      logger.info(`${newReminders.length} lembretes de hábitos agendados`);
    } catch (error) {
      logger.error('Erro ao agendar lembretes de hábitos:', error);
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

      // Cancela lembretes anteriores de check-in
      scheduledReminders
        .filter(r => r.type === 'checkin')
        .forEach(r => pushNotificationService.cancelScheduledNotification(r.timeoutId));

      // Parse do horário
      const [hours, minutes] = time.split(':').map(Number);
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      // Se o horário já passou, não agenda
      if (reminderDate <= now) return;

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
        logger.info(`Lembrete de check-in agendado para ${time}`);
      }
    } catch (error) {
      logger.error('Erro ao agendar lembrete de check-in:', error);
    }
  }, [userId, hasPermission, scheduledReminders]);

  /**
   * Verifica e notifica hábitos atrasados
   */
  const checkOverdueHabits = useCallback(async () => {
    if (!userId || !hasPermission) return;

    try {
      const habits = await habitsService.getAll(userId);
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      habits.forEach((habit: Habit) => {
        if (!habit.reminderTime) return;

        const isCompletedToday = habit.completedDates?.includes(today);
        if (isCompletedToday) return;

        // Parse do horário
        const [hours, minutes] = habit.reminderTime.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);

        // Se passou mais de 30 minutos do horário, notifica
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        if (reminderDate < thirtyMinutesAgo && reminderDate.toDateString() === now.toDateString()) {
          pushNotificationService.sendNotification({
            title: `⚠️ Hábito pendente: ${habit.name}`,
            body: 'Você ainda não completou este hábito hoje!',
            tag: `overdue-habit-${habit.id}`,
            data: { type: 'overdue-habit', habitId: habit.id },
          });
        }
      });
    } catch (error) {
      logger.error('Erro ao verificar hábitos atrasados:', error);
    }
  }, [userId, hasPermission]);

  // Configura verificação periódica de hábitos atrasados
  useEffect(() => {
    if (!hasPermission || !userId) return;

    // Agenda lembretes ao carregar
    scheduleHabitReminders();
    
    // Verifica hábitos atrasados a cada 30 minutos
    const interval = setInterval(() => {
      checkOverdueHabits();
      scheduleHabitReminders(); // Re-agenda para o próximo dia se necessário
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [hasPermission, userId, scheduleHabitReminders, checkOverdueHabits]);

  return {
    isSupported,
    hasPermission,
    requestPermission,
    sendTestNotification,
    scheduleHabitReminders,
    scheduleCheckinReminder,
    checkOverdueHabits,
    scheduledReminders,
  };
}
