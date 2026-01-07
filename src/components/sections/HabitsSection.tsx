import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { userStatsService, checkAndGrantBadges } from '@/lib/firebase/userStats';
import { habitsService } from '@/lib/firebase/habits';
import { socialService } from '@/lib/firebase/social';
import { Habit, Badge } from '@/types';
import { cn } from '@/lib/utils';
import { 
  getHabitColor, 
  canCompleteToday, 
  calculateStreak, 
  getLast7Days, 
  isCompletedOnDate 
} from '@/lib/utils/habits';
import { 
  DIFFICULTY_OPTIONS, 
  getXPByDifficulty, 
  getDefaultDifficulty,
  HabitDifficulty 
} from '@/lib/utils/habitDifficulty';
import { Check, Flame, Plus, Trophy, Target, Star, Zap, MoreVertical, Edit, Trash2, Lock, Sparkles, Bell, Clock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { DisciplineSimulator } from './DisciplineSimulator';
import { disciplineChallengeService, DisciplineChallenge } from '@/lib/firebase/disciplineChallenge';
import { Badge as UIBadge } from '@/components/ui/badge';

// Componente para exibir contagem de badges
function BadgeCount({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    userStatsService.getOrCreate(userId).then(stats => {
      setCount(stats.badges.length);
    });
  }, [userId]);

  return (
    <div>
      <p className="text-xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">Conquistas</p>
    </div>
  );
}

