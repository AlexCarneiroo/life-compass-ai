import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MoodChart } from '@/components/dashboard/MoodChart';
import { HabitsWidget } from '@/components/dashboard/HabitsWidget';
import { FinanceWidget } from '@/components/dashboard/FinanceWidget';
import { LevelProgress } from '@/components/dashboard/LevelProgress';
import { InsightsWidget } from '@/components/dashboard/InsightsWidget';
import { QuickCheckin } from '@/components/dashboard/QuickCheckin';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';
import { useAuth } from '@/hooks/useAuth';
import { checkinService } from '@/lib/firebase/checkin';
import { habitsService } from '@/lib/firebase/habits';
import { financeService } from '@/lib/firebase/finance';
import { DailyCheckIn, Habit, FinancialEntry } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export function DashboardSection() {
  const { userId } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState({
    averageMood: 0,
    averageProductivity: 0,
    habitsCompleted: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    loadWeeklyStats();
  }, [userId]);

  const loadWeeklyStats = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const todayStr = today.toISOString().split('T')[0];
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      
      // Busca check-ins da última semana
      const allCheckIns = await checkinService.getAll(userId);
      const last7Days = allCheckIns.filter(c => c.date >= weekAgoStr && c.date <= todayStr);
      
      // Busca hábitos
      const habits = await habitsService.getAll(userId);
      
      // Conta hábitos completados na semana
      const habitsCompletedThisWeek = habits.reduce((count, habit) => {
        const completedThisWeek = habit.completedDates?.filter(date => 
          date >= weekAgoStr && date <= todayStr
        ).length || 0;
        return count + completedThisWeek;
      }, 0);

      // Calcula médias (mood está em escala 1-6)
      const moods = last7Days.map(c => c.mood).filter(m => m > 0);
      const productivities = last7Days.map(c => c.productivity).filter(p => p > 0);
      
      const averageMood = moods.length > 0 
        ? moods.reduce((a, b) => a + b, 0) / moods.length 
        : 0;
      const averageProductivity = productivities.length > 0
        ? productivities.reduce((a, b) => a + b, 0) / productivities.length
        : 0;

      // Busca transações financeiras da última semana
      const allEntries = await financeService.getAll(userId);
      const last7DaysEntries = allEntries.filter(e => {
        return e.date >= weekAgoStr && e.date <= todayStr;
      });

      const totalIncome = last7DaysEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = last7DaysEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      setWeeklyStats({
        averageMood,
        averageProductivity,
        habitsCompleted: habitsCompletedThisWeek,
        totalIncome,
        totalExpenses,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas semanais:', error);
      // Define valores padrão em caso de erro
      setWeeklyStats({
        averageMood: 0,
        averageProductivity: 0,
        habitsCompleted: 0,
        totalIncome: 0,
        totalExpenses: 0,
      });
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Visão da Vida
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Seu progresso desta semana em um só lugar</p>
      </motion.div>

      {/* Level Progress */}
      <motion.div variants={itemVariants}>
        <LevelProgress />
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Humor Médio"
            value={weeklyStats.averageMood > 0 ? `${weeklyStats.averageMood.toFixed(1)}/6` : '0.0'}
            subtitle={weeklyStats.averageMood > 0 ? "Esta semana" : "Sem dados ainda"}
            emoji="😊"
            variant="pink"
            trend={weeklyStats.averageMood > 0 ? { value: 0, isPositive: true } : undefined}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Produtividade"
            value={weeklyStats.averageProductivity > 0 ? `${weeklyStats.averageProductivity.toFixed(0)}/10` : '0/10'}
            subtitle={weeklyStats.averageProductivity > 0 ? "Média semanal" : "Sem dados ainda"}
            emoji="⚡"
            variant="orange"
            trend={weeklyStats.averageProductivity > 0 ? { value: 0, isPositive: true } : undefined}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Hábitos"
            value={weeklyStats.habitsCompleted}
            subtitle="Completados esta semana"
            emoji="🎯"
            variant="success"
            trend={weeklyStats.habitsCompleted > 0 ? { value: 0, isPositive: true } : undefined}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Economia"
            value={`R$ ${(weeklyStats.totalIncome - weeklyStats.totalExpenses).toLocaleString('pt-BR')}`}
            subtitle={weeklyStats.totalIncome > 0 ? "Balanço semanal" : "Sem dados ainda"}
            emoji="💰"
            variant="cyan"
            trend={(weeklyStats.totalIncome - weeklyStats.totalExpenses) > 0 ? { value: 0, isPositive: true } : undefined}
          />
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column - Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <MoodChart />
        </motion.div>
        
        {/* Right Column - Quick Checkin */}
        <motion.div variants={itemVariants}>
          <QuickCheckin />
        </motion.div>
      </motion.div>

      {/* Secondary Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants}>
          <HabitsWidget />
        </motion.div>
        <motion.div variants={itemVariants}>
          <FinanceWidget />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GoalsWidget />
        </motion.div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <InsightsWidget />
      </motion.div>
    </motion.div>
  );
}
