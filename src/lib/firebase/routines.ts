import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Routine {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasks: RoutineTask[];
  estimatedTime: number;
  userId: string;
  createdAt: Timestamp;
}

export interface RoutineTask {
  id: string;
  name: string;
  duration: number;
  completed: boolean;
}

const COLLECTION = 'routines';

export const routinesService = {
  async create(routine: Omit<Routine, 'id' | 'createdAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...routine,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string): Promise<Routine[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    })) as Routine[];
  },

  async update(routineId: string, updates: Partial<Routine>): Promise<void> {
    const routineRef = doc(db, COLLECTION, routineId);
    await updateDoc(routineRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(routineId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, routineId));
  },
};











