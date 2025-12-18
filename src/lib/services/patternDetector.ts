import { DailyCheckIn, Habit, FinancialEntry } from '@/types';
import { checkinService } from '@/lib/firebase/checkin';
import { habitsService } from '@/lib/firebase/habits';
import { financeService } from '@/lib/firebase/finance';

export interface DetectedPattern {
  id: string;
  type: 'negative' | 'positive';
  category: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  data?: any;
}

export class PatternDetector {
  /**
   * Detecta padrões negativos e positivos nos dados do usuário
   */
  static async detectPatterns(userId: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    try {
      // Busca dados dos últimos 14 dias
      const [checkIns, habits, finances] = await Promise.all([
        checkinService.getAll(userId),
        habitsService.getAll(userId),
        financeService.getAll(userId),
      ]);

      // Filtra dados dos últimos 14 dias
      const today = new Date();
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 14);
      const dateStr = (date: Date) => date.toISOString().split('T')[0];

      const recentCheckIns = checkIns.filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= fourteenDaysAgo && checkInDate <= today;
      }).sort((a, b) => a.date.localeCompare(b.date));

      const recentFinances = finances.filter(f => {
        const financeDate = new Date(f.date);
        return financeDate >= fourteenDaysAgo && financeDate <= today;
      });

      // Detecta padrões negativos
      patterns.push(...this.detectNegativePatterns(recentCheckIns, habits, recentFinances));

      // Detecta padrões positivos
      patterns.push(...this.detectPositivePatterns(recentCheckIns, habits, recentFinances));

      return patterns;
    } catch (error) {
      console.error('Erro ao detectar padrões:', error);
      return [];
    }
  }

  /**
   * Detecta padrões negativos
   */
  private static detectNegativePatterns(
    checkIns: DailyCheckIn[],
    habits: Habit[],
    finances: FinancialEntry[]
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1. Humor baixo consecutivo (3+ dias com humor <= 2)
    const lowMoodDays = checkIns
      .filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= sevenDaysAgo && c.mood && c.mood <= 2;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (lowMoodDays.length >= 3) {
      const consecutive = this.getConsecutiveDays(lowMoodDays.map(c => c.date));
      if (consecutive >= 3) {
        patterns.push({
          id: `negative-low-mood-${Date.now()}`,
          type: 'negative',
          category: 'humor',
          title: '⚠️ Humor Baixo Detectado',
          message: `Você teve ${consecutive} dias consecutivos com humor baixo. Considere fazer atividades que te fazem bem!`,
          severity: consecutive >= 5 ? 'high' : consecutive >= 3 ? 'medium' : 'low',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive },
        });
      }
    }

    // 2. Energia baixa consecutiva (3+ dias com energia <= 2)
    const lowEnergyDays = checkIns
      .filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= sevenDaysAgo && c.energy && c.energy <= 2;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (lowEnergyDays.length >= 3) {
      const consecutive = this.getConsecutiveDays(lowEnergyDays.map(c => c.date));
      if (consecutive >= 3) {
        patterns.push({
          id: `negative-low-energy-${Date.now()}`,
          type: 'negative',
          category: 'energia',
          title: '🔋 Energia Baixa Detectada',
          message: `Você teve ${consecutive} dias consecutivos com energia baixa. Talvez precise de mais descanso ou ajustar sua rotina.`,
          severity: consecutive >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive },
        });
      }
    }

    // 3. Hábitos não completados (3+ dias sem completar nenhum hábito)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const daysWithoutHabits = last7Days.filter(date => {
      return !habits.some(habit => habit.completedDates?.includes(date));
    });

    if (daysWithoutHabits.length >= 3) {
      patterns.push({
        id: `negative-no-habits-${Date.now()}`,
        type: 'negative',
        category: 'habitos',
        title: '📉 Hábitos Negligenciados',
        message: `Você não completou nenhum hábito em ${daysWithoutHabits.length} dos últimos 7 dias. Que tal retomar seus hábitos?`,
        severity: daysWithoutHabits.length >= 5 ? 'high' : 'medium',
        detectedAt: new Date(),
        data: { daysWithoutHabits: daysWithoutHabits.length },
      });
    }

    // 4. Gastos excessivos (gastos acima da média em 3+ dias consecutivos)
    const expenses = finances.filter(f => f.type === 'expense');
    if (expenses.length >= 3) {
      const avgExpense = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;
      const highExpenseDays = expenses
        .filter(e => e.amount > avgExpense * 1.5)
        .map(e => e.date)
        .sort();

      const consecutive = this.getConsecutiveDays(highExpenseDays);
      if (consecutive >= 3) {
        patterns.push({
          id: `negative-high-expenses-${Date.now()}`,
          type: 'negative',
          category: 'financas',
          title: '💰 Gastos Elevados',
          message: `Você teve ${consecutive} dias consecutivos com gastos acima da média. Considere revisar seus gastos.`,
          severity: consecutive >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive, avgExpense },
        });
      }
    }

    // 5. Falta de check-ins (3+ dias sem check-in)
    const daysWithoutCheckIn = last7Days.filter(date => {
      return !checkIns.some(c => c.date === date);
    });

    if (daysWithoutCheckIn.length >= 3) {
      patterns.push({
        id: `negative-no-checkin-${Date.now()}`,
        type: 'negative',
        category: 'checkin',
        title: '📝 Check-ins em Falta',
        message: `Você não fez check-in em ${daysWithoutCheckIn.length} dos últimos 7 dias. Manter o registro ajuda a acompanhar seu progresso!`,
        severity: daysWithoutCheckIn.length >= 5 ? 'high' : 'medium',
        detectedAt: new Date(),
        data: { daysWithoutCheckIn: daysWithoutCheckIn.length },
      });
    }

    // 6. Sono insuficiente (3+ dias com menos de 6h de sono)
    const lowSleepDays = checkIns
      .filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= sevenDaysAgo && c.sleepHours && c.sleepHours < 6;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (lowSleepDays.length >= 3) {
      const consecutive = this.getConsecutiveDays(lowSleepDays.map(c => c.date));
      if (consecutive >= 3) {
        patterns.push({
          id: `negative-low-sleep-${Date.now()}`,
          type: 'negative',
          category: 'sono',
          title: '😴 Sono Insuficiente',
          message: `Você teve ${consecutive} dias consecutivos com menos de 6h de sono. O descanso adequado é essencial!`,
          severity: consecutive >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive },
        });
      }
    }

    return patterns;
  }

  /**
   * Detecta padrões positivos
   */
  private static detectPositivePatterns(
    checkIns: DailyCheckIn[],
    habits: Habit[],
    finances: FinancialEntry[]
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1. Humor alto consecutivo (3+ dias com humor >= 5)
    const highMoodDays = checkIns
      .filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= sevenDaysAgo && c.mood && c.mood >= 5;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (highMoodDays.length >= 3) {
      const consecutive = this.getConsecutiveDays(highMoodDays.map(c => c.date));
      if (consecutive >= 3) {
        patterns.push({
          id: `positive-high-mood-${Date.now()}`,
          type: 'positive',
          category: 'humor',
          title: '😊 Humor Excelente!',
          message: `Parabéns! Você teve ${consecutive} dias consecutivos com humor alto. Continue assim!`,
          severity: consecutive >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive },
        });
      }
    }

    // 2. Energia alta consecutiva (3+ dias com energia >= 5)
    const highEnergyDays = checkIns
      .filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= sevenDaysAgo && c.energy && c.energy >= 5;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (highEnergyDays.length >= 3) {
      const consecutive = this.getConsecutiveDays(highEnergyDays.map(c => c.date));
      if (consecutive >= 3) {
        patterns.push({
          id: `positive-high-energy-${Date.now()}`,
          type: 'positive',
          category: 'energia',
          title: '⚡ Energia em Alta!',
          message: `Incrível! Você teve ${consecutive} dias consecutivos com energia alta. Mantenha o ritmo!`,
          severity: consecutive >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive },
        });
      }
    }

    // 3. Hábitos completados consistentemente (5+ dias completando hábitos)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const daysWithHabits = last7Days.filter(date => {
      return habits.some(habit => habit.completedDates?.includes(date));
    });

    if (daysWithHabits.length >= 5) {
      patterns.push({
        id: `positive-consistent-habits-${Date.now()}`,
        type: 'positive',
        category: 'habitos',
        title: '🎯 Hábitos Consistentes!',
        message: `Excelente! Você completou hábitos em ${daysWithHabits.length} dos últimos 7 dias. Continue construindo sua rotina!`,
        severity: daysWithHabits.length >= 6 ? 'high' : 'medium',
        detectedAt: new Date(),
        data: { daysWithHabits: daysWithHabits.length },
      });
    }

    // 4. Check-ins consistentes (5+ dias fazendo check-in)
    const daysWithCheckIn = last7Days.filter(date => {
      return checkIns.some(c => c.date === date);
    });

    if (daysWithCheckIn.length >= 5) {
      patterns.push({
        id: `positive-consistent-checkin-${Date.now()}`,
        type: 'positive',
        category: 'checkin',
        title: '📊 Registro Consistente!',
        message: `Ótimo trabalho! Você fez check-in em ${daysWithCheckIn.length} dos últimos 7 dias. Isso ajuda muito no acompanhamento!`,
        severity: daysWithCheckIn.length >= 6 ? 'high' : 'medium',
        detectedAt: new Date(),
        data: { daysWithCheckIn: daysWithCheckIn.length },
      });
    }

    // 5. Economia consistente (receitas > despesas em 3+ dias)
    const incomes = finances.filter(f => f.type === 'income');
    const expenses = finances.filter(f => f.type === 'expense');
    
    if (incomes.length > 0 && expenses.length > 0) {
      const profitableDays = last7Days.filter(date => {
        const dayIncome = incomes
          .filter(i => i.date === date)
          .reduce((sum, i) => sum + i.amount, 0);
        const dayExpense = expenses
          .filter(e => e.date === date)
          .reduce((sum, e) => sum + e.amount, 0);
        return dayIncome > dayExpense;
      });

      if (profitableDays.length >= 3) {
        patterns.push({
          id: `positive-savings-${Date.now()}`,
          type: 'positive',
          category: 'financas',
          title: '💰 Economia em Andamento!',
          message: `Parabéns! Você teve receitas maiores que despesas em ${profitableDays.length} dos últimos 7 dias. Continue assim!`,
          severity: profitableDays.length >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { profitableDays: profitableDays.length },
        });
      }
    }

    // 6. Sono adequado (3+ dias com 7h+ de sono)
    const goodSleepDays = checkIns
      .filter(c => {
        const checkInDate = new Date(c.date);
        return checkInDate >= sevenDaysAgo && c.sleepHours && c.sleepHours >= 7;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (goodSleepDays.length >= 3) {
      const consecutive = this.getConsecutiveDays(goodSleepDays.map(c => c.date));
      if (consecutive >= 3) {
        patterns.push({
          id: `positive-good-sleep-${Date.now()}`,
          type: 'positive',
          category: 'sono',
          title: '😴 Sono de Qualidade!',
          message: `Excelente! Você teve ${consecutive} dias consecutivos com sono adequado (7h+). Isso faz toda a diferença!`,
          severity: consecutive >= 5 ? 'high' : 'medium',
          detectedAt: new Date(),
          data: { consecutiveDays: consecutive },
        });
      }
    }

    return patterns;
  }

  /**
   * Calcula o número máximo de dias consecutivos em uma lista de datas
   */
  private static getConsecutiveDays(dates: string[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = [...dates].sort();
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }
}






