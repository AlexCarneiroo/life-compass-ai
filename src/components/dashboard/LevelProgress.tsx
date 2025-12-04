import { Card, CardContent } from '@/components/ui/card';
import { mockUserStats } from '@/lib/mockData';
import { Sparkles, Flame, Trophy, Target } from 'lucide-react';

export function LevelProgress() {
  const { level, xp, xpToNextLevel, currentStreak, longestStreak, badges } = mockUserStats;
  const progressPercent = (xp / xpToNextLevel) * 100;

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

  return (
    <Card className="col-span-full">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Avatar & Level */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-bounce-soft">
              <span className="text-4xl">🧙‍♂️</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-accent-foreground">{level}</span>
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
                className="h-full gradient-primary transition-all duration-1000 rounded-full relative"
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
                  <p className="text-sm font-semibold">{mockUserStats.totalHabitsCompleted}</p>
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
