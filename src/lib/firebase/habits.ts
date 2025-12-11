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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedDates: doc.data().completedDates || [],
    })) as Habit[];
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
      // Busca o documento diretamente pelo ID
      const habitSnap = await getDoc(habitRef);
      
      if (habitSnap.exists()) {
        const habitData = habitSnap.data() as Habit;
        const completedDates = habitData.completedDates || [];
        if (!completedDates.includes(date)) {
          // Importa função de cálculo de streak
          const { calculateStreak } = await import('../utils/habits');
          
          const newCompletedDates = [...completedDates, date];
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
      const habitSnap = await getDoc(habitRef);
      
      if (habitSnap.exists()) {
        const habitData = habitSnap.data() as Habit;
        const completedDates = habitData.completedDates || [];
        const newCompletedDates = completedDates.filter(d => d !== date);
        
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

