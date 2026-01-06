import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import { Goal } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { goalsService } from '@/lib/firebase/goals';
import { useEffect } from 'react';

const categories = [
  { id: 'all', name: 'Todas', icon: '📋' },
  { id: 'Desenvolvimento', name: 'Desenvolvimento', icon: '🎯' },
  { id: 'Financeiro', name: 'Financeiro', icon: '💰' },
  { id: 'Saúde', name: 'Saúde', icon: '💪' },
  { id: 'Carreira', name: 'Carreira', icon: '💼' },
];

export function GoalsSection() {
  const { userId } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Desenvolvimento',
    deadline: '',
    subtasks: [{ id: '1', title: '', completed: false }],
  });

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      const data = await goalsService.getAll(userId);
      setGoals(data);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas');
    }
  };

  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(g => g.category === selectedCategory);

  const totalProgress = Math.round(
    goals.length > 0 ? goals.reduce((acc, g) => acc + g.progress, 0) / goals.length : 0
  );

  const handleOpenModal = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Desenvolvimento',
      deadline: '',
      subtasks: [{ id: '1', title: '', completed: false }],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      category: 'Desenvolvimento',
      deadline: '',
      subtasks: [{ id: '1', title: '', completed: false }],
    });
  };

  const handleAddSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, { id: Date.now().toString(), title: '', completed: false }],
    });
  };

  const handleRemoveSubtask = (id: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter(s => s.id !== id),
    });
  };

  const handleUpdateSubtask = (id: string, title: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(s => s.id === id ? { ...s, title } : s),
    });
  };

  const handleSaveGoal = async () => {
    if (!formData.title.trim()) {
      toast.error('Por favor, preencha o título da meta');
      return;
    }

    const validSubtasks = formData.subtasks.filter(s => s.title.trim());
    if (validSubtasks.length === 0) {
      toast.error('Adicione pelo menos uma subMetas');
      return;
    }

    const completedSubtasks = validSubtasks.filter(s => s.completed).length;
    const progress = Math.round((completedSubtasks / validSubtasks.length) * 100);

    try {
      await goalsService.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        deadline: formData.deadline || undefined,
        progress,
        subtasks: validSubtasks,
      }, userId);
      await loadGoals();
      toast.success('Meta criada com sucesso!');
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast.error('Erro ao criar meta');
    }
  };

  const handleToggleSubtask = async (goalId: string, subtaskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedSubtasks = goal.subtasks.map(subtask =>
      subtask.id === subtaskId 
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );
    const completedCount = updatedSubtasks.filter(s => s.completed).length;
    const progress = Math.round((completedCount / updatedSubtasks.length) * 100);

    try {
      await goalsService.update(goalId, {
        subtasks: updatedSubtasks,
        progress,
      });
      await loadGoals();
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Erro ao atualizar subtarefa');
    }
  };

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
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-indigo text-indigo-foreground w-full sm:w-auto" onClick={handleOpenModal}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Meta</Label>
                <Input
                  id="title"
                  placeholder="Ex: Aprender inglês fluente"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva sua meta..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Saúde">Saúde</SelectItem>
                      <SelectItem value="Carreira">Carreira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo (opcional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>SubMetas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.subtasks.map((subtask, index) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Input
                        placeholder={`SubMeta ${index + 1}`}
                        value={subtask.title}
                        onChange={(e) => handleUpdateSubtask(subtask.id, e.target.value)}
                      />
                      {formData.subtasks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSubtask(subtask.id)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGoal} className='mb-3'>
                Criar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goals.length}</p>
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

{/*         <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-pink-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Metas feitas</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
{/* 
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
        </Card> */}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className={cn(
              "flex-shrink-0",
              selectedCategory === cat.id && "gradient-indigo text-indigo-foreground"
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
                          {completedSubtasks}/{goal.subtasks.length} Metas
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
                        <p className="text-sm font-medium mb-3">SubMetas:</p>
                        {goal.subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSubtask(goal.id, subtask.id);
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer",
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
