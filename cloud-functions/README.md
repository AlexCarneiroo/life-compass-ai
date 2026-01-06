# 🔔 Firebase Cloud Functions - Sistema de Notificações

Este diretório contém todas as Cloud Functions necessárias para o sistema de notificações push do Life Compass AI.

## 📁 Estrutura

```
cloud-functions/
├── functions/
│   ├── src/
│   │   ├── index.ts              # Arquivo principal - exporta todas as funções
│   │   ├── notifications/
│   │   │   ├── checkin.ts        # Notificações de check-in
│   │   │   ├── habits.ts         # Notificações de hábitos
│   │   │   └── insights.ts       # Notificações de insights
│   │   ├── schedulers/
│   │   │   ├── dailyCheckin.ts   # Agendador diário de check-in
│   │   │   └── habitReminders.ts # Agendador de lembretes de hábitos
│   │   ├── types.ts              # Tipos TypeScript compartilhados
│   │   └── utils/
│   │       ├── fcm.ts            # Utilitários para enviar FCM
│   │       └── firestore.ts      # Utilitários Firestore
│   ├── package.json
│   └── tsconfig.json
├── README.md                      # Este arquivo
└── SETUP.md                      # Guia de instalação e deploy
```

## 🚀 Instalação e Deploy

Veja o arquivo `SETUP.md` para instruções completas de instalação e deploy.

## 📋 Funções Disponíveis

### Notificações de Check-in

- **`sendCheckinReminder`** (HTTP) - Envia lembrete de check-in para um usuário
- **`scheduledCheckinReminder`** (Scheduled) - Envia lembretes diários às 21h

### Notificações de Hábitos

- **`sendHabitReminder`** (HTTP) - Envia lembrete de hábito específico
- **`scheduledHabitReminders`** (Scheduled) - Envia lembretes de hábitos conforme horários configurados

### Notificações de Insights

- **`sendInsightNotification`** (HTTP) - Envia insight motivacional personalizado

## 🔗 Integração com Frontend

As funções HTTP podem ser chamadas do frontend usando `fetch` ou criando um serviço específico.

Exemplo:
```typescript
// Chamar função HTTP do frontend
const response = await fetch('https://us-central1-controll-v.cloudfunctions.net/sendCheckinReminder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user123' })
});
```

## 🔒 Segurança

Todas as funções HTTP estão protegidas com autenticação Firebase. Apenas usuários autenticados podem chamar as funções.

## 📝 Notas

- As funções agendadas (scheduled) rodam automaticamente sem necessidade de chamadas externas
- Os tokens FCM são armazenados na coleção `fcmTokens` no Firestore
- A estrutura de dados está documentada em `functions/src/types.ts`



