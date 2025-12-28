/**
 * Serviço para gerenciar Firebase Cloud Messaging (FCM)
 * Permite receber notificações push mesmo quando o app está fechado
 */

import { messaging } from '../firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

// VAPID key - configurada no .env
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Obtém o token FCM do dispositivo
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    logger.warn('FCM não está disponível');
    return null;
  }

  try {
    // Solicita permissão para notificações
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.warn('Permissão de notificação negada');
      return null;
    }

    // Obtém o token FCM
    // O Firebase Messaging automaticamente procura por firebase-messaging-sw.js na raiz
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      logger.info('Token FCM obtido com sucesso');
      return token;
    } else {
      logger.warn('Não foi possível obter token FCM');
      return null;
    }
  } catch (error) {
    logger.error('Erro ao obter token FCM:', error);
    return null;
  }
}

/**
 * Salva o token FCM do usuário no Firestore
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    const tokenDoc = await getDoc(tokenRef);

    if (tokenDoc.exists()) {
      // Atualiza token existente
      const data = tokenDoc.data();
      const tokens = data.tokens || [];
      
      // Adiciona novo token se não existir
      if (!tokens.includes(token)) {
        await updateDoc(tokenRef, {
          tokens: [...tokens, token],
          updatedAt: new Date(),
        });
        logger.info('Token FCM atualizado no Firestore');
      }
    } else {
      // Cria novo documento
      await setDoc(tokenRef, {
        userId,
        tokens: [token],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.info('Token FCM salvo no Firestore');
    }
  } catch (error) {
    logger.error('Erro ao salvar token FCM:', error);
    throw error;
  }
}

/**
 * Remove token FCM do Firestore
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    const tokenDoc = await getDoc(tokenRef);

    if (tokenDoc.exists()) {
      const data = tokenDoc.data();
      const tokens = (data.tokens || []).filter((t: string) => t !== token);
      
      if (tokens.length === 0) {
        // Remove documento se não há mais tokens
        await updateDoc(tokenRef, {
          tokens: [],
          updatedAt: new Date(),
        });
      } else {
        await updateDoc(tokenRef, {
          tokens,
          updatedAt: new Date(),
        });
      }
      logger.info('Token FCM removido do Firestore');
    }
  } catch (error) {
    logger.error('Erro ao remover token FCM:', error);
    throw error;
  }
}

/**
 * Obtém todos os tokens FCM de um usuário
 */
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    const tokenDoc = await getDoc(tokenRef);

    if (tokenDoc.exists()) {
      return tokenDoc.data().tokens || [];
    }
    return [];
  } catch (error) {
    logger.error('Erro ao obter tokens FCM:', error);
    return [];
  }
}

/**
 * Configura listener para mensagens FCM quando o app está em foreground
 */
export function setupFCMForegroundListener(
  onMessageReceived: (payload: MessagePayload) => void
): () => void {
  if (!messaging) {
    logger.warn('FCM não está disponível para listener');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    logger.info('Mensagem FCM recebida em foreground:', payload);
    onMessageReceived(payload);
  });

  return unsubscribe;
}

/**
 * Inicializa FCM para um usuário
 * Obtém token, salva no Firestore e configura listeners
 */
export async function initializeFCM(userId: string): Promise<string | null> {
  try {
    // Obtém token FCM
    const token = await getFCMToken();
    
    if (!token) {
      return null;
    }

    // Salva token no Firestore
    await saveFCMToken(userId, token);

    return token;
  } catch (error) {
    logger.error('Erro ao inicializar FCM:', error);
    return null;
  }
}

