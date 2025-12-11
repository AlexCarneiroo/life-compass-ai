import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';

export default function Login() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
      navigate('/');
    } catch (error) {
      // Erro já é tratado no authService
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      // Erro já é tratado no authService
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-border/50 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 rounded-full gradient-indigo flex items-center justify-center mb-4">
              <span className="text-3xl">🧭</span>
            </div>
            <CardTitle className="text-3xl font-bold">
              {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Entre para continuar sua jornada' 
                : 'Comece sua jornada de autodesenvolvimento'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground"
                disabled={loading}
                size="lg"
              >
                {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
              size="lg"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Google
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recuperar Senha</DialogTitle>
              <DialogDescription>
                Digite seu email para receber um link de recuperação de senha
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowResetPassword(false);
                setResetEmail('');
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await resetPassword(resetEmail);
                    setShowResetPassword(false);
                    setResetEmail('');
                  } catch (error) {
                    // Erro já é tratado no authService
                  }
                }}
                disabled={!resetEmail}
              >
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

