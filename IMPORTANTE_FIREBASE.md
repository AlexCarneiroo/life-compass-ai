# ⚠️ IMPORTANTE: Configuração do Firestore

## Por que os dados não estão salvando?

Se você está testando e os dados não estão sendo salvos no Firebase, o problema mais comum é que **as regras de segurança do Firestore estão bloqueando as operações**.

## ⚠️ PROBLEMA COM SUAS REGRAS ATUAIS

Suas regras estão bloqueando porque:
- Exigem `request.auth != null` mas o app usa `demo-user` sem autenticação
- A sintaxe `request.resource.data.userId` não funciona para leitura

## Solução Rápida (Para Testar Agora)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **controll-v**
3. Vá em **Firestore Database** → **Regras**
4. **SUBSTITUA** suas regras atuais por este código (modo de teste - permite tudo):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Clique em **Publicar**

## Regras Corrigidas (Com Suporte a Demo-User)

Se quiser manter alguma segurança mas permitir `demo-user`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      // Permite se autenticado E userId corresponde
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid) &&
        (request.resource == null || request.resource.data.userId == request.auth.uid);
      
      // OU permite demo-user (modo desenvolvimento)
      allow read, write: if request.resource.data.userId == 'demo-user' || 
        (resource != null && resource.data.userId == 'demo-user');
    }
  }
}
```

**Veja o arquivo `FIREBASE_RULES_CORRIGIDAS.md` para mais opções.**

## Verificar se está funcionando

Após configurar as regras:
1. Recarregue a aplicação
2. Tente criar um novo hábito, meta ou transação
3. Verifique no Firebase Console → Firestore Database se os dados aparecem

## Estrutura das Coleções

O app cria automaticamente estas coleções:
- `habits` - Hábitos
- `goals` - Metas
- `financialEntries` - Transações financeiras
- `healthEntries` - Dados de saúde
- `workouts` - Treinos
- `journalEntries` - Diário
- `routines` - Rotinas
- `projects` - Projetos profissionais
- `skills` - Habilidades
- `careerGoals` - Metas de carreira
- `checkIns` - Check-ins diários

## Nota sobre Autenticação

Atualmente o app usa `demo-user` como userId quando não há autenticação. Para produção, você precisará implementar autenticação do Firebase.

