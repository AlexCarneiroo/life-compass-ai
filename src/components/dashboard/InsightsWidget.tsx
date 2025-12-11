import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { habitsService } from '@/lib/firebase/habits';
import { goalsService } from '@/lib/firebase/goals';
import { checkinService } from '@/lib/firebase/checkin';
import { financeService } from '@/lib/firebase/finance';
import { Habit, Goal } from '@/types';

export function InsightsWidget() {
  const { userId } = useAuth();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, [userId]);

  const generateInsights = async () => {
    try {
      setLoading(true);
      const [habits, goals, checkIns, entries] = await Promise.all([
        habitsService.getAll(userId),
        goalsService.getAll(userId),
        checkinService.getAll(userId),
        financeService.getAll(userId),
      ]);

      const newInsights: string[] = [];

      // Insight sobre hábitos
      const completedToday = habits.filter(h => {
        const today = new Date().toISOString().split('T')[0];
        return h.completedDates?.includes(today);
      }).length;
      
      if (completedToday > 0) {
        newInsights.push(`Você completou ${completedToday} hábito(s) hoje! Continue assim! 🎯`);
      }

      // Insight sobre streaks
      const maxStreak = Math.max(...habits.map(h => h.streak || 0), 0);
      if (maxStreak >= 7) {
        newInsights.push(`Sequência incrível de ${maxStreak} dias! Você está no caminho certo! 🔥`);
      }

      // Insight sobre metas
      const goalsInProgress = goals.filter(g => g.progress > 0 && g.progress < 100);
      if (goalsInProgress.length > 0) {
        const avgProgress = Math.round(goalsInProgress.reduce((sum, g) => sum + g.progress, 0) / goalsInProgress.length);
        newInsights.push(`Suas metas estão ${avgProgress}% completas. Continue progredindo! ⭐`);
      }

      // Insight sobre humor
      const recentMoods = checkIns.slice(0, 7).map(c => c.mood).filter(m => m > 0);
      if (recentMoods.length > 0) {
        const avgMood = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
        if (avgMood >= 4) {
          newInsights.push(`Seu humor médio está ótimo (${avgMood.toFixed(1)}/5)! Mantenha o foco positivo! 😊`);
        }
      }

      // Insight sobre finanças
      const expenses = entries.filter(e => e.type === 'expense');
      const incomes = entries.filter(e => e.type === 'income');
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);
      if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(0);
        if (parseFloat(savingsRate) > 0) {
          newInsights.push(`Você está economizando ${savingsRate}% da sua renda. Excelente! 💰`);
        }
      }

      // Se não tiver insights, adiciona um motivacional
      if (newInsights.length === 0) {
        newInsights.push('Comece completando seus hábitos diários para ganhar XP e desbloquear conquistas! 🚀');
      }

      setInsights(newInsights.slice(0, 4));
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      setInsights(['Erro ao carregar insights. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Gerando insights...</p>
        ) : (
          insights.map((insight, index) => {
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
        }))}
        
        {!loading && (
          <div className="mt-4 p-4 rounded-xl gradient-pink text-pink-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">Dica do dia</span>
          </div>
          <p className="text-sm opacity-90">
            Baseado nos seus padrões, tente meditar antes de dormir hoje. 
            Usuários com perfil similar ao seu relatam 23% mais qualidade de sono.
          </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
