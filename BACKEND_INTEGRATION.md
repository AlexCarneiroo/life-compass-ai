# 🔗 Integração Frontend com Backend de Notificações

Este documento explica como integrar o frontend com o backend Node.js de notificações.

## 📋 Pré-requisitos

1. Backend rodando em `http://localhost:3000` (ou URL configurada)
2. CORS configurado no backend (já está pronto!)
3. Token FCM obtido do Firebase

## ⚙️ Configuração

### 1. Variável de Ambiente

Adicione no arquivo `.env` na raiz do projeto:

```env
VITE_NOTIFICATION_API_URL=http://localhost:3000/api
```

**Para produção:**
```env
VITE_NOTIFICATION_API_URL=https://seu-backend.com/api
```

### 2. Serviço Criado

O serviço já foi criado em `src/lib/services/notificationBackend.ts` e está pronto para uso!

## 🚀 Como Usar

### Registro Automático de Token

O token FCM é registrado automaticamente quando o usuário faz login ou abre o app. O sistema:

1. Obtém o token FCM do Firebase
2. Salva no Firestore (compatibilidade)
3. Registra no backend via API

**Não precisa fazer nada manualmente!** O hook `usePushNotifications` já faz isso automaticamente.

### Enviar Notificações do Frontend

Se você quiser enviar notificações manualmente do frontend:

```typescript
import { 
  sendCheckinReminder, 
  sendHabitReminder, 
  sendInsightNotification 
} from '@/lib/services/notificationBackend';

// Enviar lembrete de check-in
await sendCheckinReminder(userId);

// Enviar lembrete de hábito
await sendHabitReminder(userId, habitName, habitId, 'Descrição opcional');

// Enviar insight motivacional
await sendInsightNotification(
  userId, 
  'Título do Insight', 
  'Corpo da mensagem'
);
```

## 📡 Endpoints Disponíveis

O serviço se comunica com os seguintes endpoints:

### POST `/api/tokens`
Registra/atualiza token FCM no backend

**Body:**
```json
{
  "token": "fcm-token-aqui",
  "userId": "user-id-aqui",
  "deviceType": "web"
}
```

### DELETE `/api/tokens`
Remove token FCM do backend

**Body:**
```json
{
  "token": "fcm-token-aqui",
  "userId": "user-id-aqui"
}
```

### POST `/api/notifications/send-to-user/:userId`
Envia notificação para um usuário específico

**Body:**
```json
{
  "title": "Título da notificação",
  "body": "Corpo da mensagem",
  "priority": "high",
  "data": {
    "type": "checkin",
    "customKey": "customValue"
  },
  "tag": "notification-tag"
}
```

### GET `/api/health`
Verifica se o backend está disponível

## 🔄 Fluxo de Integração

### 1. Inicialização Automática

```
Usuário abre app
  ↓
usePushNotifications hook inicializa
  ↓
Solicita permissão de notificações
  ↓
Obtém token FCM do Firebase
  ↓
Salva no Firestore (backup)
  ↓
Registra no backend via API
  ↓
Pronto! Usuário recebe notificações
```

### 2. Envio de Notificações

```
Backend agendado/evento
  ↓
Backend busca tokens do usuário
  ↓
Backend envia via FCM
  ↓
Dispositivo recebe notificação
  ↓
Notificação exibida (mesmo app fechado)
```

## 🛠️ Serviços Criados

### `notificationBackend.ts`

Serviço principal para comunicação com o backend:

- `registerFCMToken()` - Registra token
- `unregisterFCMToken()` - Remove token
- `sendNotificationToUser()` - Envia notificação
- `sendCheckinReminder()` - Helper para check-in
- `sendHabitReminder()` - Helper para hábito
- `sendInsightNotification()` - Helper para insight
- `checkBackendHealth()` - Verifica disponibilidade

### `messagingBackend.ts`

Integração do FCM com o backend:

- `initializeFCMWithBackend()` - Inicializa FCM e registra no backend
- `cleanupFCMFromBackend()` - Remove token quando necessário

## ✅ Checklist de Integração

- [x] Serviço `notificationBackend.ts` criado
- [x] Serviço `messagingBackend.ts` criado
- [x] Hook `usePushNotifications` atualizado
- [ ] Variável `VITE_NOTIFICATION_API_URL` configurada no `.env`
- [ ] Backend rodando e acessível
- [ ] CORS configurado no backend
- [ ] Teste de registro de token funcionando
- [ ] Teste de envio de notificação funcionando

## 🧪 Testar

### 1. Verificar se Backend está Online

```typescript
import { checkBackendHealth } from '@/lib/services/notificationBackend';

const isOnline = await checkBackendHealth();
console.log('Backend online:', isOnline);
```

### 2. Testar Registro de Token

Abra o console do navegador e verifique os logs. Você deve ver:
- "Token FCM obtido com sucesso"
- "Token FCM salvo no Firestore"
- "Token FCM registrado no backend com sucesso"

### 3. Testar Envio de Notificação

No console do navegador:

```typescript
import { sendCheckinReminder } from '@/lib/services/notificationBackend';

// Use o userId do usuário logado
await sendCheckinReminder('seu-user-id-aqui');
```

## 🔒 Segurança

O serviço é seguro porque:

1. **Tokens FCM são públicos** - Podem ser incluídos no código do cliente
2. **Backend valida** - O backend deve validar que o userId corresponde ao token
3. **Firebase Auth** - Use Firebase Auth no backend para validar requisições se necessário

## 🐛 Troubleshooting

### Backend não está disponível

Se o backend não estiver rodando, o sistema automaticamente:
- Salva tokens apenas no Firestore
- Continua funcionando normalmente
- Tenta registrar no backend quando estiver disponível

**Logs:**
```
Backend de notificações não está disponível, usando apenas Firestore
```

### Token não está sendo registrado

1. Verifique se o backend está rodando
2. Verifique CORS no backend
3. Verifique URL no `.env`
4. Abra o console do navegador para ver erros

### Notificações não chegam

1. Verifique se o token foi registrado no backend
2. Verifique logs do backend
3. Verifique configuração FCM no Firebase
4. Teste envio manual via backend

## 📝 Notas

- O sistema funciona **com ou sem** o backend
- Se o backend não estiver disponível, usa apenas Firestore
- Tokens são registrados automaticamente
- Não precisa fazer nada manualmente após configurar a URL

## 🎯 Próximos Passos

1. Configure a URL do backend no `.env`
2. Inicie o backend
3. Teste o registro de tokens
4. Configure agendamentos no backend para envio automático

---

**Documentação do Backend:** Veja a documentação do backend para detalhes sobre endpoints e configuração.

