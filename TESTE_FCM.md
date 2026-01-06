# 🧪 Como Testar o Firebase Cloud Messaging

Agora que a chave VAPID está configurada, siga estes passos para testar:

## ✅ Passo 1: Reiniciar o Servidor

Se o servidor estiver rodando, reinicie para carregar a nova variável de ambiente:

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

## ✅ Passo 2: Ativar Notificações no App

1. Abra o app no navegador
2. Vá em **Configurações** (ícone de engrenagem)
3. Role até a seção **Notificações**
4. Clique em **Ativar** para conceder permissão
5. Quando solicitado pelo navegador, clique em **Permitir**

## ✅ Passo 3: Verificar se o Token FCM foi Gerado

1. Abra o **DevTools** (F12)
2. Vá na aba **Console**
3. Procure por uma das seguintes mensagens:
   - ✅ `Token FCM obtido com sucesso`
   - ✅ `FCM inicializado com sucesso`
   - ✅ `Token FCM salvo no Firestore`

## ✅ Passo 4: Verificar no Firestore

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **controll-v**
3. Vá em **Firestore Database**
4. Procure pela coleção `fcmTokens`
5. Deve haver um documento com seu `userId` contendo:
   ```json
   {
     "userId": "seu-user-id",
     "tokens": ["token-fcm-aqui"],
     "createdAt": timestamp,
     "updatedAt": timestamp
   }
   ```

## ✅ Passo 5: Testar Notificação Local

1. No app, vá em **Configurações** → **Notificações**
2. Clique em **Testar**
3. Você deve receber uma notificação imediatamente

## ✅ Passo 6: Testar Notificação em Background

### Opção A: Usar Cloud Function (Recomendado)

Crie uma Cloud Function para enviar notificações. Veja exemplo em `FCM_SETUP.md`.

### Opção B: Teste Manual via Console do Navegador

1. Abra o DevTools → Console
2. Cole este código (substitua `SEU_USER_ID` e `SEU_TOKEN_FCM`):

```javascript
// Obter token do Firestore primeiro
fetch('https://fcm.googleapis.com/v1/projects/controll-v/messages:send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_OAUTH2' // Precisa de token OAuth2
  },
  body: JSON.stringify({
    message: {
      token: 'SEU_TOKEN_FCM',
      notification: {
        title: '🧪 Teste FCM',
        body: 'Se você está vendo isso, o FCM está funcionando!'
      },
      webpush: {
        notification: {
          icon: '/icon-192.png'
        },
        fcmOptions: {
          link: '/'
        }
      },
      data: {
        type: 'test'
      }
    }
  })
});
```

**Nota**: Para testar sem Cloud Function, você precisará de um token OAuth2, o que é mais complexo. Recomendo criar uma Cloud Function.

## 🔍 Verificar Service Worker

1. DevTools → **Application** → **Service Workers**
2. Deve mostrar `sw.js` como **activated and running**
3. Clique em **Push** para ver eventos de push recebidos

## ⚠️ Problemas Comuns

### Token FCM não é gerado

- ✅ Verifique se a chave VAPID está no `.env` como `VITE_FIREBASE_VAPID_KEY=...`
- ✅ Verifique se reiniciou o servidor após adicionar a chave
- ✅ Verifique se concedeu permissão de notificações
- ✅ Verifique o console para erros

### Service Worker não está ativo

- ✅ Verifique se `sw.js` está em `public/sw.js`
- ✅ Verifique se o service worker está registrado (console)
- ✅ Tente desregistrar e registrar novamente:
  ```javascript
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    location.reload();
  });
  ```

### Notificações não aparecem em background

- ✅ Verifique se o service worker está ativo
- ✅ Verifique se o token FCM está salvo no Firestore
- ✅ Teste enviando uma notificação via Cloud Function

## 🎉 Próximos Passos

Após confirmar que está funcionando:

1. ✅ Criar Cloud Functions para notificações agendadas (check-in às 21h, hábitos, etc)
2. ✅ Testar notificações em diferentes navegadores
3. ✅ Configurar notificações personalizadas por tipo

## 📝 Logs Úteis

No console do navegador, você deve ver:
- `Service Worker registrado com sucesso`
- `Token FCM obtido com sucesso`
- `FCM inicializado com sucesso`
- `Token FCM salvo no Firestore`

Se ver algum erro, anote a mensagem e verifique a documentação em `FCM_SETUP.md`.



