import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  User,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reload,
} from 'firebase/auth';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Login com email e senha
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
      return userCredential.user;
    } catch (error: any) {
      logger.error('Erro ao fazer login:', error);
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        default:
          errorMessage = error.message || 'Erro ao fazer login';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Registro com email e senha
  async registerWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualiza o nome do usuário se fornecido
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
      
      toast.success('Conta criada com sucesso!');
      return userCredential.user;
    } catch (error: any) {
      logger.error('Erro ao criar conta:', error);
      let errorMessage = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
          break;
        default:
          errorMessage = error.message || 'Erro ao criar conta';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Login com Google
  async loginWithGoogle(): Promise<User> {
    try {
      // Detecta se é mobile para usar redirect ao invés de popup
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Em mobile, usa redirect (não retorna resultado imediatamente)
        await signInWithRedirect(auth, googleProvider);
        // O resultado será capturado pelo getRedirectResult no useAuth
        return auth.currentUser as User;
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        toast.success('Login com Google realizado com sucesso!');
        return result.user;
      }
    } catch (error: any) {
      logger.error('Erro ao fazer login com Google:', error);
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado';
      } else if (error.code === 'auth/popup-blocked') {
        // Fallback para redirect se popup for bloqueado
        await signInWithRedirect(auth, googleProvider);
        return auth.currentUser as User;
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Uma conta já existe com este email';
      } else {
        errorMessage = error.message || 'Erro ao fazer login com Google';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      logger.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
      throw error;
    }
  },

  // Reset de senha
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      logger.error('Erro ao enviar email de recuperação:', error);
      let errorMessage = 'Erro ao enviar email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = error.message || 'Erro ao enviar email';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Atualizar perfil
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      await updateProfile(user, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });
      
      // Força recarregar o usuário para atualizar o estado
      await reload(user);
    } catch (error: any) {
      logger.error('Erro ao atualizar perfil:', error);
      let errorMessage = 'Erro ao atualizar perfil';
      
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Por favor, faça login novamente para atualizar seu perfil';
          break;
        default:
          errorMessage = error.message || 'Erro ao atualizar perfil';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Upload de foto de perfil
  async uploadProfilePhoto(file: File): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Criar referência no Storage
      const fileRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      
      // Fazer upload
      await uploadBytes(fileRef, file);
      
      // Obter URL de download
      const downloadURL = await getDownloadURL(fileRef);
      
      // Atualizar perfil com a nova foto
      await updateProfile(user, {
        photoURL: downloadURL,
      });
      
      // Força recarregar o usuário para atualizar o estado
      await reload(user);
      
      return downloadURL;
    } catch (error: any) {
      logger.error('Erro ao fazer upload da foto:', error);
      let errorMessage = 'Erro ao fazer upload da foto';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Sem permissão para fazer upload. Configure as regras do Firebase Storage.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload cancelado';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'Erro desconhecido ao fazer upload';
      } else if (error.message?.includes('CORS') || error.message?.includes('cors')) {
        errorMessage = 'Erro de CORS. Configure as regras do Firebase Storage no console. Veja FIREBASE_STORAGE_RULES.md';
      } else if (error.message?.includes('network') || error.message?.includes('ERR_FAILED')) {
        errorMessage = 'Erro de rede. Verifique as regras do Firebase Storage e sua conexão.';
      } else {
        errorMessage = error.message || 'Erro ao fazer upload da foto';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Atualizar senha
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Usuário não autenticado');
      }

      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Atualizar senha
      await updatePassword(user, newPassword);
    } catch (error: any) {
      logger.error('Erro ao alterar senha:', error);
      let errorMessage = 'Erro ao alterar senha';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Senha atual incorreta';
          break;
        case 'auth/weak-password':
          errorMessage = 'A nova senha é muito fraca. Use pelo menos 6 caracteres';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Por favor, faça login novamente para alterar sua senha';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        default:
          errorMessage = error.message || 'Erro ao alterar senha';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },
};

