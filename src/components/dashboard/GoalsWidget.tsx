import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { mockGoals } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { ChevronRight, Target } from 'lucide-react';

export function GoalsWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>⭐</span> Metas em Andamento
          </CardTitle>
          <span className="text-sm text-muted-foreground">{mockGoals.length} ativas</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockGoals.map((goal) => {
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
                    goal.progress >= 40 ? "gradient-primary" : 
                    "gradient-accent"
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
        })}
      </CardContent>
    </Card>
  );
}
