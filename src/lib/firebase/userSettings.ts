import { 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserSettings {
  // PIN
  pinEnabled?: boolean;
  pin?: string;
  protectedSections?: string[];
  // Notificações
  checkinReminderEnabled?: boolean;
  checkinReminderTime?: string;
  habitRemindersEnabled?: boolean;
}

const COLLECTION = 'userSettings';

const defaultSettings: UserSettings = {
  pinEnabled: false,
  pin: '',
  protectedSections: [],
  checkinReminderEnabled: false,
  checkinReminderTime: '21:00',
  habitRemindersEnabled: false,
};

export const userSettingsService = {
  async getOrCreate(userId: string): Promise<UserSettings> {
    const settingsRef = doc(db, COLLECTION, userId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return {
        ...defaultSettings,
        ...settingsSnap.data(),
      } as UserSettings;
    }
    
    // Criar settings padrão
    await setDoc(settingsRef, {
      ...defaultSettings,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return defaultSettings;
  },

  async save(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const settingsRef = doc(db, COLLECTION, userId);
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  // ========== PIN ==========
  
  async setPin(userId: string, pin: string): Promise<void> {
    const settingsRef = doc(db, COLLECTION, userId);
    await setDoc(settingsRef, {
      pin,
      pinEnabled: true,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const settings = await this.getOrCreate(userId);
    return settings.pin === pin;
  },

  async removePin(userId: string): Promise<void> {
    const settingsRef = doc(db, COLLECTION, userId);
    await updateDoc(settingsRef, {
      pin: '',
      pinEnabled: false,
      protectedSections: [],
      updatedAt: Timestamp.now(),
    });
  },

  async togglePin(userId: string, enabled: boolean): Promise<void> {
    const settings = await this.getOrCreate(userId);
    if (enabled && !settings.pin) {
      throw new Error('Defina um PIN antes de habilitar');
    }
    
    const settingsRef = doc(db, COLLECTION, userId);
    await updateDoc(settingsRef, {
      pinEnabled: enabled,
      updatedAt: Timestamp.now(),
    });
  },

  async updateProtectedSections(userId: string, sections: string[]): Promise<void> {
    const settingsRef = doc(db, COLLECTION, userId);
    await updateDoc(settingsRef, {
      protectedSections: sections,
      updatedAt: Timestamp.now(),
    });
  },

  // ========== NOTIFICAÇÕES ==========
  
  async getNotificationSettings(userId: string): Promise<{
    checkinReminderEnabled: boolean;
    checkinReminderTime: string;
    habitRemindersEnabled: boolean;
  }> {
    const settings = await this.getOrCreate(userId);
    return {
      checkinReminderEnabled: settings.checkinReminderEnabled || false,
      checkinReminderTime: settings.checkinReminderTime || '21:00',
      habitRemindersEnabled: settings.habitRemindersEnabled || false,
    };
  },

  async saveNotificationSettings(userId: string, settings: {
    checkinReminderEnabled?: boolean;
    checkinReminderTime?: string;
    habitRemindersEnabled?: boolean;
  }): Promise<void> {
    await this.save(userId, settings);
  },
};
