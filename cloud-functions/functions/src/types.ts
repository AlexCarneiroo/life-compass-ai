/**
 * Tipos TypeScript compartilhados para Cloud Functions
 */

/**
 * Estrutura de dados dos tokens FCM no Firestore
 */
export interface FCMTokenDocument {
  userId: string;
  tokens: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Estrutura de um hábito no Firestore
 */
export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  reminderTime?: string; // HH:mm formato
  reminderEnabled?: boolean;
  completedDates: string[];
  userId: string;
}

/**
 * Estrutura de um check-in no Firestore
 */
export interface CheckIn {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood?: number;
  energy?: number;
  productivity?: number;
}

/**
 * Payload de notificação FCM
 */
export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, string>;
  requireInteraction?: boolean;
}

/**
 * Tipo de notificação
 */
export type NotificationType = 'checkin' | 'habit' | 'insight' | 'achievement' | 'streak';

/**
 * Request body para função HTTP de check-in
 */
export interface SendCheckinReminderRequest {
  userId: string;
}

/**
 * Request body para função HTTP de hábito
 */
export interface SendHabitReminderRequest {
  userId: string;
  habitId: string;
}

/**
 * Request body para função HTTP de insight
 */
export interface SendInsightRequest {
  userId: string;
  title: string;
  body: string;
}



