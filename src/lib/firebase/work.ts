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

export interface Project {
  id: string;
  name: string;
  progress: number;
  deadline: string;
  status: string;
  userId: string;
  createdAt: Timestamp;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  target: number;
  userId: string;
}

export interface CareerGoal {
  id: string;
  title: string;
  completed: boolean;
  deadline: string;
  userId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  relationship: string;
  lastInteraction: string;
  userId: string;
}

export const workService = {
  // Projects
  async createProject(project: Omit<Project, 'id' | 'createdAt'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...project,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAllProjects(userId: string): Promise<Project[]> {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    })) as Project[];
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteProject(projectId: string): Promise<void> {
    await deleteDoc(doc(db, 'projects', projectId));
  },

  // Skills
  async createSkill(skill: Omit<Skill, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'skills'), {
      ...skill,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAllSkills(userId: string): Promise<Skill[]> {
    const q = query(collection(db, 'skills'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Skill[];
  },

  async updateSkill(skillId: string, updates: Partial<Skill>): Promise<void> {
    const skillRef = doc(db, 'skills', skillId);
    await updateDoc(skillRef, updates);
  },

  // Career Goals
  async createCareerGoal(goal: Omit<CareerGoal, 'id'>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'careerGoals'), {
      ...goal,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAllCareerGoals(userId: string): Promise<CareerGoal[]> {
    const q = query(collection(db, 'careerGoals'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CareerGoal[];
  },

  async updateCareerGoal(goalId: string, updates: Partial<CareerGoal>): Promise<void> {
    const goalRef = doc(db, 'careerGoals', goalId);
    await updateDoc(goalRef, updates);
  },

  async deleteCareerGoal(goalId: string): Promise<void> {
    await deleteDoc(doc(db, 'careerGoals', goalId));
  },
};







