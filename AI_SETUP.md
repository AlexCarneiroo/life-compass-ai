# Configuração da IA Coach

A seção de IA Coach está implementada e funcional! Ela funciona de duas formas:

## 1. Modo Simulado (Padrão)

Sem configuração adicional, a IA usa respostas inteligentes simuladas baseadas nos seus dados reais. Ela:
- Analisa seus check-ins, hábitos, finanças e treinos
- Gera análises semanais personalizadas
- Responde perguntas com base em padrões e seus dados
- Funciona completamente offline

## 2. Modo OpenAI (Opcional)

Para usar a API completa da OpenAI (GPT-3.5-turbo):

### Passo 1: Obter API Key

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma conta ou faça login
3. Vá em "API Keys"
4. Clique em "Create new secret key"
5. Copie a chave (ela só aparece uma vez!)

### Passo 2: Configurar no Projeto

1. Crie ou edite o arquivo `.env` na raiz do projeto
2. Adicione:
   ```env
   VITE_OPENAI_API_KEY=sk-sua-chave-aqui
   ```
3. Reinicie o servidor de desenvolvimento

### Passo 3: Usar

A IA automaticamente detectará a chave e usará a API da OpenAI para respostas mais avançadas e personalizadas.

## Funcionalidades

### ✅ Chat Interativo
- Faça perguntas sobre produtividade, sono, hábitos, finanças, etc.
- A IA analisa seus dados reais antes de responder
- Respostas personalizadas baseadas no seu histórico

### ✅ Análise Semanal Automática
- Gera análise semanal dos seus dados
- Identifica conquistas e pontos de melhoria
- Fornece recomendações específicas
- Atualize clicando no botão "Atualizar"

### ✅ Modos de Coach
- **Modo Terapia**: Autoconhecimento e reflexão
- **Alto Rendimento**: Foco e produtividade extrema
- **Vida Minimalista**: Reduzir e simplificar
- **Planner Automático**: IA planeja seu dia

## Perguntas Sugeridas

- "Como posso dormir melhor?"
- "Analise meus gastos"
- "Sugira uma rotina"
- "Como melhorar meu humor?"
- "Dicas de produtividade"
- "Como criar hábitos?"

## Notas Importantes

⚠️ **Custos**: A API da OpenAI tem custos por uso. O modo simulado é gratuito e já funciona muito bem!

🔒 **Segurança**: Nunca compartilhe sua API key. Ela está no `.env` que não é commitado no git.

💡 **Dica**: Comece com o modo simulado. Se precisar de respostas mais avançadas, configure a OpenAI.










