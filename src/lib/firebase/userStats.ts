import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserStats, Badge } from '@/types';

const COLLECTION = 'userStats';

// Calcula o nível baseado no XP
export function calculateLevel(xp: number): { level: number; xpToNextLevel: number; currentLevelXP: number } {
  // Fórmula: nível = floor(sqrt(xp / 100)) + 1
  // XP necessário para cada nível aumenta exponencialmente
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const xpToNextLevel = nextLevelXP - xp;
  
  return { level, xpToNextLevel, currentLevelXP };
}

// Verifica e concede badges baseado nas ações do usuário
export async function checkAndGrantBadges(userId: string, stats: {
  habitsCompleted: number;
  currentStreak: number;
  workoutsCompleted: number;
  checkInsCompleted: number;
}): Promise<Badge[]> {
  const newBadges: Badge[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Badge: 7 Dias Consistente
  if (stats.currentStreak >= 7) {
    newBadges.push({
      id: 'streak-7',
      name: '7 Dias Consistente',
      icon: '🔥',
      description: 'Completou hábitos por 7 dias seguidos',
      earnedDate: today,
    });
  }

  // Badge: 30 Dias Consistente
  if (stats.currentStreak >= 30) {
    newBadges.push({
      id: 'streak-30',
      name: '30 Dias Consistente',
      icon: '💎',
      description: 'Completou hábitos por 30 dias seguidos',
      earnedDate: today,
    });
  }

  // Badge: Atleta
  if (stats.workoutsCompleted >= 20) {
    newBadges.push({
      id: 'athlete',
      name: 'Atleta',
      icon: '💪',
      description: 'Treinou 20 vezes',
      earnedDate: today,
    });
  }

  // Badge: Primeiro Passo
  if (stats.habitsCompleted >= 1) {
    newBadges.push({
      id: 'first-step',
      name: 'Primeiro Passo',
      icon: '👣',
      description: 'Completou seu primeiro hábito',
      earnedDate: today,
    });
  }

  // Badge: Mestre dos Hábitos
  if (stats.habitsCompleted >= 100) {
    newBadges.push({
      id: 'habit-master',
      name: 'Mestre dos Hábitos',
      icon: '👑',
      description: 'Completou 100 hábitos',
      earnedDate: today,
    });
  }

  // Badge: 100 Dias Consistente
  if (stats.currentStreak >= 100) {
    newBadges.push({
      id: 'streak-100',
      name: '100 Dias Consistente',
      icon: '🌟',
      description: 'Completou hábitos por 100 dias seguidos',
      earnedDate: today,
    });
  }

  // Badge: Check-in Diário
  if (stats.checkInsCompleted >= 7) {
    newBadges.push({
      id: 'checkin-week',
      name: 'Check-in Semanal',
      icon: '📅',
      description: 'Fez check-in por 7 dias',
      earnedDate: today,
    });
  }

  // Badge: Check-in Mensal
  if (stats.checkInsCompleted >= 30) {
    newBadges.push({
      id: 'checkin-month',
      name: 'Check-in Mensal',
      icon: '📆',
      description: 'Fez check-in por 30 dias',
      earnedDate: today,
    });
  }

  // Badge: Atleta Avançado
  if (stats.workoutsCompleted >= 50) {
    newBadges.push({
      id: 'athlete-advanced',
      name: 'Atleta Avançado',
      icon: '🏆',
      description: 'Treinou 50 vezes',
      earnedDate: today,
    });
  }

  // Badge: Mestre do Check-in
  if (stats.checkInsCompleted >= 100) {
    newBadges.push({
      id: 'checkin-master',
      name: 'Mestre do Check-in',
      icon: '🎯',
      description: 'Fez check-in por 100 dias',
      earnedDate: today,
    });
  }

  // Badge: Primeiro Check-in
  if (stats.checkInsCompleted >= 1) {
    newBadges.push({
      id: 'first-checkin',
      name: 'Primeiro Check-in',
      icon: '✨',
      description: 'Fez seu primeiro check-in',
      earnedDate: today,
    });
  }

  // Badge: 10 Hábitos
  if (stats.habitsCompleted >= 10) {
    newBadges.push({
      id: 'habit-10',
      name: '10 Hábitos',
      icon: '⭐',
      description: 'Completou 10 hábitos',
      earnedDate: today,
    });
  }

  // Badge: 50 Hábitos
  if (stats.habitsCompleted >= 50) {
    newBadges.push({
      id: 'habit-50',
      name: '50 Hábitos',
      icon: '💫',
      description: 'Completou 50 hábitos',
      earnedDate: today,
    });
  }

  // Badge: 3 Dias Consistente
  if (stats.currentStreak >= 3) {
    newBadges.push({
      id: 'streak-3',
      name: '3 Dias Consistente',
      icon: '🌱',
      description: 'Completou hábitos por 3 dias seguidos',
      earnedDate: today,
    });
  }

  return newBadges;
}

export const userStatsService = {
  // Buscar ou criar stats do usuário
  async getOrCreate(userId: string): Promise<UserStats> {
    const statsRef = doc(db, COLLECTION, userId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      return {
        level: data.level || 1,
        xp: data.xp || 0,
        xpToNextLevel: data.xpToNextLevel || 100,
        totalHabitsCompleted: data.totalHabitsCompleted || 0,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        badges: data.badges || [],
        checkInsCompleted: data.checkInsCompleted || 0,
        workoutsCompleted: data.workoutsCompleted || 0,
      } as UserStats;
    } else {
      // Criar stats iniciais
      const initialStats: UserStats = {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        totalHabitsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        checkInsCompleted: 0,
        workoutsCompleted: 0,
      };
      await setDoc(statsRef, {
        ...initialStats,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return initialStats;
    }
  },

  // Adicionar XP
  async addXP(userId: string, xpAmount: number): Promise<UserStats> {
    const statsRef = doc(db, COLLECTION, userId);
    const currentStats = await this.getOrCreate(userId);
    
    const newXP = currentStats.xp + xpAmount;
    const { level, xpToNextLevel } = calculateLevel(newXP);
    
    const updatedStats: UserStats = {
      ...currentStats,
      xp: newXP,
      level,
      xpToNextLevel,
    };

    await updateDoc(statsRef, {
      ...updatedStats,
      updatedAt: Timestamp.now(),
    });

    return updatedStats;
  },

  // Atualizar streak
  async updateStreak(userId: string, newStreak: number): Promise<void> {
    const statsRef = doc(db, COLLECTION, userId);
    const currentStats = await this.getOrCreate(userId);
    
    const longestStreak = Math.max(currentStats.longestStreak, newStreak);
    
    await updateDoc(statsRef, {
      currentStreak: newStreak,
      longestStreak,
      updatedAt: Timestamp.now(),
    });
  },

  // Adicionar badge
  async addBadge(userId: string, badge: Badge): Promise<void> {
    const statsRef = doc(db, COLLECTION, userId);
    const currentStats = await this.getOrCreate(userId);
    
    // Verifica se já tem o badge
    if (!currentStats.badges.find(b => b.id === badge.id)) {
      await updateDoc(statsRef, {
        badges: [...currentStats.badges, badge],
        updatedAt: Timestamp.now(),
      });
    }
  },

  // Atualizar total de hábitos completados
  async incrementHabitsCompleted(userId: string): Promise<void> {
    const statsRef = doc(db, COLLECTION, userId);
    const currentStats = await this.getOrCreate(userId);
    
    await updateDoc(statsRef, {
      totalHabitsCompleted: (currentStats.totalHabitsCompleted || 0) + 1,
      updatedAt: Timestamp.now(),
    });
  },

  // Incrementar check-ins completados
  async incrementCheckInsCompleted(userId: string): Promise<void> {
    const statsRef = doc(db, COLLECTION, userId);
    const currentStats = await this.getOrCreate(userId);
    
    await updateDoc(statsRef, {
      checkInsCompleted: (currentStats.checkInsCompleted || 0) + 1,
      updatedAt: Timestamp.now(),
    });
  },

  // Incrementar treinos completados
  async incrementWorkoutsCompleted(userId: string): Promise<void> {
    const statsRef = doc(db, COLLECTION, userId);
    const currentStats = await this.getOrCreate(userId);
    
    await updateDoc(statsRef, {
      workoutsCompleted: (currentStats.workoutsCompleted || 0) + 1,
      updatedAt: Timestamp.now(),
    });
  },
};


