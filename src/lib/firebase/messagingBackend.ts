/**
 * Integração do FCM com o backend de notificações
 * 
 * Este arquivo integra o sistema FCM existente com o novo backend,
 * registrando tokens automaticamente quando obtidos.
 */

import { getFCMToken, saveFCMToken } from './messaging';
import { registerFCMToken, unregisterFCMToken, checkBackendHealth } from '@/lib/services/notificationBackend';
import { logger } from '@/lib/utils/logger';

/**
 * Inicializa FCM e registra token no backend
 * Esta função substitui/enhance a função initializeFCM existente
 */
export async function initializeFCMWithBackend(userId: string): Promise<string | null> {
  try {
    // Verifica se o backend está disponível
    const backendAvailable = await checkBackendHealth();
    
    if (!backendAvailable) {
      logger.warn('Backend de notificações não está disponível, usando apenas Firestore');
      // Fallback: usa apenas o sistema Firestore existente
      const token = await getFCMToken();
      if (token) {
        await saveFCMToken(userId, token);
      }
      return token;
    }

    // Obtém token FCM
    const token = await getFCMToken();
    
    if (!token) {
      logger.warn('Não foi possível obter token FCM');
      return null;
    }

    // Salva no Firestore (mantém compatibilidade)
    await saveFCMToken(userId, token);

    // Registra no backend
    const result = await registerFCMToken(token, userId, 'web');
    
    if (result.success) {
      logger.info('Token FCM registrado no backend com sucesso');
    } else {
      logger.warn('Token FCM salvo no Firestore, mas falhou ao registrar no backend:', result.message);
    }

    return token;
  } catch (error) {
    logger.error('Erro ao inicializar FCM com backend:', error);
    // Em caso de erro, tenta ao menos salvar no Firestore
    try {
      const token = await getFCMToken();
      if (token) {
        await saveFCMToken(userId, token);
      }
      return token;
    } catch (fallbackError) {
      logger.error('Erro no fallback de FCM:', fallbackError);
      return null;
    }
  }
}

/**
 * Remove token FCM do backend quando usuário faz logout ou desabilita notificações
 */
export async function cleanupFCMFromBackend(userId: string, token: string): Promise<void> {
  try {
    const backendAvailable = await checkBackendHealth();
    
    if (backendAvailable) {
      await unregisterFCMToken(token, userId);
      logger.info('Token FCM removido do backend');
    }
  } catch (error) {
    logger.error('Erro ao remover token FCM do backend:', error);
    // Não bloqueia a operação principal se falhar
  }
}

