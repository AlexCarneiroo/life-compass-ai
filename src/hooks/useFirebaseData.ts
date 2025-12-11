import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { habitsService } from '@/lib/firebase/habits';
import { goalsService } from '@/lib/firebase/goals';
import { financeService } from '@/lib/firebase/finance';
import { healthService } from '@/lib/firebase/health';
import { journalService } from '@/lib/firebase/journal';
import { routinesService } from '@/lib/firebase/routines';
import { workService } from '@/lib/firebase/work';
import { checkinService } from '@/lib/firebase/checkin';
import { Habit, Goal, FinancialEntry, HealthEntry } from '@/types';
import { toast } from 'sonner';

// Hook para usar dados do Firebase com fallback para mock data
export function useFirebaseData<T>(
  service: {
    getAll: (userId: string) => Promise<T[]>;
    create: (data: any, userId: string) => Promise<string>;
    update: (id: string, data: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
  },
  mockData: T[],
  collectionName: string
) {
  const { userId } = useAuth();
  const [data, setData] = useState<T[]>(mockData);
  const [loading, setLoading] = useState(true);
  const [useFirebase, setUseFirebase] = useState(false);

  useEffect(() => {
    // Verifica se Firebase está configurado
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (apiKey && apiKey !== 'your-api-key') {
      setUseFirebase(true);
      loadData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await service.getAll(userId);
      setData(result);
    } catch (error) {
      console.error(`Erro ao carregar ${collectionName}:`, error);
      toast.error(`Erro ao carregar ${collectionName}`);
      // Mantém dados mock em caso de erro
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const create = async (newData: any) => {
    try {
      if (useFirebase) {
        const id = await service.create(newData, userId);
        await loadData();
        toast.success(`${collectionName} criado com sucesso!`);
        return id;
      } else {
        // Modo mock
        const newItem = { ...newData, id: Date.now().toString() };
        setData([...data, newItem as T]);
        toast.success(`${collectionName} criado com sucesso!`);
        return newItem.id;
      }
    } catch (error) {
      console.error(`Erro ao criar ${collectionName}:`, error);
      toast.error(`Erro ao criar ${collectionName}`);
      throw error;
    }
  };

  const update = async (id: string, updates: any) => {
    try {
      if (useFirebase) {
        await service.update(id, updates);
        await loadData();
        toast.success(`${collectionName} atualizado com sucesso!`);
      } else {
        // Modo mock
        setData(data.map(item => (item as any).id === id ? { ...item, ...updates } : item));
        toast.success(`${collectionName} atualizado com sucesso!`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar ${collectionName}:`, error);
      toast.error(`Erro ao atualizar ${collectionName}`);
      throw error;
    }
  };

  const remove = async (id: string) => {
    try {
      if (useFirebase) {
        await service.delete(id);
        await loadData();
        toast.success(`${collectionName} deletado com sucesso!`);
      } else {
        // Modo mock
        setData(data.filter(item => (item as any).id !== id));
        toast.success(`${collectionName} deletado com sucesso!`);
      }
    } catch (error) {
      console.error(`Erro ao deletar ${collectionName}:`, error);
      toast.error(`Erro ao deletar ${collectionName}`);
      throw error;
    }
  };

  return { data, loading, create, update, remove, refresh: loadData };
}




