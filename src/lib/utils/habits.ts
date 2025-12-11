import { Habit } from '@/types';

// Cores padrão para hábitos (se não tiver cor personalizada)
const DEFAULT_COLORS = [
  '#3B82F6', // azul
  '#10B981', // verde
  '#F59E0B', // amarelo
  '#EF4444', // vermelho
  '#8B5CF6', // roxo
  '#EC4899', // rosa
  '#06B6D4', // ciano
  '#F97316', // laranja
];

// Gera uma cor baseada no nome do hábito
export function getHabitColor(habit: Habit, index: number = 0): string {
  if (habit.color) return habit.color;
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// Verifica se um hábito pode ser completado hoje baseado na frequência
export function canCompleteToday(habit: Habit, date: string = new Date().toISOString().split('T')[0]): boolean {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  switch (habit.frequency) {
    case 'daily':
      // Pode completar todo dia
      return true;
    
    case 'weekly':
      // Pode completar uma vez por semana
      // Verifica se já completou esta semana
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Domingo da semana
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const completedThisWeek = habit.completedDates?.some(dateStr => {
        const completedDate = new Date(dateStr);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate >= weekStart && completedDate <= weekEnd;
      });
      
      return !completedThisWeek;
    
    case 'monthly':
      // Pode completar uma vez por mês
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const completedThisMonth = habit.completedDates?.some(dateStr => {
        const completedDate = new Date(dateStr);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate >= monthStart && completedDate <= monthEnd;
      });
      
      return !completedThisMonth;
    
    default:
      return true;
  }
}

// Calcula o streak baseado na frequência
export function calculateStreak(habit: Habit): number {
  if (!habit.completedDates || habit.completedDates.length === 0) return 0;
  
  // Ordena datas do mais recente para o mais antigo
  const sortedDates = [...habit.completedDates].sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (habit.frequency) {
    case 'daily': {
      // Streak diário: dias consecutivos
      let expectedDate = new Date(today);
      expectedDate.setHours(0, 0, 0, 0);
      
      for (const dateStr of sortedDates) {
        const completedDate = new Date(dateStr);
        completedDate.setHours(0, 0, 0, 0);
        
        if (completedDate.getTime() === expectedDate.getTime()) {
          streak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (completedDate < expectedDate) {
          // Se a data completada é anterior à esperada, não quebra o streak
          // mas também não incrementa
          break;
        }
      }
      break;
    }
    
    case 'weekly': {
      // Streak semanal: semanas consecutivas
      let currentWeek = new Date(today);
      currentWeek.setDate(today.getDate() - today.getDay()); // Domingo da semana
      currentWeek.setHours(0, 0, 0, 0);
      
      for (const dateStr of sortedDates) {
        const completedDate = new Date(dateStr);
        completedDate.setHours(0, 0, 0, 0);
        
        const completedWeek = new Date(completedDate);
        completedWeek.setDate(completedDate.getDate() - completedDate.getDay());
        completedWeek.setHours(0, 0, 0, 0);
        
        if (completedWeek.getTime() === currentWeek.getTime()) {
          streak++;
          currentWeek.setDate(currentWeek.getDate() - 7);
        } else if (completedWeek < currentWeek) {
          break;
        }
      }
      break;
    }
    
    case 'monthly': {
      // Streak mensal: meses consecutivos
      let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      currentMonth.setHours(0, 0, 0, 0);
      
      for (const dateStr of sortedDates) {
        const completedDate = new Date(dateStr);
        completedDate.setHours(0, 0, 0, 0);
        
        const completedMonth = new Date(completedDate.getFullYear(), completedDate.getMonth(), 1);
        completedMonth.setHours(0, 0, 0, 0);
        
        if (completedMonth.getTime() === currentMonth.getTime()) {
          streak++;
          currentMonth.setMonth(currentMonth.getMonth() - 1);
        } else if (completedMonth < currentMonth) {
          break;
        }
      }
      break;
    }
  }
  
  return streak;
}

// Gera os últimos 7 dias para visualização
export function getLast7Days(): Array<{ date: string; dayName: string; isToday: boolean }> {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayName = days[date.getDay()];
    const isToday = date.getTime() === today.getTime();
    
    return { date: dateStr, dayName, isToday };
  });
}

// Verifica se um hábito foi completado em uma data específica
export function isCompletedOnDate(habit: Habit, date: string): boolean {
  return habit.completedDates?.includes(date) || false;
}


