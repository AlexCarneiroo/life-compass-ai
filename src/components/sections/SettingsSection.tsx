import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/firebase/auth';
import { userSettingsService } from '@/lib/firebase/userSettings';
import { 
  User, 
  Lock, 
  Image, 
  Mail, 
  Save, 
  Eye, 
  EyeOff,
  Upload,
  X,
  CheckCircle,
  Key,
  Shield,
  Trash2,
  Lock as LockIcon,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, Clock } from 'lucide-react';
import { AVATARS, getAvatarById, getAvatarURL, isAvatarURL, getAvatarIdFromURL } from '@/lib/utils/avatars';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SettingsSection() {
  const { user, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  // PIN states
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [protectedSections, setProtectedSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [showDisablePinModal, setShowDisablePinModal] = useState(false); // Modal para desabilitar PIN
  const [pinToDisable, setPinToDisable] = useState(''); // PIN para desabilitar
  const [pinToRemoveSection, setPinToRemoveSection] = useState<{ sectionId: string; pin: string } | null>(null); // PIN para remover seção
  const { permission: notificationPermission, isSupported: notificationsSupported, requestPermission: requestNotificationPermission } = useBrowserNotifications();
  const { 
    hasPermission: hasPushPermission, 
    requestPermission: requestPushPermission, 
    sendTestNotification,
    scheduleCheckinReminder,
    scheduleHabitReminders,
  } = usePushNotifications();
  
  // Notification settings
  const [checkinReminderTime, setCheckinReminderTime] = useState('21:00');
  const [checkinReminderEnabled, setCheckinReminderEnabled] = useState(false);
  const [habitRemindersEnabled, setHabitRemindersEnabled] = useState(false);

  // Seções disponíveis para proteção
  const availableSections = [
    { id: 'habits', label: 'Hábitos', icon: '🎯' },
    { id: 'checkin', label: 'Check-in Diário', icon: '✅' },
    { id: 'finance', label: 'Financeiro', icon: '💰' },
    { id: 'goals', label: 'Metas & Objetivos', icon: '⭐' },
    { id: 'health', label: 'Saúde', icon: '💪' },
    { id: 'routines', label: 'Rotinas', icon: '⏰' },
    { id: 'journal', label: 'Diário', icon: '📔' },
    { id: 'ai', label: 'IA Coach', icon: '🤖' },
    { id: 'reports', label: 'Relatórios', icon: '📊' },
/*     { id: 'tools', label: 'Ferramentas', icon: '🔧' },
 */  ];

  // Atualizar estados quando o user mudar
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      // Só atualiza photoURL se não tiver sido alterado localmente
      if (!photoURL || photoURL === user.photoURL) {
        setPhotoURL(user.photoURL || '');
      }
      // Se o photoURL é um avatar, extrai o ID
      if (user.photoURL && isAvatarURL(user.photoURL)) {
        const avatarId = getAvatarIdFromURL(user.photoURL);
        if (avatarId) {
          setSelectedAvatarId(avatarId);
        }
      }
    }
  }, [user]);

  // Carregar configurações do PIN
  useEffect(() => {
    if (userId) {
      loadPinSettings();
    }
  }, [userId]);

  const loadPinSettings = async () => {
    try {
      const settings = await userSettingsService.getOrCreate(userId);
      setPinEnabled(settings.pinEnabled || false);
      setHasPin(!!settings.pin);
      setProtectedSections(settings.protectedSections || []);
    } catch (error) {
      logger.error('Erro ao carregar configurações do PIN:', error);
    }
  };

  // CÓDIGO DE UPLOAD DE IMAGEM COMENTADO - USANDO AVATARES AGORA
  // const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   // Validar tipo de arquivo
  //   if (!file.type.startsWith('image/')) {
  //     toast.error('Por favor, selecione uma imagem válida');
  //     return;
  //   }

  //   // Validar tamanho (máximo 5MB)
  //   if (file.size > 5 * 1024 * 1024) {
  //     toast.error('A imagem deve ter no máximo 5MB');
  //     return;
  //   }

  //   try {
  //     setUploadingPhoto(true);
  //     const newPhotoURL = await authService.uploadProfilePhoto(file);
  //     setPhotoURL(newPhotoURL);
      
  //     // Aguarda um pouco para o Firebase atualizar o user
  //     await new Promise(resolve => setTimeout(resolve, 500));
      
  //     // Força atualização do componente
  //     window.dispatchEvent(new CustomEvent('user-profile-updated'));
      
  //     toast.success('Foto de perfil atualizada com sucesso!');
  //   } catch (error: any) {
  //     logger.error('Erro ao fazer upload da foto:', error);
  //     toast.error(error.message || 'Erro ao fazer upload da foto');
  //   } finally {
  //     setUploadingPhoto(false);
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = '';
  //     }
  //   }
  // };

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    const avatarURL = getAvatarURL(avatarId);
    setPhotoURL(avatarURL);
    setIsAvatarModalOpen(false);
    toast.success('Avatar selecionado! Clique em "Salvar Alterações" para aplicar.');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await authService.updateProfile({
        displayName: displayName || undefined,
        photoURL: photoURL || undefined,
      });
      
      // Aguarda um pouco para o Firebase atualizar o user
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Força atualização do componente
      window.dispatchEvent(new CustomEvent('user-profile-updated'));
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      logger.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      logger.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (!pin || !confirmPin) {
      toast.error('Preencha todos os campos do PIN');
      return;
    }

    if (pin.length < 4 || pin.length > 8) {
      toast.error('O PIN deve ter entre 4 e 8 dígitos');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      toast.error('O PIN deve conter apenas números');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('Os PINs não coincidem');
      return;
    }

    try {
      setLoadingPin(true);
      
      // Se já existe PIN, precisa do PIN atual para alterar
      if (hasPin && !currentPin) {
        toast.error('Digite o PIN atual para alterá-lo');
        return;
      }

      if (hasPin) {
        const isValid = await userSettingsService.verifyPin(userId, currentPin);
        if (!isValid) {
          toast.error('PIN atual incorreto');
          return;
        }
      }

      await userSettingsService.setPin(userId, pin);
      toast.success('PIN definido com sucesso!');
      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      await loadPinSettings();
    } catch (error: any) {
      logger.error('Erro ao definir PIN:', error);
      toast.error(error.message || 'Erro ao definir PIN');
    } finally {
      setLoadingPin(false);
    }
  };

  const handleRemovePin = async () => {
    if (!currentPin) {
      toast.error('Digite o PIN atual para removê-lo');
      return;
    }

    try {
      setLoadingPin(true);
      const isValid = await userSettingsService.verifyPin(userId, currentPin);
      if (!isValid) {
        toast.error('PIN incorreto');
        return;
      }

      await userSettingsService.removePin(userId);
      toast.success('PIN removido com sucesso!');
      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      await loadPinSettings();
    } catch (error: any) {
      logger.error('Erro ao remover PIN:', error);
      toast.error(error.message || 'Erro ao remover PIN');
    } finally {
      setLoadingPin(false);
    }
  };

  const handleTogglePin = async (enabled: boolean) => {
    // Se está habilitando, não precisa de confirmação
    if (enabled) {
      try {
        setLoadingPin(true);
        await userSettingsService.togglePin(userId, enabled);
        setPinEnabled(enabled);
        toast.success('PIN habilitado');
      } catch (error: any) {
        logger.error('Erro ao alterar status do PIN:', error);
        toast.error(error.message || 'Erro ao alterar status do PIN');
        await loadPinSettings();
      } finally {
        setLoadingPin(false);
      }
      return;
    }
  };

  const handleDisablePin = async () => {
    if (!pinToDisable || pinToDisable.length < 4) {
      toast.error('Digite o PIN atual para desabilitar');
      return;
    }
    
    try {
      setLoadingPin(true);
      const isValid = await userSettingsService.verifyPin(userId, pinToDisable);
      if (!isValid) {
        toast.error('PIN incorreto');
        setPinToDisable('');
        return;
      }
      
      // Desabilita o PIN
      await userSettingsService.togglePin(userId, false);
      
      // Remove todas as seções protegidas
      await userSettingsService.updateProtectedSections(userId, []);
      
      setPinEnabled(false);
      setProtectedSections([]);
      setPinToDisable('');
      setShowDisablePinModal(false);
      
      // Notificar outros componentes
      window.dispatchEvent(new Event('pin-settings-updated'));
      
      toast.success('PIN desabilitado e todas as restrições removidas');
    } catch (error: any) {
      logger.error('Erro ao desabilitar PIN:', error);
      toast.error(error.message || 'Erro ao desabilitar PIN');
    } finally {
      setLoadingPin(false);
    }
  };

  const handleToggleProtectedSection = async (sectionId: string) => {
    if (!hasPin) {
      toast.error('Defina um PIN antes de proteger seções');
      return;
    }

    const isCurrentlyProtected = protectedSections.includes(sectionId);
    
    // Se está removendo proteção, precisa do PIN
    if (isCurrentlyProtected) {
      const pinData = pinToRemoveSection?.sectionId === sectionId ? pinToRemoveSection : null;
      
      if (!pinData || !pinData.pin) {
        // Inicia o processo de remoção, mas precisa do PIN
        setPinToRemoveSection({ sectionId, pin: '' });
        toast.error('Digite o PIN para remover a proteção desta seção');
        return;
      }
      
      try {
        setLoadingSections(true);
        const isValid = await userSettingsService.verifyPin(userId, pinData.pin);
        if (!isValid) {
          toast.error('PIN incorreto');
          setPinToRemoveSection(null);
          return;
        }
        
        const newProtected = protectedSections.filter(id => id !== sectionId);
        await userSettingsService.updateProtectedSections(userId, newProtected);
        setProtectedSections(newProtected);
        setPinToRemoveSection(null);
        
        // Notificar outros componentes
        window.dispatchEvent(new Event('pin-settings-updated'));
        
        toast.success('Proteção removida da seção');
      } catch (error: any) {
        logger.error('Erro ao remover proteção da seção:', error);
        toast.error(error.message || 'Erro ao remover proteção');
        setPinToRemoveSection(null);
      } finally {
        setLoadingSections(false);
      }
      return;
    }
    
    // Se está adicionando proteção, não precisa de PIN
    try {
      setLoadingSections(true);
      const newProtected = [...protectedSections, sectionId];
      
      await userSettingsService.updateProtectedSections(userId, newProtected);
      setProtectedSections(newProtected);
      
      // Notificar outros componentes
      window.dispatchEvent(new Event('pin-settings-updated'));
      
      toast.success('Seção protegida com PIN');
    } catch (error: any) {
      logger.error('Erro ao atualizar seções protegidas:', error);
      toast.error(error.message || 'Erro ao atualizar seções protegidas');
    } finally {
      setLoadingSections(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências da conta
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar de Perfil */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  {photoURL && isAvatarURL(photoURL) ? (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/20 to-primary/5">
                      {getAvatarById(getAvatarIdFromURL(photoURL) || '')?.emoji || '👤'}
                    </div>
                  ) : photoURL ? (
                    <AvatarImage src={photoURL} alt={displayName || 'Usuário'} />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="w-full"
                  >
                    <Smile className="w-4 h-4 mr-2" />
                    Escolher Avatar
                  </Button>
                  {photoURL && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPhotoURL('');
                        setSelectedAvatarId(null);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover Avatar
                    </Button>
                  )}
                </div>
                {/* CÓDIGO DE UPLOAD COMENTADO - USANDO AVATARES AGORA */}
                {/* <div className="flex flex-col items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-full"
                  >
                    {uploadingPhoto ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Alterar Foto
                      </>
                    )}
                  </Button>
                </div> */}
              </div>

              <Separator />

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              {/* Email (somente leitura) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={loading || !displayName}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Segurança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Segurança
              </CardTitle>
              <CardDescription>
                Altere sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a nova senha novamente"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </>
                )}
              </Button>

              {newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  Senhas coincidem
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* PIN/PIM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Senha PIM
            </CardTitle>
            <CardDescription>
              Configure uma senha PIM (PIN) para acesso rápido e segurança adicional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle para habilitar/desabilitar PIN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Habilitar Senha PIM</p>
                    <p className="text-sm text-muted-foreground">
                      {pinEnabled ? 'PIN está ativo e protegendo seções' : 'PIN está desativado'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pinEnabled}
                  onCheckedChange={(checked) => {
                    if (!checked && pinEnabled) {
                      // Se está desabilitando, abre modal
                      setShowDisablePinModal(true);
                      setPinToDisable('');
                    } else if (checked) {
                      // Se está habilitando, habilita diretamente
                      handleTogglePin(checked);
                    }
                  }}
                  disabled={loadingPin || !hasPin}
                />
              </div>
            </div>

            {/* Opções de Segurança do PIN */}
            {hasPin && (
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm">Opções de Segurança</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status do PIN:</span>
                    <Badge variant={pinEnabled ? "default" : "secondary"}>
                      {pinEnabled ? 'Ativo' : 'Desativado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Seções protegidas:</span>
                    <Badge variant="outline">
                      {protectedSections.length} seção(ões)
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {pinEnabled 
                        ? 'O PIN está protegendo as seções selecionadas abaixo.'
                        : 'Ative o PIN acima para proteger suas seções.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!hasPin && (
              <div className="space-y-4">
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="newPin">Definir Novo PIN</Label>
                  <div className="relative">
                    <Input
                      id="newPin"
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Apenas números
                        if (value.length <= 8) {
                          setPin(value);
                        }
                      }}
                      placeholder="Digite 4-8 dígitos"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O PIN deve conter apenas números (4-8 dígitos)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirmar PIN</Label>
                  <div className="relative">
                    <Input
                      id="confirmPin"
                      type={showConfirmPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Apenas números
                        if (value.length <= 8) {
                          setConfirmPin(value);
                        }
                      }}
                      placeholder="Digite o PIN novamente"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                    >
                      {showConfirmPin ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSetPin}
                  disabled={loadingPin || !pin || !confirmPin || pin !== confirmPin || pin.length < 4}
                  className="w-full"
                >
                  {loadingPin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Definir PIN
                    </>
                  )}
                </Button>

                {pin && confirmPin && pin === confirmPin && pin.length >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle className="w-4 h-4" />
                    PINs coincidem
                  </motion.div>
                )}
              </div>
            )}

            {hasPin && (
              <div className="space-y-4">
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPinForChange">PIN Atual (para alterar)</Label>
                    <div className="relative">
                      <Input
                        id="currentPinForChange"
                        type={showCurrentPin ? 'text' : 'password'}
                        value={currentPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) {
                            setCurrentPin(value);
                          }
                        }}
                        placeholder="Digite o PIN atual"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                      >
                        {showCurrentPin ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPinChange">Novo PIN</Label>
                    <div className="relative">
                      <Input
                        id="newPinChange"
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) {
                            setPin(value);
                          }
                        }}
                        placeholder="Digite 4-8 dígitos"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPinChange">Confirmar Novo PIN</Label>
                    <div className="relative">
                      <Input
                        id="confirmPinChange"
                        type={showConfirmPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) {
                            setConfirmPin(value);
                          }
                        }}
                        placeholder="Digite o PIN novamente"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                      >
                        {showConfirmPin ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSetPin}
                      disabled={loadingPin || !pin || !confirmPin || !currentPin || pin !== confirmPin || pin.length < 4}
                      className="flex-1"
                    >
                      {loadingPin ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Alterar PIN
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleRemovePin}
                      disabled={loadingPin || !currentPin}
                      variant="destructive"
                    >
                      {loadingPin ? (
                        <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Seções Protegidas */}
      {hasPin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockIcon className="w-5 h-5 text-primary" />
                Seções Protegidas
              </CardTitle>
              <CardDescription>
                Selecione quais seções requerem PIN para acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableSections.map((section) => {
                  const isProtected = protectedSections.includes(section.id);
                  const needsPin = pinToRemoveSection?.sectionId === section.id;
                  return (
                    <div key={section.id} className="space-y-2">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                        isProtected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/30 hover:border-primary/50",
                        needsPin || !pinEnabled ? "cursor-default opacity-60" : "cursor-pointer"
                      )}
                      onClick={() => {
                        if (!needsPin && pinEnabled) {
                          handleToggleProtectedSection(section.id);
                        }
                      }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{section.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{section.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {isProtected ? 'Protegida' : 'Pública'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isProtected && (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        <Switch
                          checked={isProtected}
                          onCheckedChange={() => handleToggleProtectedSection(section.id)}
                          disabled={loadingSections || needsPin || !pinEnabled}
                        />
                        </div>
                      </motion.div>
                      
                      {/* Campo de PIN para remover proteção */}
                      {needsPin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden p-3 rounded-lg border border-warning/50 bg-warning/10"
                        >
                          <p className="text-xs font-medium text-warning-foreground mb-2">
                            Digite o PIN para remover a proteção:
                          </p>
                          <div className="relative mb-2">
                            <Input
                              type={showCurrentPin ? 'text' : 'password'}
                              value={pinToRemoveSection?.pin || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 8) {
                                  setPinToRemoveSection({ sectionId: section.id, pin: value });
                                }
                              }}
                              placeholder="Digite o PIN"
                              className="pr-10 text-sm"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPin(!showCurrentPin)}
                            >
                              {showCurrentPin ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPinToRemoveSection(null)}
                              className="flex-1 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleToggleProtectedSection(section.id)}
                              disabled={!pinToRemoveSection?.pin || pinToRemoveSection.pin.length < 4}
                              className="flex-1 text-xs"
                            >
                              Remover
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {protectedSections.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Nenhuma seção protegida</p>
                  <p className="text-xs mt-1">
                    {pinEnabled 
                      ? 'Ative o switch para proteger uma seção'
                      : 'Habilite o PIN acima para proteger seções'}
                  </p>
                </div>
              )}
              
              {!pinEnabled && (
                <div className="p-4 rounded-lg border border-warning/50 bg-warning/10">
                  <p className="text-sm text-warning-foreground">
                    ⚠️ O PIN está desabilitado. Habilite o PIN acima para proteger seções.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modal de Seleção de Avatares */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-primary" />
              Escolher Avatar
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {AVATARS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id || 
                  (photoURL && isAvatarURL(photoURL) && getAvatarIdFromURL(photoURL) === avatar.id);
                return (
                  <motion.button
                    key={avatar.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectAvatar(avatar.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
                      avatar.color,
                      "shadow-md"
                    )}>
                      {avatar.emoji}
                    </div>
                    <span className="text-xs font-medium text-center">{avatar.name}</span>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary absolute top-2 right-2 bg-background rounded-full" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notificações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Gerencie permissões e lembretes automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationsSupported ? (
              <>
                {/* Permissão */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Permissão de Notificações</p>
                    <p className="text-sm text-muted-foreground">
                      {notificationPermission === 'granted' 
                        ? 'Notificações ativadas' 
                        : notificationPermission === 'denied'
                        ? 'Notificações bloqueadas'
                        : 'Permissão não solicitada'}
                    </p>
                  </div>
                  {notificationPermission !== 'granted' && (
                    <Button
                      onClick={async () => {
                        await requestNotificationPermission();
                        await requestPushPermission();
                      }}
                      variant={notificationPermission === 'denied' ? 'outline' : 'default'}
                      disabled={notificationPermission === 'denied'}
                    >
                      {notificationPermission === 'denied' 
                        ? 'Bloqueado' 
                        : 'Ativar Notificações'}
                    </Button>
                  )}
                  {notificationPermission === 'granted' && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Ativado</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const sent = await sendTestNotification();
                          if (sent) {
                            toast.success('Notificação de teste enviada!');
                          } else {
                            toast.error('Erro ao enviar notificação');
                          }
                        }}
                      >
                        Testar
                      </Button>
                    </div>
                  )}
                </div>
                
                {notificationPermission === 'denied' && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-700 dark:text-yellow-400">
                    <p className="font-medium mb-1">Notificações bloqueadas</p>
                    <p>Para ativar, acesse as configurações do navegador e permita notificações para este site.</p>
                  </div>
                )}

                {notificationPermission === 'granted' && (
                  <>
                    <Separator />
                    
                    {/* Lembrete de Check-in */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-lg">📝</span>
                          </div>
                          <div>
                            <p className="font-medium">Lembrete de Check-in</p>
                            <p className="text-sm text-muted-foreground">
                              Receba um lembrete para fazer seu check-in diário
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={checkinReminderEnabled}
                          onCheckedChange={(checked) => {
                            setCheckinReminderEnabled(checked);
                            if (checked) {
                              scheduleCheckinReminder(checkinReminderTime);
                              toast.success(`Lembrete agendado para ${checkinReminderTime}`);
                            } else {
                              toast.info('Lembrete de check-in desativado');
                            }
                          }}
                        />
                      </div>
                      {checkinReminderEnabled && (
                        <div className="flex items-center gap-2 ml-13 pl-13">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={checkinReminderTime}
                            onChange={(e) => {
                              setCheckinReminderTime(e.target.value);
                              scheduleCheckinReminder(e.target.value);
                            }}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">Horário do lembrete</span>
                        </div>
                      )}
                    </div>

                    {/* Lembretes de Hábitos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <span className="text-lg">🎯</span>
                          </div>
                          <div>
                            <p className="font-medium">Lembretes de Hábitos</p>
                            <p className="text-sm text-muted-foreground">
                              Receba lembretes para hábitos com horário definido
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={habitRemindersEnabled}
                          onCheckedChange={(checked) => {
                            setHabitRemindersEnabled(checked);
                            if (checked) {
                              scheduleHabitReminders();
                              toast.success('Lembretes de hábitos ativados');
                            } else {
                              toast.info('Lembretes de hábitos desativados');
                            }
                          }}
                        />
                      </div>
                      {habitRemindersEnabled && (
                        <div className="p-3 rounded-lg bg-muted/50 ml-13">
                          <p className="text-sm text-muted-foreground">
                            💡 Configure o horário de cada hábito na seção de Hábitos para receber lembretes personalizados.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Notificações não são suportadas neste navegador</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal para desabilitar PIN */}
      <Dialog open={showDisablePinModal} onOpenChange={setShowDisablePinModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-warning" />
              Desabilitar PIN
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg border border-warning/50 bg-warning/10">
              <p className="text-sm text-warning-foreground mb-2">
                Ao desabilitar o PIN, todas as restrições serão removidas e todas as seções ficarão liberadas.
              </p>
              <p className="text-sm font-medium text-foreground">
                Digite o PIN atual para confirmar:
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disablePinInput">PIN Atual</Label>
              <div className="relative">
                <Input
                  id="disablePinInput"
                  type={showCurrentPin ? 'text' : 'password'}
                  value={pinToDisable}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 8) {
                      setPinToDisable(value);
                    }
                  }}
                  placeholder="Digite o PIN atual"
                  className="pr-10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pinToDisable.length >= 4) {
                      handleDisablePin();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                >
                  {showCurrentPin ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisablePinModal(false);
                setPinToDisable('');
              }}
              disabled={loadingPin}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDisablePin}
              disabled={!pinToDisable || pinToDisable.length < 4 || loadingPin}
              variant="destructive"
            >
              {loadingPin ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Desabilitando...
                </>
              ) : (
                'Desabilitar PIN'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

