import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { workoutsService, Workout, WorkoutChallenge, WorkoutModality, WorkoutIntensity, Exercise, WorkoutTemplate, ChallengeParticipant } from '@/lib/firebase/workouts';
import { socialService } from '@/lib/firebase/social';
import { userStatsService } from '@/lib/firebase/userStats';
import { toast } from 'sonner';
import { 
  Dumbbell, 
  Plus, 
  Calendar, 
  Flame, 
  Target, 
  Users, 
  TrendingUp,
  Clock,
  Activity,
  Trophy,
  Award,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  Play,
  Copy,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const MODALITY_ICONS: Record<WorkoutModality, string> = {
  musculacao: '💪',
  cardio: '❤️',
  yoga: '🧘',
  corrida: '🏃',
  ciclismo: '🚴',
  natacao: '🏊',
  crossfit: '🔥',
  pilates: '🤸',
  danca: '💃',
  'artes-marciais': '🥋',
  funcional: '⚡',
  alongamento: '🧘‍♀️',
  outro: '🏋️',
};

const MODALITY_LABELS: Record<WorkoutModality, string> = {
  musculacao: 'Musculação',
  cardio: 'Cardio',
  yoga: 'Yoga',
  corrida: 'Corrida',
  ciclismo: 'Ciclismo',
  natacao: 'Natação',
  crossfit: 'Crossfit',
  pilates: 'Pilates',
  danca: 'Dança',
  'artes-marciais': 'Artes Marciais',
  funcional: 'Funcional',
  alongamento: 'Alongamento',
  outro: 'Outro',
};

const INTENSITY_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export function WorkoutSection() {
  const { userId, user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [challenges, setChallenges] = useState<WorkoutChallenge[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [connections, setConnections] = useState<{ connection: any; profile: any }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  
  // Forms
  const [workoutForm, setWorkoutForm] = useState<Partial<Workout>>({
    modality: 'musculacao',
    duration: 30,
    intensity: 'medium',
    date: new Date().toISOString().split('T')[0],
    exercises: [],
  });
  
  const [challengeForm, setChallengeForm] = useState<Partial<WorkoutChallenge>>({
    name: '',
    description: '',
    targetDays: 7,
    modality: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias a partir de hoje
    isPublic: true,
  });
  
  const [challengeRankings, setChallengeRankings] = useState<Record<string, any[]>>({});
  const [inviteCode, setInviteCode] = useState('');
  const [isJoinChallengeModalOpen, setIsJoinChallengeModalOpen] = useState(false);
  const [newChallengeInviteCode, setNewChallengeInviteCode] = useState<string | null>(null);
  
  const [templateForm, setTemplateForm] = useState<Partial<WorkoutTemplate>>({
    name: '',
    modality: 'musculacao',
    exercises: [],
    estimatedDuration: 30,
    intensity: 'medium',
    isPublic: false,
  });
  
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<WorkoutChallenge | null>(null);
  const [selectedModality, setSelectedModality] = useState<WorkoutModality | 'all'>('all');

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workoutsData, challengesCreated, challengesParticipating, templatesData, connectionsData] = await Promise.all([
        workoutsService.getAll(userId),
        workoutsService.getAllChallenges(userId),
        workoutsService.getChallengesByParticipant(userId),
        workoutsService.getMyTemplates(userId),
        socialService.getConnections(userId),
      ]);
      
      setWorkouts(workoutsData);
      
      // Combina desafios criados e participando (remove duplicatas)
      const allChallenges = [...challengesCreated];
      challengesParticipating.forEach(c => {
        if (!allChallenges.find(ac => ac.id === c.id)) {
          allChallenges.push(c);
        }
      });
      setChallenges(allChallenges);
      
      setTemplates(templatesData);
      setConnections(connectionsData);
      
      // Carrega rankings de todos os desafios
      const rankings: Record<string, any[]> = {};
      for (const challenge of allChallenges) {
        try {
          const ranking = await workoutsService.getChallengeRanking(challenge.id);
          rankings[challenge.id] = ranking;
        } catch (error) {
          console.error(`Erro ao carregar ranking do desafio ${challenge.id}:`, error);
        }
      }
      setChallengeRankings(rankings);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutForm.modality || !workoutForm.duration || !workoutForm.date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingWorkout) {
        await workoutsService.update(editingWorkout.id, workoutForm);
        toast.success('Treino atualizado!');
      } else {
        await workoutsService.create(workoutForm as Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId);
        toast.success('Treino registrado!');
        
        // Atualiza stats
        await userStatsService.incrementWorkoutsCompleted(userId);
        
        // Atualiza desafios do usuário
        const userChallenges = await workoutsService.getChallengesByParticipant(userId);
        for (const challenge of userChallenges) {
          if (!challenge.completed && new Date(challenge.endDate) >= new Date()) {
            await workoutsService.updateParticipantStreak(challenge.id, userId);
          }
        }
      }
      
      await loadData();
      setIsWorkoutModalOpen(false);
      setWorkoutForm({
        modality: 'musculacao',
        duration: 30,
        intensity: 'medium',
        date: new Date().toISOString().split('T')[0],
        exercises: [],
      });
      setEditingWorkout(null);
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      toast.error('Erro ao salvar treino');
    }
  };

  const handleSaveChallenge = async () => {
    if (!challengeForm.name || !challengeForm.targetDays || !challengeForm.startDate || !challengeForm.endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingChallenge) {
        await workoutsService.updateChallenge(editingChallenge.id, challengeForm);
        toast.success('Desafio atualizado!');
      } else {
        const challengeId = await workoutsService.createChallenge({
          ...challengeForm,
          currentStreak: 0,
          completed: false,
        } as Omit<WorkoutChallenge, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'inviteCode' | 'participants'>, userId);
        
        // Recarrega dados e busca o desafio criado
        await loadData();
        const allChallenges = await Promise.all([
          workoutsService.getAllChallenges(userId),
          workoutsService.getChallengesByParticipant(userId),
        ]);
        const flatChallenges = [...allChallenges[0], ...allChallenges[1]];
        const createdChallenge = flatChallenges.find(c => c.id === challengeId);
        
        if (createdChallenge?.inviteCode) {
          setNewChallengeInviteCode(createdChallenge.inviteCode);
          toast.success('Desafio criado!');
        } else {
          toast.success('Desafio criado!');
        }
      }
      
      // Se criou um novo desafio, mantém o modal aberto para mostrar o código
      if (!editingChallenge) {
        // Não fecha o modal ainda - será fechado quando o usuário clicar em "Fechar"
      } else {
        setIsChallengeModalOpen(false);
        setNewChallengeInviteCode(null);
      }
      setChallengeForm({
        name: '',
        description: '',
        targetDays: 7,
        modality: undefined,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isPublic: true,
      });
      setEditingChallenge(null);
    } catch (error) {
      console.error('Erro ao salvar desafio:', error);
      toast.error('Erro ao salvar desafio');
    }
  };

  const handleJoinChallenge = async () => {
    if (!inviteCode.trim()) {
      toast.error('Digite um código de convite');
      return;
    }

    try {
      const challenge = await workoutsService.getChallengeByInviteCode(inviteCode.toUpperCase());
      
      if (!challenge) {
        toast.error('Código de convite inválido');
        return;
      }

      if (challenge.participants?.includes(userId)) {
        toast.error('Você já está participando deste desafio');
        return;
      }

      // Adiciona participante
      await workoutsService.addChallengeParticipant(
        challenge.id,
        userId,
        user?.displayName || 'Usuário',
        user?.photoURL
      );

      toast.success('Você entrou no desafio!');
      setIsJoinChallengeModalOpen(false);
      setInviteCode('');
      await loadData();
    } catch (error) {
      console.error('Erro ao entrar no desafio:', error);
      toast.error('Erro ao entrar no desafio');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.modality || !templateForm.exercises || templateForm.exercises.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await workoutsService.createTemplate(templateForm as Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt'>, userId);
      toast.success('Template criado!');
      await loadData();
      setIsTemplateModalOpen(false);
      setTemplateForm({
        name: '',
        modality: 'musculacao',
        exercises: [],
        estimatedDuration: 30,
        intensity: 'medium',
        isPublic: false,
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return;
    
    try {
      await workoutsService.delete(id);
      toast.success('Treino excluído!');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      toast.error('Erro ao excluir treino');
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este desafio?')) return;
    
    try {
      await workoutsService.deleteChallenge(id);
      toast.success('Desafio excluído!');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir desafio:', error);
      toast.error('Erro ao excluir desafio');
    }
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    setWorkoutForm({
      modality: template.modality,
      name: template.name,
      duration: template.estimatedDuration,
      intensity: template.intensity,
      exercises: template.exercises,
      date: new Date().toISOString().split('T')[0],
    });
    setIsTemplateModalOpen(false);
    setIsWorkoutModalOpen(true);
  };

  const addExercise = () => {
    setWorkoutForm({
      ...workoutForm,
      exercises: [...(workoutForm.exercises || []), {
        name: '',
        sets: 3,
        reps: 10,
        weight: 0,
        rest: 60,
      }],
    });
  };

  const removeExercise = (index: number) => {
    const newExercises = [...(workoutForm.exercises || [])];
    newExercises.splice(index, 1);
    setWorkoutForm({ ...workoutForm, exercises: newExercises });
  };

  const updateExercise = (index: number, updates: Partial<Exercise>) => {
    const newExercises = [...(workoutForm.exercises || [])];
    newExercises[index] = { ...newExercises[index], ...updates };
    setWorkoutForm({ ...workoutForm, exercises: newExercises });
  };

  // Estatísticas
  const stats = {
    totalWorkouts: workouts.length,
    thisWeek: workouts.filter(w => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(w.date) >= weekAgo;
    }).length,
    totalCalories: workouts.reduce((sum, w) => sum + (w.calories || 0), 0),
    totalMinutes: workouts.reduce((sum, w) => sum + w.duration, 0),
    activeChallenges: challenges.filter(c => !c.completed).length,
    completedChallenges: challenges.filter(c => c.completed).length,
  };

  const modalityStats = Object.keys(MODALITY_LABELS).reduce((acc, mod) => {
    acc[mod] = workouts.filter(w => w.modality === mod).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredWorkouts = selectedModality === 'all' 
    ? workouts 
    : workouts.filter(w => w.modality === selectedModality);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Treino
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Controle total dos seus treinos, desafios e progresso
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsJoinChallengeModalOpen(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Entrar em Desafio</span>
            <span className="sm:hidden">Entrar</span>
          </Button>
          <Button onClick={() => setIsChallengeModalOpen(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Criar Desafio</span>
            <span className="sm:hidden">Desafio</span>
          </Button>
          <Button onClick={() => setIsWorkoutModalOpen(true)} size="sm" className="text-xs sm:text-sm">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Novo Treino
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Treinos</p>
                <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
              </div>
              <Activity className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calorias</p>
                <p className="text-2xl font-bold">{stats.totalCalories}</p>
              </div>
              <Flame className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Minutos</p>
                <p className="text-2xl font-bold">{stats.totalMinutes}</p>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challenges */}
      {challenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Desafios Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {challenges.map(challenge => {
                const ranking = challengeRankings[challenge.id] || [];
                const userRank = ranking.findIndex(p => p.userId === userId) + 1;
                const userParticipant = ranking.find(p => p.userId === userId);
                
                return (
                  <Card key={challenge.id} className={challenge.completed ? 'border-green-500' : ''}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{challenge.name}</h3>
                            {challenge.completed && (
                              <Badge className="bg-green-500 text-xs shrink-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Concluído
                              </Badge>
                            )}
                            {challenge.inviteCode && (
                              <Badge variant="outline" className="text-xs shrink-0 font-mono">
                                {challenge.inviteCode}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{challenge.description}</p>
                          <div className="text-xs text-muted-foreground mb-3">
                            {new Date(challenge.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} - {new Date(challenge.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Seu Progresso</span>
                              <span className="font-semibold">
                                {userParticipant?.currentStreak || 0} / {challenge.targetDays} dias
                              </span>
                            </div>
                            <Progress 
                              value={((userParticipant?.currentStreak || 0) / challenge.targetDays) * 100} 
                              className="h-2"
                            />
                            {ranking.length > 1 && (
                              <div className="text-xs text-muted-foreground mt-2">
                                🏆 Ranking: #{userRank} de {ranking.length} participantes
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              👥 {challenge.participants?.length || 1} participante(s)
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {challenge.userId === userId && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingChallenge(challenge);
                                  setChallengeForm(challenge);
                                  setIsChallengeModalOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteChallenge(challenge.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Ranking Preview */}
                      {ranking.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-semibold mb-2">Top 3:</p>
                          <div className="space-y-1">
                            {ranking.slice(0, 3).map((participant, index) => (
                              <div key={participant.userId} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{index + 1}º</span>
                                  <span>{participant.displayName}</span>
                                </div>
                                <span className="font-semibold">{participant.currentStreak} dias</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="workouts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workouts">Treinos</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Select value={selectedModality} onValueChange={(v) => setSelectedModality(v as WorkoutModality | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(MODALITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workouts List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredWorkouts.map(workout => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{MODALITY_ICONS[workout.modality]}</span>
                      <div>
                        <h3 className="font-semibold">{workout.name || MODALITY_LABELS[workout.modality]}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(workout.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingWorkout(workout);
                          setWorkoutForm(workout);
                          setIsWorkoutModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkout(workout.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duração</span>
                      <span className="font-semibold">{workout.duration} min</span>
                    </div>
                    {workout.calories && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Calorias</span>
                        <span className="font-semibold">{workout.calories} kcal</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Intensidade</span>
                      <Badge className={INTENSITY_COLORS[workout.intensity]}>
                        {workout.intensity === 'low' ? 'Baixa' : workout.intensity === 'medium' ? 'Média' : 'Alta'}
                      </Badge>
                    </div>
                    {workout.partnerName && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>Com {workout.partnerName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorkouts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum treino encontrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modalidade Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Treinos por Modalidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(modalityStats)
                        .filter(([_, count]) => count > 0)
                        .map(([mod, count]) => ({
                          name: MODALITY_LABELS[mod as WorkoutModality],
                          value: count,
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(modalityStats)
                        .filter(([_, count]) => count > 0)
                        .map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Treinos Semanais</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      return {
                        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
                        treinos: workouts.filter(w => w.date === dateStr).length,
                      };
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="treinos" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Meus Templates</h3>
            <Button onClick={() => setIsTemplateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleUseTemplate(template)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{MODALITY_ICONS[template.modality]}</span>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.exercises.length} exercícios • {template.estimatedDuration} min
                  </p>
                  <Badge className={INTENSITY_COLORS[template.intensity]}>
                    {template.intensity === 'low' ? 'Baixa' : template.intensity === 'medium' ? 'Média' : 'Alta'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Copy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum template criado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Workout Modal */}
      <Dialog open={isWorkoutModalOpen} onOpenChange={setIsWorkoutModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingWorkout ? 'Editar Treino' : 'Novo Treino'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Modalidade</Label>
                <Select
                  value={workoutForm.modality}
                  onValueChange={(v) => setWorkoutForm({ ...workoutForm, modality: v as WorkoutModality })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODALITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={workoutForm.date}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Nome (opcional)</Label>
              <Input
                value={workoutForm.name || ''}
                onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                placeholder="Ex: Treino de pernas"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={workoutForm.duration}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <Label>Calorias (opcional)</Label>
                <Input
                  type="number"
                  value={workoutForm.calories || ''}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, calories: parseInt(e.target.value) || undefined })}
                />
              </div>
              
              <div>
                <Label>Intensidade</Label>
                <Select
                  value={workoutForm.intensity}
                  onValueChange={(v) => setWorkoutForm({ ...workoutForm, intensity: v as WorkoutIntensity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Partner Selection */}
            {connections.length > 0 && (
              <div>
                <Label>Treinar com (opcional)</Label>
                <Select
                  value={workoutForm.partnerId || 'none'}
                  onValueChange={(v) => {
                    if (v === 'none') {
                      setWorkoutForm({
                        ...workoutForm,
                        partnerId: undefined,
                        partnerName: undefined,
                      });
                    } else {
                      const partnerData = connections.find(c => c.profile.id === v);
                      setWorkoutForm({
                        ...workoutForm,
                        partnerId: v,
                        partnerName: partnerData?.profile.displayName || undefined,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {connections.map(({ profile }) => (
                      <SelectItem key={profile.id} value={profile.id}>{profile.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercícios</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-3">
                  {workoutForm.exercises?.map((exercise, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Input
                          placeholder="Nome do exercício"
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, { name: e.target.value })}
                          className="flex-1 mr-2"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Input
                          type="number"
                          placeholder="Séries"
                          value={exercise.sets || ''}
                          onChange={(e) => updateExercise(index, { sets: parseInt(e.target.value) || undefined })}
                          className="text-xs sm:text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={exercise.reps || ''}
                          onChange={(e) => updateExercise(index, { reps: parseInt(e.target.value) || undefined })}
                          className="text-xs sm:text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Peso (kg)"
                          value={exercise.weight || ''}
                          onChange={(e) => updateExercise(index, { weight: parseFloat(e.target.value) || undefined })}
                          className="text-xs sm:text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Descanso (s)"
                          value={exercise.rest || ''}
                          onChange={(e) => updateExercise(index, { rest: parseInt(e.target.value) || undefined })}
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </Card>
                  ))}
                  {(!workoutForm.exercises || workoutForm.exercises.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Adicione exercícios para detalhar seu treino
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={workoutForm.notes || ''}
                onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                placeholder="Como foi o treino? Como você se sentiu?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkoutModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWorkout} className='mb-3'>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge Modal */}
      <Dialog open={isChallengeModalOpen} onOpenChange={(open) => {
        if (!open) {
          setNewChallengeInviteCode(null);
        }
        setIsChallengeModalOpen(open);
      }}>
        <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingChallenge ? 'Editar Desafio' : newChallengeInviteCode ? 'Desafio Criado!' : 'Novo Desafio'}</DialogTitle>
          </DialogHeader>
          
          {newChallengeInviteCode && !editingChallenge ? (
            // Mostra código após criar
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border-2 border-primary/20">
                <Label className="text-sm font-semibold mb-2 block">Código de Convite</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newChallengeInviteCode}
                    readOnly
                    className="font-mono text-lg font-bold text-center"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newChallengeInviteCode);
                      toast.success('Código copiado!');
                    }}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Compartilhe este código para convidar pessoas ao desafio
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Nome do Desafio</Label>
                <Input
                  value={challengeForm.name}
                  onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })}
                  placeholder="Ex: 30 dias de corrida"
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={challengeForm.description}
                  onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                  placeholder="Descreva seu desafio..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={challengeForm.startDate}
                    onChange={(e) => setChallengeForm({ ...challengeForm, startDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Data de Término</Label>
                  <Input
                    type="date"
                    value={challengeForm.endDate}
                    onChange={(e) => setChallengeForm({ ...challengeForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Dias Consecutivos</Label>
                  <Input
                    type="number"
                    value={challengeForm.targetDays}
                    onChange={(e) => setChallengeForm({ ...challengeForm, targetDays: parseInt(e.target.value) || 7 })}
                  />
                </div>
                
                <div>
                  <Label>Modalidade (opcional)</Label>
                  <Select
                    value={challengeForm.modality || 'any'}
                    onValueChange={(v) => setChallengeForm({ ...challengeForm, modality: v === 'any' ? undefined : v as WorkoutModality })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      {Object.entries(MODALITY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingChallenge?.inviteCode && (
                <div className="p-3 bg-muted rounded-md">
                  <Label className="text-sm font-semibold">Código de Convite</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={editingChallenge.inviteCode}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(editingChallenge.inviteCode || '');
                        toast.success('Código copiado!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Compartilhe este código para convidar pessoas
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {newChallengeInviteCode && !editingChallenge ? (
              <Button
                variant="default"
                onClick={() => {
                  setIsChallengeModalOpen(false);
                  setNewChallengeInviteCode(null);
                }}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsChallengeModalOpen(false);
                    setNewChallengeInviteCode(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveChallenge} className="w-full sm:w-auto mb-3">
                  Salvar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Ex: Treino de peito e tríceps"
                />
              </div>
              
              <div>
                <Label>Modalidade</Label>
                <Select
                  value={templateForm.modality}
                  onValueChange={(v) => setTemplateForm({ ...templateForm, modality: v as WorkoutModality })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODALITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração Estimada (min)</Label>
                <Input
                  type="number"
                  value={templateForm.estimatedDuration}
                  onChange={(e) => setTemplateForm({ ...templateForm, estimatedDuration: parseInt(e.target.value) || 30 })}
                />
              </div>
              
              <div>
                <Label>Intensidade</Label>
                <Select
                  value={templateForm.intensity}
                  onValueChange={(v) => setTemplateForm({ ...templateForm, intensity: v as WorkoutIntensity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exercises for Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercícios</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  setTemplateForm({
                    ...templateForm,
                    exercises: [...(templateForm.exercises || []), {
                      name: '',
                      sets: 3,
                      reps: 10,
                      weight: 0,
                      rest: 60,
                    }],
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-3">
                  {templateForm.exercises?.map((exercise, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Input
                          placeholder="Nome do exercício"
                          value={exercise.name}
                          onChange={(e) => {
                            const newExercises = [...(templateForm.exercises || [])];
                            newExercises[index] = { ...newExercises[index], name: e.target.value };
                            setTemplateForm({ ...templateForm, exercises: newExercises });
                          }}
                          className="flex-1 mr-2"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newExercises = [...(templateForm.exercises || [])];
                            newExercises.splice(index, 1);
                            setTemplateForm({ ...templateForm, exercises: newExercises });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          type="number"
                          placeholder="Séries"
                          value={exercise.sets || ''}
                          onChange={(e) => {
                            const newExercises = [...(templateForm.exercises || [])];
                            newExercises[index] = { ...newExercises[index], sets: parseInt(e.target.value) || undefined };
                            setTemplateForm({ ...templateForm, exercises: newExercises });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={exercise.reps || ''}
                          onChange={(e) => {
                            const newExercises = [...(templateForm.exercises || [])];
                            newExercises[index] = { ...newExercises[index], reps: parseInt(e.target.value) || undefined };
                            setTemplateForm({ ...templateForm, exercises: newExercises });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Peso (kg)"
                          value={exercise.weight || ''}
                          onChange={(e) => {
                            const newExercises = [...(templateForm.exercises || [])];
                            newExercises[index] = { ...newExercises[index], weight: parseFloat(e.target.value) || undefined };
                            setTemplateForm({ ...templateForm, exercises: newExercises });
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Descanso (s)"
                          value={exercise.rest || ''}
                          onChange={(e) => {
                            const newExercises = [...(templateForm.exercises || [])];
                            newExercises[index] = { ...newExercises[index], rest: parseInt(e.target.value) || undefined };
                            setTemplateForm({ ...templateForm, exercises: newExercises });
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                  {(!templateForm.exercises || templateForm.exercises.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Adicione exercícios ao template
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Challenge Modal */}
      <Dialog open={isJoinChallengeModalOpen} onOpenChange={setIsJoinChallengeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar em Desafio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Código de Convite</Label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Digite o código do desafio"
                className="font-mono text-lg"
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Peça o código para quem criou o desafio
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsJoinChallengeModalOpen(false);
              setInviteCode('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleJoinChallenge}>
              Entrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



