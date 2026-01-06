import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { healthService, WorkoutEntry, SelfCareTask } from '@/lib/firebase/health';
import { checkinService } from '@/lib/firebase/checkin';
import { userStatsService, checkAndGrantBadges } from '@/lib/firebase/userStats';
import { DailyCheckIn } from '@/types';
import { toast } from 'sonner';
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
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  X
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

export function HealthSection() {
  const { userId } = useAuth();
  const [tasks, setTasks] = useState<SelfCareTask[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isSelfCareModalOpen, setIsSelfCareModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SelfCareTask | null>(null);
  const [selfCareFormData, setSelfCareFormData] = useState({
    task: '',
    icon: '✨',
  });
  const [healthFormData, setHealthFormData] = useState({
    weight: undefined as number | undefined,
    height: undefined as number | undefined, // altura em metros
    steps: undefined as number | undefined,
  });
  const [userHeight, setUserHeight] = useState<number | undefined>(undefined); // Altura do usuário (salva uma vez)
  const [healthEntries, setHealthEntries] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [healthGoals, setHealthGoals] = useState({ waterGoal: 4, sleepGoal: 8, height: 0 });
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [goalsFormData, setGoalsFormData] = useState({ waterGoal: 4, sleepGoal: 8, height: 180 });
  const [workoutFormData, setWorkoutFormData] = useState({
    type: '',
    duration: 30,
    calories: 0,
    intensity: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadWorkouts();
    loadHealthEntries();
    loadSelfCareTasks();
    loadCheckIns();
    loadHealthGoals();
    
    // Listener para atualizar quando check-in for salvo
    const handleCheckinSaved = () => {
      loadCheckIns();
    };
    window.addEventListener('checkin-saved', handleCheckinSaved);
    
    return () => {
      window.removeEventListener('checkin-saved', handleCheckinSaved);
    };
  }, [userId]);

  const loadSelfCareTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await healthService.getAllSelfCareTasks(userId, today);
      setTasks(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas de autocuidado:', error);
    }
  };

  const loadCheckIns = async () => {
    try {
      const data = await checkinService.getAll(userId);
      setCheckIns(data);
    } catch (error) {
      console.error('Erro ao carregar check-ins:', error);
    }
  };

  const loadHealthGoals = async () => {
    try {
      const goals = await healthService.getHealthGoals(userId);
      if (goals) {
        setHealthGoals(goals);
        setGoalsFormData({
          waterGoal: goals.waterGoal,
          sleepGoal: goals.sleepGoal,
          height: goals.height || 180,
        });
        // Se altura está em cm, converte para metros para o userHeight
        if (goals.height > 0 && !userHeight) {
          setUserHeight(goals.height / 100); // Converte cm para metros
        }
      }
    } catch (error) {
      console.error('Erro ao carregar metas de saúde:', error);
    }
  };

  const handleSaveHealthGoals = async () => {
    try {
      await healthService.setHealthGoals(userId, {
        waterGoal: goalsFormData.waterGoal,
        sleepGoal: goalsFormData.sleepGoal,
        height: goalsFormData.height,
      });
      setHealthGoals({
        waterGoal: goalsFormData.waterGoal,
        sleepGoal: goalsFormData.sleepGoal,
        height: goalsFormData.height,
      });
      // Atualiza altura do usuário (converte cm para metros)
      if (goalsFormData.height > 0) {
        setUserHeight(goalsFormData.height / 100);
      }
      toast.success('Metas de saúde atualizadas!');
      setIsGoalsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast.error('Erro ao salvar metas');
    }
  };

  // Calcula IMC
  const calculateBMI = (weight: number, height: number): number => {
    if (!weight || !height || height <= 0) return 0;
    return weight / (height * height);
  };

  // Classifica IMC
  const getBMICategory = (bmi: number): { label: string; color: string; description: string } => {
    if (bmi < 18.5) {
      return { label: 'Abaixo do peso', color: 'text-blue-500', description: 'Consulte um nutricionista' };
    } else if (bmi < 25) {
      return { label: 'Peso normal', color: 'text-green-500', description: 'Parabéns! Mantenha o foco' };
    } else if (bmi < 30) {
      return { label: 'Sobrepeso', color: 'text-yellow-500', description: 'Foque em alimentação saudável' };
    } else {
      return { label: 'Obesidade', color: 'text-red-500', description: 'Consulte um profissional' };
    }
  };

  // Pega peso atual e calcula IMC
  const currentWeight = healthEntries[0]?.weight || healthFormData.weight;
  const currentHeight = userHeight || healthFormData.height;
  const currentBMI = currentWeight && currentHeight ? calculateBMI(currentWeight, currentHeight) : 0;
  const bmiCategory = currentBMI > 0 ? getBMICategory(currentBMI) : null;

  const loadWorkouts = async () => {
    try {
      const data = await healthService.getAllWorkouts(userId);
      setWorkouts(data);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      toast.error('Erro ao carregar treinos');
    }
  };

  const loadHealthEntries = async () => {
    try {
      const data = await healthService.getAllHealthEntries(userId);
      setHealthEntries(data);
      // Pega a altura mais recente
      const entryWithHeight = data.find(e => e.height);
      if (entryWithHeight?.height) {
        setUserHeight(entryWithHeight.height);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de saúde:', error);
    }
  };

  const handleSaveHealthData = async () => {
    try {
      // Validação: pelo menos um campo deve ser preenchido
      const hasData = 
        healthFormData.weight !== undefined ||
        healthFormData.steps !== undefined;

      if (!hasData && !healthFormData.height) {
        toast.error('Preencha pelo menos um campo para salvar');
        return;
      }

      // Se altura foi fornecida e ainda não tem altura salva, salva
      if (healthFormData.height && !userHeight) {
        setUserHeight(healthFormData.height);
        // Atualiza também nas metas de saúde
        await healthService.setHealthGoals(userId, {
          height: healthFormData.height * 100, // Converte metros para cm
        });
      }

      // Prepara os dados para salvar (remove campos undefined)
      const entryData: any = {
        date: new Date().toISOString().split('T')[0],
        waterIntake: 0, // Não salva mais aqui, vem do check-in
        sleepHours: 0, // Não salva mais aqui, vem do check-in
      };

      // Adiciona campos opcionais apenas se tiverem valor
      const finalHeight = healthFormData.height || userHeight;
      if (healthFormData.weight !== undefined && healthFormData.weight > 0) {
        entryData.weight = healthFormData.weight;
        
        // Calcula e salva o IMC se tiver peso e altura
        if (finalHeight && finalHeight > 0) {
          entryData.bmi = calculateBMI(healthFormData.weight, finalHeight);
        }
      }
      if (finalHeight) {
        entryData.height = finalHeight;
      }
      if (healthFormData.steps !== undefined && healthFormData.steps > 0) {
        entryData.steps = healthFormData.steps;
      }

      await healthService.createHealthEntry(entryData, userId);
      toast.success('Dados de saúde registrados!');
      setIsHealthModalOpen(false);
      setHealthFormData({ weight: undefined, height: undefined, steps: undefined });
      await loadHealthEntries();
    } catch (error) {
      console.error('Erro ao salvar dados de saúde:', error);
      toast.error('Erro ao salvar dados. Verifique o console para mais detalhes.');
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutFormData.type) {
      toast.error('Preencha o tipo de treino');
      return;
    }
    try {
      await healthService.createWorkout({
        ...workoutFormData,
        date: new Date().toISOString().split('T')[0],
      }, userId);
      await userStatsService.incrementWorkoutsCompleted(userId);
      
      // Verifica e concede badges
      const stats = await userStatsService.getOrCreate(userId);
      const newBadges = await checkAndGrantBadges(userId, {
        habitsCompleted: stats.totalHabitsCompleted || 0,
        currentStreak: stats.currentStreak || 0,
        workoutsCompleted: (stats.workoutsCompleted || 0) + 1,
        checkInsCompleted: stats.checkInsCompleted || 0,
      });
      
      for (const badge of newBadges) {
        await userStatsService.addBadge(userId, badge);
        toast.success(`🏆 Nova conquista: ${badge.name}!`, {
          description: badge.description,
          duration: 5000,
        });
      }
      
      await loadWorkouts();
      toast.success('Treino adicionado!');
      setIsWorkoutModalOpen(false);
      setWorkoutFormData({ type: '', duration: 30, calories: 0, intensity: 'medium' });
      
      // Dispara evento para atualizar stats
      window.dispatchEvent(new Event('stats-updated'));
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      toast.error('Erro ao salvar treino');
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await healthService.deleteWorkout(id);
      await loadWorkouts();
      toast.success('Treino removido!');
    } catch (error) {
      console.error('Erro ao remover treino:', error);
      toast.error('Erro ao remover treino');
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (task) {
        await healthService.updateSelfCareTask(id, { completed: !task.completed });
        await loadSelfCareTasks();
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleSaveSelfCareTask = async () => {
    if (!selfCareFormData.task.trim()) {
      toast.error('Preencha o nome da tarefa');
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      if (editingTask) {
        await healthService.updateSelfCareTask(editingTask.id, {
          task: selfCareFormData.task,
          icon: selfCareFormData.icon,
        });
        toast.success('Tarefa atualizada!');
      } else {
        await healthService.createSelfCareTask({
          task: selfCareFormData.task,
          icon: selfCareFormData.icon,
          completed: false,
          date: today,
        }, userId);
        toast.success('Tarefa adicionada!');
      }
      await loadSelfCareTasks();
      setIsSelfCareModalOpen(false);
      setEditingTask(null);
      setSelfCareFormData({ task: '', icon: '✨' });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  const handleEditTask = (task: SelfCareTask) => {
    setEditingTask(task);
    setSelfCareFormData({ task: task.task, icon: task.icon });
    setIsSelfCareModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await healthService.deleteSelfCareTask(id);
      await loadSelfCareTasks();
      toast.success('Tarefa removida!');
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
      toast.error('Erro ao remover tarefa');
    }
  };

  // Calcula médias dos últimos 30 dias dos check-ins
  const getAverageSleep = () => {
    const last30Days = checkIns.slice(0, 30);
    if (last30Days.length === 0) return 0;
    const total = last30Days.reduce((sum, c) => sum + (c.sleepHours || 0), 0);
    return total / last30Days.length;
  };

  const getAverageWater = () => {
    const last30Days = checkIns.slice(0, 30);
    if (last30Days.length === 0) return 0;
    // Usa waterLiters se disponível, senão converte waterGlasses antigo
    const total = last30Days.reduce((sum, c) => {
      if (c.waterLiters !== undefined) {
        return sum + c.waterLiters;
      } else if (c.waterGlasses) {
        return sum + (c.waterGlasses * 0.25); // Converte copos antigos para litros
      }
      return sum;
    }, 0);
    return total / last30Days.length;
  };

  const getAverageEnergy = () => {
    const last30Days = checkIns.slice(0, 30);
    if (last30Days.length === 0) return 0;
    const total = last30Days.reduce((sum, c) => sum + (c.energy || 0), 0);
    return total / last30Days.length;
  };

  const getWorkoutsThisWeek = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    return checkIns.filter(c => c.date >= weekAgoStr && c.workout).length;
  };

  // Gera dados dos gráficos dos últimos 30 dias
  const getSleepHistory30Days = () => {
    const last30Days = checkIns.slice(0, 30).reverse();
    return last30Days.map((checkIn, index) => ({
      day: index + 1,
      horas: checkIn.sleepHours || 0,
    }));
  };

  const getWaterHistory30Days = () => {
    const last30Days = checkIns.slice(0, 30).reverse();
    return last30Days.map((checkIn, index) => ({
      day: index + 1,
      litros: checkIn.waterLiters !== undefined 
        ? checkIn.waterLiters 
        : (checkIn.waterGlasses || 0) * 0.25, // Usa litros ou converte copos antigos
    }));
  };

  // Gera dados dos gráficos a partir dos dados reais (peso)
  const getWeightHistory = () => {
    const last7Days = healthEntries
      .filter(e => e.weight)
      .slice(0, 7)
      .reverse();
    
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return last7Days.map((entry) => {
      const date = new Date(entry.date);
      const dayName = days[date.getDay()];
      return {
        date: dayName,
        peso: entry.weight || 0,
      };
    });
  };

  // Gera dados mensais de peso (agrupa por mês)
  const getWeightHistoryMonthly = () => {
    const entriesWithWeight = healthEntries
      .filter(e => e.weight && e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Agrupa por mês e calcula média mensal
    const monthlyData: Record<string, { weights: number[]; dates: string[] }> = {};
    
    entriesWithWeight.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { weights: [], dates: [] };
      }
      
      monthlyData[monthKey].weights.push(entry.weight!);
      monthlyData[monthKey].dates.push(entry.date);
    });
    
    // Converte para array e calcula médias
    return Object.entries(monthlyData)
      .map(([monthKey, data]) => {
        const avgWeight = data.weights.reduce((sum, w) => sum + w, 0) / data.weights.length;
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return {
          month: `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`,
          peso: Number(avgWeight.toFixed(1)),
          registros: data.weights.length,
        };
      })
      .slice(-6); // Últimos 6 meses
  };

  // Gera dados mensais de IMC (agrupa por mês)
  const getBMIHistoryMonthly = () => {
    const entriesWithBMI = healthEntries
      .filter(e => e.bmi && e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Agrupa por mês e calcula média mensal
    const monthlyData: Record<string, { bmis: number[]; dates: string[] }> = {};
    
    entriesWithBMI.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { bmis: [], dates: [] };
      }
      
      monthlyData[monthKey].bmis.push(entry.bmi!);
      monthlyData[monthKey].dates.push(entry.date);
    });
    
    // Converte para array e calcula médias
    return Object.entries(monthlyData)
      .map(([monthKey, data]) => {
        const avgBMI = data.bmis.reduce((sum, b) => sum + b, 0) / data.bmis.length;
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return {
          month: `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`,
          imc: Number(avgBMI.toFixed(1)),
          registros: data.bmis.length,
        };
      })
      .slice(-6); // Últimos 6 meses
  };

  const averageSleep = getAverageSleep();
  const averageWater = getAverageWater();
  const averageEnergy = getAverageEnergy();
  const workoutsThisWeek = getWorkoutsThisWeek();
  const sleepHistory30Days = getSleepHistory30Days();
  const waterHistory30Days = getWaterHistory30Days();
  const weightHistory = getWeightHistory();
  const weightHistoryMonthly = getWeightHistoryMonthly();
  const bmiHistoryMonthly = getBMIHistoryMonthly();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <span className=''>💪</span> Saúde & Bem-estar
          </h1>
          <p className="text-muted-foreground mt-1">Monitore sua saúde física e mental</p>
        </div>
        <Dialog open={isHealthModalOpen} onOpenChange={setIsHealthModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-orange text-orange-foreground w-full sm:w-auto" onClick={() => setIsHealthModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Dados de Saúde</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    placeholder={userHeight ? userHeight.toString() : "0"}
                    value={healthFormData.height || userHeight || ''}
                    onChange={(e) => setHealthFormData({ ...healthFormData, height: parseFloat(e.target.value) || undefined })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {userHeight ? `Altura salva: ${userHeight}m` : 'Digite sua altura em metros (ex: 1.75)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={healthFormData.weight || ''}
                    onChange={(e) => setHealthFormData({ ...healthFormData, weight: parseFloat(e.target.value) || undefined })}
                  />
                  {healthFormData.weight && (userHeight || healthFormData.height) && (
                    <div className="mt-2 p-2 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">IMC:</p>
                      <p className="text-lg font-bold">
                        {calculateBMI(healthFormData.weight, userHeight || healthFormData.height || 0).toFixed(1)}
                      </p>
                      {(() => {
                        const bmi = calculateBMI(healthFormData.weight, userHeight || healthFormData.height || 0);
                        const category = getBMICategory(bmi);
                        return (
                          <p className={`text-xs font-semibold ${category.color}`}>
                            {category.label}
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="steps">Passos (opcional)</Label>
                  <Input
                    id="steps"
                    type="number"
                    placeholder="8500 (opcional)"
                    value={healthFormData.steps || ''}
                    onChange={(e) => setHealthFormData({ ...healthFormData, steps: e.target.value ? parseInt(e.target.value) || undefined : undefined })}
                  />
                  <p className="text-xs text-muted-foreground">Opcional - registre seus passos do dia</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Dica:</strong> Sono e água são registrados automaticamente no check-in diário. Use este formulário apenas para peso, altura e passos.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHealthModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveHealthData} className='mb-3'> 
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats - Cards conforme design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Média de Sono */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-medium text-muted-foreground">Média de Sono</p>
            </div>
            <p className="text-3xl font-bold mb-1">{averageSleep > 0 ? `${averageSleep.toFixed(1)} horas` : '0.0 horas'}</p>
            <p className="text-xs text-muted-foreground mb-2">Meta: {healthGoals.sleepGoal}h</p>
            <div className="flex items-center justify-between">
              <Progress value={(averageSleep / healthGoals.sleepGoal) * 100} className="h-2 flex-1" />
              <span className="text-xs font-semibold ml-2">{Math.round((averageSleep / healthGoals.sleepGoal) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Média de Água */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5 text-blue-400" />
              <p className="text-sm font-medium text-muted-foreground">Média de Água</p>
            </div>
            <p className="text-3xl font-bold mb-1">{averageWater > 0 ? `${averageWater.toFixed(1)} litros` : '0.0 litros'}</p>
            <p className="text-xs text-muted-foreground mb-2">Meta: {healthGoals.waterGoal}L</p>
            <div className="flex items-center justify-between">
              <Progress value={(averageWater / healthGoals.waterGoal) * 100} className="h-2 flex-1" />
              <span className="text-xs font-semibold ml-2">{Math.round((averageWater / healthGoals.waterGoal) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Treinos na Semana */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Treinos na Semana</p>
            </div>
            <p className="text-3xl font-bold mb-1">{workoutsThisWeek} de 7 dias</p>
            <div className="flex gap-1 mt-3">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayName, index) => {
                const today = new Date();
                const dayDate = new Date(today);
                dayDate.setDate(today.getDate() - (6 - index));
                const dayStr = dayDate.toISOString().split('T')[0];
                const hasWorkout = checkIns.some(c => c.date === dayStr && c.workout);
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-muted-foreground font-medium">{dayName}</span>
                    <div
                      className={cn(
                        "w-full h-6 rounded-lg transition-all",
                        hasWorkout ? "bg-green-500" : "bg-muted"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Energia Média */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-yellow-500" />
              <p className="text-sm font-medium text-muted-foreground">Energia Média</p>
            </div>
            <p className="text-3xl font-bold mb-1">{averageEnergy > 0 ? `${averageEnergy.toFixed(1)} de 5` : '0.0 de 5'}</p>
            <div className="flex items-center justify-between mt-3">
              <Progress value={(averageEnergy / 5) * 100} className="h-2 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peso Atual - Card maior */}
      {currentWeight && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Peso Atual</h3>
                    <p className="text-xs text-muted-foreground">Acompanhe sua evolução</p>
                  </div>
                </div>
                <p className="text-5xl font-bold mt-4 mb-4">{currentWeight} kg</p>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Altura: {healthGoals.height > 0 ? `${healthGoals.height} cm` : (userHeight ? `${(userHeight * 100).toFixed(0)} cm` : '—')}</p>
                  {currentBMI > 0 && (
                    <p className="text-sm text-muted-foreground">IMC: <span className={cn("font-semibold", bmiCategory?.color)}>{currentBMI.toFixed(1)}</span></p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsHealthModalOpen(true)}
                className="ml-4"
              >
                Atualizar Peso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row - Gráficos dos últimos 30 dias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Chart - 30 dias */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="w-5 h-5 text-purple-400" />
              Sono nos últimos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {sleepHistory30Days.length > 0 && sleepHistory30Days.some(d => d.horas > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sleepHistory30Days}>
                    <defs>
                      <linearGradient id="sleepLineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      domain={[0, 12]}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="horas" 
                      stroke="hsl(280, 70%, 55%)" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Moon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado de sono registrado</p>
                    <p className="text-xs">Faça check-ins para ver o gráfico</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Water Chart - 30 dias */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="w-5 h-5 text-blue-400" />
              Água nos últimos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {waterHistory30Days.length > 0 && waterHistory30Days.some(d => d.litros > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waterHistory30Days}>
                    <defs>
                      <linearGradient id="waterLineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      domain={[0, 4]}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => `${value.toFixed(2)} L`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="litros" 
                      stroke="hsl(200, 70%, 50%)" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Droplets className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado de água registrado</p>
                    <p className="text-xs">Faça check-ins para ver o gráfico</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Mensais - Peso e IMC */}
      {(weightHistoryMonthly.length > 0 || bmiHistoryMonthly.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Chart - Mensal */}
          {weightHistoryMonthly.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="w-5 h-5 text-primary" />
                  Evolução do Peso (Mensal)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightHistoryMonthly}>
                      <defs>
                        <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(175, 70%, 45%)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(175, 70%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any, name: string, props: any) => [
                          `${value} kg (${props.payload.registros} registro${props.payload.registros > 1 ? 's' : ''})`,
                          'Peso médio'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="hsl(175, 70%, 45%)" 
                        strokeWidth={2}
                        fill="url(#weightAreaGradient)"
                        dot={{ fill: 'hsl(175, 70%, 45%)', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BMI Chart - Mensal */}
          {bmiHistoryMonthly.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Evolução do IMC (Mensal)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bmiHistoryMonthly}>
                      <defs>
                        <linearGradient id="bmiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(15, 85%, 55%)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(15, 85%, 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'IMC', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any, name: string, props: any) => [
                          `${value} (${props.payload.registros} registro${props.payload.registros > 1 ? 's' : ''})`,
                          'IMC médio'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="imc" 
                        stroke="hsl(15, 85%, 55%)" 
                        strokeWidth={2}
                        fill="url(#bmiAreaGradient)"
                        dot={{ fill: 'hsl(15, 85%, 55%)', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-500">Abaixo: &lt;18.5</div>
                  <div className="px-2 py-1 rounded bg-green-500/20 text-green-500">Normal: 18.5-24.9</div>
                  <div className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">Sobrepeso: 25-29.9</div>
                  <div className="px-2 py-1 rounded bg-red-500/20 text-red-500">Obesidade: ≥30</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Configurar Metas de Saúde */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Configurar Metas de Saúde
            </CardTitle>
            <Dialog open={isGoalsModalOpen} onOpenChange={setIsGoalsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => {
                  setGoalsFormData({
                    waterGoal: healthGoals.waterGoal,
                    sleepGoal: healthGoals.sleepGoal,
                    height: healthGoals.height || 180,
                  });
                  setIsGoalsModalOpen(true);
                }}>
                  <Edit className="w-4 h-4 mr-1" />
                  Editar Metas
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Configurar Metas de Saúde</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="waterGoal">Meta de Água (litros/dia)</Label>
                    <Input
                      id="waterGoal"
                      type="number"
                      step="0.5"
                      min="0"
                      value={goalsFormData.waterGoal}
                      onChange={(e) => setGoalsFormData({ ...goalsFormData, waterGoal: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sleepGoal">Meta de Sono (horas/dia)</Label>
                    <Input
                      id="sleepGoal"
                      type="number"
                      step="0.5"
                      min="0"
                      value={goalsFormData.sleepGoal}
                      onChange={(e) => setGoalsFormData({ ...goalsFormData, sleepGoal: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
{/*                   <div className="space-y-2">
                    <Label htmlFor="heightGoal">Altura (cm)</Label>
                    <Input
                      id="heightGoal"
                      type="number"
                      min="0"
                      value={goalsFormData.height}
                      onChange={(e) => setGoalsFormData({ ...goalsFormData, height: parseInt(e.target.value) || 0 })}
                    />
                  </div> */}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGoalsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveHealthGoals} className='mb-3'>
                    Salvar Metas
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Meta de Água</p>
              <p className="text-2xl font-bold">{healthGoals.waterGoal}L</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Meta de Sono</p>
              <p className="text-2xl font-bold">{healthGoals.sleepGoal}h</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Altura</p>
              <p className="text-2xl font-bold">{healthGoals.height > 0 ? `${healthGoals.height} cm` : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Self-Care */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Self-Care Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Autocuidado Hoje
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </span>
                <Dialog open={isSelfCareModalOpen} onOpenChange={(open) => {
                  setIsSelfCareModalOpen(open);
                  if (!open) {
                    setEditingTask(null);
                    setSelfCareFormData({ task: '', icon: '✨' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingTask(null);
                      setSelfCareFormData({ task: '', icon: '✨' });
                      setIsSelfCareModalOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa de Autocuidado'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="taskIcon">Ícone</Label>
                        <div className="flex gap-2 flex-wrap">
                          {['✨', '💊', '🧘', '🧠', '🌙', '💆', '🛁', '📖', '🎵', '🌿'].map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setSelfCareFormData({ ...selfCareFormData, icon })}
                              className={cn(
                                "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                                selfCareFormData.icon === icon 
                                  ? "bg-primary text-primary-foreground scale-110" 
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taskName">Nome da Tarefa</Label>
                        <Input
                          id="taskName"
                          placeholder="Ex: Skincare matinal"
                          value={selfCareFormData.task}
                          onChange={(e) => setSelfCareFormData({ ...selfCareFormData, task: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsSelfCareModalOpen(false);
                        setEditingTask(null);
                        setSelfCareFormData({ task: '', icon: '✨' });
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveSelfCareTask}>
                        {editingTask ? 'Atualizar' : 'Adicionar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma tarefa de autocuidado hoje</p>
                <p className="text-sm">Adicione uma tarefa para começar</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all group",
                    task.completed 
                      ? "bg-green-500/10" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-3 flex-1"
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTask(task)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Health Insights - Preparado para implementação futura */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            Insights de Saúde da IA
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Análises inteligentes baseadas nos seus dados de saúde
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Insights de IA em breve</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Esta seção será ativada em breve com análises inteligentes sobre seu peso, IMC, padrões de sono, hidratação e muito mais.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Análise de tendências</p>
                <p className="text-sm font-medium">Em breve</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Recomendações</p>
                <p className="text-sm font-medium">Em breve</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Padrões detectados</p>
                <p className="text-sm font-medium">Em breve</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Metas inteligentes</p>
                <p className="text-sm font-medium">Em breve</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
