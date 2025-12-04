import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockHabits } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Check, Flame } from 'lucide-react';

export function HabitsWidget() {
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  const toggleHabit = (habitId: string) => {
    setCompletedToday(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const completedCount = completedToday.length;
  const totalCount = mockHabits.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <Card>
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
            className="h-full gradient-primary transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockHabits.slice(0, 5).map((habit) => {
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
        })}
        <Button variant="ghost" className="w-full mt-2 text-primary">
          Ver todos os hábitos →
        </Button>
      </CardContent>
    </Card>
  );
}
