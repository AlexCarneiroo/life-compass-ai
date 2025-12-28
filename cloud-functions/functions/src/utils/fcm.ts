/**
 * Utilitários para enviar notificações FCM
 */

import * as admin from 'firebase-admin';
import { FCMNotificationPayload, FCMTokenDocument } from '../types';

/**
 * Obtém todos os tokens FCM de um usuário
 */
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const tokenDoc = await admin
      .firestore()
      .collection('fcmTokens')
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      return [];
    }

    const data = tokenDoc.data() as FCMTokenDocument;
    return data.tokens || [];
  } catch (error) {
    console.error(`Erro ao obter tokens FCM para usuário ${userId}:`, error);
    return [];
  }
}

/**
 * Envia notificação FCM para um token específico
 */
async function sendFCMToToken(
  token: string,
  payload: FCMNotificationPayload
): Promise<boolean> {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        tag: payload.tag || 'life-compass-notification',
        requireInteraction: payload.requireInteraction ? 'true' : 'false',
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: payload.tag || 'life-compass-notification',
          requireInteraction: payload.requireInteraction || false,
        },
        fcmOptions: {
          link: '/',
        },
      },
      android: {
        priority: 'high' as const,
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`Notificação FCM enviada com sucesso: ${response}`);
    return true;
  } catch (error: any) {
    // Token inválido ou erro de envio
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.warn(`Token inválido, removendo: ${token.substring(0, 20)}...`);
      // Token inválido pode ser removido do Firestore (implementar se necessário)
    } else {
      console.error(`Erro ao enviar FCM para token:`, error);
    }
    return false;
  }
}

/**
 * Envia notificação FCM para todos os tokens de um usuário
 * Retorna o número de notificações enviadas com sucesso
 */
export async function sendFCMToUser(
  userId: string,
  payload: FCMNotificationPayload
): Promise<number> {
  try {
    const tokens = await getUserFCMTokens(userId);

    if (tokens.length === 0) {
      console.warn(`Usuário ${userId} não tem tokens FCM registrados`);
      return 0;
    }

    // Envia para todos os tokens
    const results = await Promise.allSettled(
      tokens.map(token => sendFCMToToken(token, payload))
    );

    const successCount = results.filter(
      result => result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(
      `Notificação FCM enviada para ${successCount}/${tokens.length} dispositivos do usuário ${userId}`
    );

    return successCount;
  } catch (error) {
    console.error(`Erro ao enviar FCM para usuário ${userId}:`, error);
    return 0;
  }
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