// Componente para exibir badges
function BadgesDisplay({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    userStatsService.getOrCreate(userId).then(stats => {
      setBadges(stats.badges);
    });
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Suas Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Complete hábitos para desbloquear conquistas! 🏆
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className="flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-4xl mb-2">{badge.icon}</span>
                <p className="font-semibold text-sm text-center">{badge.name}</p>
                <p className="text-xs text-muted-foreground text-center mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para visualização semanal tipo Duolingo
function WeeklyView({ habit, habitIndex, onToggle, isToggling }: { habit: Habit; habitIndex: number; onToggle: (date: string) => void; isToggling?: boolean }) {
  const last7Days = getLast7Days();
  const habitColor = getHabitColor(habit, habitIndex);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center gap-2 sm:gap-3 justify-between">
      {last7Days.map((day, index) => {
        const isCompleted = isCompletedOnDate(habit, day.date);
        const isToday = day.isToday;
        const canComplete = canCompleteToday(habit, day.date) || isCompleted;
        
        return (
          <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={() => {
                if (canComplete && !isToggling) {
                  onToggle(day.date);
                }
              }}
              disabled={(!canComplete && !isCompleted) || !!isToggling}
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 flex items-center justify-center relative flex-shrink-0",
                isCompleted 
                  ? "shadow-md" 
                  : canComplete
                    ? "bg-muted hover:bg-muted/80 cursor-pointer border-2 border-dashed border-muted-foreground/30"
                    : "bg-muted/50 cursor-not-allowed opacity-50",
                isToday && "ring-2 ring-offset-2 ring-offset-background",
                isToday && isCompleted && "ring-primary",
                isToday && !isCompleted && "ring-muted-foreground/30"
              )}
              style={{
                backgroundColor: isCompleted ? habitColor : undefined,
              }}
              title={`${day.dayName} - ${day.date}${isToday ? ' (Hoje)' : ''}`}
            >
              {isToggling ? (
                <Spinner className="w-4 h-4 text-muted-foreground" />
              ) : isCompleted ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : !canComplete ? (
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              ) : null}
            </button>
            <span className={cn(
              "text-[10px] sm:text-xs font-medium truncate w-full text-center",
              isToday ? "text-primary font-bold" : "text-muted-foreground"
            )}>
              {day.dayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HabitsSection() {
  const { userId } = useAuth();
  const { scheduleHabitReminders } = usePushNotifications();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showDisciplineSimulator, setShowDisciplineSimulator] = useState<string | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Record<string, DisciplineChallenge>>({});
  const [formData, setFormData] = useState({
    name: '',
    icon: '🎯',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    category: 'Bem-estar',
    difficulty: getDefaultDifficulty() as HabitDifficulty,
    color: '',
    reminderTime: '',
    reminderEnabled: false,
    description: '',
  });

  const categories = ['all', ...new Set(habits.map(h => h.category))];
  
  const filteredHabits = selectedCategory === 'all' 
    ? habits 
    : habits.filter(h => h.category === selectedCategory);

  const habitIcons = ['🎯', '🧘', '🏃', '💧', '📚', '📝', '😴', '🍎', '☀️', '💪', '🧠', '❤️', '🎨', '🎵', '🌱'];
  const habitColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'
  ];

  // Função para verificar e solicitar permissão de notificação
  const handleReminderToggle = useCallback(async (checked: boolean) => {
    if (checked) {
      // Verifica se o navegador suporta notificações
      if (!('Notification' in window)) {
        toast.error('Seu navegador não suporta notificações');
        return;
      }

      // Se não tem permissão, solicita
      if (Notification.permission === 'denied') {
        toast.error('Notificações bloqueadas. Ative nas configurações do navegador.');
        return;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Permissão de notificação negada');
          return;
        }
        toast.success('Notificações ativadas!');
      }
    }
    
    setFormData({ ...formData, reminderEnabled: checked });
  }, [formData]);

  useEffect(() => {
    if (!userId) return;
    
    loadHabits();
    
    // Listener para detectar mudança de dia e recarregar hábitos
    const handleDayChange = () => {
      loadHabits();
    };

    window.addEventListener('day-changed', handleDayChange);
    return () => {
      window.removeEventListener('day-changed', handleDayChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadHabits = async () => {
    if (!userId) return;
    
    try {
      const data = await habitsService.getAll(userId);
      // Recalcula streaks baseado na frequência e atualiza no Firebase se necessário
      const updatedHabits = await Promise.all(
        data.map(async (habit) => {
          const calculatedStreak = calculateStreak(habit);
          // Se o streak calculado for diferente do salvo, atualiza
          if (calculatedStreak !== habit.streak) {
            try {
              await habitsService.update(habit.id, { streak: calculatedStreak });
            } catch (error) {
              console.error('Erro ao atualizar streak:', error);
            }
          }
          return {
            ...habit,
            streak: calculatedStreak,
          };
        })
      );
      setHabits(updatedHabits);
      
      // Carrega desafios ativos para cada hábito
      const challenges: Record<string, DisciplineChallenge> = {};
      await Promise.all(
        updatedHabits.map(async (habit) => {
          try {
            const challenge = await disciplineChallengeService.getActiveForHabit(userId, habit.id);
            if (challenge && challenge.status === 'active') {
              challenges[habit.id] = challenge;
            }
          } catch (error) {
            console.error(`Erro ao carregar desafio para hábito ${habit.id}:`, error);
          }
        })
      );
      setActiveChallenges(challenges);
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
      toast.error('Erro ao carregar hábitos');
    }
  };

  const handleOpenModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({
        name: habit.name,
        icon: habit.icon,
        frequency: habit.frequency,
        category: habit.category,
        difficulty: habit.difficulty || getDefaultDifficulty(),
        color: habit.color || '',
        reminderTime: habit.reminderTime || '',
        reminderEnabled: habit.reminderEnabled || false,
        description: habit.description || '',
      });
    } else {
      setEditingHabit(null);
      setFormData({
        name: '',
        icon: '🎯',
        frequency: 'daily',
        category: 'Bem-estar',
        difficulty: getDefaultDifficulty(),
        color: '',
        reminderTime: '',
        reminderEnabled: false,
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
    setFormData({
      name: '',
      icon: '🎯',
      frequency: 'daily',
      category: 'Bem-estar',
      difficulty: getDefaultDifficulty(),
      color: '',
      reminderTime: '',
      reminderEnabled: false,
      description: '',
    });
  };

  const handleSaveHabit = async () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, preencha o nome do hábito');
      return;
    }

    try {
      // Calcula XP automaticamente baseado na dificuldade
      const xpValue = getXPByDifficulty(formData.difficulty);
      
      const habitData = {
        name: formData.name,
        icon: formData.icon,
        frequency: formData.frequency,
        category: formData.category,
        streak: 0,
        completedDates: [],
        xp: xpValue,
        difficulty: formData.difficulty,
        ...(formData.color && { color: formData.color }),
        ...(formData.description && { description: formData.description }),
        reminderEnabled: formData.reminderEnabled,
        ...(formData.reminderEnabled && formData.reminderTime && { reminderTime: formData.reminderTime }),
      };

      if (editingHabit) {
        await habitsService.update(editingHabit.id, habitData);
        await loadHabits();
        toast.success('Hábito atualizado com sucesso!');
      } else {
        await habitsService.create(habitData, userId);
        await loadHabits();
        toast.success('Hábito criado com sucesso!');
      }
      
      // Re-agenda lembretes após salvar
      await scheduleHabitReminders();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar hábito:', error);
      toast.error('Erro ao salvar hábito');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await habitsService.delete(habitId);
      await loadHabits();
      toast.success('Hábito deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar hábito:', error);
      toast.error('Erro ao deletar hábito');
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    // evita concorrer operações para o mesmo hábito
    if (togglingIds.includes(habitId)) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCompleted = isCompletedOnDate(habit, date);
    const today = new Date().toISOString().split('T')[0];
    
    // marca como em progresso
    setTogglingIds(prev => [...prev, habitId]);
    try {
      if (isCompleted) {
        // Desmarca
        await habitsService.unmarkComplete(habitId, date);
        toast.success('Hábito desmarcado');
      } else {
        // Verifica se pode completar
        if (!canCompleteToday(habit, date)) {
          const freqText = habit.frequency === 'weekly' ? 'semana' : 'mês';
          toast.error(`Você já completou este hábito neste ${freqText}!`);
          return;
        }

        // Marca como completo
        await habitsService.markComplete(habitId, date);
        
        // Marca também no desafio se houver um desafio ativo
        try {
          const activeChallenge = await disciplineChallengeService.getActiveForHabit(userId, habitId);
          if (activeChallenge && activeChallenge.status === 'active') {
            // Normaliza as datas para comparação (remove hora, mantém apenas data)
            const challengeStart = activeChallenge.startDate.split('T')[0];
            const challengeEnd = activeChallenge.endDate.split('T')[0];
            const checkDate = date.split('T')[0];
            
            // Verifica se a data está dentro do período do desafio
            if (checkDate >= challengeStart && checkDate <= challengeEnd) {
              await disciplineChallengeService.markDayComplete(activeChallenge.id, checkDate);
              // Verifica se completou o desafio
              const updatedChallenge = await disciplineChallengeService.getActiveForHabit(userId, habitId);
              if (updatedChallenge?.status === 'completed') {
                toast.success('🏆 Desafio Completo!', {
                  description: `Parabéns! Você completou ${activeChallenge.duration} dias de "${habit.name}"!`,
                  duration: 8000,
                });
              }
            }
          }
        } catch (error) {
          // Ignora erros do desafio para não bloquear a marcação do hábito
          console.error('Erro ao marcar dia no desafio:', error);
        }
        
        // Adiciona XP apenas se for hoje
        if (date === today) {
          await userStatsService.addXP(userId, habit.xp);
          await userStatsService.incrementHabitsCompleted(userId);
          
          // Verifica e concede badges
          const stats = await userStatsService.getOrCreate(userId);
          const updatedHabit = await habitsService.getAll(userId).then(h => h.find(h => h.id === habitId));
          const maxStreak = updatedHabit?.streak || 0;
          
          const newBadges = await checkAndGrantBadges(userId, {
            habitsCompleted: stats.totalHabitsCompleted + 1,
            currentStreak: maxStreak,
            workoutsCompleted: stats.workoutsCompleted || 0,
            checkInsCompleted: stats.checkInsCompleted || 0,
          });
          
          for (const badge of newBadges) {
            await userStatsService.addBadge(userId, badge);
            toast.success(`🏆 Nova conquista: ${badge.name}!`, {
              description: badge.description,
              duration: 5000,
            });
            // Compartilha a conquista no feed social
            try {
              await socialService.shareAchievement(userId, {
                id: badge.id,
                name: badge.name,
                icon: badge.icon || '🏆',
              });
            } catch (error) {
              console.error('Erro ao compartilhar conquista:', error);
            }
          }
          
          // Compartilha completação de hábito a cada 5 vezes
          const updatedStats = await userStatsService.getOrCreate(userId);
          const completionCount = updatedHabit?.completedDates?.length || 0;
          if (completionCount > 0 && completionCount % 5 === 0) {
            try {
              await socialService.shareHabitChallenge(userId, habit.name, completionCount);
            } catch (error) {
              console.error('Erro ao compartilhar desafio de hábito:', error);
            }
          }
          
          toast.success(`+${habit.xp} XP ganho!`);
        }
        
        // Dispara evento para atualizar stats
        window.dispatchEvent(new Event('stats-updated'));
      }
      
      await loadHabits();
    } catch (error) {
      console.error('Erro ao marcar hábito:', error);
      toast.error('Erro ao atualizar hábito');
    }
    finally {
      // remove flag de progresso
      setTogglingIds(prev => prev.filter(id => id !== habitId));
    }
  };

  // Função helper para obter a data atual (sempre recalculada)
  const getToday = () => new Date().toISOString().split('T')[0];
  
  const today = getToday();
  const completedToday = habits.filter(h => isCompletedOnDate(h, today));
  const totalXP = habits.reduce((sum, h) => sum + h.xp, 0);
  const completedXP = completedToday.reduce((sum, h) => sum + h.xp, 0);
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0), 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hábitos</h1>
          <p className="text-muted-foreground mt-1">Construa sua melhor versão, um dia de cada vez</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={() => handleOpenModal()}>
              <Plus className="w-5 h-5 mr-2" />
              Novo Hábito
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingHabit ? 'Editar Hábito' : 'Novo Hábito'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Hábito</Label>
                <Input
                  id="name"
                  placeholder="Ex: Meditar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {habitIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={cn(
                        "w-12 h-12 text-2xl rounded-xl border-2 transition-all hover:scale-110",
                        formData.icon === icon 
                          ? "border-primary bg-primary/10" 
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: HabitDifficulty) => 
                      setFormData({ ...formData, difficulty: value })
                    }
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <span>{option.emoji}</span>
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              +{option.xp} XP
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {DIFFICULTY_OPTIONS.find(d => d.id === formData.difficulty)?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bem-estar">Bem-estar</SelectItem>
                    <SelectItem value="Saúde">Saúde</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Produtividade">Produtividade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: 10 minutos de meditação guiada"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Lembrete */}
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="reminderEnabled" className="cursor-pointer">Lembrete</Label>
                  </div>
                  <Switch
                    id="reminderEnabled"
                    checked={formData.reminderEnabled}
                    onCheckedChange={handleReminderToggle}
                  />
                </div>
                {formData.reminderEnabled && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">Horário do lembrete</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor (opcional)</Label>
                <div className="flex flex-wrap gap-2">
                  {habitColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 transition-all hover:scale-110",
                        formData.color === color 
                          ? "border-foreground ring-2 ring-offset-2" 
                          : "border-muted hover:border-primary/50"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, color: '' })}
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center text-xs",
                      !formData.color 
                        ? "border-foreground ring-2 ring-offset-2" 
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button className='mb-3' onClick={handleSaveHabit}>
                {editingHabit ? 'Salvar Alterações' : 'Criar Hábito'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="gradient" className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-orange flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{maxStreak}</p>
              <p className="text-xs text-muted-foreground">Maior sequência</p>
            </div>
          </div>
        </Card>
        
        <Card variant="gradient" className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-blue flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{completedToday.length}/{habits.length}</p>
              <p className="text-xs text-muted-foreground">Completados hoje</p>
            </div>
          </div>
        </Card>
        
        <Card variant="gradient" className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-success flex items-center justify-center">
              <Zap className="w-5 h-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">+{completedXP}</p>
              <p className="text-xs text-muted-foreground">XP ganho hoje</p>
            </div>
          </div>
        </Card>
        
        <Card variant="gradient" className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-indigo flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-foreground" />
            </div>
            <BadgeCount userId={userId} />
          </div>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Progresso de Hoje</h3>
            <span className="text-sm text-muted-foreground">
              {habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all duration-500 rounded-full"
              style={{ width: `${habits.length > 0 ? (completedToday.length / habits.length) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Star className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">
              Complete todos os hábitos para ganhar bônus de <span className="text-primary font-semibold">+50 XP</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Todos' : cat}
          </Button>
        ))}
      </div>

      {/* Habits Grid com Visualização Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredHabits.map((habit, index) => {
          const habitColor = getHabitColor(habit, index);
          const isCompletedToday = isCompletedOnDate(habit, today);
          const canComplete = canCompleteToday(habit);
          const activeChallenge = activeChallenges[habit.id];
          
          return (
            <Card
              key={habit.id}
              className={cn(
                "p-4 sm:p-5 transition-all duration-300 hover:shadow-lg relative group",
                isCompletedToday && "ring-2 ring-success bg-success/5"
              )}
            >
              <div className="space-y-4">
                {/* Header do Hábito */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div 
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all cursor-pointer flex-shrink-0",
                      isCompletedToday ? "bg-success/20" : "bg-muted"
                    )}
                    onClick={() => !togglingIds.includes(habit.id) && toggleHabit(habit.id, getToday())}
                    style={isCompletedToday ? { backgroundColor: `${habitColor}20` } : undefined}
                  >
                    {togglingIds.includes(habit.id) ? (
                      <Spinner className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      habit.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={cn(
                        "font-semibold text-base sm:text-lg",
                        isCompletedToday && "line-through text-muted-foreground"
                      )}>
                        {habit.name}
                      </h4>
                      {isCompletedToday && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0" />}
                      {activeChallenge && (
                        <UIBadge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Desafio Ativo
                        </UIBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                        <span>{habit.streak} {habit.frequency === 'daily' ? 'dias' : habit.frequency === 'weekly' ? 'semanas' : 'meses'}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-primary font-medium">+{habit.xp} XP</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {habit.frequency === 'daily' ? 'Diário' : habit.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                      </span>
                      {!canComplete && !isCompletedToday && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                          Já completado {habit.frequency === 'weekly' ? 'esta semana' : 'este mês'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div 
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
                        isCompletedToday 
                          ? "bg-success border-success text-success-foreground" 
                          : "border-muted-foreground/30 hover:border-primary"
                      )}
                      onClick={() => !togglingIds.includes(habit.id) && toggleHabit(habit.id, getToday())}
                      style={isCompletedToday ? { 
                        backgroundColor: habitColor, 
                        borderColor: habitColor 
                      } : undefined}
                    >
                      {togglingIds.includes(habit.id) ? (
                        <Spinner className="w-4 h-4 text-white" />
                      ) : (
                        isCompletedToday && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(habit);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          <div className="flex flex-col">
                            <span>Editar Hábito</span>
                            <span className="text-xs text-muted-foreground">Alterar nome, ícone, frequência</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHabit(habit.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <div className="flex flex-col">
                            <span>Deletar Hábito</span>
                            <span className="text-xs text-muted-foreground">Remover permanentemente</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Botão de Desafio */}
                {activeChallenge ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Desafio de {activeChallenge.duration} dias ativo</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activeChallenge.completedDays.length} / {activeChallenge.duration} dias completados
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDisciplineSimulator(habit.id)}
                      className="flex-shrink-0"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisciplineSimulator(habit.id)}
                    className="w-full sm:w-auto mt-3"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Iniciar Desafio
                  </Button>
                )}

                {/* Visualização Semanal */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Últimos 7 dias</span>
                    <span className="text-xs text-muted-foreground">
                      {habit.completedDates?.filter(d => {
                        const date = new Date(d);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return date >= weekAgo;
                      }).length || 0} completados
                    </span>
                  </div>
                  <WeeklyView habit={habit} habitIndex={index} onToggle={(date) => toggleHabit(habit.id, date)} isToggling={togglingIds.includes(habit.id)} />
                </div>

              </div>
            </Card>
          );
        })}
      </div>

      {filteredHabits.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum hábito encontrado. Crie seu primeiro hábito!</p>
          </CardContent>
        </Card>
      )}

      {/* Badges Section */}
      <BadgesDisplay userId={userId} />

      {/* Modal do Simulador de Disciplina */}
      {showDisciplineSimulator && (
        <Dialog open={!!showDisciplineSimulator} onOpenChange={(open) => !open && setShowDisciplineSimulator(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Simulador de Disciplina
              </DialogTitle>
            </DialogHeader>
            {habits.find(h => h.id === showDisciplineSimulator) && (
              <DisciplineSimulator 
                habit={habits.find(h => h.id === showDisciplineSimulator)!} 
                onChallengeUpdate={async () => {
                  await loadHabits();
                  setShowDisciplineSimulator(null);
                }} 
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
