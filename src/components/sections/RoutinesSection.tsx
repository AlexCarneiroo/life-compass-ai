import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { routinesService, Routine, RoutineTask } from '@/lib/firebase/routines';
import { toast } from 'sonner';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { 
  Sun, 
  Moon, 
  Zap, 
  BookOpen, 
  Target, 
  Heart,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Routine {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasks: RoutineTask[];
  estimatedTime: number;
}

interface RoutineTask {
  id: string;
  name: string;
  duration: number;
  completed: boolean;
}

export function RoutinesSection() {
  const { userId } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '⏰',
    color: 'from-blue-500 to-cyan-500',
    estimatedTime: 30,
    tasks: [{ id: '1', name: '', duration: 5, completed: false }] as RoutineTask[],
  });

  useEffect(() => {
    loadRoutines();
  }, [userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadRoutines = async () => {
    try {
      const data = await routinesService.getAll(userId);
      setRoutines(data);
    } catch (error) {
      console.error('Erro ao carregar rotinas:', error);
      toast.error('Erro ao carregar rotinas');
    }
  };

  const handleSaveRoutine = async () => {
    if (!formData.name.trim()) {
      toast.error('Preencha o nome da rotina');
      return;
    }
    if (formData.tasks.some(t => !t.name.trim())) {
      toast.error('Preencha todas as tarefas');
      return;
    }

    try {
      await routinesService.create(formData, userId);
      await loadRoutines();
      toast.success('Rotina criada com sucesso!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        icon: '⏰',
        color: 'from-blue-500 to-cyan-500',
        estimatedTime: 30,
        tasks: [{ id: '1', name: '', duration: 5, completed: false }],
      });
    } catch (error) {
      console.error('Erro ao criar rotina:', error);
      toast.error('Erro ao criar rotina');
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      await routinesService.delete(id);
      await loadRoutines();
      toast.success('Rotina deletada!');
    } catch (error) {
      console.error('Erro ao deletar rotina:', error);
      toast.error('Erro ao deletar rotina');
    }
  };

  const toggleTask = (routineId: string, taskId: string) => {
    setRoutines(routines.map(routine => {
      if (routine.id === routineId) {
        return {
          ...routine,
          tasks: routine.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      }
      return routine;
    }));
  };

  const getProgress = (routine: Routine) => {
    const completed = routine.tasks.filter(t => t.completed).length;
    return (completed / routine.tasks.length) * 100;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRoutine = (routineId: string) => {
    setActiveRoutine(routineId);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>⏰</span> Rotinas Inteligentes
          </h1>
          <p className="text-muted-foreground mt-1">Automatize seu dia com rotinas personalizadas</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-cyan text-cyan-foreground w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Rotina
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Rotina</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Rotina</Label>
                <Input
                  id="name"
                  placeholder="Ex: Rotina Matinal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone</Label>
                  <Input
                    id="icon"
                    placeholder="⏰"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Tempo Estimado (min)</Label>
                  <Input
                    id="time"
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tarefas</Label>
                {formData.tasks.map((task, index) => (
                  <div key={task.id} className="flex gap-2">
                    <Input
                      placeholder={`Tarefa ${index + 1}`}
                      value={task.name}
                      onChange={(e) => {
                        const newTasks = [...formData.tasks];
                        newTasks[index].name = e.target.value;
                        setFormData({ ...formData, tasks: newTasks });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="min"
                      className="w-20"
                      value={task.duration}
                      onChange={(e) => {
                        const newTasks = [...formData.tasks];
                        newTasks[index].duration = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, tasks: newTasks });
                      }}
                    />
                    {formData.tasks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData({ ...formData, tasks: formData.tasks.filter((_, i) => i !== index) });
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      tasks: [...formData.tasks, { id: Date.now().toString(), name: '', duration: 5, completed: false }],
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Tarefa
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRoutine}>
                Criar Rotina
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timer Card */}
      {activeRoutine && (
        <Card className="gradient-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {routines.find(r => r.id === activeRoutine)?.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {routines.find(r => r.id === activeRoutine)?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Em andamento</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTime(timerSeconds)}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setTimerSeconds(0);
                      setActiveRoutine(null);
                      setIsTimerRunning(false);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routines.map((routine) => {
          const progress = getProgress(routine);
          const isActive = activeRoutine === routine.id;
          
          return (
            <Card key={routine.id} className={cn("transition-all group", isActive && "ring-2 ring-primary")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br",
                      routine.color
                    )}>
                      {routine.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{routine.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {routine.estimatedTime} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button 
                        size="sm" 
                        onClick={() => startRoutine(routine.id)}
                        className="gradient-cyan text-cyan-foreground"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteRoutine(routine.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Progress value={progress} className="h-2 mt-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {routine.tasks.filter(t => t.completed).length}/{routine.tasks.length} tarefas completas
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {routine.tasks.map((task, index) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(routine.id, task.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      task.completed 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                      task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground"
                    )}>
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={cn("flex-1", task.completed && "line-through opacity-70")}>
                      {task.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{task.duration}min</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Suggested Routines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span> Rotinas Sugeridas pela IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Rotina de Estudante', icon: '📚', time: 120, desc: 'Foco e memorização' },
              { name: 'Pré-Treino', icon: '🏋️', time: 15, desc: 'Aquecimento ideal' },
              { name: 'Descompressão', icon: '🧘', time: 20, desc: 'Após dia estressante' },
              { name: 'Produtividade Máxima', icon: '🚀', time: 180, desc: 'Alto rendimento' },
            ].map((suggestion, index) => (
              <button
                key={index}
                className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all text-left group"
              >
                <div className="text-3xl mb-2">{suggestion.icon}</div>
                <h4 className="font-semibold group-hover:text-primary transition-colors">
                  {suggestion.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.desc}</p>
                <p className="text-xs text-primary mt-2">{suggestion.time} min</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
