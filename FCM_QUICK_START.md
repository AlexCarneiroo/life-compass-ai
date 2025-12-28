# 🚀 Guia Rápido - Firebase Cloud Messaging

## ✅ O que foi implementado

1. **Firebase Messaging configurado** (`src/lib/firebase.ts`)
2. **Serviço de gerenciamento FCM** (`src/lib/firebase/messaging.ts`)
3. **Service Worker atualizado** (`public/sw.js`) - recebe notificações em background
4. **Integração com hook de notificações** (`src/hooks/usePushNotifications.ts`)
5. **Serviço para enviar notificações** (`src/lib/services/fcmSender.ts`)

## 🔧 Configuração Necessária

### 1. Obter Chave VAPID

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Seu projeto: **controll-v**
3. Configurações → Cloud Messaging
4. Em **Chave da Web Push**, clique em **Gerar chave de par de chaves**
5. Copie a chave gerada

### 2. Adicionar ao .env

Crie/edite o arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_VAPID_KEY=sua-chave-vapid-aqui
```

### 3. Reiniciar o servidor de desenvolvimento

```bash
npm run dev
```

## 📱 Como Funciona

### Quando o app está aberto:
- FCM envia mensagens → Listener captura → Exibe notificação local

### Quando o app está fechado:
- FCM envia mensagens → Service Worker recebe → Exibe notificação automaticamente

## 🧪 Testar

1. Abra o app
2. Conceda permissão para notificações quando solicitado
3. O token FCM será gerado e salvo automaticamente
4. Verifique no Firestore: coleção `fcmTokens` → documento com seu `userId`

## 📤 Enviar Notificações

### Opção Recomendada: Cloud Functions

Crie uma Cloud Function para enviar notificações agendadas (check-in às 21h, hábitos, etc).

Veja exemplo completo em `FCM_SETUP.md`.

### Opção Alternativa: API REST

Use o serviço `src/lib/services/fcmSender.ts` (requer token OAuth2).

## 📚 Documentação Completa

Veja `FCM_SETUP.md` para:
- Configuração detalhada
- Exemplos de Cloud Functions
- Troubleshooting
- Segurança

## ⚠️ Próximos Passos

1. ✅ Adicionar chave VAPID ao `.env`
2. ⏳ Criar Cloud Functions para enviar notificações agendadas
3. ⏳ Testar notificações em background (app fechado)

## 🔍 Verificar se está funcionando

1. Abra o DevTools → Console
2. Procure por: "Token FCM obtido com sucesso"
3. Verifique Firestore: `fcmTokens/{userId}` deve ter um documento com tokens
4. Teste: Feche o app e envie uma notificação via Cloud Function

