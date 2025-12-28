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
  limit,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { notificationsService } from './notifications';

// Perfil público do usuário
export interface PublicProfile {
  id: string;
  oderId: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  totalHabitsCompleted: number;
  badgesCount: number;
  recentBadges: { id: string; icon: string; name: string }[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Conexão entre usuários
export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Post/Compartilhamento
export interface SocialPost {
  id: string;
  oderId: string;
  type: 'achievement' | 'streak' | 'level_up' | 'habit_complete' | 'goal_complete';
  title: string;
  description: string;
  icon?: string;
  data?: any;
  likes: string[];
  createdAt: Date;
}

const PROFILES_COLLECTION = 'publicProfiles';
const CONNECTIONS_COLLECTION = 'connections';
const POSTS_COLLECTION = 'socialPosts';

export const socialService = {
  // ========== PERFIL PÚBLICO ==========
  
  async getOrCreateProfile(userId: string, displayName?: string, photoURL?: string): Promise<PublicProfile> {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        id: profileSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as PublicProfile;
    }
    
    const newProfile: Omit<PublicProfile, 'id'> = {
      oderId: userId,
      displayName: displayName || 'Usuário',
      photoURL: photoURL || '',
      bio: '',
      level: 1,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalHabitsCompleted: 0,
      badgesCount: 0,
      recentBadges: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(profileRef, {
      ...newProfile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return { id: userId, ...newProfile };
  },

  async updateProfile(userId: string, updates: Partial<PublicProfile>): Promise<void> {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async syncProfileWithStats(userId: string, stats: any, displayName?: string, photoURL?: string): Promise<void> {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    await setDoc(profileRef, {
      oderId: userId,
      displayName: displayName || 'Usuário',
      photoURL: photoURL || '',
      level: stats.level || 1,
      totalXP: stats.xp || 0,
      currentStreak: stats.currentStreak || 0,
      longestStreak: stats.longestStreak || 0,
      totalHabitsCompleted: stats.totalHabitsCompleted || 0,
      badgesCount: stats.badges?.length || 0,
      recentBadges: (stats.badges || []).slice(-4).map((b: any) => ({
        id: b.id,
        icon: b.icon,
        name: b.name,
      })),
      isPublic: true,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async getProfile(userId: string): Promise<PublicProfile | null> {
    const profileRef = doc(db, PROFILES_COLLECTION, userId);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) return null;
    
    const data = profileSnap.data();
    return {
      id: profileSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as PublicProfile;
  },

  async searchProfiles(searchTerm: string, limitCount: number = 20): Promise<PublicProfile[]> {
    // Busca simples sem índice composto
    const q = query(
      collection(db, PROFILES_COLLECTION),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    let profiles = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    })) as PublicProfile[];
    
    // Filtra apenas públicos
    profiles = profiles.filter(p => p.isPublic !== false);
    
    // Filtra pelo termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      profiles = profiles.filter(p => p.displayName?.toLowerCase().includes(term));
    }
    
    // Ordena por nível e limita
    profiles.sort((a, b) => b.level - a.level);
    return profiles.slice(0, limitCount);
  },

  async getLeaderboard(limitCount: number = 10): Promise<PublicProfile[]> {
    // Busca simples sem índice composto
    const q = query(
      collection(db, PROFILES_COLLECTION),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    let profiles = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    })) as PublicProfile[];
    
    // Filtra públicos, ordena e limita
    return profiles
      .filter(p => p.isPublic !== false)
      .sort((a, b) => (b.level - a.level) || (b.totalXP - a.totalXP))
      .slice(0, limitCount);
  },

  // ========== CONEXÕES ==========

  async sendConnectionRequest(fromUserId: string, toUserId: string, fromUserName?: string): Promise<string> {
    const existing = await this.getConnection(fromUserId, toUserId);
    if (existing) {
      if (existing.status === 'rejected') {
        await deleteDoc(doc(db, CONNECTIONS_COLLECTION, existing.id));
      } else if (existing.status === 'accepted') {
        throw new Error('Vocês já são amigos');
      } else {
        throw new Error('Solicitação já enviada');
      }
    }
    
    const docRef = await addDoc(collection(db, CONNECTIONS_COLLECTION), {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    
    // Notifica o destinatário
    const name = fromUserName || 'Alguém';
    await notificationsService.notifyFriendRequest(toUserId, name, fromUserId);
    
    return docRef.id;
  },

  async acceptConnection(connectionId: string, accepterName?: string): Promise<void> {
    const connRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const connSnap = await getDoc(connRef);
    
    if (connSnap.exists()) {
      const data = connSnap.data();
      await updateDoc(connRef, { status: 'accepted' });
      
      // Notifica quem enviou a solicitação
      const name = accepterName || 'Alguém';
      await notificationsService.notifyFriendAccepted(data.fromUserId, name);
    }
  },

  async rejectConnection(connectionId: string): Promise<void> {
    // Deleta ao invés de marcar como rejected
    await deleteDoc(doc(db, CONNECTIONS_COLLECTION, connectionId));
  },

  async removeConnection(connectionId: string): Promise<void> {
    await deleteDoc(doc(db, CONNECTIONS_COLLECTION, connectionId));
  },

  async getConnection(userId1: string, userId2: string): Promise<Connection | null> {
    // Busca simples - filtra localmente para evitar índice composto
    const q1 = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('fromUserId', '==', userId1)
    );
    const q2 = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('fromUserId', '==', userId2)
    );
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    // Filtra localmente pelo toUserId
    const conn1 = snap1.docs.find(d => d.data().toUserId === userId2);
    if (conn1) {
      return { id: conn1.id, ...conn1.data(), createdAt: conn1.data().createdAt?.toDate() } as Connection;
    }
    
    const conn2 = snap2.docs.find(d => d.data().toUserId === userId1);
    if (conn2) {
      return { id: conn2.id, ...conn2.data(), createdAt: conn2.data().createdAt?.toDate() } as Connection;
    }
    
    return null;
  },

  async getConnections(userId: string): Promise<{ connection: Connection; profile: PublicProfile }[]> {
    // Busca simples sem índice composto
    const q1 = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('fromUserId', '==', userId)
    );
    const q2 = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('toUserId', '==', userId)
    );
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const connections: Connection[] = [
      ...snap1.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as Connection)),
      ...snap2.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as Connection)),
    ].filter(c => c.status === 'accepted'); // Filtra localmente
    
    const results: { connection: Connection; profile: PublicProfile }[] = [];
    for (const conn of connections) {
      const friendId = conn.fromUserId === userId ? conn.toUserId : conn.fromUserId;
      const profile = await this.getProfile(friendId);
      if (profile) {
        results.push({ connection: conn, profile });
      }
    }
    
    return results;
  },

  async getPendingRequests(userId: string): Promise<{ connection: Connection; profile: PublicProfile }[]> {
    // Busca simples sem índice composto - filtra localmente
    const q = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('toUserId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const connections = snapshot.docs
      .map(d => ({ 
        id: d.id, 
        ...d.data(), 
        createdAt: d.data().createdAt?.toDate() 
      } as Connection))
      .filter(c => c.status === 'pending'); // Filtra localmente
    
    const results: { connection: Connection; profile: PublicProfile }[] = [];
    for (const conn of connections) {
      const profile = await this.getProfile(conn.fromUserId);
      if (profile) {
        results.push({ connection: conn, profile });
      }
    }
    
    return results;
  },

  // ========== POSTS ==========

  async createPost(userId: string, post: Omit<SocialPost, 'id' | 'oderId' | 'likes' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...post,
      oderId: userId,
      likes: [],
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getFeed(userId: string, limitCount: number = 20): Promise<(SocialPost & { profile: PublicProfile })[]> {
    try {
      // Busca conexões primeiro (cacheável)
      const connections = await this.getConnections(userId);
      const friendIds = connections.map(c => 
        c.connection.fromUserId === userId ? c.connection.toUserId : c.connection.fromUserId
      );
      friendIds.push(userId);
      
      // Limita busca inicial para melhor performance (50 em vez de 100)
      // Nota: orderBy requer índice composto no Firestore
      const q = query(
        collection(db, POSTS_COLLECTION),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      let allPosts = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      } as SocialPost));
      
      // Filtra posts de amigos e próprio
      allPosts = allPosts.filter(p => friendIds.includes(p.oderId));
      
      // Ordena localmente por data (mais recente primeiro)
      allPosts.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
      
      // Limita antes de buscar perfis (reduz queries)
      const limitedPosts = allPosts.slice(0, limitCount);
      
      // Busca perfis em paralelo (mais eficiente)
      const profilePromises = limitedPosts.map(post => 
        this.getProfile(post.oderId).then(profile => ({ post, profile }))
      );
      
      const resultsWithProfiles = await Promise.all(profilePromises);
      
      // Filtra apenas posts com perfil válido
      return resultsWithProfiles
        .filter(({ profile }) => profile !== null)
        .map(({ post, profile }) => ({ ...post, profile: profile! }));
    } catch (error) {
      logger.error('Erro ao buscar feed:', error);
      return [];
    }
  },

  async likePost(postId: string, oderId: string): Promise<void> {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return;
    
    const likes = postSnap.data().likes || [];
    if (!likes.includes(oderId)) {
      likes.push(oderId);
      await updateDoc(postRef, { likes });
    }
  },

  async unlikePost(postId: string, oderId: string): Promise<void> {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return;
    
    const likes = (postSnap.data().likes || []).filter((id: string) => id !== oderId);
    await updateDoc(postRef, { likes });
  },

  // ========== AUTO-POST ==========
  
  async shareAchievement(userId: string, badge: { id: string; name: string; icon: string }): Promise<void> {
    await this.createPost(userId, {
      type: 'achievement',
      title: `Desbloqueou: ${badge.name}`,
      description: `Conquistou uma nova medalha!`,
      icon: badge.icon,
      data: { badgeId: badge.id },
    });
  },

  async shareLevelUp(userId: string, newLevel: number): Promise<void> {
    await this.createPost(userId, {
      type: 'level_up',
      title: `Alcançou o Nível ${newLevel}!`,
      description: `Subiu de nível e está evoluindo cada vez mais!`,
      icon: '⬆️',
      data: { level: newLevel },
    });
  },

  async shareStreak(userId: string, streak: number): Promise<void> {
    if (streak % 7 !== 0) return;
    
    await this.createPost(userId, {
      type: 'streak',
      title: `${streak} dias de sequência!`,
      description: `Mantendo a consistência há ${streak} dias seguidos!`,
      icon: '🔥',
      data: { streak },
    });
  },
};


