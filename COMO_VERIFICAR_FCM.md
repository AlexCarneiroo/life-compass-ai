# ✅ Como Verificar se o FCM Está Funcionando

## 🔍 Verificação Rápida (5 minutos)

### 1️⃣ Verificar no Console do Navegador

1. Abra o app no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**
4. Procure por estas mensagens (devem aparecer automaticamente):

```
✅ Service Worker registrado com sucesso
✅ Token FCM obtido com sucesso
✅ FCM inicializado com sucesso
✅ Token FCM salvo no Firestore
```

**Se você vê essas mensagens = FCM está funcionando! ✅**

### 2️⃣ Verificar no Firestore

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **controll-v**
3. Clique em **Firestore Database**
4. Procure pela coleção **`fcmTokens`**
5. Deve haver um documento com seu `userId`

**Se você vê o documento com tokens = FCM está funcionando! ✅**

### 3️⃣ Verificar Service Worker

1. No DevTools (F12), vá em **Application** (ou **Aplicativo**)
2. No menu lateral, clique em **Service Workers**
3. Deve mostrar:
   - Status: **activated and running** ✅
   - Arquivo: `sw.js`

**Se está "activated and running" = Service Worker está funcionando! ✅**

### 4️⃣ Testar Notificação Local

1. No app, vá em **Configurações** → **Notificações**
2. Clique no botão **Testar**
3. Você deve receber uma notificação imediatamente

**Se a notificação aparece = Sistema de notificações está funcionando! ✅**

---

## 🧪 Teste Completo (Verificar Background)

### Passo 1: Obter seu Token FCM

1. Abra o DevTools (F12) → Console
2. Cole este código e pressione Enter:

```javascript
// Verificar token FCM salvo
import('@/lib/firebase/messaging').then(module => {
  import('@/hooks/useAuth').then(authModule => {
    const { useAuth } = authModule;
    // Isso vai mostrar no console
    console.log('Verificando FCM...');
  });
});

// Ou verifique diretamente no Firestore
// Vá em Firebase Console → Firestore → fcmTokens → seu userId
```

### Passo 2: Verificar Token no Firestore

1. Firebase Console → Firestore → `fcmTokens`
2. Abra o documento com seu `userId`
3. Copie um dos tokens do array `tokens`
4. Anote o token (você vai usar para testar)

### Passo 3: Testar Notificação em Background

**Opção A: Usar Firebase Console (Mais Fácil)**

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Cloud Messaging** (no menu lateral)
3. Clique em **Enviar sua primeira mensagem**
4. Preencha:
   - Título: `🧪 Teste FCM`
   - Texto: `Se você vê isso, o FCM está funcionando!`
   - Cole o token FCM que você copiou
5. Clique em **Enviar mensagem de teste**
6. **Feche o app completamente** (ou minimize a aba)
7. A notificação deve aparecer mesmo com o app fechado

**Se a notificação aparece com app fechado = FCM em background está funcionando! ✅**

---

## 📊 Checklist Completo

Marque cada item conforme verifica:

- [ ] Console mostra "Token FCM obtido com sucesso"
- [ ] Console mostra "FCM inicializado com sucesso"
- [ ] Firestore tem coleção `fcmTokens` com seu documento
- [ ] Service Worker está "activated and running"
- [ ] Notificação de teste funciona (app aberto)
- [ ] Notificação via Firebase Console funciona (app fechado)

**Se todos estão marcados = FCM está 100% funcionando! 🎉**

---

## ⚠️ Se Algo Não Está Funcionando

### Token FCM não aparece no console

**Sintomas:**
- Não vê "Token FCM obtido com sucesso"
- Erro no console relacionado a FCM

**Soluções:**
1. Verifique se a chave VAPID está no `.env`:
   ```env
   VITE_FIREBASE_VAPID_KEY=sua-chave-aqui
   ```
2. Reinicie o servidor (`npm run dev`)
3. Verifique se concedeu permissão de notificações
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Service Worker não está ativo

**Sintomas:**
- Service Worker mostra "redundant" ou erro
- Não aparece "activated and running"

**Soluções:**
1. No DevTools → Application → Service Workers
2. Clique em **Unregister** no service worker antigo
3. Recarregue a página (F5)
4. Verifique se `public/sw.js` existe

### Notificações não aparecem em background

**Sintomas:**
- Notificações funcionam com app aberto
- Não funcionam com app fechado

**Soluções:**
1. Verifique se o Service Worker está ativo
2. Verifique se o token FCM está salvo no Firestore
3. Teste enviando via Firebase Console (Cloud Messaging)
4. Verifique se o navegador permite notificações em background
   - Chrome: Configurações → Privacidade → Notificações

---

## 🎯 Teste Rápido (1 minuto)

Cole no console do navegador (F12):

```javascript
// Verificar se FCM está configurado
console.log('VAPID Key:', import.meta.env.VITE_FIREBASE_VAPID_KEY ? '✅ Configurada' : '❌ Não configurada');
console.log('Service Worker:', 'serviceWorker' in navigator ? '✅ Suportado' : '❌ Não suportado');
console.log('Notificações:', 'Notification' in window ? '✅ Suportado' : '❌ Não suportado');
console.log('Permissão:', Notification.permission);

// Verificar service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers registrados:', regs.length);
  regs.forEach(reg => {
    console.log('SW Status:', reg.active ? '✅ Ativo' : '❌ Inativo');
  });
});
```

**Resultado esperado:**
- VAPID Key: ✅ Configurada
- Service Worker: ✅ Suportado
- Notificações: ✅ Suportado
- Permissão: granted
- Service Workers registrados: 1
- SW Status: ✅ Ativo

---

## 📱 Teste no Celular (PWA)

Se você instalou o app como PWA no celular:

1. Abra o app no celular
2. Vá em Configurações → Notificações
3. Ative as notificações
4. Feche o app completamente
5. Envie uma notificação via Firebase Console
6. A notificação deve aparecer mesmo com app fechado

---

## 🎉 Confirmação Final

Se você conseguiu:
- ✅ Ver os logs no console
- ✅ Ver o token no Firestore
- ✅ Service Worker ativo
- ✅ Notificação de teste funciona
- ✅ Notificação em background funciona

**PARABÉNS! O FCM está 100% funcionando! 🚀**

Agora você pode criar Cloud Functions para enviar notificações agendadas automaticamente.
