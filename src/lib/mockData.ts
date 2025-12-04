import { DailyCheckIn, Habit, FinancialEntry, Goal, UserStats, WeeklyReport } from '@/types';

export const mockUserStats: UserStats = {
  level: 7,
  xp: 2450,
  xpToNextLevel: 3000,
  totalHabitsCompleted: 156,
  currentStreak: 12,
  longestStreak: 28,
  badges: [
    { id: '1', name: '7 Dias Consistente', icon: '🔥', description: 'Completou hábitos por 7 dias seguidos', earnedDate: '2024-01-15' },
    { id: '2', name: 'Madrugador', icon: '🌅', description: 'Acordou cedo 10 vezes', earnedDate: '2024-01-20' },
    { id: '3', name: 'Hidratado', icon: '💧', description: 'Bebeu 2L de água por 7 dias', earnedDate: '2024-01-22' },
    { id: '4', name: 'Atleta', icon: '💪', description: 'Treinou 20 vezes', earnedDate: '2024-01-25' },
  ],
};

export const mockHabits: Habit[] = [
  { id: '1', name: 'Meditar', icon: '🧘', frequency: 'daily', streak: 12, completedDates: [], xp: 120, category: 'Bem-estar' },
  { id: '2', name: 'Exercício', icon: '🏃', frequency: 'daily', streak: 8, completedDates: [], xp: 200, category: 'Saúde' },
  { id: '3', name: 'Leitura', icon: '📚', frequency: 'daily', streak: 15, completedDates: [], xp: 150, category: 'Desenvolvimento' },
  { id: '4', name: 'Beber água', icon: '💧', frequency: 'daily', streak: 20, completedDates: [], xp: 100, category: 'Saúde' },
  { id: '5', name: 'Journaling', icon: '📝', frequency: 'daily', streak: 5, completedDates: [], xp: 80, category: 'Bem-estar' },
  { id: '6', name: 'Dormir 8h', icon: '😴', frequency: 'daily', streak: 3, completedDates: [], xp: 90, category: 'Saúde' },
];

export const mockTodayCheckIn: DailyCheckIn = {
  id: '1',
  date: new Date().toISOString().split('T')[0],
  mood: 4,
  moodEmoji: '😊',
  energy: 7,
  productivity: 8,
  expenses: 45.50,
  workout: true,
  waterGlasses: 6,
  sleepHours: 7.5,
  reflection: 'Dia produtivo! Consegui focar bem nas tarefas importantes.',
  moodReason: 'Trabalho',
};

export const mockWeeklyData = {
  mood: [3, 4, 4, 5, 4, 3, 4],
  energy: [6, 7, 8, 7, 6, 8, 7],
  productivity: [7, 8, 9, 8, 7, 6, 8],
  expenses: [50, 30, 120, 45, 80, 200, 35],
  days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
};

export const mockFinancialEntries: FinancialEntry[] = [
  { id: '1', date: '2024-01-28', amount: 5000, type: 'income', category: 'Salário', description: 'Salário mensal' },
  { id: '2', date: '2024-01-28', amount: 1200, type: 'expense', category: 'Moradia', description: 'Aluguel' },
  { id: '3', date: '2024-01-27', amount: 150, type: 'expense', category: 'Alimentação', description: 'Supermercado' },
  { id: '4', date: '2024-01-26', amount: 80, type: 'expense', category: 'Transporte', description: 'Uber' },
  { id: '5', date: '2024-01-25', amount: 200, type: 'expense', category: 'Lazer', description: 'Jantar fora' },
  { id: '6', date: '2024-01-24', amount: 500, type: 'income', category: 'Freelance', description: 'Projeto extra' },
];

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Aprender inglês fluente',
    description: 'Alcançar nível C1 em inglês',
    progress: 65,
    deadline: '2024-06-01',
    category: 'Desenvolvimento',
    subtasks: [
      { id: '1', title: 'Fazer curso online', completed: true },
      { id: '2', title: 'Praticar conversação 3x/semana', completed: true },
      { id: '3', title: 'Assistir séries em inglês', completed: false },
      { id: '4', title: 'Fazer simulado do TOEFL', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Economizar R$10.000',
    description: 'Reserva de emergência',
    progress: 45,
    deadline: '2024-12-31',
    category: 'Financeiro',
    subtasks: [
      { id: '1', title: 'Cortar gastos desnecessários', completed: true },
      { id: '2', title: 'Investir 20% do salário', completed: true },
      { id: '3', title: 'Criar orçamento mensal', completed: true },
      { id: '4', title: 'Buscar renda extra', completed: false },
    ],
  },
];

export const mockWeeklyReport: WeeklyReport = {
  weekStart: '2024-01-22',
  weekEnd: '2024-01-28',
  averageMood: 4.1,
  averageEnergy: 7.0,
  averageProductivity: 7.6,
  totalExpenses: 560,
  totalIncome: 5500,
  habitsCompleted: 38,
  workoutsCompleted: 5,
  insights: [
    'Seu humor melhorou 15% quando você treinou',
    'Produtividade 20% maior nos dias com 7h+ de sono',
    'Gastos 30% menores que a semana passada',
    'Sequência de meditação: 12 dias! Continue assim!',
  ],
};

export const moodEmojis = ['😢', '😕', '😐', '🙂', '😊', '😄'];

export const expenseCategories = [
  { name: 'Alimentação', icon: '🍔', color: 'hsl(15, 85%, 55%)' },
  { name: 'Transporte', icon: '🚗', color: 'hsl(200, 70%, 50%)' },
  { name: 'Moradia', icon: '🏠', color: 'hsl(150, 60%, 45%)' },
  { name: 'Lazer', icon: '🎮', color: 'hsl(280, 70%, 55%)' },
  { name: 'Saúde', icon: '💊', color: 'hsl(340, 70%, 55%)' },
  { name: 'Educação', icon: '📚', color: 'hsl(45, 90%, 50%)' },
];
