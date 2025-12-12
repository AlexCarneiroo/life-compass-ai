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
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '@/lib/utils/logger';

// Tipos
export interface PomodoroSession {
  id: string;
  userId: string;
  duration: number; // em minutos
  completedAt: Timestamp;
  createdAt: Timestamp;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const POMODORO_COLLECTION = 'pomodoroSessions';
const NOTES_COLLECTION = 'notes';

// Serviço de Pomodoro
export const pomodoroService = {
  // Criar sessão de Pomodoro
  async create(session: Omit<PomodoroSession, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, POMODORO_COLLECTION), {
        ...session,
        userId,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('Erro ao criar sessão de Pomodoro:', error);
      throw error;
    }
  },

  // Buscar todas as sessões do usuário
  async getAll(userId: string): Promise<PomodoroSession[]> {
    try {
      const q = query(
        collection(db, POMODORO_COLLECTION), 
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PomodoroSession[];
    } catch (error) {
      logger.error('Erro ao buscar sessões de Pomodoro:', error);
      return [];
    }
  },

  // Buscar sessões do dia atual
  async getTodaySessions(userId: string): Promise<PomodoroSession[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      const q = query(
        collection(db, POMODORO_COLLECTION), 
        where('userId', '==', userId),
        where('completedAt', '>=', todayTimestamp),
        orderBy('completedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PomodoroSession[];
    } catch (error) {
      logger.error('Erro ao buscar sessões de hoje:', error);
      return [];
    }
  },

  // Deletar sessão
  async delete(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, POMODORO_COLLECTION, sessionId));
    } catch (error) {
      logger.error('Erro ao deletar sessão de Pomodoro:', error);
      throw error;
    }
  },
};

// Serviço de Notas
export const notesService = {
  // Criar nota
  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
        ...note,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('Erro ao criar nota:', error);
      throw error;
    }
  },

  // Buscar todas as notas do usuário
  async getAll(userId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, NOTES_COLLECTION), 
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
    } catch (error) {
      logger.error('Erro ao buscar notas:', error);
      return [];
    }
  },

  // Buscar nota por ID
  async getById(noteId: string): Promise<Note | null> {
    try {
      const docRef = doc(db, NOTES_COLLECTION, noteId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Note;
      }
      return null;
    } catch (error) {
      logger.error('Erro ao buscar nota:', error);
      return null;
    }
  },

  // Atualizar nota
  async update(noteId: string, updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    try {
      const noteRef = doc(db, NOTES_COLLECTION, noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error('Erro ao atualizar nota:', error);
      throw error;
    }
  },

  // Deletar nota
  async delete(noteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
    } catch (error) {
      logger.error('Erro ao deletar nota:', error);
      throw error;
    }
  },
};

