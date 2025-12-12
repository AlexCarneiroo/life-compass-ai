/**
 * Sistema de dificuldade para hábitos com XP automático
 */

export type HabitDifficulty = 'very-easy' | 'easy' | 'normal' | 'hard' | 'very-hard' | 'extreme';

export interface DifficultyOption {
  id: HabitDifficulty;
  label: string;
  emoji: string;
  xp: number;
  description: string;
  color: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'very-easy',
    label: 'Facinho',
    emoji: '😊',
    xp: 10,
    description: 'Muito simples de fazer',
    color: 'bg-green-500',
  },
  {
    id: 'easy',
    label: 'Fácil',
    emoji: '😄',
    xp: 25,
    description: 'Fácil de completar',
    color: 'bg-emerald-500',
  },
  {
    id: 'normal',
    label: 'Normal',
    emoji: '😐',
    xp: 50,
    description: 'Dificuldade moderada',
    color: 'bg-blue-500',
  },
  {
    id: 'hard',
    label: 'Difícil',
    emoji: '😤',
    xp: 100,
    description: 'Requer esforço',
    color: 'bg-orange-500',
  },
  {
    id: 'very-hard',
    label: 'Muito Difícil',
    emoji: '😰',
    xp: 200,
    description: 'Muito desafiador',
    color: 'bg-red-500',
  },
  {
    id: 'extreme',
    label: 'Extremo',
    emoji: '🔥',
    xp: 500,
    description: 'Máximo desafio',
    color: 'bg-purple-500',
  },
];

/**
 * Obtém a configuração de dificuldade pelo ID
 */
export function getDifficultyById(id: HabitDifficulty): DifficultyOption {
  return DIFFICULTY_OPTIONS.find(d => d.id === id) || DIFFICULTY_OPTIONS[2]; // Default: normal
}

/**
 * Obtém o XP baseado na dificuldade
 */
export function getXPByDifficulty(difficulty: HabitDifficulty): number {
  return getDifficultyById(difficulty).xp;
}

/**
 * Obtém a dificuldade padrão
 */
export function getDefaultDifficulty(): HabitDifficulty {
  return 'normal';
}

