/**
 * Utilitários para interagir com Firestore
 */

import * as admin from 'firebase-admin';
import { Habit } from '../types';

/**
 * Obtém um hábito por ID
 */
export async function getHabitById(
  userId: string,
  habitId: string
): Promise<Habit | null> {
  try {
    const habitDoc = await admin
      .firestore()
      .collection('habits')
      .doc(habitId)
      .get();

    if (!habitDoc.exists) {
      return null;
    }

    const data = habitDoc.data();
    
    // Verifica se o hábito pertence ao usuário
    if (data?.userId !== userId) {
      return null;
    }

    return {
      id: habitDoc.id,
      ...data,
    } as Habit;
  } catch (error) {
    console.error(`Erro ao obter hábito ${habitId}:`, error);
    return null;
  }
}

/**
 * Obtém todos os hábitos de um usuário que têm lembretes habilitados
 */
export async function getHabitsWithReminders(userId: string): Promise<Habit[]> {
  try {
    const habitsSnapshot = await admin
      .firestore()
      .collection('habits')
      .where('userId', '==', userId)
      .where('reminderEnabled', '==', true)
      .get();

    return habitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Habit[];
  } catch (error) {
    console.error(`Erro ao obter hábitos com lembretes para ${userId}:`, error);
    return [];
  }
}

/**
 * Verifica se um usuário já fez check-in hoje
 */
export async function hasCheckinToday(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const checkinsSnapshot = await admin
      .firestore()
      .collection('checkins')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .limit(1)
      .get();

    return !checkinsSnapshot.empty;
  } catch (error) {
    console.error(`Erro ao verificar check-in de hoje para ${userId}:`, error);
    return false;
  }
}

/**
 * Obtém todos os usuários que precisam receber lembretes de check-in
 * (usuários que têm tokens FCM e não fizeram check-in hoje)
 */
export async function getUsersNeedingCheckinReminder(): Promise<string[]> {
  try {
    // Obtém todos os usuários com tokens FCM
    const tokensSnapshot = await admin
      .firestore()
      .collection('fcmTokens')
      .get();

    const userIds: string[] = [];
    
    // Para cada usuário, verifica se já fez check-in hoje
    for (const tokenDoc of tokensSnapshot.docs) {
      const userId = tokenDoc.id;
      const hasCheckin = await hasCheckinToday(userId);
      
      if (!hasCheckin) {
        userIds.push(userId);
      }
    }

    return userIds;
  } catch (error) {
    console.error('Erro ao obter usuários que precisam de lembrete de check-in:', error);
    return [];
  }
}

