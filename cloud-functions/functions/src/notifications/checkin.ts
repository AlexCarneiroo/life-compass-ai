/**
 * Cloud Functions para notificações de check-in
 */

import * as functions from 'firebase-functions';
import { sendCheckinReminder } from '../utils/fcm';
import { hasCheckinToday } from '../utils/firestore';
import { SendCheckinReminderRequest } from '../types';

/**
 * Função HTTP para enviar lembrete de check-in manualmente
 * 
 * POST /sendCheckinReminder
 * Body: { userId: string }
 */
export const sendCheckinReminderHTTP = functions.https.onRequest(
  async (request, response) => {
    // CORS
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { userId } = request.body as SendCheckinReminderRequest;

      if (!userId) {
        response.status(400).json({ error: 'userId é obrigatório' });
        return;
      }

      // Verifica se já fez check-in hoje
      const hasCheckin = await hasCheckinToday(userId);
      if (hasCheckin) {
        response.status(200).json({
          success: true,
          message: 'Usuário já fez check-in hoje',
          sent: false,
        });
        return;
      }

      // Envia notificação
      const sentCount = await sendCheckinReminder(userId);

      response.status(200).json({
        success: true,
        message: 'Lembrete de check-in enviado',
        sent: sentCount > 0,
        devices: sentCount,
      });
    } catch (error: any) {
      console.error('Erro ao enviar lembrete de check-in:', error);
      response.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
);

/**
 * Função agendada que envia lembretes de check-in diariamente às 21:00
 * Configuração no Cloud Scheduler: 0 21 * * * (todo dia às 21h)
 */
export const scheduledCheckinReminder = functions.pubsub
  .schedule('0 21 * * *') // Todo dia às 21:00 (horário UTC)
  .timeZone('America/Sao_Paulo') // Ajuste para seu fuso horário
  .onRun(async (context) => {
    console.log('Iniciando envio de lembretes de check-in...');

    try {
      // Importa dinamicamente para evitar problemas de inicialização
      const { getUsersNeedingCheckinReminder } = await import('../utils/firestore');

      // Obtém usuários que precisam de lembrete
      const userIds = await getUsersNeedingCheckinReminder();
      console.log(`${userIds.length} usuários precisam de lembrete de check-in`);

      // Envia notificação para cada usuário
      const results = await Promise.allSettled(
        userIds.map(userId => sendCheckinReminder(userId))
      );

      const successCount = results.filter(
        r => r.status === 'fulfilled' && r.value > 0
      ).length;

      console.log(
        `Lembretes de check-in enviados: ${successCount}/${userIds.length} usuários`
      );

      return null;
    } catch (error) {
      console.error('Erro ao executar lembretes agendados de check-in:', error);
      throw error;
    }
  });

