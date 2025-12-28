# Configuração do Firebase Cloud Messaging (FCM)

Este guia explica como configurar notificações push do Firebase Cloud Messaging que funcionam mesmo quando o app está fechado.

## 📋 Pré-requisitos

1. Projeto Firebase configurado
2. Firebase Cloud Messaging habilitado no console
3. Chave VAPID gerada

## 🔑 Passo 1: Obter a Chave VAPID

A chave VAPID é necessária para autenticar seu app com o FCM.

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **controll-v**
3. Vá em **Configurações do projeto** (ícone de engrenagem)
4. Role até a seção **Cloud Messaging**
5. Em **Chave da Web Push**, clique em **Gerar chave de par de chaves**
6. Copie a chave gerada (será algo como: `BEl...xyz`)

## 🔧 Passo 2: Configurar Variáveis de Ambiente

Adicione a chave VAPID ao seu arquivo `.env`:

```env
VITE_FIREBASE_VAPID_KEY=sua-chave-vapid-aqui
```

**Importante**: A chave VAPID é pública e pode ser incluída no código do cliente.

## 📱 Passo 3: Como Funciona

### Notificações em Background (App Fechado)

Quando o app está fechado, o FCM envia notificações diretamente para o service worker (`public/sw.js`), que as exibe automaticamente.

### Notificações em Foreground (App Aberto)

Quando o app está aberto, o FCM envia mensagens que são capturadas pelo listener em `src/lib/firebase/messaging.ts` e exibidas como notificações locais.

## 🚀 Passo 4: Enviar Notificações

### Opção 1: Usar Cloud Functions (Recomendado)

Crie uma Cloud Function no Firebase para enviar notificações:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendCheckinReminder = functions.pubsub
  .schedule('0 21 * * *') // Todo dia às 21h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const db = admin.firestore();
    const users = await db.collection('users').get();
    
    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const tokensDoc = await db.collection('fcmTokens').doc(userId).get();
      const tokens = tokensDoc.data()?.tokens || [];
      
      for (const token of tokens) {
        await admin.messaging().send({
          token,
          notification: {
            title: '📝 Hora do Check-in Diário',
            body: 'Como foi seu dia? Registre seu humor, energia e produtividade.',
          },
          webpush: {
            notification: {
              icon: '/icon-192.png',
            },
            fcmOptions: {
              link: '/#checkin',
            },
          },
          data: {
            type: 'checkin',
          },
        });
      }
    }
  });
```

### Opção 2: Usar API REST FCM V1 (Requer Token OAuth2)

Para usar a API REST FCM V1 diretamente do frontend, você precisa:

1. Criar uma conta de serviço no Firebase
2. Obter um token de acesso OAuth2
3. Usar o serviço `src/lib/services/fcmSender.ts`

**Nota**: Por segurança, é recomendado usar Cloud Functions ou um backend para enviar notificações.

## 📝 Estrutura de Dados no Firestore

Os tokens FCM são salvos na coleção `fcmTokens`:

```
fcmTokens/{userId}
  - userId: string
  - tokens: string[]  // Array de tokens FCM do usuário
  - createdAt: timestamp
  - updatedAt: timestamp
```

## 🔔 Tipos de Notificações

O sistema suporta os seguintes tipos de notificações:

1. **Check-in Diário**: Lembrete para fazer check-in às 21h
2. **Lembretes de Hábitos**: Notificações nos horários configurados
3. **Insights Motivacionais**: Notificações aleatórias durante o dia

## 🧪 Testar Notificações

### Teste Local (App Aberto)

1. Abra o app
2. Vá em Configurações → Notificações
3. Clique em "Testar Notificação"
4. Você deve receber uma notificação

### Teste em Background (App Fechado)

1. Feche o app completamente
2. Use a Cloud Function ou API para enviar uma notificação
3. A notificação deve aparecer mesmo com o app fechado

## ⚠️ Troubleshooting

### Notificações não aparecem em background

1. Verifique se o service worker está registrado (console do navegador)
2. Verifique se a chave VAPID está configurada corretamente
3. Verifique se o token FCM foi salvo no Firestore
4. Verifique os logs do service worker no DevTools → Application → Service Workers

### Token FCM não é gerado

1. Verifique se o usuário concedeu permissão para notificações
2. Verifique se o Firebase Messaging está inicializado corretamente
3. Verifique se a chave VAPID está configurada

### Service Worker não recebe mensagens

1. Verifique se o service worker está ativo
2. Verifique se o evento `push` está sendo capturado
3. Verifique os logs no DevTools → Application → Service Workers

## 📚 Recursos Adicionais

- [Documentação FCM](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🔐 Segurança

- A chave VAPID é pública e pode ser incluída no código
- Os tokens FCM devem ser armazenados de forma segura no Firestore
- Use Cloud Functions ou backend para enviar notificações em produção
- Não exponha tokens de acesso OAuth2 no frontend

