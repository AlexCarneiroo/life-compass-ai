import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { aiService } from '@/lib/ai/openai';
import { checkinService } from '@/lib/firebase/checkin';
import { habitsService } from '@/lib/firebase/habits';
import { financeService } from '@/lib/firebase/finance';
import { healthService } from '@/lib/firebase/health';
import { goalsService } from '@/lib/firebase/goals';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
}

const modes = [
  { id: 'therapy', name: 'Modo Terapia', icon: '🧘', desc: 'Autoconhecimento e reflexão', color: 'from-purple-500 to-pink-500' },
  { id: 'performance', name: 'Alto Rendimento', icon: '🚀', desc: 'Foco e produtividade extrema', color: 'from-orange-500 to-red-500' },
  { id: 'minimalist', name: 'Vida Minimalista', icon: '🍃', desc: 'Reduzir e simplificar', color: 'from-green-500 to-teal-500' },
  { id: 'planner', name: 'Planner Automático', icon: '📅', desc: 'IA planeja seu dia', color: 'from-blue-500 to-cyan-500' },
];

export function AICoachSection() {
  const { userId } = useAuth();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([
    { 
      role: 'ai', 
      message: 'Olá! Sou seu coach pessoal de IA. Como posso ajudar você hoje? Posso analisar seus dados e dar sugestões personalizadas sobre produtividade, sono, hábitos, finanças e muito mais!' 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<{
    achievements: string[];
    improvements: string[];
    recommendation: string;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWeeklyAnalysis();
  }, [userId]);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const loadWeeklyAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const [checkIns, habits, finances, workouts, goals] = await Promise.all([
        checkinService.getAll(userId),
        habitsService.getAll(userId),
        financeService.getAll(userId),
        healthService.getAllWorkouts(userId),
        goalsService.getAll(userId),
      ]);

      const userData = {
        checkIns,
        habits,
        finances,
        workouts,
        goals,
        health: [],
      };

      const analysis = await aiService.generateWeeklyAnalysis(userData);
      setWeeklyAnalysis(analysis);
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      toast.error('Erro ao gerar análise semanal');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setChat(prev => [...prev, { role: 'user', message: userMessage }]);
    setMessage('');
    setLoading(true);

    try {
      // Carrega dados do usuário para contexto
      const [checkIns, habits, finances, workouts, goals] = await Promise.all([
        checkinService.getAll(userId),
        habitsService.getAll(userId),
        financeService.getAll(userId),
        healthService.getAllWorkouts(userId),
        goalsService.getAll(userId),
      ]);

      const userData = {
        checkIns,
        habits,
        finances,
        workouts,
        goals,
        health: [],
      };

      // Converte histórico do chat para formato da API
      const messages = [
        ...chat.map(m => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.message,
        })),
        { role: 'user' as const, content: userMessage },
      ];

      const response = await aiService.chat(messages, userData);
      setChat(prev => [...prev, { role: 'ai', message: response }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar sua mensagem');
      setChat(prev => [...prev, { 
        role: 'ai', 
        message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Como posso dormir melhor?',
    'Analise meus gastos',
    'Sugira uma rotina',
    'Como melhorar meu humor?',
    'Dicas de produtividade',
    'Como criar hábitos?',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <span>🤖</span> IA Coach Pessoal
        </h1>
        <p className="text-muted-foreground mt-1">
          Seu assistente inteligente para análises e sugestões personalizadas
          {!import.meta.env.VITE_HUGGINGFACE_API_KEY && !import.meta.env.VITE_OPENAI_API_KEY && (
            <span className="text-xs block mt-1 text-orange-500">
              💡 Dica: Configure VITE_HUGGINGFACE_API_KEY ou VITE_OPENAI_API_KEY no .env para usar IA completa
            </span>
          )}
          {(import.meta.env.VITE_HUGGINGFACE_API_KEY || import.meta.env.VITE_OPENAI_API_KEY) && (
            <span className="text-xs block mt-1 text-green-500">
              ✅ IA ativada - {import.meta.env.VITE_HUGGINGFACE_API_KEY ? 'Hugging Face' : 'OpenAI'}
            </span>
          )}
        </p>
      </div>

      {/* AI Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              selectedMode === mode.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedMode(mode.id)}
          >
            <CardContent className="p-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 bg-gradient-to-br",
                mode.color
              )}>
                {mode.icon}
              </div>
              <h3 className="font-semibold">{mode.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Analysis */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Análise Semanal Automática
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadWeeklyAnalysis}
              disabled={loadingAnalysis}
            >
              {loadingAnalysis ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Atualizar'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAnalysis ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : weeklyAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold">O que funcionou</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {weeklyAnalysis.achievements.map((achievement, index) => (
                    <li key={index}>✓ {achievement}</li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold">Pontos de atenção</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {weeklyAnalysis.improvements.map((improvement, index) => (
                    <li key={index}>⚠ {improvement}</li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold">Recomendação</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  💡 {weeklyAnalysis.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Clique em "Atualizar" para gerar uma análise dos seus dados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Converse com seu Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <div className="h-[300px] overflow-y-auto space-y-4 p-4 rounded-xl bg-muted/30">
            {chat.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[80%] p-3 rounded-xl",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">IA Coach</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{msg.message}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Faça uma pergunta ao seu coach..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[50px] max-h-[100px] resize-none"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage}
              className="gradient-primary text-primary-foreground px-4"
              disabled={loading || !message.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(question)}
                disabled={loading}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
