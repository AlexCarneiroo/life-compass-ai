import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Flame, Trophy, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userStatsService } from '@/lib/firebase/userStats';
import { UserStats } from '@/types';
import { cn } from '@/lib/utils';
import { getAvatarById, isAvatarURL, getAvatarIdFromURL } from '@/lib/utils/avatars';

// Cores de borda baseadas no nível
const levelBorderColors: Record<number, string> = {
  1: 'border-slate-400/30',
  2: 'border-emerald-500/40',
  3: 'border-blue-500/40',
  4: 'border-indigo-500/40',
  5: 'border-purple-500/50',
  6: 'border-pink-500/50',
  7: 'border-orange-500/50',
  8: 'border-amber-500/60',
  9: 'border-yellow-400/60',
  10: 'border-yellow-300/70',
};

const levelGlowColors: Record<number, string> = {
  1: '',
  2: 'shadow-emerald-500/10',
  3: 'shadow-blue-500/10',
  4: 'shadow-indigo-500/15',
  5: 'shadow-purple-500/15',
  6: 'shadow-pink-500/20',
  7: 'shadow-orange-500/20',
  8: 'shadow-amber-500/25',
  9: 'shadow-yellow-400/30',
  10: 'shadow-yellow-300/40',
};

// Cores de fundo do badge de nível (mesmas cores da borda)
const levelBadgeColors: Record<number, string> = {
  1: 'bg-slate-500',
  2: 'bg-emerald-500',
  3: 'bg-blue-500',
  4: 'bg-indigo-500',
  5: 'bg-purple-500',
  6: 'bg-pink-500',
  7: 'bg-orange-500',
  8: 'bg-amber-500',
  9: 'bg-yellow-400',
  10: 'bg-yellow-300',
};

export function LevelProgress() {
  const { userId, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalHabitsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
  });

  useEffect(() => {
    if (userId) loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const userStats = await userStatsService.getOrCreate(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pega o avatar do usuário
  const photoURL = user?.photoURL || '';
  const avatarEmoji = photoURL && isAvatarURL(photoURL) 
    ? getAvatarById(getAvatarIdFromURL(photoURL) || '')?.emoji 
    : null;
  const userInitial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  const { level, xp, xpToNextLevel, currentStreak, longestStreak, badges } = stats;
  const progressPercent = xpToNextLevel > 0 ? (xp / (xp + xpToNextLevel)) * 100 : 0;

  const levelTitles: Record<number, string> = {
    1: 'Iniciante',
    2: 'Aprendiz',
    3: 'Praticante',
    4: 'Dedicado',
    5: 'Focado',
    6: 'Consistente',
    7: 'Disciplinado',
    8: 'Master',
    9: 'Lendário',
    10: 'Transcendente',
  };

  // Pega a cor da borda baseada no nível (máximo 10)
  const borderColor = levelBorderColors[Math.min(level, 10)] || levelBorderColors[10];
  const glowColor = levelGlowColors[Math.min(level, 10)] || levelGlowColors[10];
  const badgeColor = levelBadgeColors[Math.min(level, 10)] || levelBadgeColors[10];

  if (loading) {
    return (
      <Card className="col-span-full border-2">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "col-span-full border-2 transition-all duration-500",
      borderColor,
      glowColor && `shadow-lg ${glowColor}`
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Avatar & Level */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl gradient-indigo flex items-center justify-center shadow-glow animate-bounce-soft">
              {avatarEmoji ? (
                <span className="text-4xl">{avatarEmoji}</span>
              ) : (
                <span className="text-4xl font-bold text-indigo-foreground">{userInitial}</span>
              )}
            </div>
            <div className={cn(
              "absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-md",
              badgeColor
            )}>
              <span className="text-lg font-bold text-white">{level}</span>
            </div>
          </div>

          {/* Level Info & Progress */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {levelTitles[level] || 'Mestre'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nível {level} • {xp.toLocaleString()} XP
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Próximo nível</p>
                <p className="font-semibold text-primary">{xpToNextLevel.toLocaleString()} XP</p>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-indigo transition-all duration-1000 rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{currentStreak} dias</p>
                  <p className="text-xs text-muted-foreground">Sequência atual</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{longestStreak} dias</p>
                  <p className="text-xs text-muted-foreground">Recorde</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{stats.totalHabitsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Hábitos completos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Badges */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">Conquistas recentes</p>
            <div className="flex gap-2">
              {badges.slice(0, 4).map((badge) => (
                <div 
                  key={badge.id}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer"
                  title={badge.name}
                >
                  {badge.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
