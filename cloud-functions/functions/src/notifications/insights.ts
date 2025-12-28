/**
 * Cloud Functions para notificações de insights motivacionais
 */

import * as functions from 'firebase-functions';
import { sendInsightNotification } from '../utils/fcm';
import { SendInsightRequest } from '../types';

/**
 * Função HTTP para enviar insight motivacional
 * 
 * POST /sendInsightNotification
 * Body: { userId: string, title: string, body: string }
 */
export const sendInsightNotificationHTTP = functions.https.onRequest(
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
      const { userId, title, body } = request.body as SendInsightRequest;

      if (!userId || !title || !body) {
        response.status(400).json({
          error: 'userId, title e body são obrigatórios',
        });
        return;
      }

      // Envia notificação
      const sentCount = await sendInsightNotification(userId, title, body);

      response.status(200).json({
        success: true,
        message: 'Insight enviado',
        sent: sentCount > 0,
        devices: sentCount,
      });
    } catch (error: any) {
      console.error('Erro ao enviar insight:', error);
      response.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
);

