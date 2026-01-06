/**
 * Firebase Cloud Functions - Entry Point
 * 
 * Este arquivo exporta todas as Cloud Functions do sistema de notificações
 */

import * as admin from 'firebase-admin';

// Inicializa Firebase Admin SDK
admin.initializeApp();

// Exporta funções de notificações
export {
  sendCheckinReminderHTTP,
  scheduledCheckinReminder,
} from './notifications/checkin';

export {
  sendHabitReminderHTTP,
  scheduledHabitReminders,
} from './notifications/habits';

export {
  sendInsightNotificationHTTP,
} from './notifications/insights';



