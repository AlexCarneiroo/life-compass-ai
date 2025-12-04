import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';

const weeklyData = [
  { week: 'Sem 1', humor: 3.5, produtividade: 7, gastos: 450 },
  { week: 'Sem 2', humor: 4.0, produtividade: 7.5, gastos: 380 },
  { week: 'Sem 3', humor: 3.8, produtividade: 8, gastos: 520 },
  { week: 'Sem 4', humor: 4.2, produtividade: 8.5, gastos: 400 },
];

const habitCompletion = [
  { name: 'Meditação', value: 85 },
  { name: 'Exercício', value: 70 },
  { name: 'Leitura', value: 90 },
  { name: 'Água', value: 75 },
];

const expensesByCategory = [
  { name: 'Alimentação', value: 800, color: 'hsl(15, 85%, 55%)' },
  { name: 'Transporte', value: 300, color: 'hsl(200, 70%, 50%)' },
  { name: 'Moradia', value: 1200, color: 'hsl(150, 60%, 45%)' },
  { name: 'Lazer', value: 400, color: 'hsl(280, 70%, 55%)' },
  { name: 'Outros', value: 200, color: 'hsl(45, 90%, 50%)' },
];

const metrics = [
  { name: 'Humor Médio', current: 4.2, previous: 3.8, unit: '/5', icon: '😊' },
  { name: 'Produtividade', current: 8.5, previous: 7.5, unit: '/10', icon: '⚡' },
  { name: 'Hábitos Completados', current: 38, previous: 32, unit: '', icon: '🎯' },
  { name: 'Treinos', current: 12, previous: 10, unit: '', icon: '💪' },
  { name: 'Gastos Totais', current: 2100, previous: 2400, unit: 'R$', icon: '💰' },
  { name: 'Sono Médio', current: 7.5, previous: 7.0, unit: 'h', icon: '😴' },
];

export function ReportsSection() {
  const getChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>📊</span> Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Análises semanais e mensais do seu progresso</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Janeiro 2024
          </Button>
          <Button className="gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const change = getChange(metric.current, metric.previous);
          const isPositive = metric.name === 'Gastos Totais' ? change < 0 : change > 0;
          
          return (
            <Card key={metric.name} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{metric.icon}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                    isPositive ? "bg-green-500/10 text-green-500" : 
                    change === 0 ? "bg-muted text-muted-foreground" :
                    "bg-red-500/10 text-red-500"
                  )}>
                    {change > 0 ? <TrendingUp className="w-3 h-3" /> : 
                     change < 0 ? <TrendingDown className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    {Math.abs(change).toFixed(0)}%
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {metric.unit === 'R$' ? `R$ ${metric.current.toLocaleString()}` : `${metric.current}${metric.unit}`}
                </p>
                <p className="text-xs text-muted-foreground">{metric.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Anterior: {metric.unit === 'R$' ? `R$ ${metric.previous.toLocaleString()}` : `${metric.previous}${metric.unit}`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="humor" stroke="hsl(var(--primary))" strokeWidth={2} name="Humor" />
                  <Line type="monotone" dataKey="produtividade" stroke="hsl(var(--accent))" strokeWidth={2} name="Produtividade" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-accent" />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <RechartsPie>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`R$ ${value}`, '']}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {expensesByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-muted-foreground">{cat.name}</span>
                    <span className="font-medium">R$ {cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Completion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            🎯 Conclusão de Hábitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitCompletion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${value}%`, 'Conclusão']}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Resumo do Mês pela IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-500 mb-3">✅ Conquistas</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Humor médio subiu de 3.8 para 4.2 (+10%)</li>
                <li>• Economizou R$ 300 comparado ao mês anterior</li>
                <li>• Manteve streak de meditação por 28 dias</li>
                <li>• Completou 95% das metas de hábitos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-500 mb-3">⚠️ Pontos de Melhoria</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Exercício caiu para 70% de conclusão</li>
                <li>• Sono irregular nos fins de semana</li>
                <li>• Gastos com lazer acima do planejado</li>
                <li>• Journaling feito apenas 15 dias</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="font-semibold mb-2">💡 Recomendação Principal</h4>
            <p className="text-sm text-muted-foreground">
              Baseado na análise dos seus dados, recomendo focar em regularizar o sono nos fins de semana. 
              Seus dados mostram que dormir bem no sábado e domingo melhora sua produtividade na segunda em 35%.
              Considere criar uma rotina noturna específica para esses dias.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
