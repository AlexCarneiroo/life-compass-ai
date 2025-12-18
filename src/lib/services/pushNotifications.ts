/**
 * Serviço de Notificações Push para PWA
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Verifica se notificações são suportadas
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Verifica se já tem permissão
   */
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  /**
   * Envia uma notificação local
   */
  async sendNotification(options: PushNotificationOptions): Promise<boolean> {
    if (!this.hasPermission()) {
      console.warn('Sem permissão para notificações');
      return false;
    }

    try {
      // Tenta usar o Service Worker para notificações persistentes
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        tag: options.tag || 'lifeos-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        vibrate: [200, 100, 200],
      });
      
      return true;
    } catch (error) {
      // Fallback para Notification API direta
      try {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          tag: options.tag,
        });
        return true;
      } catch (fallbackError) {
        console.error('Erro ao enviar notificação:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Agenda uma notificação para um horário específico
   */
  scheduleNotification(options: PushNotificationOptions, scheduledTime: Date): number {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Se o horário já passou, não agenda
      return -1;
    }

    const timeoutId = window.setTimeout(() => {
      this.sendNotification(options);
    }, delay);

    return timeoutId;
  }

  /**
   * Cancela uma notificação agendada
   */
  cancelScheduledNotification(timeoutId: number): void {
    window.clearTimeout(timeoutId);
  }
}

export const pushNotificationService = new PushNotificationService();

