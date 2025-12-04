import { StatsCard } from '@/components/dashboard/StatsCard';
import { MoodChart } from '@/components/dashboard/MoodChart';
import { HabitsWidget } from '@/components/dashboard/HabitsWidget';
import { FinanceWidget } from '@/components/dashboard/FinanceWidget';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { InsightsWidget } from '@/components/dashboard/InsightsWidget';
import { QuickCheckin } from '@/components/dashboard/QuickCheckin';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';
import { mockTodayCheckIn, mockWeeklyReport } from '@/lib/mockData';
import { Activity, Brain, Target, Wallet } from 'lucide-react';

export function DashboardSection() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Visão da Vida</h1>
        <p className="text-muted-foreground mt-1">Seu progresso desta semana em um só lugar</p>
      </div>

      {/* Level Progress */}
      <LevelProgress />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Humor Médio"
          value={mockWeeklyReport.averageMood.toFixed(1)}
          subtitle="Melhora de 8%"
          emoji="😊"
          variant="primary"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Produtividade"
          value={`${mockWeeklyReport.averageProductivity.toFixed(0)}/10`}
          subtitle="Acima da média"
          emoji="⚡"
          variant="accent"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Hábitos"
          value={mockWeeklyReport.habitsCompleted}
          subtitle="Completados esta semana"
          emoji="🎯"
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Economia"
          value={`R$ ${(mockWeeklyReport.totalIncome - mockWeeklyReport.totalExpenses).toLocaleString('pt-BR')}`}
          subtitle="Balanço positivo"
          emoji="💰"
          variant="energy"
          trend={{ value: 30, isPositive: true }}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart */}
        <MoodChart />
        
        {/* Right Column - Quick Checkin */}
        <QuickCheckin />
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HabitsWidget />
        <FinanceWidget />
        <GoalsWidget />
      </div>

      {/* AI Insights */}
      <InsightsWidget />
    </div>
  );
}
