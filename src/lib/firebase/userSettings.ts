import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';

const COLLECTION = 'userSettings';

export interface UserSettings {
  userId: string;
  pin?: string; // Hash do PIN (não armazenar em texto plano)
  pinEnabled: boolean;
  protectedSections?: string[]; // Lista de IDs das seções protegidas
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Função simples para hash (em produção, use uma biblioteca como crypto-js)
async function hashPin(pin: string): Promise<string> {
  // Usando Web Crypto API para hash seguro
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const userSettingsService = {
  // Obter ou criar configurações do usuário
  async getOrCreate(userId: string): Promise<UserSettings> {
    try {
      const docRef = doc(db, COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId: data.userId,
          pin: data.pin,
          pinEnabled: data.pinEnabled || false,
          protectedSections: data.protectedSections || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as UserSettings;
      }

      // Criar configurações padrão
      const defaultSettings = {
        userId,
        pinEnabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(docRef, defaultSettings);

      return {
        userId,
        pinEnabled: false,
        protectedSections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserSettings;
    } catch (error) {
      logger.error('Erro ao obter configurações do usuário:', error);
      throw error;
    }
  },

  // Definir PIN
  async setPin(userId: string, pin: string): Promise<void> {
    try {
      if (!pin || pin.length < 4 || pin.length > 8) {
        throw new Error('O PIN deve ter entre 4 e 8 dígitos');
      }

      // Validar que o PIN contém apenas números
      if (!/^\d+$/.test(pin)) {
        throw new Error('O PIN deve conter apenas números');
      }

      const hashedPin = await hashPin(pin);
      const docRef = doc(db, COLLECTION, userId);

      await updateDoc(docRef, {
        pin: hashedPin,
        pinEnabled: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error('Erro ao definir PIN:', error);
      throw error;
    }
  },

  // Verificar PIN
  async verifyPin(userId: string, pin: string): Promise<boolean> {
    try {
      const settings = await this.getOrCreate(userId);
      
      if (!settings.pin || !settings.pinEnabled) {
        return false;
      }

      const hashedPin = await hashPin(pin);
      return hashedPin === settings.pin;
    } catch (error) {
      logger.error('Erro ao verificar PIN:', error);
      return false;
    }
  },

  // Remover PIN
  async removePin(userId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION, userId);
      await updateDoc(docRef, {
        pin: null,
        pinEnabled: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error('Erro ao remover PIN:', error);
      throw error;
    }
  },

  // Habilitar/Desabilitar PIN
  async togglePin(userId: string, enabled: boolean): Promise<void> {
    try {
      const settings = await this.getOrCreate(userId);
      
      if (enabled && !settings.pin) {
        throw new Error('Defina um PIN antes de habilitá-lo');
      }

      const docRef = doc(db, COLLECTION, userId);
      await updateDoc(docRef, {
        pinEnabled: enabled,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error('Erro ao alterar status do PIN:', error);
      throw error;
    }
  },

  // Atualizar seções protegidas
  async updateProtectedSections(userId: string, sections: string[]): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION, userId);
      await updateDoc(docRef, {
        protectedSections: sections,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error('Erro ao atualizar seções protegidas:', error);
      throw error;
    }
  },
};

