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
import { FinancialEntry } from '@/types';

const COLLECTION = 'financialEntries';

export const financeService = {
  async create(entry: Omit<FinancialEntry, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...entry,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string): Promise<FinancialEntry[]> {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
    })) as FinancialEntry[];
    
    // Ordena por data (mais recente primeiro) no código
    return results.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  },

  async update(entryId: string, updates: Partial<FinancialEntry>): Promise<void> {
    const entryRef = doc(db, COLLECTION, entryId);
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(entryId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, entryId));
  },
};


