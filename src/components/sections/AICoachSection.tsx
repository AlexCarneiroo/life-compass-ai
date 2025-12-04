import { useState } from 'react';
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
  Zap,
  Target,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

const insights = [
  {
    type: 'positive',
    icon: '📈',
    title: 'Produtividade em alta!',
    description: 'Sua produtividade aumentou 23% quando você dormiu mais de 7h. Continue assim!',
  },
  {
    type: 'warning',
    icon: '⚠️',
    title: 'Padrão identificado',
    description: 'Você gasta 35% mais nos finais de semana. Considere criar um orçamento específico.',
  },
  {
    type: 'tip',
    icon: '💡',
    title: 'Dica personalizada',
    description: 'Baseado nos seus dados, treinar pela manhã melhora seu humor em 40%.',
  },
  {
    type: 'positive',
    icon: '🎯',
    title: 'Meta próxima!',
    description: 'Você está a apenas 15% de completar sua meta de economia. Faltam R$ 1.500!',
  },
];

const chatHistory = [
  { role: 'ai', message: 'Olá! Sou seu coach pessoal de IA. Como posso ajudar você hoje?' },
  { role: 'user', message: 'Como posso melhorar minha produtividade?' },
  { role: 'ai', message: 'Analisando seus dados dos últimos 30 dias, identifiquei alguns padrões interessantes:\n\n1. Você é 45% mais produtivo nas terças e quartas\n2. Sua produtividade cai após reuniões longas\n3. Dias com exercício têm 30% mais tarefas concluídas\n\nSugestão: Agende suas tarefas mais importantes para terça/quarta pela manhã, antes das reuniões.' },
];

const modes = [
  { id: 'therapy', name: 'Modo Terapia', icon: '🧘', desc: 'Autoconhecimento e reflexão', color: 'from-purple-500 to-pink-500' },
  { id: 'performance', name: 'Alto Rendimento', icon: '🚀', desc: 'Foco e produtividade extrema', color: 'from-orange-500 to-red-500' },
  { id: 'minimalist', name: 'Vida Minimalista', icon: '🍃', desc: 'Reduzir e simplificar', color: 'from-green-500 to-teal-500' },
  { id: 'planner', name: 'Planner Automático', icon: '📅', desc: 'IA planeja seu dia', color: 'from-blue-500 to-cyan-500' },
];

export function AICoachSection() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState(chatHistory);

  const sendMessage = () => {
    if (!message.trim()) return;
    setChat([...chat, { role: 'user', message }]);
    setMessage('');
    // Simulate AI response
    setTimeout(() => {
      setChat(prev => [...prev, {
        role: 'ai',
        message: 'Obrigado pela pergunta! Estou analisando seus dados para dar a melhor resposta possível...'
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <span>🤖</span> IA Coach Pessoal
        </h1>
        <p className="text-muted-foreground mt-1">Seu assistente inteligente para análises e sugestões</p>
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

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className={cn(
            "border-l-4",
            insight.type === 'positive' && "border-l-green-500",
            insight.type === 'warning' && "border-l-orange-500",
            insight.type === 'tip' && "border-l-blue-500"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Faça uma pergunta ao seu coach..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[50px] max-h-[100px] resize-none"
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
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2">
            {[
              'Como posso dormir melhor?',
              'Analise meus gastos',
              'Sugira uma rotina',
              'Como melhorar meu humor?',
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Analysis */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Análise Semanal Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold">O que funcionou</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Meditação 5x esta semana</li>
                <li>✓ Gastou 20% menos</li>
                <li>✓ Dormiu média de 7.5h</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold">Pontos de atenção</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>⚠ Pulou exercício 2 dias</li>
                <li>⚠ Humor abaixo na quinta</li>
                <li>⚠ Menos água no fim de semana</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold">Sugestões</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>💡 Agende treino para quinta</li>
                <li>💡 Configure lembrete de água</li>
                <li>💡 Tente dormir 30min mais cedo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
