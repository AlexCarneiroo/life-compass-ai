import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Login com email e senha
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
      return userCredential.user;
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
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
      console.error('Erro ao criar conta:', error);
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
      const result = await signInWithPopup(auth, googleProvider);
      toast.success('Login com Google realizado com sucesso!');
      return result.user;
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado';
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
      console.error('Erro ao fazer logout:', error);
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
      console.error('Erro ao enviar email de recuperação:', error);
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
};

