import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  FileText, 
  Calculator, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2,
  Save,
  Trash2,
  Plus,
  Edit2,
  X,
  History,
  Clock,
  Coffee
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { pomodoroService, notesService, PomodoroSession, Note } from '@/lib/firebase/tools';
import { Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

// Componente Pomodoro
function PomodoroTimer() {
  const { userId } = useAuth();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const initialTimeRef = useRef<number>(25 * 60);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const todaySessions = await pomodoroService.getTodaySessions(userId);
      setSessions(todaySessions);
    } catch (error) {
      logger.error('Erro ao carregar sessões:', error);
      toast.error('Erro ao carregar sessões de Pomodoro');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadSessions();
    } else {
      setLoading(false);
    }
  }, [userId, loadSessions]);

  // Timer effect - otimizado para evitar recriações
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    // Inicializar quando começar
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      initialTimeRef.current = timeLeft;
    }

    // Intervalo de 1 segundo para atualizar o display
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, initialTimeRef.current - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsRunning(false);
        startTimeRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]); // Apenas isRunning como dependência

  const handleComplete = useCallback(async () => {
    if (!userId) return;

    try {
      // Salvar sessão no Firebase
      await pomodoroService.create({
        userId,
        duration: selectedDuration,
        completedAt: Timestamp.now(),
      }, userId);
      
      // Recarregar sessões
      await loadSessions();
      
      toast.success(isBreak ? 'Pausa concluída! Hora de trabalhar!' : 'Pomodoro concluído! Hora de descansar!');
      
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 minutos de pausa
      } else {
        setIsBreak(false);
        setTimeLeft(selectedDuration * 60);
      }
    } catch (error) {
      logger.error('Erro ao salvar sessão:', error);
      toast.error('Erro ao salvar sessão de Pomodoro');
    }
  }, [userId, selectedDuration, isBreak, loadSessions]);

  // Efeito separado para quando o timer chegar a zero
  const hasCompletedRef = useRef(false);
  const lastCompletedTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (timeLeft === 0 && !isRunning && userId && !hasCompletedRef.current) {
      const now = Date.now();
      // Prevenir múltiplas execuções em menos de 2 segundos
      if (now - lastCompletedTimeRef.current > 2000) {
        hasCompletedRef.current = true;
        lastCompletedTimeRef.current = now;
        handleComplete().finally(() => {
          // Reset flag após um delay para permitir nova execução
          setTimeout(() => {
            hasCompletedRef.current = false;
          }, 2000);
        });
      }
    }
  }, [timeLeft, isRunning, userId, handleComplete]);

  const start = useCallback(() => {
    initialTimeRef.current = timeLeft;
    startTimeRef.current = null; // Reset para forçar inicialização no useEffect
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    const newTime = selectedDuration * 60;
    setTimeLeft(newTime);
    initialTimeRef.current = newTime;
    startTimeRef.current = null;
  }, [selectedDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          Pomodoro Timer
        </CardTitle>
        <CardDescription>
          Técnica de produtividade: 25 minutos de foco, 5 minutos de pausa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de duração */}
        {!isRunning && !isBreak && (
          <div className="flex gap-2 justify-center">
            {[15, 25, 45].map((duration) => (
              <Button
                key={duration}
                variant={selectedDuration === duration ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedDuration(duration);
                  setTimeLeft(duration * 60);
                }}
              >
                {duration} min
              </Button>
            ))}
          </div>
        )}

        {/* Timer Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-64">
            <svg className="transform -rotate-90 w-64 h-64">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className={cn(
                  "transition-all duration-1000",
                  isBreak ? "text-emerald-500" : "text-primary"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn(
                "text-5xl font-bold",
                isBreak ? "text-emerald-500" : "text-primary"
              )}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {isBreak ? (
                  <span className="flex items-center gap-1">
                    <Coffee className="w-4 h-4" />
                    Pausa
                  </span>
                ) : (
                  'Foco'
                )}
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={start} size="lg" className="gap-2">
                <Play className="w-4 h-4" />
                Iniciar
              </Button>
            ) : (
              <Button onClick={pause} size="lg" variant="outline" className="gap-2">
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
            )}
            <Button onClick={reset} size="lg" variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
          </div>
        </div>

        {/* Histórico */}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4" />
              Sessões Hoje
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{session.duration} minutos</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {session.completedAt instanceof Timestamp
                        ? session.completedAt.toDate().toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : new Date((session.completedAt as any).seconds * 1000).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Componente Bloco de Notas
function NotesManager() {
  const { userId } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const allNotes = await notesService.getAll(userId);
      setNotes(allNotes);
    } catch (error) {
      logger.error('Erro ao carregar notas:', error);
      toast.error('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadNotes();
    } else {
      setLoading(false);
    }
  }, [userId, loadNotes]);

  const createNote = async () => {
    if (!userId) return;

    try {
      const noteId = await notesService.create({
        title: 'Nova Nota',
        content: '',
      }, userId);
      
      await loadNotes();
      
      // Selecionar a nota recém-criada
      const newNote = await notesService.getById(noteId);
      if (newNote) {
        setSelectedNote(newNote);
        setTitle(newNote.title);
        setContent(newNote.content);
        setIsEditing(true);
      }
    } catch (error) {
      logger.error('Erro ao criar nota:', error);
      toast.error('Erro ao criar nota');
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  const saveNote = async () => {
    if (!selectedNote || !userId) return;

    try {
      await notesService.update(selectedNote.id, {
        title: title || 'Sem título',
        content,
      });
      
      await loadNotes();
      
      // Atualizar nota selecionada
      const updated = await notesService.getById(selectedNote.id);
      if (updated) {
        setSelectedNote(updated);
      }
      
      setIsEditing(false);
      toast.success('Nota salva!');
    } catch (error) {
      logger.error('Erro ao salvar nota:', error);
      toast.error('Erro ao salvar nota');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await notesService.delete(id);
      await loadNotes();
      
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
      }
      toast.success('Nota excluída!');
    } catch (error) {
      logger.error('Erro ao excluir nota:', error);
      toast.error('Erro ao excluir nota');
    }
  };

  const formatDate = (timestamp: Timestamp | number) => {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : typeof timestamp === 'number'
      ? new Date(timestamp)
      : new Date((timestamp as any).seconds * 1000);
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Bloco de Notas Inteligente
            </CardTitle>
            <CardDescription>
              Organize suas ideias e pensamentos
            </CardDescription>
          </div>
          <Button onClick={createNote} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Nota
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
          {/* Lista de Notas */}
          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Carregando...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma nota ainda
                  </div>
                ) : (
                  notes.map((note) => (
                    <motion.div
                      key={note.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectNote(note)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all relative group",
                        selectedNote?.id === note.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {note.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {note.content || 'Sem conteúdo'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(note.updatedAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Editor */}
          <div className="md:col-span-2 border rounded-lg p-4 flex flex-col">
            {selectedNote ? (
              <>
                {isEditing ? (
                  <>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título da nota"
                      className="mb-3 font-semibold"
                    />
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escreva sua nota aqui..."
                      className="flex-1 mb-3 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveNote} className="gap-2">
                        <Save className="w-4 h-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          if (selectedNote) {
                            setTitle(selectedNote.title);
                            setContent(selectedNote.content);
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{selectedNote.title}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNote(selectedNote.id)}
                          className="gap-2 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {selectedNote.content || 'Sem conteúdo'}
                      </div>
                    </ScrollArea>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Criada em: {formatDate(selectedNote.createdAt as Timestamp)}
                      <br />
                      Atualizada em: {formatDate(selectedNote.updatedAt as Timestamp)}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecione uma nota ou crie uma nova</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente Calculadora
function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const buttons = [
    { label: 'C', action: clear, className: 'bg-red-500 hover:bg-red-600 text-white' },
    { label: '⌫', action: () => setDisplay(display.slice(0, -1) || '0'), className: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { label: '/', action: () => performOperation('/'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '*', action: () => performOperation('*'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '7', action: () => inputNumber('7') },
    { label: '8', action: () => inputNumber('8') },
    { label: '9', action: () => inputNumber('9') },
    { label: '-', action: () => performOperation('-'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '4', action: () => inputNumber('4') },
    { label: '5', action: () => inputNumber('5') },
    { label: '6', action: () => inputNumber('6') },
    { label: '+', action: () => performOperation('+'), className: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: '1', action: () => inputNumber('1') },
    { label: '2', action: () => inputNumber('2') },
    { label: '3', action: () => inputNumber('3') },
    { label: '=', action: handleEquals, className: 'bg-green-500 hover:bg-green-600 text-white row-span-2' },
    { label: '0', action: () => inputNumber('0'), className: 'col-span-2' },
    { label: '.', action: inputDecimal },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Calculadora
        </CardTitle>
        <CardDescription>
          Calculadora simples e prática
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm mx-auto space-y-4">
          {/* Display */}
          <div className="bg-muted rounded-lg p-4 text-right">
            <div className="text-4xl font-mono font-bold overflow-x-auto">
              {display}
            </div>
          </div>

          {/* Botões */}
          <div className="grid grid-cols-4 gap-2">
            {buttons.map((button, index) => (
              <Button
                key={index}
                onClick={button.action}
                className={cn(
                  "h-14 text-lg font-semibold",
                  button.className || "bg-muted hover:bg-muted/80"
                )}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente Principal
export function ToolsSection() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Ferramentas</h1>
          <p className="text-muted-foreground">
            Ferramentas úteis para aumentar sua produtividade e organização
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="pomodoro" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pomodoro" className="gap-2">
            <Timer className="w-4 h-4" />
            Pomodoro
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="w-4 h-4" />
            Calculadora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro">
          <PomodoroTimer />
        </TabsContent>

        <TabsContent value="notes">
          <NotesManager />
        </TabsContent>

        <TabsContent value="calculator">
          <Calculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

