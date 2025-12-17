import { useState, useEffect, useCallback, useRef } from 'react';
import { pushNotificationService } from '@/lib/services/pushNotifications';
import { useAuth } from './useAuth';
import { habitsService } from '@/lib/firebase/habits';
import { Habit } from '@/types';
import { checkinService } from '@/lib/firebase/checkin';
import { userSettingsService } from '@/lib/firebase/userSettings';
import { userStatsService } from '@/lib/firebase/userStats';
import { logger } from '@/lib/utils/logger';

interface ScheduledReminder {
  id: string;
  timeoutId: number;
  type: 'habit' | 'checkin' | 'insight';
  time: string;
}

// Insights motivacionais
const INSIGHT_MESSAGES = [
  { title: '💡 Dica do dia', body: 'Pequenos passos consistentes levam a grandes resultados!' },
  { title: '🎯 Foco', body: 'Lembre-se: consistência supera intensidade.' },
  { title: '🌟 Motivação', body: 'Cada hábito completado é uma vitória!' },
  { title: '💪 Força', body: 'Você já está mais longe do que estava ontem.' },
  { title: '🧠 Mentalidade', body: 'O sucesso é a soma de pequenos esforços repetidos.' },
  { title: '🔥 Energia', body: 'Sua sequência de dias mostra sua dedicação!' },
  { title: '⭐ Progresso', body: 'Não compare seu início com o meio de alguém.' },
  { title: '🚀 Evolução', body: 'Cada dia é uma nova oportunidade de crescer.' },
  { title: '❤️ Autocuidado', body: 'Cuide de você hoje. Seu futuro eu agradece.' },
  { title: '🏆 Conquista', body: 'Celebre cada pequena vitória no caminho.' },
];

// Insights baseados em dados
const getPersonalizedInsight = (stats: any, habits: Habit[]): { title: string; body: string } | null => {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(h => h.completedDates?.includes(today)).length;
  const totalHabits = habits.length;
  
  if (stats.currentStreak >= 7) {
    return { title: '🔥 Sequência incrível!', body: `${stats.currentStreak} dias seguidos! Continue assim!` };
  }
  
  if (completedToday === 0 && totalHabits > 0) {
    return { title: '📋 Seus hábitos esperam', body: `Você tem ${totalHabits} hábitos para completar hoje!` };
  }
  
  if (completedToday > 0 && completedToday < totalHabits) {
    const remaining = totalHabits - completedToday;
    return { title: '👏 Bom progresso!', body: `Faltam apenas ${remaining} hábitos para fechar o dia!` };
  }
  
  if (stats.level > 1) {
    return { title: '⬆️ Nível ' + stats.level, body: `Você já acumulou ${stats.xp} XP! Continue evoluindo.` };
  }
  
  return null;
};

export function usePushNotifications() {
  const { userId } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const insightTimeoutRef = useRef<number | null>(null);
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

  const sendTestInsight = useCallback(async () => {
    const insight = INSIGHT_MESSAGES[Math.floor(Math.random() * INSIGHT_MESSAGES.length)];
    return pushNotificationService.sendNotification({
      title: insight.title,
      body: insight.body,
      tag: 'test-insight',
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
        // Verifica se lembrete está ativado E tem horário definido
        if (!habit.reminderEnabled || !habit.reminderTime) return;

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

      // Só loga se houver lembretes agendados
      if (newReminders.length > 0) {
        logger.info(`${newReminders.length} lembretes de hábitos agendados`);
      }
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
   * Agenda um insight aleatório em horário aleatório (entre 8h e 21h)
   */
  const scheduleRandomInsight = useCallback(async () => {
    if (!userId || !hasPermission) return;
    
    // Evita re-agendar se já tem um agendado
    if (insightTimeoutRef.current) return;

    try {

      const now = new Date();
      const currentHour = now.getHours();
      
      // Define janela de horário (8h às 21h)
      const minHour = 8;
      const maxHour = 21;
      
      // Gera horário aleatório
      let targetHour: number;
      let targetMinute = Math.floor(Math.random() * 60);
      
      if (currentHour >= maxHour || currentHour < minHour) {
        // Fora do horário, agenda para amanhã entre 8h-12h
        targetHour = minHour + Math.floor(Math.random() * 4);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(targetHour, targetMinute, 0, 0);
        
        const delay = tomorrow.getTime() - now.getTime();
        insightTimeoutRef.current = window.setTimeout(() => sendInsight(), delay);
      } else {
        // Dentro do horário, agenda para daqui 1-3 horas
        const hoursFromNow = 1 + Math.floor(Math.random() * 2);
        targetHour = Math.min(currentHour + hoursFromNow, maxHour);
        
        const targetDate = new Date(now);
        targetDate.setHours(targetHour, targetMinute, 0, 0);
        
        // Se passou, adiciona 1 dia
        if (targetDate <= now) {
          targetDate.setDate(targetDate.getDate() + 1);
          targetDate.setHours(minHour + Math.floor(Math.random() * 4), targetMinute, 0, 0);
        }
        
        const delay = targetDate.getTime() - now.getTime();
        insightTimeoutRef.current = window.setTimeout(() => sendInsight(), delay);
      }
      
      // Log removido para evitar spam no console
    } catch (error) {
      logger.error('Erro ao agendar insight:', error);
    }
  }, [userId, hasPermission]);

  /**
   * Envia um insight (aleatório ou personalizado)
   */
  const sendInsight = useCallback(async () => {
    if (!userId || !hasPermission) return;

    try {
      // Tenta enviar insight personalizado
      const [stats, habits] = await Promise.all([
        userStatsService.getOrCreate(userId),
        habitsService.getAll(userId),
      ]);
      
      let insight = getPersonalizedInsight(stats, habits);
      
      // Se não tem personalizado, usa aleatório
      if (!insight) {
        insight = INSIGHT_MESSAGES[Math.floor(Math.random() * INSIGHT_MESSAGES.length)];
      }
      
      await pushNotificationService.sendNotification({
        title: insight.title,
        body: insight.body,
        tag: 'daily-insight',
        data: { type: 'insight' },
      });
      
      // Agenda próximo insight
      scheduleRandomInsight();
    } catch (error) {
      logger.error('Erro ao enviar insight:', error);
    }
  }, [userId, hasPermission, scheduleRandomInsight]);

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
        // Verifica se lembrete está ativado
        if (!habit.reminderEnabled || !habit.reminderTime) return;

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

  // Configura verificação periódica - roda apenas UMA vez
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
        
        // Inicia insights aleatórios
        scheduleRandomInsight();
      } catch (error) {
        logger.error('Erro ao inicializar lembretes:', error);
      }
    };

    initReminders();
    
    // Verifica hábitos atrasados a cada 30 minutos
    const interval = setInterval(async () => {
      const settings = await userSettingsService.getNotificationSettings(userId);
      if (settings.habitRemindersEnabled) {
        checkOverdueHabits();
      }
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (insightTimeoutRef.current) {
        clearTimeout(insightTimeoutRef.current);
        insightTimeoutRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [hasPermission, userId]);

  return {
    isSupported,
    hasPermission,
    requestPermission,
    sendTestNotification,
    sendTestInsight,
    scheduleHabitReminders,
    scheduleCheckinReminder,
    checkOverdueHabits,
    scheduleRandomInsight,
    sendInsight,
    scheduledReminders,
  };
}
