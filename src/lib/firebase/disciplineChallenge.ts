import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface DisciplineChallenge {
  id: string;
  userId: string;
  habitId: string;
  habitName: string;
  duration: 7 | 14 | 21; // dias
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'failed';
  completedDays: string[]; // datas completadas
  difficultyMap: { [date: string]: number }; // dificuldade de 1-10 por dia
  rewards: Reward[];
  tips: Tip[];
  notificationsBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reward {
  id: string;
  day: number;
  title: string;
  description: string;
  xp: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface Tip {
  id: string;
  day: number;
  title: string;
  content: string;
  shown: boolean;
}

const COLLECTION = 'disciplineChallenges';

export const disciplineChallengeService = {
  /**
   * Cria um novo desafio de disciplina
   */
  async create(challenge: Omit<DisciplineChallenge, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...challenge,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Busca todos os desafios do usuário
   */
  async getAll(userId: string): Promise<DisciplineChallenge[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as DisciplineChallenge;
    });
  },

  /**
   * Busca desafio ativo para um hábito específico
   */
  async getActiveForHabit(userId: string, habitId: string): Promise<DisciplineChallenge | null> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('habitId', '==', habitId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const data = querySnapshot.docs[0].data();
    return {
      id: querySnapshot.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as DisciplineChallenge;
  },

  /**
   * Atualiza um desafio
   */
  async update(challengeId: string, updates: Partial<DisciplineChallenge>): Promise<void> {
    const challengeRef = doc(db, COLLECTION, challengeId);
    await updateDoc(challengeRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Marca um dia como completo
   */
  async markDayComplete(challengeId: string, date: string): Promise<void> {
    const challengeRef = doc(db, COLLECTION, challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const challenge = challengeSnap.data() as DisciplineChallenge;
      const completedDays = challenge.completedDays || [];
      
      if (!completedDays.includes(date)) {
        const newCompletedDays = [...completedDays, date];
        
        // Verifica se completou todos os dias
        const allDays = getAllDaysInChallenge(challenge.startDate, challenge.endDate);
        const isCompleted = allDays.every(day => newCompletedDays.includes(day));
        
        await updateDoc(challengeRef, {
          completedDays: newCompletedDays,
          status: isCompleted ? 'completed' : 'active',
          updatedAt: Timestamp.now(),
        });
      }
    }
  },

  /**
   * Atualiza dificuldade de um dia
   */
  async updateDifficulty(challengeId: string, date: string, difficulty: number): Promise<void> {
    const challengeRef = doc(db, COLLECTION, challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const challenge = challengeSnap.data() as DisciplineChallenge;
      const difficultyMap = challenge.difficultyMap || {};
      
      await updateDoc(challengeRef, {
        difficultyMap: {
          ...difficultyMap,
          [date]: difficulty,
        },
        updatedAt: Timestamp.now(),
      });
    }
  },

  /**
   * Desbloqueia uma recompensa
   */
  async unlockReward(challengeId: string, rewardId: string): Promise<void> {
    const challengeRef = doc(db, COLLECTION, challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const challenge = challengeSnap.data() as DisciplineChallenge;
      const rewards = challenge.rewards || [];
      
      const updatedRewards = rewards.map(reward => 
        reward.id === rewardId 
          ? { ...reward, unlocked: true, unlockedAt: new Date() }
          : reward
      );
      
      await updateDoc(challengeRef, {
        rewards: updatedRewards,
        updatedAt: Timestamp.now(),
      });
    }
  },

  /**
   * Marca uma dica como mostrada
   */
  async markTipShown(challengeId: string, tipId: string): Promise<void> {
    const challengeRef = doc(db, COLLECTION, challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const challenge = challengeSnap.data() as DisciplineChallenge;
      const tips = challenge.tips || [];
      
      const updatedTips = tips.map(tip => 
        tip.id === tipId ? { ...tip, shown: true } : tip
      );
      
      await updateDoc(challengeRef, {
        tips: updatedTips,
        updatedAt: Timestamp.now(),
      });
    }
  },

  /**
   * Estende um desafio adicionando mais dias
   */
  async extendChallenge(challengeId: string, additionalDays: number): Promise<void> {
    const challengeRef = doc(db, COLLECTION, challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const challenge = challengeSnap.data() as DisciplineChallenge;
      const currentEndDate = new Date(challenge.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + additionalDays);
      const newEndDateStr = newEndDate.toISOString().split('T')[0];
      
      const newDuration = challenge.duration + additionalDays;
      
      // Gera novas recompensas e dicas para os dias adicionais
      // Se a duração for maior que 21, usa 21 como base e adiciona recompensas extras
      const baseDuration = newDuration <= 21 ? (newDuration as 7 | 14 | 21) : 21;
      const newRewards = generateRewards(baseDuration);
      const newTips = generateTips(baseDuration);
      
      // Se a duração for maior que 21, adiciona recompensas extras
      if (newDuration > 21) {
        const extraRewards: Reward[] = [];
        for (let day = 28; day <= newDuration; day += 7) {
          extraRewards.push({
            id: `r-extra-${day}`,
            day: day,
            title: `🎯 ${day} Dias de Disciplina`,
            description: `Incrível! Você completou ${day} dias!`,
            xp: 100 * Math.floor(day / 7),
            unlocked: false,
          });
        }
        newRewards.push(...extraRewards);
      }
      
      // Mantém recompensas já desbloqueadas
      const existingRewards = challenge.rewards || [];
      const updatedRewards = newRewards.map(newReward => {
        const existing = existingRewards.find(r => r.day === newReward.day);
        return existing || newReward;
      });
      
      // Mantém dicas já mostradas
      const existingTips = challenge.tips || [];
      const updatedTips = newTips.map(newTip => {
        const existing = existingTips.find(t => t.day === newTip.day);
        return existing || newTip;
      });
      
      await updateDoc(challengeRef, {
        duration: newDuration,
        endDate: newEndDateStr,
        rewards: updatedRewards,
        tips: updatedTips,
        updatedAt: Timestamp.now(),
      });
    }
  },

  /**
   * Deleta um desafio
   */
  async delete(challengeId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, challengeId));
  },
};

/**
 * Gera todas as datas de um desafio
 */
function getAllDaysInChallenge(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: string[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split('T')[0]);
  }
  
  return days;
}

/**
 * Gera recompensas baseadas na duração
 */
export function generateRewards(duration: 7 | 14 | 21): Reward[] {
  const rewards: Reward[] = [];
  
  if (duration === 7) {
    rewards.push(
      { id: 'r1', day: 3, title: '🔥 Primeira Semana', description: 'Você completou 3 dias!', xp: 50, unlocked: false },
      { id: 'r2', day: 7, title: '🏆 Semana Completa', description: 'Parabéns! Você completou 7 dias!', xp: 150, unlocked: false },
    );
  } else if (duration === 14) {
    rewards.push(
      { id: 'r1', day: 3, title: '🔥 Primeiros Passos', description: 'Você completou 3 dias!', xp: 50, unlocked: false },
      { id: 'r2', day: 7, title: '⭐ Uma Semana', description: 'Parabéns! Você completou 7 dias!', xp: 100, unlocked: false },
      { id: 'r3', day: 14, title: '🏆 Duas Semanas', description: 'Incrível! Você completou 14 dias!', xp: 300, unlocked: false },
    );
  } else if (duration === 21) {
    rewards.push(
      { id: 'r1', day: 3, title: '🔥 Primeiros Passos', description: 'Você completou 3 dias!', xp: 50, unlocked: false },
      { id: 'r2', day: 7, title: '⭐ Uma Semana', description: 'Parabéns! Você completou 7 dias!', xp: 100, unlocked: false },
      { id: 'r3', day: 14, title: '💪 Duas Semanas', description: 'Excelente! Você completou 14 dias!', xp: 200, unlocked: false },
      { id: 'r4', day: 21, title: '🏆 Desafio Completo', description: 'Lendário! Você completou 21 dias!', xp: 500, unlocked: false },
    );
  }
  
  return rewards;
}

/**
 * Gera dicas baseadas na duração
 */
export function generateTips(duration: 7 | 14 | 21): Tip[] {
  const allTips = [
    { day: 1, title: 'Comece com pequenos passos', content: 'No primeiro dia, foque em completar o hábito de forma simples. Não precisa ser perfeito!' },
    { day: 2, title: 'Crie um lembrete', content: 'Configure um alarme ou coloque um post-it em um lugar visível para não esquecer.' },
    { day: 3, title: 'Celebre pequenas vitórias', content: 'Você já completou 3 dias! Cada dia conta e você está construindo um hábito sólido.' },
    { day: 4, title: 'Foque no processo, não no resultado', content: 'O importante é fazer, não ser perfeito. Continue mesmo quando for difícil.' },
    { day: 5, title: 'Encontre seu horário ideal', content: 'Identifique o melhor momento do dia para fazer seu hábito e mantenha essa rotina.' },
    { day: 6, title: 'Prepare-se para os obstáculos', content: 'Antecipe possíveis dificuldades e tenha um plano B para não quebrar a sequência.' },
    { day: 7, title: 'Uma semana completa!', content: 'Parabéns! Você completou uma semana inteira. Isso já é um grande progresso!' },
    { day: 10, title: 'Mantenha a consistência', content: 'Você está no meio do caminho. Continue firme, você consegue!' },
    { day: 14, title: 'Duas semanas de disciplina', content: 'Incrível! Você está construindo um hábito real. Continue assim!' },
    { day: 18, title: 'Quase lá!', content: 'Faltam poucos dias! Você está quase completando o desafio. Não desista agora!' },
    { day: 21, title: 'Desafio completo!', content: 'Parabéns! Você completou 21 dias de disciplina. Isso é uma conquista incrível!' },
  ];
  
  return allTips
    .filter(tip => tip.day <= duration)
    .map((tip, index) => ({
      id: `tip-${tip.day}`,
      day: tip.day,
      title: tip.title,
      content: tip.content,
      shown: false,
    }));
}

