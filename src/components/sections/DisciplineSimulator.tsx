import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { disciplineChallengeService, DisciplineChallenge, generateRewards, generateTips } from '@/lib/firebase/disciplineChallenge';
import { habitsService } from '@/lib/firebase/habits';
import { userStatsService } from '@/lib/firebase/userStats';
import { Habit } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Target, 
  Trophy, 
  Zap, 
  Lightbulb, 
  BellOff, 
  Calendar, 
  Flame,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Gift,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DisciplineSimulatorProps {
  habit: Habit;
  onChallengeUpdate?: () => void;
}

export function DisciplineSimulator({ habit, onChallengeUpdate }: DisciplineSimulatorProps) {
  const { userId } = useAuth();
  const [challenge, setChallenge] = useState<DisciplineChallenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 21>(7);
  const [selectedAdditionalDays, setSelectedAdditionalDays] = useState<7 | 14 | 21>(7);
  const [customDays, setCustomDays] = useState<string>('');
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState<any>(null);

  const getAllDaysInChallenge = (startDate: string, endDate: string): string[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const loadChallenge = async () => {
    try {
      const activeChallenge = await disciplineChallengeService.getActiveForHabit(userId, habit.id);
      setChallenge(activeChallenge);
      
      // Verifica se o desafio expirou
      if (activeChallenge) {
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date(activeChallenge.endDate);
        const todayDate = new Date(today);
        
        if (todayDate > endDate && activeChallenge.status === 'active') {
          // Verifica se completou todos os dias
          const allDays = getAllDaysInChallenge(activeChallenge.startDate, activeChallenge.endDate);
          const completedAll = allDays.every(day => activeChallenge.completedDays.includes(day));
          
          if (!completedAll) {
            await disciplineChallengeService.update(activeChallenge.id, { status: 'failed' });
            setChallenge({ ...activeChallenge, status: 'failed' });
            toast.error('Desafio expirado', {
              description: 'O desafio terminou sem ser completado. Tente novamente!',
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar desafio:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDailyReminders = useCallback(() => {
    if (!challenge || challenge.status !== 'active') return;
    
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = challenge.completedDays.includes(today);
    
    // Verifica se já passou das 18h e não completou
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 18 && !isCompleted) {
      // Envia lembrete
      toast.warning('⏰ Lembrete do Desafio', {
        description: `Você ainda não completou "${habit.name}" hoje. Não quebre a sequência!`,
        duration: 10000,
      });
    }
  }, [challenge, habit.name]);

  const checkRewards = useCallback(async () => {
    if (!challenge || challenge.status !== 'active') return;
    
    const completedDays = challenge.completedDays.length;
    const rewards = challenge.rewards || [];
    
    for (const reward of rewards) {
      if (completedDays >= reward.day && !reward.unlocked) {
        // Desbloqueia recompensa
        await disciplineChallengeService.unlockReward(challenge.id, reward.id);
        
        // Adiciona XP
        await userStatsService.addXP(userId, reward.xp);
        
        toast.success(`🎁 Recompensa Desbloqueada!`, {
          description: `${reward.title}: ${reward.description} (+${reward.xp} XP)`,
          duration: 8000,
        });
        
        await loadChallenge();
        onChallengeUpdate?.();
      }
    }
  }, [challenge, userId, onChallengeUpdate]);

  const checkTips = useCallback(() => {
    if (!challenge || challenge.status !== 'active') return;
    
    const completedDays = challenge.completedDays.length;
    const tips = challenge.tips || [];
    
    // Mostra dica do dia atual se ainda não foi mostrada
    const todayTip = tips.find(tip => tip.day === completedDays + 1 && !tip.shown);
    
    if (todayTip) {
      setCurrentTip(todayTip);
      setShowTip(true);
      disciplineChallengeService.markTipShown(challenge.id, todayTip.id);
    }
  }, [challenge]);

  useEffect(() => {
    loadChallenge();
  }, [habit.id, userId]);

  useEffect(() => {
    if (challenge && challenge.status === 'active') {
      const timer = setTimeout(() => {
        checkDailyReminders();
        checkRewards();
        checkTips();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge]);

  const handleStartChallenge = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + selectedDuration - 1);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const newChallenge: Omit<DisciplineChallenge, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        habitId: habit.id,
        habitName: habit.name,
        duration: selectedDuration,
        startDate: today,
        endDate: endDateStr,
        status: 'active',
        completedDays: [],
        difficultyMap: {},
        rewards: generateRewards(selectedDuration),
        tips: generateTips(selectedDuration),
        notificationsBlocked: false,
      };
      
      const challengeId = await disciplineChallengeService.create(newChallenge, userId);
      const createdChallenge = {
        ...newChallenge,
        id: challengeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DisciplineChallenge;
      
      setChallenge(createdChallenge);
      setIsModalOpen(false);
      
      toast.success('🚀 Desafio Iniciado!', {
        description: `Você tem ${selectedDuration} dias para completar "${habit.name}". Boa sorte!`,
        duration: 5000,
      });
      
      onChallengeUpdate?.();
    } catch (error) {
      console.error('Erro ao iniciar desafio:', error);
      toast.error('Erro ao iniciar desafio');
    }
  };

  const handleCompleteDay = async (date: string) => {
    if (!challenge) return;
    
    try {
      await disciplineChallengeService.markDayComplete(challenge.id, date);
      await loadChallenge();
      
      // Verifica se completou o desafio
      const updatedChallenge = await disciplineChallengeService.getActiveForHabit(userId, habit.id);
      if (updatedChallenge?.status === 'completed') {
        toast.success('🏆 Desafio Completo!', {
          description: `Parabéns! Você completou ${challenge.duration} dias de "${habit.name}"!`,
          duration: 8000,
        });
      } else {
        toast.success('✅ Dia Completo!', {
          description: `Você completou mais um dia do desafio!`,
        });
      }
      
      onChallengeUpdate?.();
    } catch (error) {
      console.error('Erro ao marcar dia como completo:', error);
      toast.error('Erro ao marcar dia como completo');
    }
  };

  const handleUpdateDifficulty = async (date: string, difficulty: number) => {
    if (!challenge) return;
    
    try {
      await disciplineChallengeService.updateDifficulty(challenge.id, date, difficulty);
      await loadChallenge();
    } catch (error) {
      console.error('Erro ao atualizar dificuldade:', error);
    }
  };

  const handleExtendChallenge = async () => {
    if (!challenge) return;
    
    const daysToAdd = useCustomDays ? parseInt(customDays) : selectedAdditionalDays;
    
    if (!daysToAdd || daysToAdd <= 0) {
      toast.error('Por favor, informe um número válido de dias');
      return;
    }
    
    if (daysToAdd > 365) {
      toast.error('O número máximo de dias é 365');
      return;
    }
    
    try {
      await disciplineChallengeService.extendChallenge(challenge.id, daysToAdd);
      await loadChallenge();
      setIsExtendModalOpen(false);
      setCustomDays('');
      setUseCustomDays(false);
      
      toast.success('🎉 Desafio Estendido!', {
        description: `Você adicionou ${daysToAdd} dias ao seu desafio. Agora você tem ${challenge.duration + daysToAdd} dias para completar!`,
        duration: 5000,
      });
      
      onChallengeUpdate?.();
    } catch (error) {
      console.error('Erro ao estender desafio:', error);
      toast.error('Erro ao estender desafio');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Simulador de Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ative um desafio de disciplina para este hábito e receba suporte completo durante o processo!
          </p>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gradient-primary text-primary-foreground">
                <Target className="w-4 h-4 mr-2" />
                Iniciar Desafio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Escolha a Duração do Desafio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[7, 14, 21].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration as 7 | 14 | 21)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        selectedDuration === duration
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="text-2xl font-bold mb-1">{duration}</div>
                      <div className="text-xs text-muted-foreground">dias</div>
                    </button>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">O que você receberá:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Mensagens de cobrança diárias</li>
                    <li>Recompensas ao completar marcos</li>
                    <li>Dicas personalizadas</li>
                    <li>Mapa de dificuldade diário</li>
                    <li>Opção de bloquear notificações de distração</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStartChallenge} className="mb-3 gradient-primary text-primary-foreground">
                  Iniciar Desafio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  const allDays = getAllDaysInChallenge(challenge.startDate, challenge.endDate);
  const completedDays = challenge.completedDays.length;
  const progress = (completedDays / challenge.duration) * 100;
  const today = new Date().toISOString().split('T')[0];
  const isTodayCompleted = challenge.completedDays.includes(today);
  const daysRemaining = challenge.duration - completedDays;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Desafio de {challenge.duration} Dias
            </CardTitle>
            <div className="flex items-center gap-2">
              {challenge.status === 'active' && (
                <Dialog open={isExtendModalOpen} onOpenChange={(open) => {
                  setIsExtendModalOpen(open);
                  if (!open) {
                    setCustomDays('');
                    setUseCustomDays(false);
                    setSelectedAdditionalDays(7);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Plus className="w-3 h-3 mr-1" />
                      Estender
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Estender Desafio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Adicione mais dias ao seu desafio atual de {challenge.duration} dias.
                      </p>
                      
                      {/* Opções rápidas */}
                      <div>
                        <Label className="text-sm mb-2 block">Opções Rápidas</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[7, 14, 21].map((days) => (
                            <button
                              key={days}
                              onClick={() => {
                                setSelectedAdditionalDays(days as 7 | 14 | 21);
                                setUseCustomDays(false);
                              }}
                              className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                !useCustomDays && selectedAdditionalDays === days
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div className="text-2xl font-bold mb-1">+{days}</div>
                              <div className="text-xs text-muted-foreground">dias</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Opção customizada */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="customDays"
                            checked={useCustomDays}
                            onChange={(e) => {
                              setUseCustomDays(e.target.checked);
                              if (e.target.checked) {
                                setCustomDays('');
                              }
                            }}
                            className="w-4 h-4 rounded border-border"
                          />
                          <Label htmlFor="customDays" className="text-sm cursor-pointer">
                            Ou escolha um número customizado
                          </Label>
                        </div>
                        {useCustomDays && (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              value={customDays}
                              onChange={(e) => setCustomDays(e.target.value)}
                              placeholder="Digite o número de dias"
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Máximo: 365 dias
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Preview */}
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-1">Novo desafio:</p>
                        <p className="text-lg font-bold text-primary">
                          {challenge.duration + (useCustomDays ? (parseInt(customDays) || 0) : selectedAdditionalDays)} dias
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Data final: {new Date(new Date(challenge.endDate).getTime() + (useCustomDays ? (parseInt(customDays) || 0) : selectedAdditionalDays) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsExtendModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleExtendChallenge} className="gradient-primary text-primary-foreground">
                        Estender Desafio
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Badge variant={challenge.status === 'completed' ? 'default' : challenge.status === 'failed' ? 'destructive' : 'secondary'}>
                {challenge.status === 'completed' ? 'Completo' : challenge.status === 'failed' ? 'Falhou' : 'Ativo'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progresso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {completedDays} / {challenge.duration} dias
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {daysRemaining > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
              </p>
            )}
          </div>

          {/* Ação do dia */}
          {challenge.status === 'active' && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Hoje</span>
                {isTodayCompleted ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completo
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Pendente
                  </Badge>
                )}
              </div>
              {!isTodayCompleted && (
                <Button
                  onClick={() => handleCompleteDay(today)}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como Completo
                </Button>
              )}
            </div>
          )}

          {/* Recompensas */}
          {challenge.rewards && challenge.rewards.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Recompensas
              </h4>
              <div className="space-y-2">
                {challenge.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-center justify-between",
                      reward.unlocked
                        ? "bg-green-500/10 border-green-500/50"
                        : "bg-muted/50 border-border"
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">{reward.title}</p>
                      <p className="text-xs text-muted-foreground">{reward.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">+{reward.xp} XP</span>
                      {reward.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa de Dificuldade */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Mapa de Dificuldade
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {allDays.slice(0, 14).map((date, index) => {
                const isCompleted = challenge.completedDays.includes(date);
                const difficulty = challenge.difficultyMap?.[date] || 0;
                const dayNumber = index + 1;
                
                return (
                  <div
                    key={date}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                        isCompleted
                          ? "bg-green-500 text-white"
                          : difficulty > 0
                          ? `bg-red-${Math.min(500 + difficulty * 50, 900)} text-white`
                          : "bg-muted"
                      )}
                      title={`Dia ${dayNumber} - Dificuldade: ${difficulty}/10`}
                    >
                      {dayNumber}
                    </div>
                    {difficulty > 0 && (
                      <span className="text-xs text-muted-foreground">{difficulty}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Completo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>Difícil</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Dica */}
      <AnimatePresence>
        {showTip && currentTip && (
          <Dialog open={showTip} onOpenChange={setShowTip}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Dica do Dia {currentTip.day}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="font-semibold">{currentTip.title}</p>
                <p className="text-muted-foreground">{currentTip.content}</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowTip(false)} className="gradient-primary text-primary-foreground">
                  Entendi!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}

