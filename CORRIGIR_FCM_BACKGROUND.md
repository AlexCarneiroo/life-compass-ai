# 🔧 Como Corrigir Notificações FCM em Background

## ⚠️ Problema

As notificações não aparecem quando o site está fechado.

## ✅ Solução

O Firebase Messaging precisa de um service worker específico chamado `firebase-messaging-sw.js` na pasta `public`.

### Passo 1: Verificar se o arquivo existe

O arquivo `public/firebase-messaging-sw.js` foi criado. Este é o service worker específico do Firebase.

### Passo 2: Limpar Service Workers Antigos

1. Abra o DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Clique em **Unregister** em todos os service workers antigos
4. Feche todas as abas do app
5. Abra o app novamente

### Passo 3: Verificar se está funcionando

1. Abra o DevTools → Console
2. Procure por: `Service Worker registrado com sucesso`
3. Vá em **Application** → **Service Workers**
4. Deve mostrar:
   - `sw.js` (seu service worker principal)
   - `firebase-messaging-sw.js` (service worker do Firebase)

### Passo 4: Testar Notificação em Background

1. **Feche o app completamente** (feche todas as abas)
2. Vá em Firebase Console → **Cloud Messaging**
3. Clique em **Enviar sua primeira mensagem**
4. Cole o token FCM (pegar no Firestore: `fcmTokens` → seu documento)
5. Envie a mensagem
6. A notificação deve aparecer mesmo com o app fechado

---

## 🔍 Verificação de Problemas

### O Firebase não encontra o service worker

**Sintoma:** Erro no console: "Messaging: We are unable to register the default service worker"

**Solução:**
1. Verifique se `public/firebase-messaging-sw.js` existe
2. Verifique se o arquivo está acessível: `http://localhost:8080/firebase-messaging-sw.js`
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Desregistre todos os service workers e recarregue

### Service Worker não está sendo registrado

**Sintoma:** Não aparece `firebase-messaging-sw.js` em Application → Service Workers

**Solução:**
1. Verifique se o token FCM está sendo gerado
2. Verifique o console para erros
3. Tente registrar manualmente no console:
   ```javascript
   navigator.serviceWorker.register('/firebase-messaging-sw.js')
     .then(reg => console.log('Registrado:', reg))
     .catch(err => console.error('Erro:', err));
   ```

### Notificações ainda não aparecem

**Sintoma:** Token gerado, service worker ativo, mas notificações não aparecem

**Soluções:**
1. Verifique se o token FCM está correto no Firestore
2. Verifique se está usando o token correto ao enviar
3. Verifique se o payload da mensagem está correto
4. Teste com o Firebase Console primeiro (mais fácil)

---

## 🧪 Teste Rápido

Cole no console do navegador:

```javascript
// Verificar service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
  regs.forEach(reg => {
    console.log('SW:', reg.scope, reg.active ? '✅ Ativo' : '❌ Inativo');
  });
});

// Verificar se firebase-messaging-sw.js está acessível
fetch('/firebase-messaging-sw.js')
  .then(r => r.ok ? console.log('✅ firebase-messaging-sw.js encontrado') : console.log('❌ Não encontrado'))
  .catch(e => console.log('❌ Erro:', e));
```

---

## 📝 Notas Importantes

1. **Dois Service Workers**: Você terá dois service workers:
   - `sw.js` - Seu service worker principal (cache, etc)
   - `firebase-messaging-sw.js` - Service worker do Firebase (FCM)

2. **Ordem de Registro**: O Firebase registra automaticamente o `firebase-messaging-sw.js` quando você chama `getToken()`

3. **HTTPS Necessário**: Em produção, você precisa de HTTPS para notificações push funcionarem

4. **Teste Local**: Para testar localmente, use `localhost` (funciona sem HTTPS)

---

## ✅ Checklist Final

- [ ] Arquivo `public/firebase-messaging-sw.js` existe
- [ ] Service workers antigos foram desregistrados
- [ ] Token FCM está sendo gerado
- [ ] Token está salvo no Firestore
- [ ] Service worker do Firebase está ativo
- [ ] Teste via Firebase Console funciona

Se todos estão marcados, as notificações devem funcionar em background! 🎉

