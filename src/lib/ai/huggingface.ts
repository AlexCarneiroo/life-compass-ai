// Serviço de IA usando Hugging Face Inference API
// Para usar, adicione VITE_HUGGINGFACE_API_KEY no .env

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

class HuggingFaceAIService {
  private apiKey: string | null = null;
  private baseURL = 'https://api-inference.huggingface.co/models';
  // Usando um modelo de geração de texto que funciona bem com português
  // Alternativas: 'google/flan-t5-large', 'facebook/blenderbot-400M-distill'
  private model = 'google/flan-t5-large'; // Modelo multilíngue que funciona bem

  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || null;
  }

  async chat(messages: AIMessage[], userData?: UserData): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key não configurada');
    }

    try {
      // Pega a última mensagem do usuário
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        throw new Error('Nenhuma mensagem do usuário encontrada');
      }

      // Constrói o contexto baseado nos dados do usuário
      const context = this.buildContext(userData);
      const prompt = this.buildPrompt(context, lastUserMessage.content, messages);

      // Usa a Inference API do Hugging Face
      let response;
      let data;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        response = await fetch(`${this.baseURL}/${this.model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              return_full_text: false,
              do_sample: true,
            },
          }),
        });

        if (response.status === 503) {
          // Modelo está carregando, espera e tenta novamente
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempts++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`Erro na API do Hugging Face: ${response.status} - ${await response.text()}`);
        }

        data = await response.json();
        break;
      }

      if (!data) {
        throw new Error('Não foi possível obter resposta após várias tentativas');
      }
      
      // A resposta pode vir em diferentes formatos dependendo do modelo
      let responseText = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        responseText = data[0].generated_text;
      } else if (data.generated_text) {
        responseText = data.generated_text;
      } else if (typeof data === 'string') {
        responseText = data;
      } else if (data[0]?.text) {
        responseText = data[0].text;
      } else if (Array.isArray(data) && data[0]) {
        // Tenta pegar qualquer campo de texto
        responseText = data[0].summary || data[0].text || JSON.stringify(data[0]);
      } else {
        // Último recurso: stringify
        responseText = JSON.stringify(data);
      }

      // Limpa a resposta removendo o prompt original se estiver presente
      if (responseText && prompt && responseText.includes(prompt)) {
        responseText = responseText.replace(prompt, '').trim();
      }

      // Remove prefixos comuns que alguns modelos adicionam
      responseText = responseText
        .replace(/^Coach:\s*/i, '')
        .replace(/^Resposta:\s*/i, '')
        .trim();

      return responseText || 'Desculpe, não consegui processar sua solicitação. Tente reformular sua pergunta.';
    } catch (error: any) {
      console.error('Erro ao chamar Hugging Face:', error);
      throw error;
    }
  }

  private buildContext(userData?: UserData): string {
    if (!userData) {
      return 'Você é um coach pessoal de IA especializado em bem-estar, produtividade e desenvolvimento pessoal.';
    }

    let context = 'Contexto do usuário:\n';

    // Análise de check-ins
    if (userData.checkIns && userData.checkIns.length > 0) {
      const recent = userData.checkIns.slice(0, 7);
      const avgMood = recent.reduce((sum, c) => sum + (c.mood || 0), 0) / recent.length;
      const avgSleep = recent.reduce((sum, c) => sum + (c.sleepHours || 0), 0) / recent.length;
      const avgWater = recent.reduce((sum, c) => {
        if (c.waterLiters !== undefined) return sum + c.waterLiters;
        if (c.waterGlasses) return sum + (c.waterGlasses * 0.25);
        return sum;
      }, 0) / recent.length;
      
      context += `- Humor médio: ${avgMood.toFixed(1)}/6\n`;
      context += `- Sono médio: ${avgSleep.toFixed(1)} horas\n`;
      context += `- Água média: ${avgWater.toFixed(1)} litros\n`;
    }

    // Análise de hábitos
    if (userData.habits && userData.habits.length > 0) {
      const completed = userData.habits.filter(h => h.completedDates && h.completedDates.length > 0).length;
      context += `- Hábitos ativos: ${userData.habits.length}\n`;
      context += `- Hábitos com progresso: ${completed}\n`;
    }

    // Análise financeira
    if (userData.finances && userData.finances.length > 0) {
      const expenses = userData.finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      const income = userData.finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
      context += `- Gastos totais: R$ ${expenses.toFixed(2)}\n`;
      context += `- Receitas totais: R$ ${income.toFixed(2)}\n`;
      context += `- Saldo: R$ ${(income - expenses).toFixed(2)}\n`;
    }

    // Análise de treinos
    if (userData.workouts && userData.workouts.length > 0) {
      context += `- Treinos recentes: ${userData.workouts.slice(0, 7).length}\n`;
    }

    return context || 'Usuário está começando a usar o app.';
  }

  private buildPrompt(context: string, userMessage: string, messageHistory: AIMessage[]): string {
    // Constrói um prompt estruturado para o modelo
    const systemPrompt = `Você é um coach pessoal de IA especializado em bem-estar, produtividade e desenvolvimento pessoal.
Seja empático, encorajador e prático. Responda sempre em português brasileiro.

${context}

Use essas informações para dar conselhos personalizados e relevantes.`;

    // Constrói histórico de conversa
    let conversationHistory = '';
    const recentMessages = messageHistory.slice(-4); // Últimas 4 mensagens para contexto
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        conversationHistory += `Usuário: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationHistory += `Coach: ${msg.content}\n`;
      }
    });

    return `${systemPrompt}

${conversationHistory}Usuário: ${userMessage}
Coach:`;
  }

  async generateWeeklyAnalysis(userData: UserData): Promise<{
    achievements: string[];
    improvements: string[];
    recommendation: string;
  }> {
    try {
      const context = this.buildContext(userData);
      const prompt = `Analise os dados do usuário e gere um relatório semanal com:
1. 3-5 conquistas (o que funcionou bem)
2. 3-5 pontos de melhoria (o que precisa atenção)
3. 1 recomendação principal específica

${context}

Responda em formato JSON:
{
  "achievements": ["conquista 1", "conquista 2"],
  "improvements": ["melhoria 1", "melhoria 2"],
  "recommendation": "recomendação principal"
}`;

      const response = await this.chat([
        { role: 'user', content: prompt }
      ], userData);

      // Tenta parsear JSON
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Erro ao parsear JSON:', e);
      }

      // Fallback para análise simulada
      return this.generateSimulatedAnalysis(userData);
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      return this.generateSimulatedAnalysis(userData);
    }
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

export const huggingFaceService = new HuggingFaceAIService();

