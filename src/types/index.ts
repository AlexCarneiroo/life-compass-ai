export interface DailyCheckIn {
  id: string;
  date: string;
  mood: number;
  moodEmoji: string;
  energy: number;
  productivity: number;
  expenses: number;
  workout: boolean;
  waterGlasses: number;
  sleepHours: number;
  reflection: string;
  moodReason?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  completedDates: string[];
  xp: number;
  category: string;
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
  waterIntake: number;
  sleepHours: number;
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
