import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockHabits, mockUserStats } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Check, Flame, Plus, Trophy, Target, Star, Zap } from 'lucide-react';

export function HabitsSection() {
  const [completedToday, setCompletedToday] = useState<string[]>(['1', '4']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(mockHabits.map(h => h.category))];
  
  const filteredHabits = selectedCategory === 'all' 
    ? mockHabits 
    : mockHabits.filter(h => h.category === selectedCategory);

  const toggleHabit = (habitId: string) => {
    setCompletedToday(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const totalXP = mockHabits.reduce((sum, h) => sum + h.xp, 0);
  const completedXP = completedToday.reduce((sum, id) => {
    const habit = mockHabits.find(h => h.id === id);
    return sum + (habit?.xp || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hábitos</h1>
          <p className="text-muted-foreground mt-1">Construa sua melhor versão, um dia de cada vez</p>
        </div>
        <Button size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Novo Hábito
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="gradient" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockUserStats.currentStreak}</p>
              <p className="text-sm text-muted-foreground">Dias em sequência</p>
            </div>
          </div>
        </Card>
        
        <Card variant="gradient" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
              <Target className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedToday.length}/{mockHabits.length}</p>
              <p className="text-sm text-muted-foreground">Completados hoje</p>
            </div>
          </div>
        </Card>
        
        <Card variant="gradient" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <Zap className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">+{completedXP}</p>
              <p className="text-sm text-muted-foreground">XP ganho hoje</p>
            </div>
          </div>
        </Card>
        
        <Card variant="gradient" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-energy flex items-center justify-center">
              <Trophy className="w-6 h-6 text-energy-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockUserStats.badges.length}</p>
              <p className="text-sm text-muted-foreground">Conquistas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Progresso de Hoje</h3>
            <span className="text-sm text-muted-foreground">
              {Math.round((completedToday.length / mockHabits.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all duration-500 rounded-full"
              style={{ width: `${(completedToday.length / mockHabits.length) * 100}%` }}
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

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHabits.map((habit) => {
          const isCompleted = completedToday.includes(habit.id);
          return (
            <Card
              key={habit.id}
              className={cn(
                "p-5 cursor-pointer transition-all duration-300 hover:shadow-lg",
                isCompleted && "ring-2 ring-success bg-success/5"
              )}
              onClick={() => toggleHabit(habit.id)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all",
                  isCompleted ? "bg-success/20" : "bg-muted"
                )}>
                  {habit.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-semibold text-lg",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {habit.name}
                    </h4>
                    {isCompleted && <Check className="w-5 h-5 text-success" />}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Flame className="w-4 h-4 text-accent" />
                      <span>{habit.streak} dias</span>
                    </div>
                    <span className="text-sm text-primary font-medium">+{habit.xp} XP</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {habit.frequency === 'daily' ? 'Diário' : habit.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                  isCompleted 
                    ? "bg-success border-success text-success-foreground" 
                    : "border-muted-foreground/30 hover:border-primary"
                )}>
                  {isCompleted && <Check className="w-5 h-5" />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Suas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mockUserStats.badges.map((badge) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
