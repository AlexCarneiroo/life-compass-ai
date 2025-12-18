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
  setDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';

const WORKOUTS_COLLECTION = 'workouts';
const CHALLENGES_COLLECTION = 'workoutChallenges';
const CHALLENGE_PARTICIPANTS_COLLECTION = 'challengeParticipants';
const WORKOUT_TEMPLATES_COLLECTION = 'workoutTemplates';

export type WorkoutModality = 
  | 'musculacao' 
  | 'cardio' 
  | 'yoga' 
  | 'corrida' 
  | 'ciclismo' 
  | 'natacao' 
  | 'crossfit' 
  | 'pilates' 
  | 'danca' 
  | 'artes-marciais'
  | 'funcional'
  | 'alongamento'
  | 'outro';

export type WorkoutIntensity = 'low' | 'medium' | 'high';

export interface Workout {
  id: string;
  userId: string;
  modality: WorkoutModality;
  name?: string; // Nome personalizado do treino
  duration: number; // em minutos
  calories?: number;
  intensity: WorkoutIntensity;
  date: string; // YYYY-MM-DD
  notes?: string;
  exercises?: Exercise[];
  partnerId?: string; // ID do parceiro de treino
  partnerName?: string; // Nome do parceiro (cache)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number; // em kg
  duration?: number; // em segundos (para exercícios de tempo)
  rest?: number; // em segundos
  notes?: string;
}

export interface WorkoutChallenge {
  id: string;
  userId: string; // Criador do desafio
  name: string;
  description: string;
  targetDays: number; // Dias consecutivos necessários
  currentStreak: number; // Dias consecutivos atuais (para o criador)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (data de término do desafio)
  completed: boolean;
  modality?: WorkoutModality; // Modalidade específica (opcional)
  isPublic: boolean; // Se pode ser encontrado por link
  inviteCode?: string; // Código único para convite via link
  participants: string[]; // IDs dos participantes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChallengeParticipant {
  challengeId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  currentStreak: number;
  totalWorkouts: number;
  lastWorkoutDate?: string;
  joinedAt: Timestamp;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  modality: WorkoutModality;
  exercises: Exercise[];
  estimatedDuration: number;
  intensity: WorkoutIntensity;
  isPublic: boolean; // Se outros usuários podem usar
  createdAt: Timestamp;
}

