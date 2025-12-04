import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Scale, 
  Droplets, 
  Moon, 
  Dumbbell, 
  Heart, 
  TrendingUp,
  TrendingDown,
  Plus,
  Target,
  Activity,
  Flame,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const mockHealthData = {
  weight: { current: 75.5, goal: 72, lastWeek: 76.2, unit: 'kg' },
  water: { current: 6, goal: 8, unit: 'copos' },
  sleep: { current: 7.5, goal: 8, average: 7.2, unit: 'h' },
  workouts: { thisWeek: 4, goal: 5, streak: 12 },
  calories: { burned: 2450, goal: 2500 },
  steps: { current: 8500, goal: 10000 },
};

const weightHistory = [
  { date: 'Seg', peso: 76.2 },
  { date: 'Ter', peso: 76.0 },
  { date: 'Qua', peso: 75.8 },
  { date: 'Qui', peso: 75.6 },
  { date: 'Sex', peso: 75.5 },
  { date: 'Sáb', peso: 75.4 },
  { date: 'Dom', peso: 75.5 },
];

const sleepHistory = [
  { date: 'Seg', horas: 7 },
  { date: 'Ter', horas: 6.5 },
  { date: 'Qua', horas: 8 },
  { date: 'Qui', horas: 7.5 },
  { date: 'Sex', horas: 7 },
  { date: 'Sáb', horas: 9 },
  { date: 'Dom', horas: 7.5 },
];

const recentWorkouts = [
  { id: '1', type: 'Musculação', duration: 60, calories: 450, date: 'Hoje' },
  { id: '2', type: 'Corrida', duration: 30, calories: 320, date: 'Ontem' },
  { id: '3', type: 'Yoga', duration: 45, calories: 180, date: 'Ter' },
  { id: '4', type: 'HIIT', duration: 25, calories: 380, date: 'Seg' },
];

const selfCareTasks = [
  { id: '1', task: 'Skincare matinal', completed: true, icon: '✨' },
  { id: '2', task: 'Tomar vitaminas', completed: true, icon: '💊' },
  { id: '3', task: 'Alongamento', completed: false, icon: '🧘' },
  { id: '4', task: 'Meditar 10min', completed: false, icon: '🧠' },
  { id: '5', task: 'Skincare noturno', completed: false, icon: '🌙' },
];

export function HealthSection() {
  const [tasks, setTasks] = useState(selfCareTasks);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const weightChange = mockHealthData.weight.current - mockHealthData.weight.lastWeek;
  const waterPercent = (mockHealthData.water.current / mockHealthData.water.goal) * 100;
  const sleepPercent = (mockHealthData.sleep.current / mockHealthData.sleep.goal) * 100;
  const stepsPercent = (mockHealthData.steps.current / mockHealthData.steps.goal) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>💪</span> Saúde & Bem-estar
          </h1>
          <p className="text-muted-foreground mt-1">Monitore sua saúde física e mental</p>
        </div>
        <Button className="gradient-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Dados
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-5 h-5 text-primary" />
              {weightChange < 0 ? (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {Math.abs(weightChange).toFixed(1)}kg
                </span>
              ) : (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{weightChange.toFixed(1)}kg
                </span>
              )}
            </div>
            <p className="text-2xl font-bold">{mockHealthData.weight.current}kg</p>
            <p className="text-xs text-muted-foreground">Meta: {mockHealthData.weight.goal}kg</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-muted-foreground">{Math.round(waterPercent)}%</span>
            </div>
            <p className="text-2xl font-bold">{mockHealthData.water.current}/{mockHealthData.water.goal}</p>
            <p className="text-xs text-muted-foreground">Copos de água</p>
            <Progress value={waterPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-muted-foreground">{Math.round(sleepPercent)}%</span>
            </div>
            <p className="text-2xl font-bold">{mockHealthData.sleep.current}h</p>
            <p className="text-xs text-muted-foreground">Dormidas hoje</p>
            <Progress value={sleepPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-xs text-muted-foreground">{Math.round(stepsPercent)}%</span>
            </div>
            <p className="text-2xl font-bold">{mockHealthData.steps.current.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Passos hoje</p>
            <Progress value={stepsPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="w-5 h-5 text-primary" />
              Evolução do Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="peso" stroke="hsl(var(--primary))" fill="url(#weightGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="w-5 h-5 text-purple-400" />
              Qualidade do Sono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sleepHistory}>
                  <defs>
                    <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="horas" stroke="hsl(280, 70%, 55%)" fill="url(#sleepGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workouts and Self-Care */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-accent" />
                Treinos Recentes
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-muted-foreground">{mockHealthData.workouts.streak} dias</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{workout.type}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {workout.duration}min • {workout.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-500">{workout.calories}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Treino
            </Button>
          </CardContent>
        </Card>

        {/* Self-Care Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Autocuidado Hoje
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                  task.completed 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <span className="text-xl">{task.icon}</span>
                <span className={cn("flex-1 text-left", task.completed && "line-through opacity-70")}>
                  {task.task}
                </span>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground"
                )}>
                  {task.completed && <span className="text-xs text-white">✓</span>}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Health Insights */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            Insights de Saúde da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-green-500 font-medium mb-1">✅ Ótimo progresso!</p>
              <p className="text-sm text-muted-foreground">
                Você perdeu 0.7kg esta semana mantendo uma rotina consistente de exercícios.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-500 font-medium mb-1">💧 Hidratação</p>
              <p className="text-sm text-muted-foreground">
                Nos dias que você bebe 8+ copos de água, sua energia aumenta 20%.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-purple-500 font-medium mb-1">😴 Padrão de sono</p>
              <p className="text-sm text-muted-foreground">
                Dormir antes das 23h melhora sua produtividade no dia seguinte em 35%.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-orange-500 font-medium mb-1">🔥 Sugestão</p>
              <p className="text-sm text-muted-foreground">
                Adicionar 1 treino de HIIT por semana pode acelerar seu metabolismo em 15%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
