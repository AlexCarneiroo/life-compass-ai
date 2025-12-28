# 🚀 Setup e Deploy - Firebase Cloud Functions

## Pré-requisitos

1. Node.js 18+ instalado
2. Firebase CLI instalado: `npm install -g firebase-tools`
3. Projeto Firebase criado e configurado
4. Conta Firebase com billing habilitado (necessário para Cloud Functions)

## 📦 Passo 1: Inicializar Firebase Functions

```bash
# Na raiz do projeto
cd cloud-functions
firebase init functions
```

Quando solicitado:
- ✅ Use TypeScript
- ✅ Use ESLint
- ✅ Instale dependências agora

## 🔧 Passo 2: Instalar Dependências

```bash
cd functions
npm install
```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env` na raiz do projeto (não commitado):

```env
FIREBASE_PROJECT_ID=controll-v
```

**Nota**: A autenticação do Admin SDK será automática no ambiente de produção.

## 🏗️ Passo 4: Estrutura de Arquivos

Certifique-se de que a estrutura está assim:

```
cloud-functions/
└── functions/
    ├── src/
    │   ├── index.ts
    │   ├── notifications/
    │   ├── schedulers/
    │   ├── types.ts
    │   └── utils/
    ├── package.json
    └── tsconfig.json
```

## 🔥 Passo 5: Deploy

### Deploy de todas as funções:

```bash
cd functions
npm run deploy
# ou
firebase deploy --only functions
```

### Deploy de função específica:

```bash
firebase deploy --only functions:sendCheckinReminder
```

### Deploy apenas funções agendadas:

```bash
firebase deploy --only functions:scheduledCheckinReminder,functions:scheduledHabitReminders
```

## 🧪 Passo 6: Testar Localmente

### Emulator (Desenvolvimento):

```bash
# Iniciar emulador
firebase emulators:start --only functions

# As funções estarão disponíveis em:
# http://localhost:5001/controll-v/us-central1/sendCheckinReminder
```

### Testar função HTTP:

```bash
curl -X POST http://localhost:5001/controll-v/us-central1/sendCheckinReminder \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

## 📊 Passo 7: Verificar Logs

```bash
# Ver logs em tempo real
firebase functions:log

# Ver logs de função específica
firebase functions:log --only sendCheckinReminder
```

## 🔐 Passo 8: Configurar Regras de Segurança

No Firebase Console, certifique-se de que as regras do Firestore permitem:
- Leitura de `fcmTokens` (apenas pelo próprio userId)
- Leitura de `habits`, `checkins`, etc. (conforme regras existentes)

## 🎯 Próximos Passos

1. Deploy das funções para produção
2. Testar integração com frontend
3. Monitorar logs e performance
4. Configurar alertas (opcional)

## 📝 Notas Importantes

- **Custo**: Cloud Functions tem tier gratuito generoso, mas monitore uso
- **Performance**: Funções cold start podem levar ~1-2s na primeira chamada
- **Timeout**: Funções HTTP têm timeout padrão de 60s (configurável até 540s)
- **Scheduled**: Funções agendadas precisam de Cloud Scheduler (habilitado automaticamente)

## 🐛 Troubleshooting

### Erro: "Permission denied"
- Verifique se está autenticado: `firebase login`
- Verifique se tem permissões no projeto

### Erro: "Billing required"
- Habilite billing no Firebase Console
- Cloud Functions requer billing mesmo para tier gratuito

### Função não aparece no console
- Aguarde alguns minutos após deploy
- Verifique se o deploy foi bem-sucedido: `firebase functions:list`

