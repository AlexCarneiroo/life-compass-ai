import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Mic, 
  Image, 
  Calendar,
  Sparkles,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  type: 'text' | 'audio' | 'photo';
  duration?: number;
  aiInsight?: string;
}

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    date: '2024-01-28',
    content: 'Hoje foi um dia muito produtivo! Consegui finalizar o projeto que estava atrasado e ainda tive tempo para fazer exercício. Me sinto realizado.',
    mood: '😊',
    type: 'text',
    aiInsight: 'Notei que você tem se sentido mais realizado em dias com exercício físico. Continue assim!',
  },
  {
    id: '2',
    date: '2024-01-27',
    content: 'Áudio gravado - 3:45min',
    mood: '😐',
    type: 'audio',
    duration: 225,
    aiInsight: 'Você mencionou preocupação com prazos. Que tal criar uma rotina de planejamento semanal?',
  },
  {
    id: '3',
    date: '2024-01-26',
    content: 'Dia difícil no trabalho. Muitas reuniões e pouco tempo para focar. Preciso melhorar minha gestão de tempo.',
    mood: '😕',
    type: 'text',
    aiInsight: 'Identifiquei um padrão: dias com muitas reuniões afetam seu humor. Considere bloquear horários de foco.',
  },
  {
    id: '4',
    date: '2024-01-25',
    content: 'Finalmente tirei aquela foto no parque que queria!',
    mood: '😄',
    type: 'photo',
  },
];

export function JournalSection() {
  const [entries] = useState(mockEntries);
  const [newEntry, setNewEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>📔</span> Diário
          </h1>
          <p className="text-muted-foreground mt-1">Registre seus pensamentos, áudios e fotos</p>
        </div>
      </div>

      {/* New Entry Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">O que está na sua mente?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Escreva sobre seu dia, seus sentimentos, aprendizados..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button className="gradient-primary text-primary-foreground flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              Salvar Entrada
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsRecording(!isRecording)}
              className={cn(isRecording && "bg-red-500/10 border-red-500 text-red-500")}
            >
              {isRecording ? <Pause className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              {isRecording ? 'Parar' : 'Gravar Áudio'}
            </Button>
            <Button variant="outline">
              <Image className="w-4 h-4 mr-2" />
              Adicionar Foto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card className="gradient-card border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🧠</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Resumo da IA - Esta Semana</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>📊 <strong>Humor predominante:</strong> Positivo (65% dos dias)</p>
                <p>💭 <strong>Temas recorrentes:</strong> Trabalho, produtividade, exercícios</p>
                <p>⚠️ <strong>Ponto de atenção:</strong> Você mencionou estresse 3 vezes esta semana</p>
                <p>✨ <strong>Conquista:</strong> Você completou um projeto importante!</p>
              </div>
              <Button variant="outline" size="sm" className="mt-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Ver análise completa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Entradas Recentes</h2>
        
        {entries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{entry.mood}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="capitalize">{formatDate(entry.date)}</span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      entry.type === 'text' && "bg-blue-500/10 text-blue-500",
                      entry.type === 'audio' && "bg-purple-500/10 text-purple-500",
                      entry.type === 'photo' && "bg-green-500/10 text-green-500"
                    )}>
                      {entry.type === 'text' && '📝 Texto'}
                      {entry.type === 'audio' && '🎙️ Áudio'}
                      {entry.type === 'photo' && '📷 Foto'}
                    </span>
                  </div>
                  
                  {entry.type === 'audio' ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10">
                      <Button size="icon" variant="ghost" className="h-10 w-10">
                        <Play className="w-5 h-5 text-purple-500" />
                      </Button>
                      <div className="flex-1">
                        <div className="h-2 bg-purple-500/20 rounded-full">
                          <div className="h-full w-0 bg-purple-500 rounded-full" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.floor((entry.duration || 0) / 60)}:{((entry.duration || 0) % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground">{entry.content}</p>
                  )}
                  
                  {entry.aiInsight && (
                    <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{entry.aiInsight}</p>
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span> Sugestões para Escrever
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'O que te deixou feliz hoje?',
              'Qual foi seu maior desafio?',
              'O que você aprendeu de novo?',
              'Como está seu nível de energia?',
              'Pelo que você é grato hoje?',
              'Qual meta você avançou?',
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => setNewEntry(prompt + '\n\n')}
                className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
