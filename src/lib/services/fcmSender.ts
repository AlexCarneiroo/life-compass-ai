/**
 * Serviço para enviar notificações via Firebase Cloud Messaging API (V1)
 * 
 * IMPORTANTE: Para usar este serviço diretamente do frontend, você precisa de um
 * token de acesso OAuth2. É recomendado usar Cloud Functions ou um backend.
 * 
 * Para produção, crie Cloud Functions que usem o Admin SDK do Firebase.
 */

import { getUserFCMTokens } from '@/lib/firebase/messaging';
import { logger } from '@/lib/utils/logger';

// Token de acesso OAuth2 - NÃO use a API key diretamente!
// Para obter: https://firebase.google.com/docs/cloud-messaging/auth-server
const FCM_ACCESS_TOKEN = import.meta.env.VITE_FCM_ACCESS_TOKEN || '';
const FCM_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'controll-v';

interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, string>;
  requireInteraction?: boolean;
}

interface FCMMessage {
  message: {
    token?: string;
    topic?: string;
    notification?: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
    webpush?: {
      notification?: {
        title: string;
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        requireInteraction?: boolean;
      };
      fcmOptions?: {
        link?: string;
      };
    };
    android?: {
      priority: 'normal' | 'high';
    };
    apns?: {
      headers: {
        'apns-priority': string;
      };
    };
  };
}

/**
 * Envia notificação FCM para um token específico
 */
export async function sendFCMToToken(
  token: string,
  payload: FCMNotificationPayload
): Promise<boolean> {
  if (!FCM_ACCESS_TOKEN) {
    logger.error('FCM_ACCESS_TOKEN não configurado. Use Cloud Functions ou configure OAuth2 token.');
    logger.warn('Para produção, use Cloud Functions com Admin SDK em vez deste serviço.');
    return false;
  }

  try {
    const message: FCMMessage = {
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          ...payload.data,
          tag: payload.tag || 'lifeos-notification',
          requireInteraction: payload.requireInteraction ? 'true' : 'false',
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: '/icon-192.png',
            tag: payload.tag || 'lifeos-notification',
            requireInteraction: payload.requireInteraction || false,
          },
          fcmOptions: {
            link: '/',
          },
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FCM_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Erro ao enviar FCM:', error);
      return false;
    }

    logger.info('Notificação FCM enviada com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao enviar notificação FCM:', error);
    return false;
  }
}

/**
 * Envia notificação FCM para todos os tokens de um usuário
 */
export async function sendFCMToUser(
  userId: string,
  payload: FCMNotificationPayload
): Promise<number> {
  try {
    const tokens = await getUserFCMTokens(userId);
    
    if (tokens.length === 0) {
      logger.warn(`Usuário ${userId} não tem tokens FCM registrados`);
      return 0;
    }

    // Envia para todos os tokens
    const results = await Promise.allSettled(
      tokens.map(token => sendFCMToToken(token, payload))
    );

    const successCount = results.filter(
      r => r.status === 'fulfilled' && r.value === true
    ).length;

    logger.info(
      `Notificação FCM enviada para ${successCount}/${tokens.length} dispositivos do usuário ${userId}`
    );

    return successCount;
  } catch (error) {
    logger.error('Erro ao enviar FCM para usuário:', error);
    return 0;
  }
}

/**
 * Envia notificação de lembrete de hábito
 */
export async function sendHabitReminder(
  userId: string,
  habitName: string,
  habitId: string,
  description?: string
): Promise<number> {
  return sendFCMToUser(userId, {
    title: `⏰ Hora do hábito: ${habitName}`,
    body: description || 'Não esqueça de completar seu hábito!',
    tag: `habit-${habitId}`,
    data: {
      type: 'habit',
      habitId,
    },
  });
}

/**
 * Envia notificação de lembrete de check-in
 */
export async function sendCheckinReminder(userId: string): Promise<number> {
  return sendFCMToUser(userId, {
    title: '📝 Hora do Check-in Diário',
    body: 'Como foi seu dia? Registre seu humor, energia e produtividade.',
    tag: 'daily-checkin',
    data: {
      type: 'checkin',
    },
    requireInteraction: true,
  });
}

/**
 * Envia notificação de insight motivacional
 */
export async function sendInsightNotification(
  userId: string,
  title: string,
  body: string
): Promise<number> {
  return sendFCMToUser(userId, {
    title,
    body,
    tag: 'daily-insight',
    data: {
      type: 'insight',
    },
  });
}

