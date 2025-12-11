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

export interface Notification {
  id: string;
  userId: string;
  type: 'negative' | 'positive' | 'info';
  category: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
  data?: any;
}

const COLLECTION = 'notifications';

export const notificationService = {
  /**
   * Cria uma nova notificação
   */
  async create(notification: Omit<Notification, 'id' | 'createdAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...notification,
      userId,
      read: false,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Busca todas as notificações do usuário
   */
  async getAll(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId)
    );

    if (unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        read: Boolean(data.read), // Garante que seja sempre booleano
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Notification;
    });

    // Ordena por data (mais recente primeiro)
    return results.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  },

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now(),
    });
  },

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const promises = querySnapshot.docs.map(doc => {
      return updateDoc(doc.ref, {
        read: true,
        readAt: Timestamp.now(),
      });
    });

    await Promise.all(promises);
  },

  /**
   * Deleta uma notificação
   */
  async delete(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, notificationId));
  },

  /**
   * Deleta todas as notificações lidas
   */
  async deleteRead(userId: string): Promise<void> {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId),
      where('read', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const promises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
  },
};

