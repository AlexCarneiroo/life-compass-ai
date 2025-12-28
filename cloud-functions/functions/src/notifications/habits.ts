/**
 * Cloud Functions para notificações de hábitos
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendHabitReminder } from '../utils/fcm';
import { getHabitById, getHabitsWithReminders } from '../utils/firestore';
import { SendHabitReminderRequest } from '../types';

/**
 * Função HTTP para enviar lembrete de hábito manualmente
 * 
 * POST /sendHabitReminder
 * Body: { userId: string, habitId: string }
 */
export const sendHabitReminderHTTP = functions.https.onRequest(
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
      const { userId, habitId } = request.body as SendHabitReminderRequest;

      if (!userId || !habitId) {
        response.status(400).json({
          error: 'userId e habitId são obrigatórios',
        });
        return;
      }

      // Obtém o hábito
      const habit = await getHabitById(userId, habitId);
      if (!habit) {
        response.status(404).json({ error: 'Hábito não encontrado' });
        return;
      }

      // Envia notificação
      const sentCount = await sendHabitReminder(
        userId,
        habit.name,
        habitId,
        `Não esqueça de completar: ${habit.name}`
      );

      response.status(200).json({
        success: true,
        message: 'Lembrete de hábito enviado',
        sent: sentCount > 0,
        devices: sentCount,
      });
    } catch (error: any) {
      console.error('Erro ao enviar lembrete de hábito:', error);
      response.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
);

/**
 * Função agendada que verifica e envia lembretes de hábitos
 * Executa a cada hora (00:00, 01:00, 02:00, etc.)
 * 
 * Para hábitos com horários específicos, esta função verifica se é o horário certo
 */
export const scheduledHabitReminders = functions.pubsub
  .schedule('0 * * * *') // A cada hora
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Iniciando verificação de lembretes de hábitos...');

    try {
      // Obtém a hora atual
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      console.log(`Horário atual: ${currentTime}`);

      // Obtém todos os usuários com tokens FCM
      const tokensSnapshot = await admin
        .firestore()
        .collection('fcmTokens')
        .get();

      let totalSent = 0;

      // Para cada usuário, verifica hábitos com lembretes
      for (const tokenDoc of tokensSnapshot.docs) {
        const userId = tokenDoc.id;
        const habits = await getHabitsWithReminders(userId);

        for (const habit of habits) {
          // Verifica se o hábito tem horário configurado
          if (!habit.reminderTime) {
            continue;
          }

          // Compara horário (formato HH:mm)
          if (habit.reminderTime === currentTime) {
            // Verifica se o hábito já foi completado hoje (para hábitos diários)
            if (habit.frequency === 'daily') {
              const today = new Date().toISOString().split('T')[0];
              const completedToday = habit.completedDates?.includes(today);
              
              if (completedToday) {
                console.log(
                  `Hábito ${habit.id} já completado hoje, pulando...`
                );
                continue;
              }
            }

            // Envia notificação
            const sentCount = await sendHabitReminder(
              userId,
              habit.name,
              habit.id,
              `Hora de completar: ${habit.name}`
            );

            if (sentCount > 0) {
              totalSent++;
            }

            console.log(
              `Lembrete de hábito ${habit.name} enviado para ${userId}`
            );
          }
        }
      }

      console.log(`Total de lembretes de hábitos enviados: ${totalSent}`);
      return null;
    } catch (error) {
      console.error('Erro ao executar lembretes agendados de hábitos:', error);
      throw error;
    }
  });

