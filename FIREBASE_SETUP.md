# Configuração do Firebase

Este projeto está preparado para usar Firebase como banco de dados. Siga os passos abaixo para configurar:

## 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Preencha o nome do projeto
4. Configure o Google Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Configurar Firestore Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (para desenvolvimento)
4. Escolha a localização do servidor
5. Clique em "Ativar"

## 3. Obter Credenciais

1. No menu lateral, clique em "Configurações do projeto" (ícone de engrenagem)
2. Role até "Seus apps"
3. Clique no ícone `</>` (Web)
4. Registre o app com um nome
5. Copie as credenciais do Firebase

## 4. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto
2. Copie o conteúdo de `.env.example` para `.env`
3. Preencha com suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=seu-app-id
```

## 5. Configurar Regras de Segurança (Firestore)

⚠️ **IMPORTANTE**: Para que os dados sejam salvos, você DEVE configurar as regras do Firestore.

No Firestore, vá em "Regras" e configure (modo de teste para desenvolvimento):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Modo de teste - permite tudo (APENAS PARA DESENVOLVIMENTO)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**OU** para produção com autenticação:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura/escrita apenas para o próprio usuário
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid) &&
        (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
  }
}
```

**NOTA**: Se você não configurar as regras, o Firebase bloqueará todas as operações de escrita!

## 6. Estrutura de Dados

O projeto usa as seguintes coleções no Firestore:

- `habits` - Hábitos do usuário
- `goals` - Metas e objetivos
- `financialEntries` - Transações financeiras
- `healthEntries` - Registros de saúde
- `workouts` - Treinos realizados
- `journalEntries` - Entradas do diário
- `routines` - Rotinas personalizadas
- `projects` - Projetos profissionais
- `skills` - Habilidades profissionais
- `careerGoals` - Metas de carreira
- `checkIns` - Check-ins diários

## 7. Modo Demo (Sem Firebase)

Se você não configurar o Firebase, o app funcionará em modo demo usando dados mock locais. Todas as funcionalidades estarão disponíveis, mas os dados não serão salvos permanentemente.

## Notas Importantes

- Em desenvolvimento, você pode usar o modo de teste do Firestore
- Para produção, configure regras de segurança adequadas
- Todos os dados são associados ao `userId` do usuário autenticado
- O projeto usa `demo-user` como fallback quando não há autenticação

