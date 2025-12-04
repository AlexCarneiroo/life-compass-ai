import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { mockWeeklyReport } from '@/lib/mockData';
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

export function InsightsWidget() {
  const { insights } = mockWeeklyReport;

  const insightIcons = [
    { icon: TrendingUp, color: 'text-success' },
    { icon: Lightbulb, color: 'text-warning' },
    { icon: Brain, color: 'text-primary' },
    { icon: AlertTriangle, color: 'text-accent' },
  ];

  return (
    <Card variant="glow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span>🤖</span> IA Coach - Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const { icon: Icon, color } = insightIcons[index % insightIcons.length];
          return (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm text-foreground flex-1">{insight}</p>
            </div>
          );
        })}
        
        <div className="mt-4 p-4 rounded-xl gradient-primary text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">Dica do dia</span>
          </div>
          <p className="text-sm opacity-90">
            Baseado nos seus padrões, tente meditar antes de dormir hoje. 
            Usuários com perfil similar ao seu relatam 23% mais qualidade de sono.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
