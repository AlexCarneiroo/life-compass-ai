# 🔧 Regras do Firestore Corrigidas

## Problema Identificado

Suas regras atuais estão bloqueando as operações porque:
1. Exigem `request.auth != null` (usuário autenticado)
2. Mas o app usa `demo-user` quando não há autenticação
3. A sintaxe `request.resource.data.userId` não funciona para operações de leitura

## Solução: Regras Corrigidas

Cole estas regras no Firebase Console → Firestore Database → Regras:

### Opção 1: Modo Desenvolvimento (Permite tudo - NÃO USE EM PRODUÇÃO)

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

### Opção 2: Com Autenticação + Modo Demo (Recomendado para desenvolvimento)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      // Permite se estiver autenticado E o userId corresponde ao auth.uid
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid) &&
        (request.resource == null || request.resource.data.userId == request.auth.uid);
      
      // OU permite se o userId for 'demo-user' (modo desenvolvimento sem auth)
      allow read, write: if request.resource.data.userId == 'demo-user' || 
        (resource != null && resource.data.userId == 'demo-user');
    }
  }
}
```

### Opção 3: Apenas Autenticação (Para produção)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      // Permite leitura se o documento pertence ao usuário autenticado
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Permite escrita se o documento pertence ao usuário autenticado
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      
      // Permite atualização se o documento pertence ao usuário autenticado
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid &&
        request.resource.data.userId == request.auth.uid;
      
      // Permite deleção se o documento pertence ao usuário autenticado
      allow delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Como Aplicar

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **controll-v**
3. Vá em **Firestore Database** → **Regras**
4. Cole uma das opções acima (recomendo Opção 1 para testar agora)
5. Clique em **Publicar**

## Recomendação

Para **testar agora**, use a **Opção 1** (permite tudo).

Depois que confirmar que está funcionando, você pode:
- Implementar autenticação do Firebase
- Usar a **Opção 3** para produção

## Verificação

Após aplicar as regras:
1. Recarregue a aplicação
2. Tente criar um hábito
3. Verifique no console do navegador se há erros
4. Verifique no Firestore se o documento foi criado







