import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

const mockRoutines: Routine[] = [
  {
    id: '1',
    name: 'Rotina Matinal',
    icon: '🌅',
    color: 'from-orange-500 to-yellow-500',
    estimatedTime: 45,
    tasks: [
      { id: '1', name: 'Acordar e se alongar', duration: 5, completed: true },
      { id: '2', name: 'Beber água com limão', duration: 2, completed: true },
      { id: '3', name: 'Meditar', duration: 10, completed: false },
      { id: '4', name: 'Exercício leve', duration: 15, completed: false },
      { id: '5', name: 'Banho frio', duration: 5, completed: false },
      { id: '6', name: 'Café da manhã saudável', duration: 10, completed: false },
    ],
  },
  {
    id: '2',
    name: 'Rotina Noturna',
    icon: '🌙',
    color: 'from-purple-500 to-indigo-500',
    estimatedTime: 30,
    tasks: [
      { id: '1', name: 'Desligar eletrônicos', duration: 1, completed: false },
      { id: '2', name: 'Journaling', duration: 10, completed: false },
      { id: '3', name: 'Skincare', duration: 5, completed: false },
      { id: '4', name: 'Leitura', duration: 15, completed: false },
    ],
  },
  {
    id: '3',
    name: 'Modo Foco',
    icon: '🎯',
    color: 'from-blue-500 to-cyan-500',
    estimatedTime: 90,
    tasks: [
      { id: '1', name: 'Definir 3 prioridades', duration: 5, completed: false },
      { id: '2', name: 'Pomodoro #1 (25min)', duration: 25, completed: false },
      { id: '3', name: 'Pausa (5min)', duration: 5, completed: false },
      { id: '4', name: 'Pomodoro #2 (25min)', duration: 25, completed: false },
      { id: '5', name: 'Pausa (5min)', duration: 5, completed: false },
      { id: '6', name: 'Pomodoro #3 (25min)', duration: 25, completed: false },
    ],
  },
  {
    id: '4',
    name: 'Autocuidado',
    icon: '💆',
    color: 'from-pink-500 to-rose-500',
    estimatedTime: 60,
    tasks: [
      { id: '1', name: 'Banho relaxante', duration: 20, completed: false },
      { id: '2', name: 'Máscara facial', duration: 15, completed: false },
      { id: '3', name: 'Música relaxante', duration: 10, completed: false },
      { id: '4', name: 'Chá calmante', duration: 10, completed: false },
      { id: '5', name: 'Gratidão (3 coisas)', duration: 5, completed: false },
    ],
  },
];

export function RoutinesSection() {
  const [routines, setRoutines] = useState(mockRoutines);
  const [activeRoutine, setActiveRoutine] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
        <Button className="gradient-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Rotina
        </Button>
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
            <Card key={routine.id} className={cn("transition-all", isActive && "ring-2 ring-primary")}>
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
                  {!isActive && (
                    <Button 
                      size="sm" 
                      onClick={() => startRoutine(routine.id)}
                      className="gradient-primary text-primary-foreground"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  )}
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
