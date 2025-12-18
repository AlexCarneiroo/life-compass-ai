# 🧪 Teste de Notificações em Background

## ⚠️ Problema Comum

Notificações não aparecem quando o site está fechado.

## ✅ Solução Implementada

Foi criado o arquivo `public/firebase-messaging-sw.js` que é o service worker específico do Firebase Messaging.

## 🔧 Passos para Testar

### 1. Limpar Service Workers Antigos

1. Abra o DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Clique em **Unregister** em TODOS os service workers
4. Feche TODAS as abas do app
5. Feche o navegador completamente
6. Abra o navegador novamente e acesse o app

### 2. Verificar se o Service Worker do Firebase foi Registrado

1. Abra o DevTools → **Application** → **Service Workers**
2. Você deve ver:
   - `sw.js` (seu service worker principal)
   - `firebase-messaging-sw.js` (service worker do Firebase) - **Este é o importante!**

**Se não aparecer `firebase-messaging-sw.js`, o Firebase não está registrando corretamente.**

### 3. Verificar Token FCM

1. Abra o console (F12)
2. Procure por: `Token FCM obtido com sucesso`
3. Vá em Firebase Console → Firestore → `fcmTokens`
4. Copie o token do array `tokens`

### 4. Testar Notificação em Background

**Método 1: Firebase Console (Mais Fácil)**

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Seu projeto: **controll-v**
3. Vá em **Cloud Messaging** (menu lateral)
4. Clique em **Enviar sua primeira mensagem** ou **Nova campanha**
5. Escolha **Notificação única**
6. Preencha:
   - **Título**: `🧪 Teste Background`
   - **Texto**: `Se você vê isso com app fechado, está funcionando!`
7. Clique em **Enviar mensagem de teste**
8. Cole o token FCM que você copiou
9. Clique em **Testar**
10. **IMPORTANTE**: Feche TODAS as abas do app antes de enviar
11. A notificação deve aparecer mesmo com o app fechado

**Método 2: Verificar se o arquivo está acessível**

1. Abra uma nova aba
2. Acesse: `http://localhost:8080/firebase-messaging-sw.js`
3. Deve mostrar o código do service worker (não erro 404)

### 5. Verificar Logs do Service Worker

1. DevTools → **Application** → **Service Workers**
2. Clique em `firebase-messaging-sw.js`
3. Clique em **Inspect** ou **Inspecionar**
4. Vá na aba **Console**
5. Envie uma notificação
6. Deve aparecer: `Service Worker: Mensagem FCM recebida em background`

---

## 🔍 Diagnóstico

### Se o service worker não aparece

**Problema**: Firebase não está registrando o service worker

**Soluções**:
1. Verifique se `public/firebase-messaging-sw.js` existe
2. Verifique se está acessível: `http://localhost:8080/firebase-messaging-sw.js`
3. Verifique o console para erros
4. Tente registrar manualmente:
   ```javascript
   navigator.serviceWorker.register('/firebase-messaging-sw.js')
     .then(reg => console.log('✅ Registrado:', reg))
     .catch(err => console.error('❌ Erro:', err));
   ```

### Se o token não é gerado

**Problema**: FCM não está inicializando

**Soluções**:
1. Verifique se a chave VAPID está no `.env`
2. Reinicie o servidor
3. Verifique se concedeu permissão de notificações
4. Verifique o console para erros específicos

### Se a notificação não aparece em background

**Problema**: Service worker não está processando a mensagem

**Soluções**:
1. Verifique se `firebase-messaging-sw.js` está ativo
2. Verifique os logs do service worker (Inspect)
3. Verifique se o payload está correto
4. Teste com o Firebase Console primeiro

---

## 🎯 Teste Rápido no Console

Cole no console do navegador:

```javascript
// 1. Verificar service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('📋 Service Workers registrados:', regs.length);
  regs.forEach(reg => {
    console.log('  -', reg.scope, reg.active ? '✅ Ativo' : '❌ Inativo');
  });
});

// 2. Verificar se firebase-messaging-sw.js existe
fetch('/firebase-messaging-sw.js')
  .then(r => {
    if (r.ok) {
      console.log('✅ firebase-messaging-sw.js encontrado e acessível');
    } else {
      console.log('❌ firebase-messaging-sw.js não encontrado (status:', r.status, ')');
    }
  })
  .catch(e => console.log('❌ Erro ao buscar firebase-messaging-sw.js:', e));

// 3. Verificar permissão
console.log('🔔 Permissão de notificações:', Notification.permission);
```

**Resultado esperado**:
- Service Workers: 2 (sw.js e firebase-messaging-sw.js)
- firebase-messaging-sw.js: ✅ encontrado
- Permissão: granted

---

## ✅ Checklist Final

Antes de testar, verifique:

- [ ] Arquivo `public/firebase-messaging-sw.js` existe
- [ ] Service workers antigos foram desregistrados
- [ ] Navegador foi fechado e reaberto
- [ ] Token FCM está sendo gerado
- [ ] Token está salvo no Firestore
- [ ] `firebase-messaging-sw.js` aparece em Application → Service Workers
- [ ] Permissão de notificações está "granted"
- [ ] App está completamente fechado antes de enviar notificação

Se todos estão marcados e ainda não funciona, verifique os logs do service worker (Inspect) para ver erros específicos.
