# 🔧 Configuração do Firebase Storage

## ⚠️ IMPORTANTE: Erro de CORS no Upload de Imagens

Se você está recebendo erro de CORS ao tentar fazer upload de imagens, é porque as **regras de segurança do Firebase Storage não estão configuradas**.

## Como Configurar as Regras do Storage

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **controll-v**
3. No menu lateral, clique em **Storage** (ou **Armazenamento**)
4. Se o Storage ainda não foi criado, clique em **Começar**
5. Vá na aba **Regras** (Rules)

## Regras para Desenvolvimento (Permite tudo - NÃO USE EM PRODUÇÃO)

Cole estas regras no Firebase Console → Storage → Regras:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permite tudo para desenvolvimento
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Regras para Produção (Com Autenticação)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fotos de perfil - apenas o próprio usuário pode ler/escrever
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Outros arquivos - apenas usuários autenticados
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Regras Recomendadas (Segurança + Desenvolvimento)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fotos de perfil
    match /profile-photos/{userId}/{allPaths=**} {
      // Permite leitura para usuários autenticados
      allow read: if request.auth != null;
      // Permite escrita apenas pelo próprio usuário
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024 // Máximo 5MB
        && request.resource.contentType.matches('image/.*');
    }
    
    // Outros arquivos
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Como Aplicar

1. Cole uma das regras acima no editor de regras
2. Clique em **Publicar**
3. Aguarde alguns segundos para as regras serem aplicadas
4. Recarregue a aplicação e tente fazer upload novamente

## Verificar se Está Funcionando

Após configurar as regras:
1. Recarregue a aplicação
2. Tente fazer upload de uma foto de perfil
3. Verifique no Firebase Console → Storage se a imagem foi salva
4. Verifique no console do navegador se não há mais erros de CORS

## Notas Importantes

- As regras do Storage são diferentes das regras do Firestore
- Você precisa configurar ambas separadamente
- Em desenvolvimento, pode usar regras permissivas
- Em produção, sempre use regras restritivas com autenticação




