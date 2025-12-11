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

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
  type: 'text' | 'audio' | 'photo';
  duration?: number;
  aiInsight?: string;
  userId: string;
  createdAt: Timestamp;
}

const COLLECTION = 'journalEntries';

export const journalService = {
  async create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'userId'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...entry,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string): Promise<JournalEntry[]> {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
      createdAt: doc.data().createdAt,
    })) as JournalEntry[];
  },

  async update(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
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

