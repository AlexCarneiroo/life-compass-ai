# ⚡ Quick Start - Cloud Functions

Guia rápido para começar a usar as Cloud Functions.

## 🎯 O que foi criado

✅ Estrutura completa de Cloud Functions para notificações push  
✅ Funções HTTP para envio manual de notificações  
✅ Funções agendadas para lembretes automáticos  
✅ Integração com FCM (Firebase Cloud Messaging)  
✅ Documentação completa  

## 📦 Estrutura de Arquivos

```
cloud-functions/
├── functions/
│   ├── src/
│   │   ├── index.ts              # Exporta todas as funções
│   │   ├── notifications/
│   │   │   ├── checkin.ts        # Check-in reminders
│   │   │   ├── habits.ts         # Habit reminders
│   │   │   └── insights.ts       # Motivational insights
│   │   ├── utils/
│   │   │   ├── fcm.ts            # FCM helpers
│   │   │   └── firestore.ts      # Firestore helpers
│   │   └── types.ts              # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── README.md                      # Visão geral
├── SETUP.md                       # Guia de instalação
└── INTEGRATION.md                 # Como integrar no frontend
```

## 🚀 Passos para Deploy

### 1. Instalar Firebase CLI (se ainda não tiver)

```bash
npm install -g firebase-tools
```

### 2. Fazer login

```bash
firebase login
```

### 3. Inicializar Functions (se necessário)

```bash
cd cloud-functions
firebase init functions
```

Quando perguntado:
- ✅ TypeScript
- ✅ ESLint
- ✅ Instalar dependências

### 4. Instalar dependências

```bash
cd functions
npm install
```

### 5. Build e Deploy

```bash
# Build
npm run build

# Deploy
npm run deploy
# ou
firebase deploy --only functions
```

## 📋 Funções Criadas

### HTTP Functions (chamadas do frontend)

1. **`sendCheckinReminder`**
   - URL: `https://us-central1-controll-v.cloudfunctions.net/sendCheckinReminder`
   - Envia lembrete de check-in para um usuário

2. **`sendHabitReminder`**
   - URL: `https://us-central1-controll-v.cloudfunctions.net/sendHabitReminder`
   - Envia lembrete de hábito específico

3. **`sendInsightNotification`**
   - URL: `https://us-central1-controll-v.cloudfunctions.net/sendInsightNotification`
   - Envia insight motivacional

### Scheduled Functions (automáticas)

1. **`scheduledCheckinReminder`**
   - Executa: Todos os dias às 21:00 (horário de São Paulo)
   - Envia lembretes de check-in para usuários que não fizeram

2. **`scheduledHabitReminders`**
   - Executa: A cada hora (00:00, 01:00, 02:00, etc.)
   - Envia lembretes de hábitos conforme horários configurados

## 🧪 Testar Localmente

```bash
# Iniciar emulador
firebase emulators:start --only functions

# Testar função (em outra aba do terminal)
curl -X POST http://localhost:5001/controll-v/us-central1/sendCheckinReminder \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

## 📝 Próximos Passos

1. ✅ Deploy das funções para produção
2. ✅ Testar integração com frontend (veja `INTEGRATION.md`)
3. ✅ Monitorar logs: `firebase functions:log`
4. ✅ Configurar alertas (opcional)

## 🔗 Links Úteis

- [Documentação Firebase Functions](https://firebase.google.com/docs/functions)
- [Firebase Console](https://console.firebase.google.com/)
- [Cloud Functions Logs](https://console.cloud.google.com/functions)

## ⚠️ Importante

- **Billing**: Cloud Functions requer billing habilitado (mesmo no tier gratuito)
- **Custos**: Tier gratuito inclui 2 milhões de invocações/mês
- **Timeout**: Funções HTTP têm timeout padrão de 60s
- **Cold Start**: Primeira execução pode levar 1-2s

## 🆘 Problemas Comuns

### "Permission denied"
```bash
firebase login
```

### "Billing required"
- Habilite billing no Firebase Console
- Mesmo no tier gratuito, é necessário ter billing ativo

### Funções não aparecem no console
- Aguarde alguns minutos após deploy
- Verifique: `firebase functions:list`

### Erro de compilação TypeScript
```bash
cd functions
npm run build
# Verifique erros de tipo
```

---

📚 Para mais detalhes, veja `SETUP.md` e `INTEGRATION.md`

