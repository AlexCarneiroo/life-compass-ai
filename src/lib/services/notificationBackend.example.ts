/**
 * EXEMPLOS DE USO - Backend de Notificações
 * 
 * Este arquivo contém exemplos de como usar o serviço de notificações
 * Copie e adapte conforme necessário
 */

import {
  registerFCMToken,
  unregisterFCMToken,
  sendNotificationToUser,
  sendCheckinReminder,
  sendHabitReminder,
  sendInsightNotification,
  checkBackendHealth,
} from './notificationBackend';

// ==========================================
// Exemplo 1: Registrar Token FCM
// ==========================================

async function exemploRegistrarToken() {
  const fcmToken = 'token-fcm-aqui';
  const userId = 'user-123';

  const result = await registerFCMToken(fcmToken, userId, 'web');
  
  if (result.success) {
    console.log('Token registrado com sucesso!');
  } else {
    console.error('Erro ao registrar token:', result.message);
  }
}

// ==========================================
// Exemplo 2: Enviar Notificação Personalizada
// ==========================================

async function exemploEnviarNotificacao() {
  const userId = 'user-123';
  
  const result = await sendNotificationToUser(
    userId,
    '🎉 Parabéns!',
    'Você completou 7 dias seguidos de hábitos!',
    {
      priority: 'high',
      tag: 'streak-achievement',
      data: {
        type: 'achievement',
        streak: '7',
      },
    }
  );

  if (result.success) {
    console.log(`Notificação enviada para ${result.sent} dispositivo(s)`);
  }
}

// ==========================================
// Exemplo 3: Enviar Lembrete de Check-in
// ==========================================

async function exemploLembreteCheckin() {
  const userId = 'user-123';
  
  await sendCheckinReminder(userId);
  console.log('Lembrete de check-in enviado!');
}

// ==========================================
// Exemplo 4: Enviar Lembrete de Hábito
// ==========================================

async function exemploLembreteHabito() {
  const userId = 'user-123';
  const habitId = 'habit-456';
  const habitName = 'Meditar';
  
  await sendHabitReminder(
    userId,
    habitName,
    habitId,
    'Não esqueça de meditar hoje!'
  );
  console.log('Lembrete de hábito enviado!');
}

// ==========================================
// Exemplo 5: Enviar Insight Motivacional
// ==========================================

async function exemploInsight() {
  const userId = 'user-123';
  
  await sendInsightNotification(
    userId,
    '💪 Você está no caminho certo!',
    'Seus pequenos hábitos diários estão construindo uma vida melhor.'
  );
  console.log('Insight enviado!');
}

// ==========================================
// Exemplo 6: Verificar se Backend está Online
// ==========================================

async function exemploVerificarBackend() {
  const isOnline = await checkBackendHealth();
  
  if (isOnline) {
    console.log('✅ Backend está online e funcionando!');
  } else {
    console.warn('⚠️ Backend não está disponível');
  }
}

// ==========================================
// Exemplo 7: Integração em Componente React
// ==========================================

/*
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sendCheckinReminder } from '@/lib/services/notificationBackend';

function MeuComponente() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEnviarLembrete = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await sendCheckinReminder(userId);
      if (result.success) {
        alert('Lembrete enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar lembrete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleEnviarLembrete} disabled={loading}>
      {loading ? 'Enviando...' : 'Enviar Lembrete de Check-in'}
    </button>
  );
}
*/

// ==========================================
// Exemplo 8: Remover Token ao Fazer Logout
// ==========================================

async function exemploRemoverToken(userId: string, fcmToken: string) {
  await unregisterFCMToken(fcmToken, userId);
  console.log('Token removido do backend');
}



