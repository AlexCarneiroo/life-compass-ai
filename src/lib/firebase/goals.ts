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
import { Goal } from '@/types';

const COLLECTION = 'goals';

export const goalsService = {
  async create(goal: Omit<Goal, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...goal,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string): Promise<Goal[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[];
  },

  async update(goalId: string, updates: Partial<Goal>): Promise<void> {
    const goalRef = doc(db, COLLECTION, goalId);
    await updateDoc(goalRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(goalId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, goalId));
  },
};











