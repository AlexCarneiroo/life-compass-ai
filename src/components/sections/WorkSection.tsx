import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { workService, Project, Skill, CareerGoal } from '@/lib/firebase/work';
import { toast } from 'sonner';
import { 
  Plus, 
  Briefcase,
  Users,
  Target,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const teamMembers = [
  { name: 'Ana', role: 'Designer', relationship: 'Ótimo', lastInteraction: 'Hoje' },
  { name: 'Carlos', role: 'Dev Backend', relationship: 'Bom', lastInteraction: '2 dias' },
  { name: 'Marina', role: 'PM', relationship: 'Ótimo', lastInteraction: 'Ontem' },
  { name: 'Pedro', role: 'QA', relationship: 'Regular', lastInteraction: '5 dias' },
];

export function WorkSection() {
  const { userId } = useAuth();
  const [workMood, setWorkMood] = useState(4);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    progress: 0,
    deadline: '',
    status: 'Em andamento',
  });
  const moods = ['😫', '😕', '😐', '🙂', '😊'];

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [projectsData, skillsData, goalsData] = await Promise.all([
        workService.getAllProjects(userId),
        workService.getAllSkills(userId),
        workService.getAllCareerGoals(userId),
      ]);
      setProjects(projectsData);
      setSkills(skillsData);
      setCareerGoals(goalsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados profissionais');
    }
  };

  const handleSaveProject = async () => {
    if (!projectFormData.name.trim()) {
      toast.error('Preencha o nome do projeto');
      return;
    }

    try {
      await workService.createProject(projectFormData, userId);
      await loadData();
      toast.success('Projeto criado!');
      setIsProjectModalOpen(false);
      setProjectFormData({ name: '', progress: 0, deadline: '', status: 'Em andamento' });
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto');
    }
  };

  const handleToggleCareerGoal = async (goalId: string) => {
    const goal = careerGoals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      await workService.updateCareerGoal(goalId, { completed: !goal.completed });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>💼</span> Vida Profissional
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe sua carreira e projetos</p>
        </div>
        <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-blue text-blue-foreground w-full sm:w-auto" onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Nome do Projeto</Label>
                <Input
                  id="projectName"
                  placeholder="Ex: Redesign do App"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="progress">Progresso (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={projectFormData.progress}
                    onChange={(e) => setProjectFormData({ ...projectFormData, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={projectFormData.deadline}
                    onChange={(e) => setProjectFormData({ ...projectFormData, deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProjectModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProject}>
                Criar Projeto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Projetos ativos</p>
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
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Tarefas concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-cyan flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-xs text-muted-foreground">Colegas de equipe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.5</p>
                <p className="text-xs text-muted-foreground">Avaliação média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Mood */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Como está seu humor no trabalho hoje?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-3">
            {moods.map((mood, index) => (
              <button
                key={index}
                onClick={() => setWorkMood(index)}
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-2xl sm:text-3xl transition-all",
                  workMood === index 
                    ? "bg-primary/20 ring-2 ring-primary scale-110" 
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                {mood}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Projetos em Andamento
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{project.name}</h4>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  project.progress >= 80 ? "bg-green-500/10 text-green-500" :
                  project.progress >= 50 ? "bg-primary/10 text-primary" :
                  "bg-orange-500/10 text-orange-500"
                )}>
                  {project.status}
                </span>
              </div>
              <Progress value={project.progress} className="h-2 mb-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{project.progress}% concluído</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(project.deadline).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills & Career Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Habilidades para Desenvolver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {skill.level}% / {skill.target}%
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-primary/30 rounded-full"
                    style={{ width: `${skill.target}%` }}
                  />
                  <div 
                    className="absolute h-full gradient-blue rounded-full transition-all"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Career Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Metas de Carreira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {careerGoals.map((goal) => (
              <div 
                key={goal.id} 
                onClick={() => handleToggleCareerGoal(goal.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted transition-colors",
                  goal.completed ? "bg-green-500/10" : "bg-muted/50"
                )}
              >
                {goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={cn("font-medium", goal.completed && "line-through text-muted-foreground")}>
                    {goal.title}
                  </p>
                  <p className="text-xs text-muted-foreground">Meta: {goal.deadline}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Team Relationships */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Relacionamento com a Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center text-pink-foreground font-semibold">
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    member.relationship === 'Ótimo' && "bg-green-500/10 text-green-500",
                    member.relationship === 'Bom' && "bg-blue-500/10 text-blue-500",
                    member.relationship === 'Regular' && "bg-orange-500/10 text-orange-500"
                  )}>
                    {member.relationship}
                  </span>
                  <span className="text-xs text-muted-foreground">{member.lastInteraction}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