export const workoutsService = {
  // Workouts
  async create(workout: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), {
      ...workout,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(userId: string): Promise<Workout[]> {
    // Busca simples e ordena localmente para evitar índice composto
    const q = query(
      collection(db, WORKOUTS_COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const workouts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as Workout[];
    
    // Ordena por data localmente (mais recente primeiro)
    return workouts.sort((a, b) => b.date.localeCompare(a.date));
  },

  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<Workout[]> {
    // Busca simples e filtra localmente para evitar índice composto
    const q = query(
      collection(db, WORKOUTS_COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const allWorkouts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as Workout[];
    
    // Filtra por data localmente
    return allWorkouts
      .filter(w => w.date >= startDate && w.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getByModality(userId: string, modality: WorkoutModality): Promise<Workout[]> {
    // Busca simples e filtra localmente para evitar índice composto
    const q = query(
      collection(db, WORKOUTS_COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const allWorkouts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as Workout[];
    
    // Filtra por modalidade e ordena localmente
    return allWorkouts
      .filter(w => w.modality === modality)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getById(workoutId: string): Promise<Workout | null> {
    const docRef = doc(db, WORKOUTS_COLLECTION, workoutId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        date: docSnap.data().date,
        createdAt: docSnap.data().createdAt,
        updatedAt: docSnap.data().updatedAt,
      } as Workout;
    }
    return null;
  },

  async update(workoutId: string, updates: Partial<Workout>): Promise<void> {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, workoutId);
    await updateDoc(workoutRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(workoutId: string): Promise<void> {
    await deleteDoc(doc(db, WORKOUTS_COLLECTION, workoutId));
  },

  // Challenges
  async createChallenge(challenge: Omit<WorkoutChallenge, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'inviteCode' | 'participants'>, userId: string): Promise<string> {
    // Gera código único para convite
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Remove campos undefined antes de salvar (Firestore não aceita undefined)
    const cleanChallenge = Object.fromEntries(
      Object.entries(challenge).filter(([_, value]) => value !== undefined)
    ) as Omit<WorkoutChallenge, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'inviteCode' | 'participants'>;
    
    const docRef = await addDoc(collection(db, CHALLENGES_COLLECTION), {
      ...cleanChallenge,
      userId,
      inviteCode,
      participants: [userId], // Criador é o primeiro participante
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    // Cria registro do participante (criador)
    await this.addChallengeParticipant(docRef.id, userId);
    
    return docRef.id;
  },

  async getAllChallenges(userId: string): Promise<WorkoutChallenge[]> {
    // Busca simples e ordena localmente para evitar índice composto
    const q = query(
      collection(db, CHALLENGES_COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const challenges = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate,
      endDate: doc.data().endDate,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as WorkoutChallenge[];
    
    // Ordena por createdAt localmente (mais recente primeiro)
    return challenges.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  },

  async updateChallenge(challengeId: string, updates: Partial<WorkoutChallenge>): Promise<void> {
    // Remove campos undefined antes de salvar (Firestore não aceita undefined)
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<WorkoutChallenge>;
    
    const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
    await updateDoc(challengeRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteChallenge(challengeId: string): Promise<void> {
    await deleteDoc(doc(db, CHALLENGES_COLLECTION, challengeId));
  },

  // Atualiza streak de desafio baseado nos treinos
  async updateChallengeStreak(challengeId: string, userId: string): Promise<void> {
    const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
    const challengeDoc = await getDoc(challengeRef);
    
    if (!challengeDoc.exists()) return;
    
    const challenge = challengeDoc.data() as WorkoutChallenge;
    
    // Busca treinos desde o início do desafio
    const workouts = await this.getByDateRange(userId, challenge.startDate, new Date().toISOString().split('T')[0]);
    
    // Calcula streak consecutivo
    let currentStreak = 0;
    const sortedDates = [...new Set(workouts.map(w => w.date))].sort().reverse();
    
    let lastDate: Date | null = null;
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr + 'T12:00:00');
      if (!lastDate) {
        lastDate = date;
        currentStreak = 1;
      } else {
        const diffDays = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          lastDate = date;
        } else {
          break;
        }
      }
    }
    
    const completed = currentStreak >= challenge.targetDays;
    
    await updateDoc(challengeRef, {
      currentStreak,
      completed,
      endDate: completed ? new Date().toISOString().split('T')[0] : undefined,
      updatedAt: Timestamp.now(),
    });
  },

  // Templates
  async createTemplate(template: Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, WORKOUT_TEMPLATES_COLLECTION), {
      ...template,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getMyTemplates(userId: string): Promise<WorkoutTemplate[]> {
    // Busca simples e ordena localmente para evitar índice composto
    const q = query(
      collection(db, WORKOUT_TEMPLATES_COLLECTION), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    })) as WorkoutTemplate[];
    
    // Ordena por createdAt localmente (mais recente primeiro)
    return templates.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  },

  async getPublicTemplates(): Promise<WorkoutTemplate[]> {
    // Busca simples e filtra/ordena localmente para evitar índice composto
    const q = query(
      collection(db, WORKOUT_TEMPLATES_COLLECTION)
    );
    const querySnapshot = await getDocs(q);
    const allTemplates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    })) as WorkoutTemplate[];
    
    // Filtra por isPublic e ordena por createdAt localmente (mais recente primeiro)
    return allTemplates
      .filter(t => t.isPublic === true)
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await deleteDoc(doc(db, WORKOUT_TEMPLATES_COLLECTION, templateId));
  },

  // Challenge Participants & Ranking
  async addChallengeParticipant(challengeId: string, userId: string, displayName?: string, photoURL?: string): Promise<void> {
    const participantRef = doc(db, CHALLENGE_PARTICIPANTS_COLLECTION, `${challengeId}_${userId}`);
    const participantDoc = await getDoc(participantRef);
    
    if (!participantDoc.exists()) {
      // Remove campos undefined antes de salvar (Firestore não aceita undefined)
      const participantData: any = {
        challengeId,
        userId,
        displayName: displayName || 'Usuário',
        currentStreak: 0,
        totalWorkouts: 0,
        joinedAt: Timestamp.now(),
      };
      
      // Só adiciona photoURL se tiver valor
      if (photoURL) {
        participantData.photoURL = photoURL;
      }
      
      await setDoc(participantRef, participantData);
      
      // Adiciona userId à lista de participantes do desafio
      const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
      const challengeDoc = await getDoc(challengeRef);
      if (challengeDoc.exists()) {
        const challenge = challengeDoc.data() as WorkoutChallenge;
        if (!challenge.participants.includes(userId)) {
          await updateDoc(challengeRef, {
            participants: arrayUnion(userId),
            updatedAt: Timestamp.now(),
          });
        }
      }
    }
  },

  async getChallengeByInviteCode(inviteCode: string): Promise<WorkoutChallenge | null> {
    const q = query(
      collection(db, CHALLENGES_COLLECTION),
      where('inviteCode', '==', inviteCode)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const challengeDoc = querySnapshot.docs[0];
    return {
      id: challengeDoc.id,
      ...challengeDoc.data(),
      startDate: challengeDoc.data().startDate,
      endDate: challengeDoc.data().endDate,
      createdAt: challengeDoc.data().createdAt,
      updatedAt: challengeDoc.data().updatedAt,
    } as WorkoutChallenge;
  },

  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    const q = query(
      collection(db, CHALLENGE_PARTICIPANTS_COLLECTION),
      where('challengeId', '==', challengeId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      joinedAt: doc.data().joinedAt,
    })) as ChallengeParticipant[];
  },

  async getChallengeRanking(challengeId: string): Promise<ChallengeParticipant[]> {
    const participants = await this.getChallengeParticipants(challengeId);
    // Ordena por streak (maior primeiro), depois por total de treinos
    return participants.sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      return b.totalWorkouts - a.totalWorkouts;
    });
  },

  async updateParticipantStreak(challengeId: string, userId: string): Promise<void> {
    const challengeRef = doc(db, CHALLENGES_COLLECTION, challengeId);
    const challengeDoc = await getDoc(challengeRef);
    
    if (!challengeDoc.exists()) return;
    
    const challenge = challengeDoc.data() as WorkoutChallenge;
    
    // Busca treinos do participante desde o início do desafio até hoje (ou endDate)
    const endDate = challenge.endDate || new Date().toISOString().split('T')[0];
    const workouts = await this.getByDateRange(userId, challenge.startDate, endDate);
    
    // Filtra por modalidade se especificada
    const filteredWorkouts = challenge.modality
      ? workouts.filter(w => w.modality === challenge.modality)
      : workouts;
    
    // Calcula streak consecutivo
    let currentStreak = 0;
    const sortedDates = [...new Set(filteredWorkouts.map(w => w.date))].sort().reverse();
    
    let lastDate: Date | null = null;
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr + 'T12:00:00');
      if (!lastDate) {
        lastDate = date;
        currentStreak = 1;
      } else {
        const diffDays = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          lastDate = date;
        } else {
          break;
        }
      }
    }
    
    // Atualiza registro do participante
    const participantRef = doc(db, CHALLENGE_PARTICIPANTS_COLLECTION, `${challengeId}_${userId}`);
    const participantDoc = await getDoc(participantRef);
    
    if (participantDoc.exists()) {
      // Remove campos undefined antes de salvar (Firestore não aceita undefined)
      const updateData: any = {
        currentStreak,
        totalWorkouts: filteredWorkouts.length,
      };
      
      // Só adiciona lastWorkoutDate se tiver valor
      if (filteredWorkouts.length > 0) {
        updateData.lastWorkoutDate = filteredWorkouts[0].date;
      }
      
      await updateDoc(participantRef, updateData);
    }
    
    // Se for o criador, atualiza também o desafio
    if (challenge.userId === userId) {
      const completed = currentStreak >= challenge.targetDays;
      await updateDoc(challengeRef, {
        currentStreak,
        completed,
        updatedAt: Timestamp.now(),
      });
    }
  },

  async getChallengesByParticipant(userId: string): Promise<WorkoutChallenge[]> {
    // Busca desafios onde o usuário é participante
    const q = query(
      collection(db, CHALLENGES_COLLECTION)
    );
    const querySnapshot = await getDocs(q);
    const allChallenges = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate,
      endDate: doc.data().endDate,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    })) as WorkoutChallenge[];
    
    // Filtra localmente por participantes
    return allChallenges.filter(c => c.participants?.includes(userId));
  },
};
