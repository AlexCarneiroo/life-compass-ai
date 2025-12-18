import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moodEmojis } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { 
  Droplet, Moon, Zap, DollarSign, Dumbbell, 
  Brain, Heart, Coffee, BookOpen, Save,
  ChevronRight, ChevronLeft, CheckCircle2, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { checkinService } from '@/lib/firebase/checkin';
import { userStatsService, checkAndGrantBadges } from '@/lib/firebase/userStats';
import { workoutsService } from '@/lib/firebase/workouts';
import { DailyCheckIn } from '@/types';
import { offlineCheckinService } from '@/lib/services/offlineCheckin';
import { logger } from '@/lib/utils/logger';

const moodReasons = [
  { id: 'work', label: 'Trabalho', icon: '💼' },
  { id: 'relationship', label: 'Relacionamento', icon: '💕' },
  { id: 'health', label: 'Saúde', icon: '🏥' },
  { id: 'money', label: 'Dinheiro', icon: '💰' },
  { id: 'family', label: 'Família', icon: '👨‍👩‍👧' },
  { id: 'personal', label: 'Pessoal', icon: '🧘' },
];

export function CheckinSection() {
  const { userId } = useAuth();
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<number | null>(null);
  const [moodReason, setMoodReason] = useState<string | null>(null);
  const [energy, setEnergy] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [water, setWater] = useState(1.5); // Em litros
  const [sleep, setSleep] = useState(7);
  const [workout, setWorkout] = useState(false);
  const [expenses, setExpenses] = useState('');
  const [reflection, setReflection] = useState('');
  const [existingCheckin, setExistingCheckin] = useState<DailyCheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const totalSteps = 4;

  // Verifica se é o dia atual
  const isToday = (date: string | undefined | null) => {
    if (!date) return false;
    const today = new Date().toISOString().split('T')[0];
    const checkinDate = String(date).split('T')[0];
    return checkinDate === today;
  };

  // Carrega check-in do dia se existir
  useEffect(() => {
    if (userId) {
      loadTodayCheckin();
    }
  }, [userId]);

  // Listener para atualizar quando check-in for salvo
  useEffect(() => {
    if (!userId) return;
    
    const handleCheckinSaved = () => {
      // Aguarda um pouco e recarrega
      setTimeout(() => {
        loadTodayCheckin();
      }, 500);
    };

    window.addEventListener('checkin-saved', handleCheckinSaved);
    return () => {
      window.removeEventListener('checkin-saved', handleCheckinSaved);
    };
  }, [userId]);

  // Detectar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineCheckins();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  // Sincronizar check-ins offline quando voltar online
  const syncOfflineCheckins = async () => {
    if (!userId || !isOnline) return;

    try {
      const unsynced = offlineCheckinService.getUnsynced();
      for (const checkin of unsynced) {
        try {
          const { synced, offlineId, ...checkinData } = checkin;
          const firebaseId = await checkinService.create(checkinData, userId);
          offlineCheckinService.markAsSynced(offlineId, firebaseId);
          logger.log('Check-in sincronizado:', offlineId);
        } catch (error) {
          logger.error('Erro ao sincronizar check-in:', error);
        }
      }
      offlineCheckinService.removeSynced();
      if (unsynced.length > 0) {
        toast.success(`${unsynced.length} check-in(s) sincronizado(s)!`);
        loadTodayCheckin();
      }
    } catch (error) {
      logger.error('Erro ao sincronizar check-ins offline:', error);
    }
  };

  const loadTodayCheckin = async () => {
    if (!userId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const checkin = await checkinService.getByDate(userId, today);
      
      if (checkin) {
        setExistingCheckin(checkin);
        setIsEditing(false); // Garante que não está editando quando há check-in
        // Não preenche os campos automaticamente - só quando o usuário clicar em editar
      } else {
        // Se não há check-in, reseta o estado de edição e os campos
        setExistingCheckin(null);
        setIsEditing(false);
        // Reseta os campos para valores padrão
        setMood(null);
        setMoodReason(null);
        setEnergy(5);
        setProductivity(5);
        setWater(1.5);
        setSleep(7);
        setWorkout(false);
        setExpenses('');
        setReflection('');
        setStep(1);
      }
    } catch (error) {
      console.error('Erro ao carregar check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para forçar recarregamento
  const forceReload = async () => {
    await loadTodayCheckin();
  };

  const handleSave = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const checkinData = {
        date: todayStr,
        mood: mood !== null ? mood + 1 : 4,
        moodEmoji: mood !== null ? moodEmojis[mood] : '😊',
        energy,
        productivity,
        expenses: parseFloat(expenses) || 0,
        workout,
        waterLiters: water,
        waterGlasses: Math.round(water / 0.25), // Mantém compatibilidade
        sleepHours: sleep,
        reflection,
        moodReason: moodReason || undefined,
      };

      // Se estiver offline, salvar localmente
      if (!isOnline) {
        offlineCheckinService.saveOffline(checkinData);
        toast.success('Check-in salvo offline!', {
          description: 'Será sincronizado quando você voltar online.'
        });
        setIsEditing(false);
        setStep(1);
        return;
      }
      
      // Verifica se já existe check-in hoje (usa o estado existente ou busca novamente)
      const currentCheckin = existingCheckin || await checkinService.getByDate(userId, todayStr);
      
      if (currentCheckin) {
        // Sempre atualiza se já existe
        await checkinService.update(currentCheckin.id, checkinData);
        
        // Se treinou e não tinha treino registrado hoje, cria
        if (workout) {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayWorkouts = await workoutsService.getByDateRange(userId, todayStr, todayStr);
          
          if (todayWorkouts.length === 0) {
            try {
              await workoutsService.create({
                modality: 'outro',
                duration: 30,
                intensity: 'medium',
                date: todayStr,
                notes: 'Treino registrado via check-in',
              }, userId);
              
              await userStatsService.incrementWorkoutsCompleted(userId);
              
              // Atualiza desafios
              const userChallenges = await workoutsService.getChallengesByParticipant(userId);
              for (const challenge of userChallenges) {
                await workoutsService.updateParticipantStreak(challenge.id, userId);
              }
            } catch (error) {
              console.error('Erro ao criar treino do check-in:', error);
            }
          }
        }
        
        toast.success('Check-in atualizado com sucesso!', {
          description: workout ? 'Treino registrado automaticamente!' : 'Seu progresso foi atualizado.'
        });
        
        // Aguarda um pouco para garantir que o Firebase processou
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Força recarregar o check-in do dia
        await loadTodayCheckin();
        
        // Sai do modo de edição e reseta o step
        setIsEditing(false);
        setStep(1);
      } else {
        // Só cria se não existe
        await checkinService.create(checkinData, userId);
        // Se treinou, cria treino automaticamente
        if (workout) {
          try {
            await workoutsService.create({
              modality: 'outro', // Modalidade padrão, usuário pode editar depois
              duration: 30, // Duração padrão
              intensity: 'medium',
              date: todayStr,
              notes: 'Treino registrado via check-in',
            }, userId);
            
            // Atualiza stats
            await userStatsService.incrementWorkoutsCompleted(userId);
            
            // Atualiza desafios do usuário
            const userChallenges = await workoutsService.getChallengesByParticipant(userId);
            for (const challenge of userChallenges) {
              await workoutsService.updateParticipantStreak(challenge.id, userId);
            }
          } catch (error) {
            console.error('Erro ao criar treino do check-in:', error);
            // Não bloqueia o check-in se falhar
          }
        }
        
        // Adiciona XP por fazer check-in completo (só na primeira vez)
        await userStatsService.addXP(userId, 50);
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
        
        toast.success('Check-in salvo com sucesso!', {
          description: workout ? 'Treino registrado automaticamente!' : 'Seu progresso foi registrado. Continue assim!'
        });
        
        // Aguarda um pouco para garantir que o Firebase processou
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Força recarregar o check-in do dia
        await loadTodayCheckin();
        
        // Garante que não está editando
        setIsEditing(false);
        setStep(1);
      }
      
      // Dispara eventos para atualizar (com delay para garantir que o Firebase processou)
      setTimeout(() => {
        window.dispatchEvent(new Event('checkin-saved'));
        window.dispatchEvent(new Event('stats-updated'));
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar check-in:', error);
      toast.error('Erro ao salvar check-in');
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Como você está se sentindo?</h2>
              <p className="text-muted-foreground mt-1">Escolha o emoji que melhor representa seu humor hoje</p>
            </div>
            
            <div className="flex justify-center gap-4">
              {moodEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setMood(index)}
                  className={cn(
                    "w-16 h-16 rounded-2xl text-3xl transition-all duration-300 hover:scale-110",
                    mood === index 
                      ? "bg-primary/20 ring-4 ring-primary scale-110 shadow-lg" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {mood !== null && (
              <div className="space-y-4 mt-8 animate-fade-in">
                <p className="text-center text-muted-foreground">O que mais influenciou seu humor?</p>
                <div className="grid grid-cols-3 gap-3">
                  {moodReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setMoodReason(reason.id)}
                      className={cn(
                        "p-4 rounded-xl flex flex-col items-center gap-2 transition-all",
                        moodReason === reason.id 
                          ? "bg-primary/20 ring-2 ring-primary" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <span className="text-2xl">{reason.icon}</span>
                      <span className="text-sm font-medium">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Energia & Produtividade</h2>
              <p className="text-muted-foreground mt-1">Como foi seu dia?</p>
            </div>

            {/* Energy */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                    <Zap className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Nível de Energia</p>
                    <p className="text-sm text-muted-foreground">Como está sua disposição?</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-accent">{energy}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Productivity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
                    <Brain className="w-6 h-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Produtividade</p>
                    <p className="text-sm text-muted-foreground">Quanto você conseguiu realizar?</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-success">{productivity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={productivity}
                onChange={(e) => setProductivity(Number(e.target.value))}
                className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-success"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Saúde & Finanças</h2>
              <p className="text-muted-foreground mt-1">Registre seus hábitos de hoje</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Droplet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Água</p>
                    <p className="text-xs text-muted-foreground">Litros de água</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setWater(Math.max(0, water - 0.5))}
                  >
                    -
                  </Button>
                  <span className="text-4xl font-bold w-20 text-center">{water.toFixed(1)}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setWater(water + 0.5)}
                  >
                    +
                  </Button>
                </div>
              </Card>

              {/* Sleep */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-energy/10 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-energy" />
                  </div>
                  <div>
                    <p className="font-semibold">Sono</p>
                    <p className="text-xs text-muted-foreground">Horas dormidas</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSleep(Math.max(0, sleep - 1))}
                  >
                    -
                  </Button>
                  <span className="text-4xl font-bold w-16 text-center">{sleep}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSleep(sleep + 1)}
                  >
                    +
                  </Button>
                </div>
              </Card>

              {/* Workout */}
              <Card 
                className={cn(
                  "p-5 cursor-pointer transition-all",
                  workout && "ring-2 ring-success bg-success/5"
                )}
                onClick={() => setWorkout(!workout)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    workout ? "bg-success/20" : "bg-muted"
                  )}>
                    <Dumbbell className={cn("w-5 h-5", workout ? "text-success" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-semibold">Exercício</p>
                    <p className="text-xs text-muted-foreground">Treinou hoje?</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className={cn(
                    "text-4xl",
                    workout ? "text-success" : "text-muted-foreground"
                  )}>
                    {workout ? '✓ Sim!' : '—'}
                  </span>
                </div>
              </Card>

              {/* Expenses */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold">Gastos</p>
                    <p className="text-xs text-muted-foreground">Total do dia</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border-0 text-xl font-semibold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Reflexão do Dia</h2>
              <p className="text-muted-foreground mt-1">O que você aprendeu hoje?</p>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold">Escreva sua reflexão</p>
              </div>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Hoje eu aprendi que... / Estou grato por... / Amanhã quero..."
                className="w-full h-40 p-4 rounded-xl bg-muted border-0 resize-none focus:ring-2 focus:ring-primary outline-none"
              />
            </Card>

            {/* Summary */}
            <Card className="p-6 gradient-primary text-primary-foreground">
              <h3 className="font-bold text-lg mb-4">Resumo do Check-in</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-3xl">{moodEmojis[mood || 0]}</span>
                  <p className="text-sm opacity-80 mt-1">Humor</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{energy}/10</span>
                  <p className="text-sm opacity-80 mt-1">Energia</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{water.toFixed(1)}</span>
                  <p className="text-sm opacity-80 mt-1">Litros água</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{sleep}h</span>
                  <p className="text-sm opacity-80 mt-1">Sono</p>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  // Se há check-in do dia e não está editando, mostra o card de confirmação
  if (!loading && existingCheckin && isToday(existingCheckin.date) && !isEditing) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Check-in Diário</h1>
            <p className="text-muted-foreground mt-1">
              Registre seu dia e acompanhe seu progresso
            </p>
          </div>
        </div>

        {/* Card de Check-in Concluído */}
        <Card className="p-4 sm:p-6 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/10">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  Check-in do dia concluído! ✅
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 dark:bg-emerald-500/10 px-2 py-1 rounded-full w-fit">
                  {new Date(existingCheckin.date + 'T12:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
              </div>
              <p className="text-emerald-700/80 dark:text-emerald-300/80 mb-4 text-sm sm:text-base">
                Você já registrou seu check-in de hoje. Deseja editar alguma informação?
              </p>
              
              {/* Resumo do Check-in */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl p-2 sm:p-3 text-center">
                  <span className="text-xl sm:text-2xl block mb-1">{existingCheckin.moodEmoji}</span>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">Humor</p>
                </div>
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl p-2 sm:p-3 text-center">
                  <span className="text-base sm:text-lg font-bold block mb-1 text-emerald-700 dark:text-emerald-300">{existingCheckin.energy}/10</span>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">Energia</p>
                </div>
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl p-2 sm:p-3 text-center">
                  <span className="text-base sm:text-lg font-bold block mb-1 text-emerald-700 dark:text-emerald-300">
                    {existingCheckin.waterLiters?.toFixed(1) || (existingCheckin.waterGlasses ? (existingCheckin.waterGlasses * 0.25).toFixed(1) : '0.0')}L
                  </span>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">Água</p>
                </div>
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl p-2 sm:p-3 text-center">
                  <span className="text-base sm:text-lg font-bold block mb-1 text-emerald-700 dark:text-emerald-300">{existingCheckin.sleepHours}h</span>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">Sono</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setIsEditing(true);
                  setStep(1);
                  // Preenche os campos com os dados existentes
                  setMood(existingCheckin.mood - 1);
                  setMoodReason(existingCheckin.moodReason || null);
                  setEnergy(existingCheckin.energy);
                  setProductivity(existingCheckin.productivity);
                  if (existingCheckin.waterLiters !== undefined) {
                    setWater(existingCheckin.waterLiters);
                  } else if (existingCheckin.waterGlasses) {
                    setWater(existingCheckin.waterGlasses * 0.25);
                  }
                  setSleep(existingCheckin.sleepHours);
                  setWorkout(existingCheckin.workout);
                  setExpenses(existingCheckin.expenses > 0 ? existingCheckin.expenses.toString() : '');
                  setReflection(existingCheckin.reflection || '');
                }}
                variant="outline"
                className="w-full bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Check-in
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Check-in Diário</h1>
          <p className="text-muted-foreground mt-1">
            {existingCheckin && isEditing ? 'Editando seu check-in de hoje' : 'Registre seu dia e acompanhe seu progresso'}
          </p>
        </div>
        {existingCheckin && isEditing && (
          <span className="text-xs text-muted-foreground bg-primary/10  px-3 py-1.5 rounded-full">
            Editando
          </span>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              "flex-1 h-2 rounded-full transition-all",
              i + 1 <= step ? "gradient-cyan" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-8">
        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 1 && existingCheckin && isEditing) {
              setIsEditing(false);
              setStep(1);
              // Recarrega o check-in para mostrar o card de confirmação
              loadTodayCheckin();
            } else {
              setStep(s => Math.max(1, s - 1));
            }
          }}
          disabled={step === 1 && (!existingCheckin || !isEditing)}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {step === 1 && existingCheckin && isEditing ? 'Cancelar' : 'Anterior'}
        </Button>
        
        {step < totalSteps ? (
          <Button onClick={() => setStep(s => s + 1)}>
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            variant="success" 
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {existingCheckin ? 'Atualizar Check-in' : 'Salvar Check-in'}
          </Button>
        )}
      </div>
    </div>
  );
}
