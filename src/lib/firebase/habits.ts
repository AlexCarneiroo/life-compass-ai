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
import { Habit } from '@/types';

const COLLECTION = 'habits';

export const habitsService = {
  // Criar hábito
  async create(habit: Omit<Habit, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...habit,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Buscar todos os hábitos do usuário
  async getAll(userId: string): Promise<Habit[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    // Importa função de dificuldade
    const { getXPByDifficulty, getDefaultDifficulty } = await import('../utils/habitDifficulty');
    
    return Promise.all(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      // Compatibilidade: se não tiver difficulty, define como 'normal' e recalcula XP se necessário
      let difficulty = data.difficulty || 'normal';
      let xp = data.xp || 50;
      let needsUpdate = false;
      
      // Se não tiver difficulty mas tiver XP, tenta inferir a dificuldade
      if (!data.difficulty && data.xp) {
        if (data.xp <= 10) difficulty = 'very-easy';
        else if (data.xp <= 25) difficulty = 'easy';
        else if (data.xp <= 50) difficulty = 'normal';
        else if (data.xp <= 100) difficulty = 'hard';
        else if (data.xp <= 200) difficulty = 'very-hard';
        else difficulty = 'extreme';
        needsUpdate = true;
      } else if (!data.difficulty) {
        difficulty = getDefaultDifficulty();
        xp = getXPByDifficulty(difficulty);
        needsUpdate = true;
      } else if (data.difficulty && !data.xp) {
        // Se tem difficulty mas não tem XP, recalcula
        xp = getXPByDifficulty(data.difficulty as any);
        needsUpdate = true;
      }
      
      // Atualiza no Firebase se necessário (em background, não bloqueia)
      if (needsUpdate) {
        const habitRef = doc.ref;
        updateDoc(habitRef, {
          difficulty,
          xp,
          updatedAt: Timestamp.now(),
        }).catch(err => {
          console.error('Erro ao atualizar hábito com dificuldade:', err);
        });
      }
      
      // Normaliza as datas completadas para garantir formato YYYY-MM-DD
      const normalizedCompletedDates = (data.completedDates || []).map((d: string) => d.split('T')[0]);
      
      return {
        id: doc.id,
        ...data,
        completedDates: normalizedCompletedDates,
        difficulty,
        xp,
      } as Habit;
    }));
  },

  // Atualizar hábito
  async update(habitId: string, updates: Partial<Habit>): Promise<void> {
    const habitRef = doc(db, COLLECTION, habitId);
    await updateDoc(habitRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Deletar hábito
  async delete(habitId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, habitId));
  },

  // Marcar hábito como completo
  async markComplete(habitId: string, date: string): Promise<void> {
    const habitRef = doc(db, COLLECTION, habitId);
    
    try {
      // Normaliza a data para formato YYYY-MM-DD (remove hora se houver)
      const normalizedDate = date.split('T')[0];
      
      // Busca o documento diretamente pelo ID
      const habitSnap = await getDoc(habitRef);
      
      if (habitSnap.exists()) {
        const habitData = habitSnap.data() as Habit;
        const completedDates = habitData.completedDates || [];
        // Normaliza as datas existentes também
        const normalizedCompletedDates = completedDates.map(d => d.split('T')[0]);
        
        if (!normalizedCompletedDates.includes(normalizedDate)) {
          // Importa função de cálculo de streak
          const { calculateStreak } = await import('../utils/habits');
          
          const newCompletedDates = [...normalizedCompletedDates, normalizedDate];
          const newStreak = calculateStreak({
            ...habitData,
            completedDates: newCompletedDates,
          });
          
          await updateDoc(habitRef, {
            completedDates: newCompletedDates,
            streak: newStreak,
            updatedAt: Timestamp.now(),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao marcar hábito como completo:', error);
      throw error;
    }
  },

  // Desmarcar hábito (remover data)
  async unmarkComplete(habitId: string, date: string): Promise<void> {
    const habitRef = doc(db, COLLECTION, habitId);
    
    try {
      // Normaliza a data para formato YYYY-MM-DD (remove hora se houver)
      const normalizedDate = date.split('T')[0];
      
      const habitSnap = await getDoc(habitRef);
      
      if (habitSnap.exists()) {
        const habitData = habitSnap.data() as Habit;
        const completedDates = habitData.completedDates || [];
        // Normaliza as datas existentes também
        const normalizedCompletedDates = completedDates.map(d => d.split('T')[0]);
        const newCompletedDates = normalizedCompletedDates.filter(d => d !== normalizedDate);
        
        // Importa função de cálculo de streak
        const { calculateStreak } = await import('../utils/habits');
        
        const newStreak = calculateStreak({
          ...habitData,
          completedDates: newCompletedDates,
        });
        
        await updateDoc(habitRef, {
          completedDates: newCompletedDates,
          streak: newStreak,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Erro ao desmarcar hábito:', error);
      throw error;
    }
  },
};

