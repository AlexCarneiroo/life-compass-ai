export interface DailyCheckIn {
  id: string;
  date: string;
  mood: number;
  moodEmoji: string;
  energy: number;
  productivity: number;
  expenses: number;
  workout: boolean;
  waterGlasses?: number; // Mantido para compatibilidade
  waterLiters?: number; // Novo campo em litros
  sleepHours: number;
  reflection: string;
  moodReason?: string;
}

export type HabitDifficulty = 'very-easy' | 'easy' | 'normal' | 'hard' | 'very-hard' | 'extreme';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  completedDates: string[];
  xp: number; // Mantido para compatibilidade, mas será calculado automaticamente
  difficulty: HabitDifficulty; // Nova propriedade
  category: string;
  color?: string; // Cor personalizada do hábito (hex)
  reminderTime?: string; // Horário do lembrete (HH:mm)
  reminderEnabled?: boolean; // Se lembrete está ativo
  description?: string; // Descrição opcional do hábito
}

export interface FinancialEntry {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  deadline?: string;
  subtasks: SubTask[];
  category: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface HealthEntry {
  id: string;
  date: string;
  weight?: number;
  height?: number; // altura em metros
  bmi?: number; // IMC calculado e armazenado
  waterIntake: number;
  sleepHours: number;
  steps?: number;
  workout?: WorkoutEntry;
}

export interface WorkoutEntry {
  type: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalHabitsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  checkInsCompleted?: number;
  workoutsCompleted?: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  averageMood: number;
  averageEnergy: number;
  averageProductivity: number;
  totalExpenses: number;
  totalIncome: number;
  habitsCompleted: number;
  workoutsCompleted: number;
  insights: string[];
}
