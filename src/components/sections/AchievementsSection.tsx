import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { userStatsService } from '@/lib/firebase/userStats';
import { Badge } from '@/types';
import { Trophy, Star, Flame, Target, Zap, Award, Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

// Definição de todas as conquistas possíveis
// IMPORTANTE: Os IDs devem corresponder aos IDs gerados por checkAndGrantBadges
const ALL_ACHIEVEMENTS = [
  // Check-ins
  { id: 'first-checkin', name: 'Primeiro Check-in', description: 'Fez seu primeiro check-in', icon: '✨', category: 'Início' },
  { id: 'checkin-week', name: 'Check-in Semanal', description: 'Fez check-in por 7 dias', icon: '📅', category: 'Consistência' },
  { id: 'checkin-month', name: 'Check-in Mensal', description: 'Fez check-in por 30 dias', icon: '📆', category: 'Consistência' },
  { id: 'checkin-master', name: 'Mestre do Check-in', description: 'Fez check-in por 100 dias', icon: '🎯', category: 'Consistência' },
  
  // Hábitos
  { id: 'first-step', name: 'Primeiro Passo', description: 'Completou seu primeiro hábito', icon: '👣', category: 'Hábitos' },
  { id: 'habit-10', name: '10 Hábitos', description: 'Completou 10 hábitos', icon: '⭐', category: 'Hábitos' },
  { id: 'habit-50', name: '50 Hábitos', description: 'Completou 50 hábitos', icon: '💫', category: 'Hábitos' },
  { id: 'habit-master', name: 'Mestre dos Hábitos', description: 'Completou 100 hábitos', icon: '👑', category: 'Hábitos' },
  
  // Sequências (Streaks)
  { id: 'streak-3', name: '3 Dias Consistente', description: 'Completou hábitos por 3 dias seguidos', icon: '🌱', category: 'Consistência' },
  { id: 'streak-7', name: '7 Dias Consistente', description: 'Completou hábitos por 7 dias seguidos', icon: '🔥', category: 'Consistência' },
  { id: 'streak-30', name: '30 Dias Consistente', description: 'Completou hábitos por 30 dias seguidos', icon: '💎', category: 'Consistência' },
  { id: 'streak-100', name: '100 Dias Consistente', description: 'Completou hábitos por 100 dias seguidos', icon: '🌟', category: 'Consistência' },
  
  // Níveis (serão adicionados dinamicamente baseado no nível do usuário)
  { id: 'level-5', name: 'Nível 5', description: 'Alcance o nível 5', icon: '⭐', category: 'Progressão' },
  { id: 'level-10', name: 'Nível 10', description: 'Alcance o nível 10', icon: '🌟', category: 'Progressão' },
  { id: 'level-25', name: 'Veterano', description: 'Alcance o nível 25', icon: '🎖️', category: 'Progressão' },
  { id: 'level-50', name: 'Lenda', description: 'Alcance o nível 50', icon: '👑', category: 'Progressão' },
  
  // Treinos
  { id: 'athlete', name: 'Atleta', description: 'Treinou 20 vezes', icon: '💪', category: 'Saúde' },
  { id: 'athlete-advanced', name: 'Atleta Avançado', description: 'Treinou 50 vezes', icon: '🏆', category: 'Saúde' },
  
  // Metas (serão implementadas no futuro)
  { id: 'first-goal', name: 'Sonhador', description: 'Crie sua primeira meta', icon: '🎯', category: 'Metas' },
  { id: 'goal-complete', name: 'Realizador', description: 'Complete uma meta', icon: '🏅', category: 'Metas' },
  
  // Especiais (serão implementadas no futuro)
  { id: 'early-bird', name: 'Madrugador', description: 'Faça check-in antes das 7h', icon: '🌅', category: 'Especial' },
  { id: 'night-owl', name: 'Coruja', description: 'Faça check-in após às 23h', icon: '🦉', category: 'Especial' },
  { id: 'perfect-mood', name: 'Dia Perfeito', description: 'Registre humor máximo (6)', icon: '😊', category: 'Bem-estar' },
  { id: 'hydration-master', name: 'Hidratado', description: 'Beba 3L de água em um dia', icon: '💧', category: 'Saúde' },
  { id: 'sleep-champion', name: 'Dorminhoco', description: 'Durma 8h por 7 dias seguidos', icon: '😴', category: 'Saúde' },
  { id: 'journal-writer', name: 'Escritor', description: 'Escreva 10 entradas no diário', icon: '📝', category: 'Diário' },
];

const categoryIcons: Record<string, React.ReactNode> = {
  'Início': <Star className="w-5 h-5" />,
  'Consistência': <Flame className="w-5 h-5" />,
  'Hábitos': <Target className="w-5 h-5" />,
  'Progressão': <Zap className="w-5 h-5" />,
  'Metas': <Award className="w-5 h-5" />,
  'Saúde': <Medal className="w-5 h-5" />,
  'Especial': <Crown className="w-5 h-5" />,
  'Bem-estar': <Trophy className="w-5 h-5" />,
  'Diário': <Trophy className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  'Início': 'from-blue-500 to-blue-600',
  'Consistência': 'from-orange-500 to-red-500',
  'Hábitos': 'from-purple-500 to-purple-600',
  'Progressão': 'from-yellow-500 to-amber-500',
  'Metas': 'from-emerald-500 to-green-500',
  'Saúde': 'from-pink-500 to-rose-500',
  'Especial': 'from-indigo-500 to-violet-500',
  'Bem-estar': 'from-cyan-500 to-teal-500',
  'Diário': 'from-amber-500 to-orange-500',
};

export function AchievementsSection() {
  const { userId } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ level: 1, xp: 0, totalHabitsCompleted: 0 });

  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        const userStats = await userStatsService.getOrCreate(userId);
        const badges = userStats.badges || [];
        
        // Debug: log das conquistas ganhas
        console.log('🏆 Conquistas carregadas do Firestore:', badges.length);
        console.log('IDs das conquistas ganhas:', badges.map(b => b.id));
        console.log('IDs das conquistas disponíveis:', ALL_ACHIEVEMENTS.map(a => a.id));
        
        setEarnedBadges(badges);
        setStats({
          level: userStats.level,
          xp: userStats.xp,
          totalHabitsCompleted: userStats.totalHabitsCompleted,
        });
      } catch (error) {
        console.error('Erro ao carregar conquistas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Listener para atualizar quando stats mudarem
    const handleStatsUpdate = () => {
      loadData();
    };
    window.addEventListener('stats-updated', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('stats-updated', handleStatsUpdate);
    };
  }, [userId]);

  // Cria um Set com os IDs das conquistas ganhas (normaliza para comparar)
  const earnedIds = new Set(earnedBadges.map(b => b.id.toLowerCase().trim()));
  const categories = [...new Set(ALL_ACHIEVEMENTS.map(a => a.category))];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Conquistas
        </h1>
        <p className="text-muted-foreground mt-1">
          Suas medalhas e conquistas desbloqueadas
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{earnedBadges.length}</div>
          <p className="text-sm text-muted-foreground">Conquistadas</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-muted-foreground">{ALL_ACHIEVEMENTS.length - earnedBadges.length}</div>
          <p className="text-sm text-muted-foreground">Restantes</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-amber-500">{stats.level}</div>
          <p className="text-sm text-muted-foreground">Nível</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-purple-500">{stats.totalHabitsCompleted}</div>
          <p className="text-sm text-muted-foreground">Hábitos</p>
        </Card>
      </motion.div>

      {/* Minhas Conquistas Ganhas */}
      {earnedBadges.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                Minhas Conquistas ({earnedBadges.length})
              </CardTitle>
              <CardDescription>
                Conquistas que você já desbloqueou
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {earnedBadges.map((badge) => {
                  // Encontra a definição da conquista ou usa os dados do badge
                  const normalizeId = (id: string) => id.toLowerCase().trim().replace(/[-_]/g, '');
                  const achievementDef = ALL_ACHIEVEMENTS.find(a => 
                    normalizeId(a.id) === normalizeId(badge.id)
                  ) || {
                    name: badge.name,
                    icon: badge.icon,
                    description: badge.description,
                    category: 'Ganhas'
                  };

                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center p-4 rounded-xl bg-background/50 border border-amber-500/30"
                    >
                      <div className="text-4xl mb-2">{achievementDef.icon || badge.icon}</div>
                      <p className="text-xs font-semibold text-center line-clamp-2 mb-1">
                        {achievementDef.name || badge.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground text-center">
                        {new Date(badge.earnedDate).toLocaleDateString('pt-BR')}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Achievements by Category */}
      {categories.map((category) => {
        const categoryAchievements = ALL_ACHIEVEMENTS.filter(a => a.category === category);
        
        // Normaliza IDs para contar conquistas ganhas
        const normalizeId = (id: string) => id.toLowerCase().trim().replace(/[-_]/g, '');
        const earnedInCategory = categoryAchievements.filter(a => {
          const normalizedAchievementId = normalizeId(a.id);
          return earnedBadges.some(b => normalizeId(b.id) === normalizedAchievementId);
        }).length;

        return (
          <motion.div key={category} variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                      categoryColors[category]
                    )}>
                      {categoryIcons[category]}
                    </div>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {earnedInCategory}/{categoryAchievements.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {categoryAchievements.map((achievement) => {
                    // Normaliza IDs para comparação (remove diferenças de formato)
                    const normalizeId = (id: string) => id.toLowerCase().trim().replace(/[-_]/g, '');
                    const normalizedAchievementId = normalizeId(achievement.id);
                    
                    // Verifica se a conquista foi ganha
                    const isEarned = earnedBadges.some(b => {
                      const normalizedBadgeId = normalizeId(b.id);
                      return normalizedBadgeId === normalizedAchievementId;
                    });
                    
                    // Encontra a conquista ganha correspondente
                    const earnedBadge = earnedBadges.find(b => {
                      const normalizedBadgeId = normalizeId(b.id);
                      return normalizedBadgeId === normalizedAchievementId;
                    });

                    return (
                      <motion.div
                        key={achievement.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "relative p-4 rounded-xl border text-center transition-all cursor-pointer",
                          isEarned
                            ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
                            : "bg-muted/30 border-muted opacity-50 grayscale"
                        )}
                      >
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <p className={cn(
                          "text-xs font-medium line-clamp-2",
                          isEarned ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {achievement.name}
                        </p>
                        {isEarned && earnedBadge && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(earnedBadge.earnedDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {!isEarned && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                            <span className="text-2xl">🔒</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}




