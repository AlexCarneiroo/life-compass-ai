import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

const mockProjects = [
  { id: '1', name: 'Redesign do App', progress: 75, deadline: '2024-02-15', status: 'Em andamento' },
  { id: '2', name: 'API de Pagamentos', progress: 45, deadline: '2024-03-01', status: 'Em andamento' },
  { id: '3', name: 'Documentação', progress: 90, deadline: '2024-02-01', status: 'Finalizando' },
];

const mockSkills = [
  { name: 'Liderança', level: 70, target: 85 },
  { name: 'Comunicação', level: 80, target: 90 },
  { name: 'Gestão de Tempo', level: 55, target: 75 },
  { name: 'Resolução de Problemas', level: 85, target: 90 },
];

const mockCareerGoals = [
  { id: '1', title: 'Promoção para Senior', completed: false, deadline: '2024-06' },
  { id: '2', title: 'Certificação AWS', completed: true, deadline: '2024-01' },
  { id: '3', title: 'Liderar equipe de 5+', completed: false, deadline: '2024-09' },
];

const teamMembers = [
  { name: 'Ana', role: 'Designer', relationship: 'Ótimo', lastInteraction: 'Hoje' },
  { name: 'Carlos', role: 'Dev Backend', relationship: 'Bom', lastInteraction: '2 dias' },
  { name: 'Marina', role: 'PM', relationship: 'Ótimo', lastInteraction: 'Ontem' },
  { name: 'Pedro', role: 'QA', relationship: 'Regular', lastInteraction: '5 dias' },
];

export function WorkSection() {
  const [workMood, setWorkMood] = useState(4);
  const moods = ['😫', '😕', '😐', '🙂', '😊'];

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
        <Button className="gradient-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockProjects.length}</p>
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
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
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
          {mockProjects.map((project) => (
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
            {mockSkills.map((skill) => (
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
                    className="absolute h-full gradient-primary rounded-full transition-all"
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
            {mockCareerGoals.map((goal) => (
              <div 
                key={goal.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
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
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
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
