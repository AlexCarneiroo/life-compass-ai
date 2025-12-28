/**
 * Serviço para comunicação com o backend de notificações
 * 
 * Este serviço integra o frontend com o backend Node.js que gerencia
 * as notificações push via FCM.
 */

import { logger } from '@/lib/utils/logger';

// URL base da API - pode ser configurada via variável de ambiente
const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:3000/api';

/**
 * Cria um AbortController com timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Registra o token FCM no backend
 */
export async function registerFCMToken(
  fcmToken: string,
  userId: string,
  deviceType: 'web' | 'android' | 'ios' = 'web'
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_URL}/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        userId: userId,
        deviceType: deviceType,
      }),
      // Timeout de 10 segundos
      signal: createTimeoutSignal(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    logger.info('Token FCM registrado no backend com sucesso');
    return { success: true, ...data };
  } catch (error: any) {
    // Ignora erros de timeout/network silenciosamente (não é crítico)
    if (error.name === 'AbortError' || error.message?.includes('fetch')) {
      logger.warn('Backend não disponível para registrar token (usando apenas Firestore)');
    } else {
      logger.error('Erro ao registrar token FCM no backend:', error);
    }
    return { success: false, message: error.message };
  }
}

/**
 * Remove o token FCM do backend
 */
export async function unregisterFCMToken(
  fcmToken: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_URL}/tokens`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        userId: userId,
      }),
      // Timeout de 10 segundos
      signal: createTimeoutSignal(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    logger.info('Token FCM removido do backend com sucesso');
    return { success: true, ...data };
  } catch (error: any) {
    // Não é crítico se falhar (token pode já ter sido removido)
    if (error.name !== 'AbortError') {
      logger.warn('Erro ao remover token FCM do backend (não crítico):', error.message);
    }
    return { success: false, message: error.message };
  }
}

/**
 * Envia notificação para um usuário específico
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  options?: {
    priority?: 'normal' | 'high';
    data?: Record<string, string>;
    tag?: string;
  }
): Promise<{ success: boolean; message?: string; sent?: number }> {
  try {
    const response = await fetch(`${API_URL}/notifications/send-to-user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        body: body,
        priority: options?.priority || 'high',
        data: options?.data,
        tag: options?.tag,
      }),
      // Timeout de 15 segundos
      signal: createTimeoutSignal(15000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    logger.info(`Notificação enviada para usuário ${userId}`);
    return { success: true, ...data };
  } catch (error: any) {
    logger.error('Erro ao enviar notificação:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Envia notificação de lembrete de check-in
 */
export async function sendCheckinReminder(userId: string): Promise<{ success: boolean; message?: string }> {
  return sendNotificationToUser(
    userId,
    '📝 Hora do Check-in Diário',
    'Como foi seu dia? Registre seu humor, energia e produtividade.',
    {
      priority: 'high',
      tag: 'daily-checkin',
      data: {
        type: 'checkin',
      },
    }
  );
}

/**
 * Envia notificação de lembrete de hábito
 */
export async function sendHabitReminder(
  userId: string,
  habitName: string,
  habitId: string,
  description?: string
): Promise<{ success: boolean; message?: string }> {
  return sendNotificationToUser(
    userId,
    `⏰ Hora do hábito: ${habitName}`,
    description || 'Não esqueça de completar seu hábito!',
    {
      priority: 'high',
      tag: `habit-${habitId}`,
      data: {
        type: 'habit',
        habitId: habitId,
      },
    }
  );
}

/**
 * Envia notificação de insight motivacional
 */
export async function sendInsightNotification(
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; message?: string }> {
  return sendNotificationToUser(userId, title, body, {
    priority: 'normal',
    tag: 'daily-insight',
    data: {
      type: 'insight',
    },
  });
}

/**
 * Verifica se o backend está disponível
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      // Timeout de 5 segundos
      signal: createTimeoutSignal(5000),
    });
    return response.ok;
  } catch (error: any) {
    // Ignora erros de timeout/network silenciosamente
    if (error.name !== 'AbortError') {
      logger.warn('Backend de notificações não está disponível:', error.message);
    }
    return false;
  }
}

