import { DailyCheckIn } from '@/types';
import { logger } from '@/lib/utils/logger';

const OFFLINE_CHECKIN_KEY = 'offline-checkins';

export interface OfflineCheckIn extends DailyCheckIn {
  synced: boolean;
  offlineId: string;
}

export const offlineCheckinService = {
  // Salvar check-in offline
  saveOffline(checkin: Omit<DailyCheckIn, 'id'>): string {
    try {
      const offlineId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const offlineCheckin: OfflineCheckIn = {
        ...checkin,
        id: offlineId,
        synced: false,
        offlineId,
      };

      const existing = this.getAllOffline();
      existing.push(offlineCheckin);
      localStorage.setItem(OFFLINE_CHECKIN_KEY, JSON.stringify(existing));
      
      logger.log('Check-in salvo offline:', offlineId);
      return offlineId;
    } catch (error) {
      logger.error('Erro ao salvar check-in offline:', error);
      throw error;
    }
  },

  // Buscar todos os check-ins offline não sincronizados
  getAllOffline(): OfflineCheckIn[] {
    try {
      const stored = localStorage.getItem(OFFLINE_CHECKIN_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as OfflineCheckIn[];
    } catch (error) {
      logger.error('Erro ao buscar check-ins offline:', error);
      return [];
    }
  },

  // Buscar check-ins não sincronizados
  getUnsynced(): OfflineCheckIn[] {
    return this.getAllOffline().filter(checkin => !checkin.synced);
  },

  // Marcar check-in como sincronizado
  markAsSynced(offlineId: string, firebaseId: string): void {
    try {
      const all = this.getAllOffline();
      const updated = all.map(checkin => 
        checkin.offlineId === offlineId
          ? { ...checkin, synced: true, id: firebaseId }
          : checkin
      );
      localStorage.setItem(OFFLINE_CHECKIN_KEY, JSON.stringify(updated));
      logger.log('Check-in marcado como sincronizado:', offlineId);
    } catch (error) {
      logger.error('Erro ao marcar check-in como sincronizado:', error);
    }
  },

  // Remover check-in sincronizado
  removeSynced(): void {
    try {
      const all = this.getAllOffline();
      const unsynced = all.filter(checkin => !checkin.synced);
      localStorage.setItem(OFFLINE_CHECKIN_KEY, JSON.stringify(unsynced));
    } catch (error) {
      logger.error('Erro ao remover check-ins sincronizados:', error);
    }
  },

  // Limpar todos os check-ins offline
  clearAll(): void {
    localStorage.removeItem(OFFLINE_CHECKIN_KEY);
  },
};







