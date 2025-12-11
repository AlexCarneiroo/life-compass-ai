import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { journalService, JournalEntry } from '@/lib/firebase/journal';
import { toast } from 'sonner';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
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

export function JournalSection() {
  const { userId } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMood, setSelectedMood] = useState('😊');
  const [entryType, setEntryType] = useState<'text' | 'audio' | 'photo'>('text');

  useEffect(() => {
    loadEntries();
  }, [userId]);

  const loadEntries = async () => {
    try {
      const data = await journalService.getAll(userId);
      setEntries(data);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
      toast.error('Erro ao carregar entradas do diário');
    }
  };

  const handleSaveEntry = async () => {
    if (!newEntry.trim()) {
      toast.error('Por favor, escreva algo antes de salvar');
      return;
    }

    try {
      await journalService.create({
        date: new Date().toISOString().split('T')[0],
        content: newEntry,
        mood: selectedMood,
        type: entryType,
      }, userId);
      await loadEntries();
      toast.success('Entrada salva com sucesso!');
      setNewEntry('');
      setSelectedMood('😊');
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      toast.error('Erro ao salvar entrada. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await journalService.delete(id);
      await loadEntries();
      toast.success('Entrada deletada!');
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
      toast.error('Erro ao deletar entrada');
    }
  };

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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Humor:</Label>
              <div className="flex gap-2">
                {['😢', '😕', '😐', '🙂', '😊', '😄'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedMood(emoji)}
                    className={`w-10 h-10 text-xl rounded-xl transition-all ${
                      selectedMood === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gradient-primary text-primary-foreground flex-1 sm:flex-none" onClick={handleSaveEntry}>
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
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteEntry(entry.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
