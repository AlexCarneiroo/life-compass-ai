import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { goalsService } from '@/lib/firebase/goals';
import { Goal } from '@/types';

export function GoalsWidget() {
  const { userId } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsService.getAll(userId);
      setGoals(data);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>⭐</span> Metas em Andamento
          </CardTitle>
          <span className="text-sm text-muted-foreground">{goals.length} ativas</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando metas...</p>
        ) : goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma meta ainda. Crie sua primeira meta!
          </p>
        ) : (
          goals.map((goal) => {
          const completedSubtasks = goal.subtasks.filter(s => s.completed).length;
          const totalSubtasks = goal.subtasks.length;
          
          return (
            <div key={goal.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {goal.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedSubtasks}/{totalSubtasks} tarefas • {goal.category}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    goal.progress >= 70 ? "gradient-success" : 
                    goal.progress >= 40 ? "gradient-blue" : 
                    "gradient-orange"
                  )}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-foreground">{goal.progress}%</span>
                {goal.deadline && (
                  <span className="text-xs text-muted-foreground">
                    Meta: {new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        }))}
      </CardContent>
    </Card>
  );
}
