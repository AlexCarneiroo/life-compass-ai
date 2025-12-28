# 🔔 Integração Completa - Push Notifications

Este documento descreve a integração completa de push notifications com o backend.

## ✅ O que está implementado

### 1. Serviços Backend
- ✅ `src/lib/services/notificationBackend.ts` - Cliente da API
- ✅ `src/lib/firebase/messagingBackend.ts` - Integração FCM com backend
- ✅ Registro automático de tokens
- ✅ Verificação de saúde do backend
- ✅ Tratamento de erros robusto

### 2. Firebase Configuration
- ✅ `src/lib/firebase.ts` - Configuração Firebase
- ✅ `public/firebase-messaging-sw.js` - Service Worker para background
- ✅ Suporte a notificações em foreground e background

### 3. Hooks React
- ✅ `src/hooks/usePushNotifications.ts` - Hook principal
- ✅ `src/hooks/useBrowserNotifications.ts` - Hook de permissões
- ✅ Inicialização automática
- ✅ Listener de mensagens em foreground

### 4. Componentes UI
- ✅ `src/components/notifications/NotificationManager.tsx` - Gerenciador completo
- ✅ `src/components/sections/SettingsSection.tsx` - Seção de configurações
- ✅ Status de permissões
- ✅ Botões de ativação e teste
- ✅ Feedback visual

## 🚀 Como usar

### 1. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Firebase (já deve estar configurado)
VITE_FIREBASE_PROJECT_ID=controll-v
VITE_FIREBASE_VAPID_KEY=sua-chave-vapid-aqui

# Backend de Notificações
VITE_NOTIFICATION_API_URL=http://localhost:3000/api
```

### 2. Obter VAPID Key do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto: **controll-v**
3. Vá em **Configurações do projeto** (ícone de engrenagem)
4. Role até **Cloud Messaging**
5. Em **Chave da Web Push**, clique em **Gerar chave de par de chaves**
6. Copie a chave e adicione no `.env` como `VITE_FIREBASE_VAPID_KEY`

### 3. Inicialização Automática

O sistema inicializa automaticamente quando:
- Usuário faz login
- App é carregado
- Permissão é concedida

**Não precisa fazer nada manualmente!**

### 4. Usar o Componente de Notificações

```tsx
import { NotificationManager } from '@/components/notifications/NotificationManager';

function MyComponent() {
  return <NotificationManager />;
}
```

Ou use nas configurações (já está integrado):

```tsx
// Em SettingsSection.tsx - já está implementado!
```

## 📋 Endpoints do Backend

O sistema se comunica com os seguintes endpoints:

### GET `/api/health`
Verifica se o backend está online

### POST `/api/tokens`
Registra token FCM

**Body:**
```json
{
  "token": "fcm-token-aqui",
  "userId": "user-123",
  "deviceType": "web"
}
```

### DELETE `/api/tokens`
Remove token FCM

**Body:**
```json
{
  "token": "fcm-token-aqui",
  "userId": "user-123"
}
```

### POST `/api/notifications/send-to-user/:userId`
Envia notificação para usuário

**Body:**
```json
{
  "title": "Título",
  "body": "Mensagem",
  "priority": "high",
  "data": {
    "type": "checkin"
  },
  "tag": "notification-tag"
}
```

## 🔄 Fluxo Completo

### 1. Inicialização
```
App carrega
  ↓
usePushNotifications inicializa
  ↓
Verifica permissão do navegador
  ↓
Se não tem → Mostra botão "Ativar"
  ↓
Se tem → Obtém token FCM
  ↓
Registra token no backend
  ↓
Salva token no Firestore (backup)
  ↓
Configura listeners
```

### 2. Recebimento de Notificações

**Foreground (app aberto):**
```
Backend envia via FCM
  ↓
onMessage() captura
  ↓
Exibe notificação local
  ↓
Atualiza UI se necessário
```

**Background (app fechado):**
```
Backend envia via FCM
  ↓
Service Worker recebe
  ↓
onBackgroundMessage() processa
  ↓
Exibe notificação automaticamente
  ↓
Usuário clica → Abre app
```

## 🧪 Testar

### 1. Teste de Permissão

1. Abra o app
2. Vá em **Configurações** → **Notificações**
3. Clique em **Ativar Notificações**
4. Permita no navegador
5. Verifique: Status deve mostrar "Ativado"

### 2. Teste de Notificação Local

1. Com permissão ativada
2. Clique em **Testar Notificação Local**
3. Deve aparecer uma notificação

### 3. Teste Via Backend

1. Certifique-se que o backend está rodando
2. Clique em **Testar Via Backend**
3. Deve receber notificação do backend

### 4. Teste em Background

1. Com permissão ativada
2. Feche completamente o app/navegador
3. Use a API do backend para enviar notificação:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/send-to-user/USER_ID \
     -H "Content-Type: application/json" \
     -d '{"title": "Teste", "body": "Notificação de teste", "priority": "high"}'
   ```
4. A notificação deve aparecer mesmo com app fechado

## 🐛 Troubleshooting

### "Permissão negada"
- Navegador bloqueou notificações
- Vá em Configurações do navegador → Site Settings → Notifications
- Permita para o site

### "Backend offline"
- Verifique se o backend está rodando
- Verifique a URL no `.env`
- Verifique CORS no backend

### "Token não registrado"
- Verifique console do navegador para erros
- Verifique se Firebase está configurado
- Verifique se VAPID key está correta

### Notificações não chegam em background
- Verifique se `firebase-messaging-sw.js` está em `public/`
- Verifique se service worker está registrado (DevTools → Application → Service Workers)
- Limpe cache e recarregue

## 📝 Checklist de Verificação

- [ ] Firebase configurado com projeto "controll-v"
- [ ] VAPID Key obtida e configurada no `.env`
- [ ] Backend rodando em `http://localhost:3000`
- [ ] `.env` com `VITE_NOTIFICATION_API_URL=http://localhost:3000/api`
- [ ] Service Worker registrado (verificar no DevTools)
- [ ] Permissão de notificações concedida
- [ ] Token FCM obtido e registrado
- [ ] Teste local funcionando
- [ ] Teste via backend funcionando
- [ ] Notificações em background funcionando

## 🎯 Próximos Passos

1. ✅ Configurar VAPID key
2. ✅ Iniciar backend
3. ✅ Testar integração
4. ✅ Configurar lembretes agendados no backend
5. ✅ Monitorar logs e performance

## 📚 Arquivos Importantes

- `src/lib/services/notificationBackend.ts` - Cliente da API
- `src/lib/firebase/messagingBackend.ts` - Integração FCM
- `src/hooks/usePushNotifications.ts` - Hook principal
- `src/components/notifications/NotificationManager.tsx` - UI
- `public/firebase-messaging-sw.js` - Service Worker
- `.env` - Configurações

---

**Status:** ✅ Integração completa e pronta para uso!

