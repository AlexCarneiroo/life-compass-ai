import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Check, Flame } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { habitsService } from '@/lib/firebase/habits';
import { Habit } from '@/types';
import { userStatsService } from '@/lib/firebase/userStats';
import { disciplineChallengeService } from '@/lib/firebase/disciplineChallenge';
import { toast } from 'sonner';

export function HabitsWidget() {
  const { userId } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, [userId]);

  // Listener para detectar mudança de dia e recarregar hábitos
  useEffect(() => {
    const handleDayChange = () => {
      loadHabits();
    };

    window.addEventListener('day-changed', handleDayChange);
    return () => {
      window.removeEventListener('day-changed', handleDayChange);
    };
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await habitsService.getAll(userId);
      setHabits(data);
      
      // Verifica quais hábitos foram completados hoje
      const today = new Date().toISOString().split('T')[0];
      const completed = data
        .filter(h => h.completedDates?.includes(today))
        .map(h => h.id);
      setCompletedToday(completed);
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const isCompleted = completedToday.includes(habitId);
    const habit = habits.find(h => h.id === habitId);
    
    setCompletedToday(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
    
    try {
      const today = new Date().toISOString().split('T')[0];
      if (!isCompleted && habit) {
        await habitsService.markComplete(habitId, today);
        
        // Marca também no desafio se houver um desafio ativo
        try {
          const activeChallenge = await disciplineChallengeService.getActiveForHabit(userId, habitId);
          if (activeChallenge && activeChallenge.status === 'active') {
            // Normaliza as datas para comparação
            const challengeStart = activeChallenge.startDate.split('T')[0];
            const challengeEnd = activeChallenge.endDate.split('T')[0];
            
            // Verifica se a data está dentro do período do desafio
            if (today >= challengeStart && today <= challengeEnd) {
              await disciplineChallengeService.markDayComplete(activeChallenge.id, today);
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
        
        // Adiciona XP
        await userStatsService.addXP(userId, habit.xp);
        await userStatsService.incrementHabitsCompleted(userId);
        toast.success(`+${habit.xp} XP ganho!`);
      }
      await loadHabits();
    } catch (error) {
      console.error('Erro ao marcar hábito:', error);
    }
  };

  const completedCount = completedToday.length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span> Hábitos de Hoje
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div 
            className="h-full gradient-success transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : habits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito ainda. Crie seu primeiro hábito!</p>
        ) : (
          habits.slice(0, 5).map((habit) => {
          const isCompleted = completedToday.includes(habit.id);
          return (
            <div
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300",
                isCompleted 
                  ? "bg-success/10 border border-success/30" 
                  : "bg-muted/50 hover:bg-muted border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.icon}</span>
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    isCompleted && "line-through text-muted-foreground"
                  )}>
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-accent" />
                    <span>{habit.streak} dias</span>
                    <span className="text-primary">+{habit.xp} XP</span>
                  </div>
                </div>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                isCompleted 
                  ? "bg-success border-success text-success-foreground" 
                  : "border-muted-foreground/30"
              )}>
                {isCompleted && <Check className="w-4 h-4" />}
              </div>
            </div>
          );
        }))}
        {habits.length > 5 && (
          <Button variant="ghost" className="w-full mt-2 text-primary">
            Ver todos os hábitos →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
