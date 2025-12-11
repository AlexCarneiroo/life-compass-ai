import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  Timestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { HealthEntry } from '@/types';

const COLLECTION = 'healthEntries';

export interface WorkoutEntry {
  id: string;
  type: string;
  duration: number;
  calories: number;
  date: string;
  intensity?: 'low' | 'medium' | 'high';
}

export interface SelfCareTask {
  id: string;
  task: string;
  completed: boolean;
  icon: string;
  date: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export const healthService = {
  async createHealthEntry(entry: Omit<HealthEntry, 'id'>, userId: string): Promise<string> {
    // Remove campos undefined antes de salvar
    const cleanEntry = Object.fromEntries(
      Object.entries(entry).filter(([_, value]) => value !== undefined)
    ) as Omit<HealthEntry, 'id'>;
    
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...cleanEntry,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAllHealthEntries(userId: string): Promise<HealthEntry[]> {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
    })) as HealthEntry[];
    
    // Ordena por data (mais recente primeiro) no código
    return results.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  },

  async createWorkout(workout: Omit<WorkoutEntry, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'workouts'), {
      ...workout,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAllWorkouts(userId: string): Promise<WorkoutEntry[]> {
    const q = query(
      collection(db, 'workouts'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
    })) as WorkoutEntry[];
    
    // Ordena por data (mais recente primeiro) no código
    return results.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  },

  async updateWorkout(workoutId: string, updates: Partial<WorkoutEntry>): Promise<void> {
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, updates);
  },

  async deleteWorkout(workoutId: string): Promise<void> {
    await deleteDoc(doc(db, 'workouts', workoutId));
  },

  // Self-Care Tasks
  async createSelfCareTask(task: Omit<SelfCareTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'selfCareTasks'), {
      ...task,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAllSelfCareTasks(userId: string, date?: string): Promise<SelfCareTask[]> {
    let q;
    if (date) {
      // Quando há filtro por data, não precisa de orderBy (já filtra por userId e date)
      q = query(
        collection(db, 'selfCareTasks'),
        where('userId', '==', userId),
        where('date', '==', date)
      );
    } else {
      // Sem filtro de data, apenas filtra por userId
      q = query(
        collection(db, 'selfCareTasks'),
        where('userId', '==', userId)
      );
    }
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        date: data.date as string,
      } as SelfCareTask;
    });
    
    // Ordena por data (mais recente primeiro) e depois por createdAt no código
    return results.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      // Se as datas forem iguais, ordena por createdAt
      const aCreated = a.createdAt?.toMillis?.() || 0;
      const bCreated = b.createdAt?.toMillis?.() || 0;
      return bCreated - aCreated;
    });
  },

  async updateSelfCareTask(taskId: string, updates: Partial<SelfCareTask>): Promise<void> {
    const taskRef = doc(db, 'selfCareTasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteSelfCareTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'selfCareTasks', taskId));
  },

  // Health Goals
  async getHealthGoals(userId: string): Promise<{ waterGoal: number; sleepGoal: number; height: number } | null> {
    try {
      const q = query(
        collection(db, 'healthGoals'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const data = querySnapshot.docs[0].data();
      return {
        waterGoal: data.waterGoal || 4, // litros
        sleepGoal: data.sleepGoal || 8, // horas
        height: data.height || 0, // cm
      };
    } catch (error) {
      console.error('Erro ao carregar metas de saúde:', error);
      return null;
    }
  },

  async setHealthGoals(userId: string, goals: { waterGoal?: number; sleepGoal?: number; height?: number }): Promise<void> {
    try {
      const q = query(
        collection(db, 'healthGoals'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Cria novo documento
        await addDoc(collection(db, 'healthGoals'), {
          userId,
          waterGoal: goals.waterGoal || 4,
          sleepGoal: goals.sleepGoal || 8,
          height: goals.height || 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        // Atualiza documento existente
        const docRef = doc(db, 'healthGoals', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...goals,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Erro ao salvar metas de saúde:', error);
      throw error;
    }
  },
};

