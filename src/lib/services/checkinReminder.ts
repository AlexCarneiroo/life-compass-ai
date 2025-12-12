import { checkinService } from '@/lib/firebase/checkin';
import { notificationService } from '@/lib/firebase/notifications';
import { logger } from '@/lib/utils/logger';

/**
 * Serviço para enviar lembretes de check-in às 21h
 */
export class CheckinReminderService {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static lastCheckDate: string | null = null;

  /**
   * Inicia o serviço de lembretes de check-in
   */
  static start(userId: string) {
    // Limpa intervalo anterior se existir
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Verifica imediatamente
    this.checkAndSendReminder(userId);

    // Verifica a cada minuto se chegou às 21h
    this.checkInterval = setInterval(() => {
      this.checkAndSendReminder(userId);
    }, 60 * 1000); // Verifica a cada minuto
  }

  /**
   * Para o serviço de lembretes
   */
  static stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.lastCheckDate = null;
  }

  /**
   * Verifica se é 21h e se precisa enviar notificação
   */
  private static async checkAndSendReminder(userId: string) {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.toISOString().split('T')[0];

      // Só envia se for 21h (21:00 - 21:59)
      if (currentHour !== 21) {
        return;
      }

      // Evita enviar múltiplas notificações no mesmo dia
      if (this.lastCheckDate === currentDate) {
        return;
      }

      // Verifica se já foi feito o check-in hoje
      const todayCheckin = await checkinService.getByDate(userId, currentDate);

      if (todayCheckin) {
        // Já foi feito, não precisa enviar
        this.lastCheckDate = currentDate;
        return;
      }

      // Verifica se já existe notificação de check-in hoje
      const existingNotifications = await notificationService.getAll(userId);
      const todayReminder = existingNotifications.find(
        n => n.data?.type === 'checkin-reminder' &&
        n.createdAt.toISOString().split('T')[0] === currentDate
      );

      if (todayReminder) {
        // Já foi enviada hoje
        this.lastCheckDate = currentDate;
        return;
      }

      // Cria a notificação de lembrete
      await notificationService.create({
        type: 'info',
        category: 'checkin',
        title: 'Lembrete de Check-in',
        message: 'Não esqueça de fazer seu check-in do dia! 📝',
        severity: 'medium',
        data: {
          type: 'checkin-reminder',
          date: currentDate,
        },
      }, userId);

      this.lastCheckDate = currentDate;
      // Notificação enviada com sucesso
    } catch (error) {
      logger.error('Erro ao verificar lembrete de check-in:', error);
    }
  }

  /**
   * Força verificação manual (útil para testes)
   */
  static async forceCheck(userId: string) {
    this.lastCheckDate = null;
    await this.checkAndSendReminder(userId);
  }
}

