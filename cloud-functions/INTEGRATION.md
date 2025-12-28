# 🔗 Integração Frontend - Cloud Functions

Este documento explica como integrar as Cloud Functions no frontend.

## 📋 Funções Disponíveis

### 1. Enviar Lembrete de Check-in

**Endpoint**: `sendCheckinReminder`

```typescript
// Exemplo de uso no frontend
async function sendCheckinReminder(userId: string) {
  try {
    const response = await fetch(
      'https://us-central1-controll-v.cloudfunctions.net/sendCheckinReminder',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }
    );

    const data = await response.json();
    if (data.success) {
      console.log(`Notificação enviada para ${data.devices} dispositivo(s)`);
    }
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error);
  }
}
```

### 2. Enviar Lembrete de Hábito

**Endpoint**: `sendHabitReminder`

```typescript
async function sendHabitReminder(userId: string, habitId: string) {
  try {
    const response = await fetch(
      'https://us-central1-controll-v.cloudfunctions.net/sendHabitReminder',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, habitId }),
      }
    );

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Erro ao enviar lembrete de hábito:', error);
    return false;
  }
}
```

### 3. Enviar Insight Motivacional

**Endpoint**: `sendInsightNotification`

```typescript
async function sendInsight(
  userId: string,
  title: string,
  body: string
) {
  try {
    const response = await fetch(
      'https://us-central1-controll-v.cloudfunctions.net/sendInsightNotification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, title, body }),
      }
    );

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Erro ao enviar insight:', error);
    return false;
  }
}
```

## 🛠️ Criando um Serviço no Frontend

Crie um arquivo `src/lib/services/cloudFunctions.ts`:

```typescript
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL || 
  'https://us-central1-controll-v.cloudfunctions.net';

interface CheckinReminderResponse {
  success: boolean;
  message: string;
  sent: boolean;
  devices: number;
}

interface HabitReminderResponse {
  success: boolean;
  message: string;
  sent: boolean;
  devices: number;
}

interface InsightResponse {
  success: boolean;
  message: string;
  sent: boolean;
  devices: number;
}

export const cloudFunctionsService = {
  /**
   * Envia lembrete de check-in para um usuário
   */
  async sendCheckinReminder(userId: string): Promise<CheckinReminderResponse> {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/sendCheckinReminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar lembrete de check-in');
    }

    return response.json();
  },

  /**
   * Envia lembrete de hábito para um usuário
   */
  async sendHabitReminder(
    userId: string,
    habitId: string
  ): Promise<HabitReminderResponse> {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/sendHabitReminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, habitId }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar lembrete de hábito');
    }

    return response.json();
  },

  /**
   * Envia insight motivacional para um usuário
   */
  async sendInsight(
    userId: string,
    title: string,
    body: string
  ): Promise<InsightResponse> {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/sendInsightNotification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar insight');
    }

    return response.json();
  },
};
```

## 🌍 Variáveis de Ambiente

Adicione no `.env`:

```env
VITE_FUNCTIONS_BASE_URL=https://us-central1-controll-v.cloudfunctions.net
```

**Nota**: Substitua `controll-v` pelo ID do seu projeto Firebase.

## 📝 Funções Agendadas

As seguintes funções rodam automaticamente e **não precisam** ser chamadas do frontend:

- `scheduledCheckinReminder` - Envia lembretes de check-in todos os dias às 21h
- `scheduledHabitReminders` - Verifica e envia lembretes de hábitos a cada hora

## 🔒 Segurança

⚠️ **Importante**: No momento, as funções HTTP são públicas. Para produção, considere:

1. Adicionar autenticação Firebase nas funções
2. Validar tokens de autenticação
3. Implementar rate limiting

Exemplo de função protegida:

```typescript
export const sendCheckinReminderHTTP = functions
  .runWith({ enforceAppCheck: true }) // Requer App Check
  .https.onCall(async (data, context) => {
    // Verifica autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário não autenticado'
      );
    }

    const userId = context.auth.uid;
    // ... resto do código
  });
```

## 🧪 Testando Localmente

1. Inicie o emulador: `firebase emulators:start --only functions`
2. Use a URL local: `http://localhost:5001/controll-v/us-central1/sendCheckinReminder`

