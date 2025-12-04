import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Calendar,
  Target,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockGoals } from '@/lib/mockData';

const categories = [
  { id: 'all', name: 'Todas', icon: '📋' },
  { id: 'Desenvolvimento', name: 'Desenvolvimento', icon: '🎯' },
  { id: 'Financeiro', name: 'Financeiro', icon: '💰' },
  { id: 'Saúde', name: 'Saúde', icon: '💪' },
  { id: 'Carreira', name: 'Carreira', icon: '💼' },
];

const allGoals = [
  ...mockGoals,
  {
    id: '3',
    title: 'Correr uma maratona',
    description: 'Completar 42km',
    progress: 30,
    deadline: '2024-09-15',
    category: 'Saúde',
    subtasks: [
      { id: '1', title: 'Correr 5km sem parar', completed: true },
      { id: '2', title: 'Correr 10km', completed: true },
      { id: '3', title: 'Correr 21km (meia maratona)', completed: false },
      { id: '4', title: 'Correr 42km', completed: false },
    ],
  },
  {
    id: '4',
    title: 'Promoção no trabalho',
    description: 'Alcançar cargo de Senior',
    progress: 55,
    deadline: '2024-12-01',
    category: 'Carreira',
    subtasks: [
      { id: '1', title: 'Completar certificação', completed: true },
      { id: '2', title: 'Liderar projeto importante', completed: true },
      { id: '3', title: 'Mentorar 2 juniores', completed: false },
      { id: '4', title: 'Apresentar resultados', completed: false },
    ],
  },
];

export function GoalsSection() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const filteredGoals = selectedCategory === 'all' 
    ? allGoals 
    : allGoals.filter(g => g.category === selectedCategory);

  const totalProgress = Math.round(
    allGoals.reduce((acc, g) => acc + g.progress, 0) / allGoals.length
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>⭐</span> Metas & Objetivos
          </h1>
          <p className="text-muted-foreground mt-1">Defina e acompanhe suas metas pessoais</p>
        </div>
        <Button className="gradient-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allGoals.length}</p>
                <p className="text-xs text-muted-foreground">Metas ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-100" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProgress}%</p>
                <p className="text-xs text-muted-foreground">Progresso médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Tarefas feitas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Próximas do prazo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className={cn(
              "flex-shrink-0",
              selectedCategory === cat.id && "gradient-primary text-primary-foreground"
            )}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Goals List */}
      <div className="grid gap-4">
        {filteredGoals.map((goal) => {
          const isExpanded = expandedGoal === goal.id;
          const completedSubtasks = goal.subtasks.filter(s => s.completed).length;
          const daysLeft = goal.deadline 
            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          
          return (
            <Card 
              key={goal.id} 
              className={cn(
                "transition-all cursor-pointer hover:shadow-lg",
                isExpanded && "ring-2 ring-primary"
              )}
              onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                    goal.progress >= 70 ? "bg-green-500/20" :
                    goal.progress >= 40 ? "bg-primary/20" :
                    "bg-orange-500/20"
                  )}>
                    {goal.category === 'Desenvolvimento' && '🎯'}
                    {goal.category === 'Financeiro' && '💰'}
                    {goal.category === 'Saúde' && '💪'}
                    {goal.category === 'Carreira' && '💼'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {completedSubtasks}/{goal.subtasks.length} tarefas
                        </span>
                        <span className="text-sm font-semibold">{goal.progress}%</span>
                      </div>
                      <Progress 
                        value={goal.progress} 
                        className={cn(
                          "h-2",
                          goal.progress >= 70 && "[&>div]:bg-green-500"
                        )} 
                      />
                    </div>
                    
                    {daysLeft !== null && (
                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className={cn(
                          daysLeft <= 7 ? "text-red-500" : 
                          daysLeft <= 30 ? "text-orange-500" : 
                          "text-muted-foreground"
                        )}>
                          {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido!'}
                        </span>
                      </div>
                    )}
                    
                    {/* Expanded Subtasks */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-2 animate-fade-in">
                        <p className="text-sm font-medium mb-3">Subtarefas:</p>
                        {goal.subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-colors",
                              subtask.completed 
                                ? "bg-green-500/10" 
                                : "bg-muted/50 hover:bg-muted"
                            )}
                          >
                            {subtask.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={cn(
                              subtask.completed && "line-through text-muted-foreground"
                            )}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Motivation */}
      <Card className="gradient-card border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Motivação da IA</h3>
              <p className="text-muted-foreground">
                "Você está a apenas 35% de completar sua meta de economia! 
                Baseado no seu progresso atual, você vai atingir a meta em aproximadamente 45 dias. 
                Continue assim! 🚀"
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver sugestões
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ajustar prazo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
