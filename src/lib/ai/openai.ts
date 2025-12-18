// Serviço de IA usando OpenAI, Hugging Face ou outras APIs
// Para usar OpenAI, adicione VITE_OPENAI_API_KEY no .env
// Para usar Hugging Face, adicione VITE_HUGGINGFACE_API_KEY no .env

import { huggingFaceService } from './huggingface';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UserData {
  checkIns: any[];
  habits: any[];
  finances: any[];
  goals: any[];
  health: any[];
  workouts: any[];
}

class AIService {
  private openaiKey: string | null = null;
  private huggingFaceKey: string | null = null;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.openaiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    this.huggingFaceKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || null;
  }

  async chat(messages: AIMessage[], userData?: UserData): Promise<string> {
    // Prioridade: Hugging Face > OpenAI > Simulado
    if (this.huggingFaceKey) {
      try {
        return await huggingFaceService.chat(messages, userData);
      } catch (error) {
        console.error('Erro ao chamar Hugging Face:', error);
        // Fallback para OpenAI ou simulado
      }
    }

    // Tenta OpenAI se disponível
    if (this.openaiKey) {
      try {
        const systemPrompt = this.buildSystemPrompt(userData);
        
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na API da OpenAI');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';
      } catch (error) {
        console.error('Erro ao chamar OpenAI:', error);
        // Fallback para resposta simulada
      }
    }

    // Se não tiver nenhuma API key, usa resposta simulada inteligente
    return this.getSimulatedResponse(messages[messages.length - 1].content, userData);
  }

  private buildSystemPrompt(userData?: UserData): string {
    if (!userData) {
      return `Você é um coach pessoal de IA especializado em bem-estar, produtividade e desenvolvimento pessoal. 
      Seja empático, encorajador e prático. Responda sempre em português brasileiro.`;
    }

    // Analisa dados do usuário
    const insights = this.analyzeUserData(userData);
    
    return `Você é um coach pessoal de IA especializado em bem-estar, produtividade e desenvolvimento pessoal.
    
Contexto do usuário:
${insights}

Use essas informações para dar conselhos personalizados e relevantes. Seja empático, encorajador e prático. 
Responda sempre em português brasileiro.`;
  }

  private analyzeUserData(data: UserData): string {
    let analysis = '';

    // Análise de check-ins
    if (data.checkIns && data.checkIns.length > 0) {
      const recentCheckIns = data.checkIns.slice(0, 7);
      const avgMood = recentCheckIns.reduce((sum, c) => sum + (c.mood || 0), 0) / recentCheckIns.length;
      const avgSleep = recentCheckIns.reduce((sum, c) => sum + (c.sleepHours || 0), 0) / recentCheckIns.length;
      const avgWater = recentCheckIns.reduce((sum, c) => {
        if (c.waterLiters !== undefined) return sum + c.waterLiters;
        if (c.waterGlasses) return sum + (c.waterGlasses * 0.25);
        return sum;
      }, 0) / recentCheckIns.length;
      
      analysis += `- Humor médio: ${avgMood.toFixed(1)}/6\n`;
      analysis += `- Sono médio: ${avgSleep.toFixed(1)} horas\n`;
      analysis += `- Água média: ${avgWater.toFixed(1)} litros\n`;
    }

    // Análise de hábitos
    if (data.habits && data.habits.length > 0) {
      const completedHabits = data.habits.filter(h => h.completedDates && h.completedDates.length > 0).length;
      analysis += `- Hábitos ativos: ${data.habits.length}\n`;
      analysis += `- Hábitos com progresso: ${completedHabits}\n`;
    }

    // Análise financeira
    if (data.finances && data.finances.length > 0) {
      const expenses = data.finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      const income = data.finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
      analysis += `- Gastos totais: R$ ${expenses.toFixed(2)}\n`;
      analysis += `- Receitas totais: R$ ${income.toFixed(2)}\n`;
      analysis += `- Saldo: R$ ${(income - expenses).toFixed(2)}\n`;
    }

    // Análise de treinos
    if (data.workouts && data.workouts.length > 0) {
      const recentWorkouts = data.workouts.slice(0, 7);
      analysis += `- Treinos recentes: ${recentWorkouts.length}\n`;
    }

    return analysis || 'Usuário está começando a usar o app.';
  }

  private getSimulatedResponse(userMessage: string, userData?: UserData): string {
    const message = userMessage.toLowerCase();

    // Respostas inteligentes baseadas em padrões
    if (message.includes('produtividade') || message.includes('produtivo')) {
      return `Para melhorar sua produtividade, recomendo:

1. **Organize suas tarefas por prioridade** - Foque nas mais importantes primeiro
2. **Use a técnica Pomodoro** - 25 minutos de foco, 5 de descanso
3. **Elimine distrações** - Desative notificações durante tarefas importantes
4. **Mantenha um horário consistente** - Seu cérebro funciona melhor com rotina

Baseado nos seus dados, você é mais produtivo quando dorme bem. Tente manter 7-8 horas de sono!`;
    }

    if (message.includes('sono') || message.includes('dormir')) {
      return `Para melhorar seu sono:

1. **Mantenha um horário regular** - Durma e acorde no mesmo horário
2. **Crie uma rotina antes de dormir** - Leia, medite ou ouça música calma
3. **Evite telas 1 hora antes** - A luz azul atrapalha o sono
4. **Mantenha o quarto escuro e fresco** - Temperatura ideal: 18-20°C
5. **Evite cafeína após 14h** - Ela pode durar até 8 horas no organismo

Sono de qualidade é fundamental para sua saúde e produtividade!`;
    }

    if (message.includes('água') || message.includes('hidratação')) {
      return `Para manter-se hidratado:

1. **Beba água regularmente** - Não espere sentir sede
2. **Tenha uma garrafa sempre por perto** - Facilita o hábito
3. **Beba água ao acordar** - Seu corpo precisa após horas sem água
4. **Acompanhe sua ingestão** - Use o check-in diário para monitorar
5. **Meta recomendada: 2-3 litros por dia** - Ajuste conforme sua atividade física

Água é essencial para energia, concentração e saúde geral!`;
    }

    if (message.includes('gasto') || message.includes('financeiro') || message.includes('dinheiro')) {
      return `Para melhorar suas finanças:

1. **Acompanhe todos os gastos** - Use a seção de Finanças regularmente
2. **Crie um orçamento** - Defina limites para cada categoria
3. **Poupe antes de gastar** - Separe uma porcentagem da renda
4. **Evite compras por impulso** - Espere 24h antes de compras grandes
5. **Revise gastos mensalmente** - Identifique onde pode economizar

Controle financeiro traz paz de espírito e liberdade!`;
    }

    if (message.includes('hábito') || message.includes('rotina')) {
      return `Para criar hábitos duradouros:

1. **Comece pequeno** - Hábitos pequenos são mais fáceis de manter
2. **Seja consistente** - Faça todos os dias, mesmo que pouco
3. **Conecte com hábitos existentes** - "Depois de X, farei Y"
4. **Celebre pequenas vitórias** - Reconheça seu progresso
5. **Seja paciente** - Leva 21-66 dias para formar um hábito

Consistência é mais importante que perfeição!`;
    }

    if (message.includes('humor') || message.includes('feliz') || message.includes('triste')) {
      return `Para melhorar seu humor:

1. **Exercite-se regularmente** - Libera endorfinas naturais
2. **Durma bem** - Sono afeta diretamente o humor
3. **Pratique gratidão** - Anote 3 coisas boas do dia
4. **Conecte-se com pessoas** - Relacionamentos são fundamentais
5. **Passe tempo na natureza** - Reduz estresse e ansiedade
6. **Faça atividades que gosta** - Reserve tempo para hobbies

Lembre-se: é normal ter dias difíceis. O importante é cuidar de si mesmo!`;
    }

    if (message.includes('treino') || message.includes('exercício') || message.includes('academia')) {
      return `Para manter uma rotina de exercícios:

1. **Encontre algo que goste** - Não precisa ser academia tradicional
2. **Comece devagar** - 10-15 minutos já fazem diferença
3. **Seja consistente** - Melhor 3x por semana do que 1x intenso
4. **Varie os exercícios** - Evita monotonia e lesões
5. **Acompanhe seu progresso** - Use a seção de Saúde
6. **Ouça seu corpo** - Descanso é tão importante quanto treino

Movimento regular melhora saúde física e mental!`;
    }

    // Resposta padrão
    return `Olá! Sou seu coach pessoal de IA. 

Posso ajudar você com:
- 💪 Produtividade e foco
- 😴 Sono e descanso
- 💰 Finanças e economia
- 🎯 Hábitos e rotinas
- 😊 Humor e bem-estar
- 🏋️ Treinos e exercícios

Faça uma pergunta específica ou peça uma análise dos seus dados!`;
  }

  async generateWeeklyAnalysis(userData: UserData): Promise<{
    achievements: string[];
    improvements: string[];
    recommendation: string;
  }> {
    // Prioridade: Hugging Face > OpenAI > Simulado
    if (this.huggingFaceKey) {
      try {
        return await huggingFaceService.generateWeeklyAnalysis(userData);
      } catch (error) {
        console.error('Erro ao gerar análise com Hugging Face:', error);
        // Fallback para OpenAI ou simulado
      }
    }

    if (this.openaiKey) {
      try {
        const prompt = `Analise os dados do usuário e gere um relatório semanal com:
1. 3-5 conquistas (o que funcionou bem)
2. 3-5 pontos de melhoria (o que precisa atenção)
3. 1 recomendação principal específica

Dados do usuário:
${this.analyzeUserData(userData)}

Responda em formato JSON:
{
  "achievements": ["conquista 1", "conquista 2"],
  "improvements": ["melhoria 1", "melhoria 2"],
  "recommendation": "recomendação principal"
}`;

        const response = await this.chat([
          { role: 'user', content: prompt }
        ], userData);

        // Tenta parsear JSON, se falhar usa análise simulada
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Continua para análise simulada
        }
      } catch (error) {
        console.error('Erro ao gerar análise com OpenAI:', error);
      }
    }

    return this.generateSimulatedAnalysis(userData);
  }

  private generateSimulatedAnalysis(userData: UserData): {
    achievements: string[];
    improvements: string[];
    recommendation: string;
  } {
    const achievements: string[] = [];
    const improvements: string[] = [];
    let recommendation = 'Continue mantendo seus hábitos e monitorando seu progresso!';

    if (userData.checkIns && userData.checkIns.length > 0) {
      const recent = userData.checkIns.slice(0, 7);
      const avgSleep = recent.reduce((sum, c) => sum + (c.sleepHours || 0), 0) / recent.length;
      
      if (avgSleep >= 7) {
        achievements.push(`Manteve média de sono de ${avgSleep.toFixed(1)} horas`);
      } else {
        improvements.push(`Sono médio de ${avgSleep.toFixed(1)}h está abaixo do recomendado (7-8h)`);
        recommendation = 'Tente dormir 30 minutos mais cedo para melhorar seu descanso e produtividade.';
      }
    }

    if (userData.habits && userData.habits.length > 0) {
      const activeHabits = userData.habits.filter(h => h.completedDates && h.completedDates.length > 0);
      if (activeHabits.length > 0) {
        achievements.push(`Manteve ${activeHabits.length} hábitos ativos`);
      } else {
        improvements.push('Nenhum hábito foi completado recentemente');
      }
    }

    if (userData.finances && userData.finances.length > 0) {
      const expenses = userData.finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      if (expenses > 0) {
        improvements.push(`Total de gastos: R$ ${expenses.toFixed(2)} - Revise suas despesas`);
      }
    }

    if (achievements.length === 0) {
      achievements.push('Você está começando sua jornada! Continue registrando seus dados.');
    }

    if (improvements.length === 0) {
      improvements.push('Mantenha o foco e continue monitorando seu progresso');
    }

    return { achievements, improvements, recommendation };
  }
}

export const aiService = new AIService();
