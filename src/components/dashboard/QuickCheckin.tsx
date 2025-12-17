import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { moodEmojis } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Droplet, Moon, Zap, Dumbbell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkinService } from '@/lib/firebase/checkin';
import { userStatsService, checkAndGrantBadges } from '@/lib/firebase/userStats';
import { toast } from 'sonner';
import { DailyCheckIn } from '@/types';

export function QuickCheckin() {
  const { userId } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(5);
  const [water, setWater] = useState(1.5); // Em litros
  const [sleep, setSleep] = useState(7);
  const [workout, setWorkout] = useState(false);
  const [existingCheckin, setExistingCheckin] = useState<DailyCheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega check-in do dia se existir
  useEffect(() => {
    loadTodayCheckin();
  }, [userId]);

  const loadTodayCheckin = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const checkin = await checkinService.getByDate(userId, today);
      
      if (checkin) {
        setExistingCheckin(checkin);
        // Preenche os campos com os dados existentes
        setMood(checkin.mood - 1); // Ajusta de volta para índice 0-5
        setEnergy(checkin.energy);
        // Converte waterGlasses antigo para litros ou usa waterLiters
        if (checkin.waterLiters !== undefined) {
          setWater(checkin.waterLiters);
        } else if (checkin.waterGlasses) {
          setWater(checkin.waterGlasses * 0.25); // Converte copos para litros (250ml por copo)
        }
        setSleep(checkin.sleepHours);
        setWorkout(checkin.workout);
      }
    } catch (error) {
      console.error('Erro ao carregar check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCheckin = async () => {
    if (mood === null) {
      toast.error('Selecione seu humor');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Verifica se já existe check-in hoje (usa o estado existente ou busca novamente)
      const currentCheckin = existingCheckin || await checkinService.getByDate(userId, todayStr);
      
      const checkinData = {
        date: todayStr,
        mood: mood + 1, // Ajusta para escala 1-6
        moodEmoji: moodEmojis[mood],
        energy,
        productivity: energy, // Usa energia como produtividade no quick checkin
        expenses: 0,
        workout,
        waterLiters: water,
        waterGlasses: Math.round(water / 0.25), // Mantém compatibilidade
        sleepHours: sleep,
        reflection: '',
      };

      if (currentCheckin) {
        // Atualiza check-in existente
        await checkinService.update(currentCheckin.id, checkinData);
        toast.success('Check-in atualizado com sucesso!');
        // Recarrega para atualizar o estado
        await loadTodayCheckin();
      } else {
        // Cria novo check-in
        await checkinService.create(checkinData, userId);
        // Adiciona XP por fazer check-in (só na primeira vez)
        await userStatsService.addXP(userId, 10);
        await userStatsService.incrementCheckInsCompleted(userId);
        
        // Atualiza streak baseado nos check-ins
        const allCheckIns = await checkinService.getAll(userId);
        const newStreak = await userStatsService.calculateAndUpdateStreak(userId, allCheckIns);
        
        // Verifica e concede badges
        const stats = await userStatsService.getOrCreate(userId);
        const newBadges = await checkAndGrantBadges(userId, {
          habitsCompleted: stats.totalHabitsCompleted || 0,
          currentStreak: newStreak,
          workoutsCompleted: stats.workoutsCompleted || 0,
          checkInsCompleted: (stats.checkInsCompleted || 0) + 1,
        });
        
        for (const badge of newBadges) {
          await userStatsService.addBadge(userId, badge);
          toast.success(`🏆 Nova conquista: ${badge.name}!`, {
            description: badge.description,
            duration: 5000,
          });
        }
        
        toast.success('Check-in salvo com sucesso!');
        // Recarrega para mostrar que agora existe
        await loadTodayCheckin();
      }
      
      // Dispara eventos para atualizar
      window.dispatchEvent(new Event('checkin-saved'));
      window.dispatchEvent(new Event('stats-updated'));
    } catch (error) {
      console.error('Erro ao salvar check-in:', error);
      toast.error('Erro ao salvar check-in');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span> Check-in Rápido
          </div>
          {existingCheckin && (
            <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-1 rounded-full">
              Editando
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mood Selection */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Como você está se sentindo?</p>
          <div className="flex justify-between">
            {moodEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => setMood(index)}
                className={cn(
                  "w-12 h-12 rounded-xl text-2xl transition-all duration-200 hover:scale-110",
                  mood === index 
                    ? "bg-primary/20 ring-2 ring-primary scale-110" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Energy Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Energia</span>
            </div>
            <span className="text-sm font-semibold">{energy}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-warning"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Water */}
          <div className="p-3 rounded-xl bg-muted text-center">
            <Droplet className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="flex items-center justify-center gap-1">
              <button 
                onClick={() => setWater(Math.max(0, water - 0.5))}
                className="w-6 h-6 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                -
              </button>
              <span className="font-bold text-lg w-12">{water.toFixed(1)}</span>
              <button 
                onClick={() => setWater(water + 0.5)}
                className="w-6 h-6 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Litros</p>
          </div>

          {/* Sleep */}
          <div className="p-3 rounded-xl bg-muted text-center">
            <Moon className="w-5 h-5 text-energy mx-auto mb-1" />
            <div className="flex items-center justify-center gap-1">
              <button 
                onClick={() => setSleep(Math.max(0, sleep - 1))}
                className="w-6 h-6 rounded-full bg-card hover:bg-energy/10 transition-colors"
              >
                -
              </button>
              <span className="font-bold text-lg w-8">{sleep}</span>
              <button 
                onClick={() => setSleep(sleep + 1)}
                className="w-6 h-6 rounded-full bg-card hover:bg-energy/10 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Horas sono</p>
          </div>

          {/* Workout */}
          <button 
            onClick={() => setWorkout(!workout)}
            className={cn(
              "p-3 rounded-xl text-center transition-all",
              workout ? "bg-success/20 ring-2 ring-success" : "bg-muted"
            )}
          >
            <Dumbbell className={cn("w-5 h-5 mx-auto mb-1", workout ? "text-success" : "text-muted-foreground")} />
            <span className={cn("font-bold text-lg", workout ? "text-success" : "text-foreground")}>
              {workout ? '✓' : '—'}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Treinou?</p>
          </button>
        </div>

        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSaveCheckin}
          disabled={loading}
        >
          {existingCheckin ? 'Atualizar Check-in' : 'Salvar Check-in'}
        </Button>
      </CardContent>
    </Card>
  );
}
