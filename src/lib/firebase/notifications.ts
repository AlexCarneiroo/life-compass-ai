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
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface AppNotification {
  id: string;
  userId: string;
  type: 'friend_request' | 'friend_accepted' | 'achievement' | 'level_up' | 'streak' | 'reminder';
  title: string;
  message: string;
  icon?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationsService = {
  async create(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string, maxItems: number = 20): Promise<AppNotification[]> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      limit(maxItems)
    );
    
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AppNotification[];
    
    // Ordena localmente por data
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
      read: true,
    });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map(d => updateDoc(doc(db, NOTIFICATIONS_COLLECTION, d.id), { read: true }))
    );
  },

  async delete(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
  },

  // Limpa notificações antigas (mais de 30 dias)
  async cleanup(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const notifications = await this.getAll(userId, 100);
    const old = notifications.filter(n => n.createdAt < thirtyDaysAgo);
    await Promise.all(old.map(n => this.delete(n.id)));
  },

  // Subscribe para atualizações em tempo real
  subscribe(userId: string, callback: (notifications: AppNotification[]) => void): Unsubscribe {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as AppNotification[];
      
      callback(notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });
  },

  // Helpers para criar notificações específicas
  async notifyFriendRequest(toUserId: string, fromUserName: string, fromUserId: string): Promise<void> {
    await this.create({
      userId: toUserId,
      type: 'friend_request',
      title: 'Nova solicitação de amizade',
      message: `${fromUserName} quer se conectar com você!`,
      icon: '👋',
      data: { fromUserId },
    });
  },

  async notifyFriendAccepted(toUserId: string, friendName: string): Promise<void> {
    await this.create({
      userId: toUserId,
      type: 'friend_accepted',
      title: 'Solicitação aceita!',
      message: `${friendName} aceitou sua solicitação de amizade!`,
      icon: '🎉',
    });
  },

  async notifyAchievement(userId: string, badgeName: string, badgeIcon: string): Promise<void> {
    await this.create({
      userId,
      type: 'achievement',
      title: 'Nova conquista!',
      message: `Você desbloqueou: ${badgeName}`,
      icon: badgeIcon,
    });
  },

  async notifyLevelUp(userId: string, newLevel: number): Promise<void> {
    await this.create({
      userId,
      type: 'level_up',
      title: 'Level Up! 🎮',
      message: `Parabéns! Você alcançou o nível ${newLevel}!`,
      icon: '⬆️',
    });
  },
};
