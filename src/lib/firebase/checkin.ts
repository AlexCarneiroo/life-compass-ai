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
import { DailyCheckIn } from '@/types';

const COLLECTION = 'checkIns';

export const checkinService = {
  async create(checkIn: Omit<DailyCheckIn, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...checkIn,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string): Promise<DailyCheckIn[]> {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      // Garante que a data seja sempre uma string
      let dateValue = data.date;
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        // Se for um Timestamp do Firebase, converte para string
        dateValue = dateValue.toDate().toISOString().split('T')[0];
      } else if (dateValue) {
        // Garante que seja string
        dateValue = String(dateValue).split('T')[0];
      }
      
      return {
        id: doc.id,
        ...data,
        date: dateValue,
      } as DailyCheckIn;
    });
    
    // Ordena por data (mais recente primeiro) no código
    return results.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  },

  async getByDate(userId: string, date: string): Promise<DailyCheckIn | null> {
    // Normaliza a data para garantir formato YYYY-MM-DD
    const normalizedDate = date.split('T')[0];
    
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId),
      where('date', '==', normalizedDate)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const data = querySnapshot.docs[0].data() as Record<string, any>;
    // Garante que a data seja sempre uma string
    let dateValue = data.date;
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      dateValue = dateValue.toDate().toISOString().split('T')[0];
    } else if (dateValue) {
      dateValue = String(dateValue).split('T')[0];
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...data,
      date: dateValue,
    } as DailyCheckIn;
  },

  async update(checkInId: string, updates: Partial<DailyCheckIn>): Promise<void> {
    const checkInRef = doc(db, COLLECTION, checkInId);
    await updateDoc(checkInRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(checkInId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, checkInId));
  },
};


