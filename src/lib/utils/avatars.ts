/**
 * Lista de avatares fictícios disponíveis
 * Cada avatar tem um ID único e um emoji/ícone
 */

export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
  color: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'avatar-1', emoji: '👤', name: 'Pessoa', color: 'bg-blue-500' },
  { id: 'avatar-2', emoji: '🧑‍💼', name: 'Profissional', color: 'bg-indigo-500' },
  { id: 'avatar-3', emoji: '👨‍🎓', name: 'Estudante', color: 'bg-purple-500' },
  { id: 'avatar-4', emoji: '🧑‍🔬', name: 'Cientista', color: 'bg-cyan-500' },
  { id: 'avatar-5', emoji: '👨‍💻', name: 'Desenvolvedor', color: 'bg-teal-500' },
  { id: 'avatar-6', emoji: '🧑‍🎨', name: 'Artista', color: 'bg-pink-500' },
  { id: 'avatar-7', emoji: '🧑‍⚕️', name: 'Médico', color: 'bg-red-500' },
  { id: 'avatar-8', emoji: '🧑‍🏫', name: 'Professor', color: 'bg-orange-500' },
  { id: 'avatar-9', emoji: '🧑‍🚀', name: 'Astronauta', color: 'bg-slate-500' },
  { id: 'avatar-10', emoji: '🧑‍✈️', name: 'Piloto', color: 'bg-blue-600' },
  { id: 'avatar-11', emoji: '🧑‍🍳', name: 'Chef', color: 'bg-amber-500' },
  { id: 'avatar-12', emoji: '🧑‍🌾', name: 'Fazendeiro', color: 'bg-green-500' },
  { id: 'avatar-13', emoji: '🧑‍🏭', name: 'Trabalhador', color: 'bg-gray-500' },
  { id: 'avatar-14', emoji: '🧑‍🎤', name: 'Músico', color: 'bg-violet-500' },
  { id: 'avatar-15', emoji: '🧑‍🎭', name: 'Ator', color: 'bg-rose-500' },
  { id: 'avatar-16', emoji: '🧑‍🚒', name: 'Bombeiro', color: 'bg-red-600' },
  { id: 'avatar-17', emoji: '🧑‍🔧', name: 'Mecânico', color: 'bg-yellow-600' },
  { id: 'avatar-18', emoji: '🧑‍⚖️', name: 'Juiz', color: 'bg-indigo-600' },
  { id: 'avatar-19', emoji: '🧑‍🎪', name: 'Artista de Circo', color: 'bg-fuchsia-500' },
  { id: 'avatar-20', emoji: '🧑‍🦱', name: 'Estilo', color: 'bg-emerald-500' },
  { id: 'avatar-21', emoji: '🧑‍🦰', name: 'Ruivo', color: 'bg-orange-600' },
  { id: 'avatar-22', emoji: '🧑‍🦳', name: 'Sênior', color: 'bg-slate-400' },
  { id: 'avatar-23', emoji: '🧑‍🦲', name: 'Careca', color: 'bg-neutral-500' },
  { id: 'avatar-24', emoji: '🧑‍🦯', name: 'Acessível', color: 'bg-blue-400' },
];

/**
 * Busca um avatar pelo ID
 */
export function getAvatarById(id: string): AvatarOption | undefined {
  return AVATARS.find(avatar => avatar.id === id);
}

/**
 * Gera uma URL de avatar baseada no ID (para compatibilidade com photoURL)
 */
export function getAvatarURL(avatarId: string): string {
  return `avatar://${avatarId}`;
}

/**
 * Verifica se uma URL é um avatar fictício
 */
export function isAvatarURL(url: string): boolean {
  return url.startsWith('avatar://');
}

/**
 * Extrai o ID do avatar de uma URL
 */
export function getAvatarIdFromURL(url: string): string | null {
  if (isAvatarURL(url)) {
    return url.replace('avatar://', '');
  }
  return null;
}



