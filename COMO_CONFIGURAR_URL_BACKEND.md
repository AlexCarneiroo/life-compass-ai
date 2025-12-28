# 🔗 Como Configurar a URL do Backend

## 📍 Onde a URL está configurada

A URL do backend está definida em **2 lugares**:

### 1. No código (padrão)

**Arquivo:** `src/lib/services/notificationBackend.ts`

```typescript
// Linha 11
const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:3000/api';
```

**Valor padrão:** `http://localhost:3000/api`

### 2. Variável de ambiente (recomendado)

**Arquivo:** `.env` (na raiz do projeto)

```env
VITE_NOTIFICATION_API_URL=http://localhost:3000/api
```

## 🎯 Como configurar

### Opção 1: Usar o padrão (desenvolvimento local)

Se seu backend roda em `http://localhost:3000`, **não precisa fazer nada!** O código já usa esse valor por padrão.

### Opção 2: Configurar via .env (recomendado)

1. **Crie o arquivo `.env`** na raiz do projeto (se não existir)

2. **Adicione a URL:**

```env
VITE_NOTIFICATION_API_URL=http://localhost:3000/api
```

**Para produção:**
```env
VITE_NOTIFICATION_API_URL=https://seu-backend.com/api
```

3. **Reinicie o servidor de desenvolvimento:**

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

## 🔍 Como descobrir a URL do seu backend

### Se você criou o backend:

A URL é onde você configurou o servidor. Geralmente:
- **Desenvolvimento:** `http://localhost:3000/api`
- **Produção:** `https://seu-dominio.com/api`

### Se você recebeu do time de backend:

Pergunte qual é a URL base da API. Geralmente será algo como:
- `http://localhost:3000/api` (desenvolvimento)
- `https://api.seudominio.com/api` (produção)

### Verificar no código do backend:

Procure por algo como:
```javascript
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

A URL será: `http://localhost:3000` + `/api` (se houver prefixo)

## ✅ Verificar se está funcionando

1. **Inicie o backend** (se ainda não estiver rodando)

2. **Inicie o frontend:**
```bash
npm run dev
```

3. **Abra o console do navegador** (F12)

4. **Procure por logs:**
   - ✅ `Token FCM registrado no backend com sucesso` = Funcionando!
   - ⚠️ `Backend de notificações não está disponível` = URL incorreta ou backend offline

## 🧪 Testar a URL manualmente

Abra no navegador ou use curl:

```bash
# Teste de health check
curl http://localhost:3000/api/health

# Deve retornar algo como: {"status": "ok"}
```

## 📝 Exemplo completo de .env

```env
# Firebase
VITE_FIREBASE_PROJECT_ID=controll-v
VITE_FIREBASE_VAPID_KEY=sua-chave-vapid

# Backend de Notificações
VITE_NOTIFICATION_API_URL=http://localhost:3000/api
```

## ⚠️ Importante

- **Desenvolvimento:** Use `http://localhost:3000/api`
- **Produção:** Use `https://seu-backend.com/api`
- **Reinicie o servidor** após mudar o `.env`
- A URL deve terminar com `/api` se seu backend usa esse prefixo

## 🆘 Problemas comuns

### "Backend não está disponível"
- Verifique se o backend está rodando
- Verifique se a URL está correta
- Verifique CORS no backend

### "CORS error"
- O backend precisa permitir requisições do frontend
- Verifique configuração CORS no backend

### URL não está sendo lida
- Certifique-se de que o arquivo se chama `.env` (não `.env.local`)
- Reinicie o servidor após criar/editar `.env`
- Variáveis devem começar com `VITE_` para serem expostas

