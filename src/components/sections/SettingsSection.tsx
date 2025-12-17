import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Smile,
  ChevronDown
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

// Componente de seção expansível
interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

function CollapsibleSection({ title, description, icon, children, defaultOpen = false, badge }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {title}
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </CardTitle>
                {description && (
                  <CardDescription className="text-xs mt-0.5">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </CardHeader>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 pb-4">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

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

  // Carregar configurações do PIN e Notificações
  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const loadSettings = async () => {
    try {
      const settings = await userSettingsService.getOrCreate(userId);
      // PIN
      setPinEnabled(settings.pinEnabled || false);
      setHasPin(!!settings.pin);
      setProtectedSections(settings.protectedSections || []);
      // Notificações
      setCheckinReminderEnabled(settings.checkinReminderEnabled || false);
      setCheckinReminderTime(settings.checkinReminderTime || '21:00');
      setHabitRemindersEnabled(settings.habitRemindersEnabled || false);
    } catch (error) {
      logger.error('Erro ao carregar configurações:', error);
    }
  };

  // Alias para manter compatibilidade
  const loadPinSettings = loadSettings;

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
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações e preferências
          </p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {/* Perfil */}
        <CollapsibleSection
          title="Perfil"
          description="Nome, avatar e informações pessoais"
          icon={<User className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            {/* Avatar compacto */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                {photoURL && isAvatarURL(photoURL) ? (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                    {getAvatarById(getAvatarIdFromURL(photoURL) || '')?.emoji || '👤'}
                  </div>
                ) : photoURL ? (
                  <AvatarImage src={photoURL} alt={displayName || 'Usuário'} />
                ) : null}
                <AvatarFallback className="text-xl">
                  {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <Smile className="w-4 h-4 mr-1" />
                  Alterar
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
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Nome e Email em grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs">Nome</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted h-9 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={loading || !displayName}
              size="sm"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CollapsibleSection>

        {/* Segurança - Alterar Senha */}
        <CollapsibleSection
          title="Alterar Senha"
          description="Atualize sua senha de acesso"
          icon={<Lock className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••"
                    className="h-9 pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-9 pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">Confirmar</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="h-9 pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                size="sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    Alterar
                  </>
                )}
              </Button>
              {newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Senhas coincidem
                </span>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* PIN/PIM */}
        <CollapsibleSection
          title="Senha PIM"
          description="Proteção adicional com PIN"
          icon={<Key className="w-5 h-5" />}
          badge={hasPin ? (pinEnabled ? 'Ativo' : 'Inativo') : undefined}
        >
          <div className="space-y-4">
            {/* Toggle rápido */}
            {hasPin && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">PIN {pinEnabled ? 'Ativo' : 'Desativado'}</p>
                    <p className="text-xs text-muted-foreground">
                      {protectedSections.length} seção(ões) protegida(s)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pinEnabled}
                  onCheckedChange={(checked) => {
                    if (!checked && pinEnabled) {
                      setShowDisablePinModal(true);
                      setPinToDisable('');
                    } else if (checked) {
                      handleTogglePin(checked);
                    }
                  }}
                  disabled={loadingPin}
                />
              </div>
            )}

            {/* Criar PIN */}
            {!hasPin && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPin" className="text-xs">Novo PIN (4-8 dígitos)</Label>
                    <div className="relative">
                      <Input
                        id="newPin"
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) setPin(value);
                        }}
                        placeholder="••••"
                        maxLength={8}
                        className="h-9 pr-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPin" className="text-xs">Confirmar PIN</Label>
                    <div className="relative">
                      <Input
                        id="confirmPin"
                        type={showConfirmPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) setConfirmPin(value);
                        }}
                        placeholder="••••"
                        maxLength={8}
                        className="h-9 pr-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                      >
                        {showConfirmPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSetPin}
                    disabled={loadingPin || !pin || !confirmPin || pin !== confirmPin || pin.length < 4}
                    size="sm"
                  >
                    {loadingPin ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-1" />
                        Criar PIN
                      </>
                    )}
                  </Button>
                  {pin && confirmPin && pin === confirmPin && pin.length >= 4 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      PINs coincidem
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Alterar/Remover PIN */}
            {hasPin && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs text-muted-foreground">Alterar ou remover PIN:</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">PIN Atual</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPin ? 'text' : 'password'}
                        value={currentPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) setCurrentPin(value);
                        }}
                        placeholder="••••"
                        maxLength={8}
                        className="h-9 pr-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                      >
                        {showCurrentPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Novo PIN</Label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) setPin(value);
                        }}
                        placeholder="••••"
                        maxLength={8}
                        className="h-9 pr-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Confirmar</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) setConfirmPin(value);
                        }}
                        placeholder="••••"
                        maxLength={8}
                        className="h-9 pr-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                      >
                        {showConfirmPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSetPin}
                    disabled={loadingPin || !pin || !confirmPin || !currentPin || pin !== confirmPin || pin.length < 4}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Alterar
                  </Button>
                  <Button
                    onClick={handleRemovePin}
                    disabled={loadingPin || !currentPin}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Seções Protegidas - compacto */}
            {hasPin && pinEnabled && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium">Seções protegidas:</p>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {availableSections.map((section) => {
                    const isProtected = protectedSections.includes(section.id);
                    const needsPin = pinToRemoveSection?.sectionId === section.id;
                    return (
                      <div key={section.id}>
                        <div
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer",
                            isProtected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                          )}
                          onClick={() => !needsPin && handleToggleProtectedSection(section.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{section.icon}</span>
                            <span className="text-xs font-medium">{section.label}</span>
                          </div>
                          <Switch
                            checked={isProtected}
                            onCheckedChange={() => handleToggleProtectedSection(section.id)}
                            disabled={loadingSections || needsPin}
                            className="scale-75"
                          />
                        </div>
                        {needsPin && (
                          <div className="mt-1 p-2 rounded border border-warning/50 bg-warning/10">
                            <Input
                              type="password"
                              value={pinToRemoveSection?.pin || ''}
                              onChange={(e) => setPinToRemoveSection({ sectionId: section.id, pin: e.target.value.replace(/\D/g, '') })}
                              placeholder="PIN"
                              className="h-7 text-xs mb-1"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setPinToRemoveSection(null)} className="flex-1 h-6 text-xs">
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={() => handleToggleProtectedSection(section.id)} disabled={!pinToRemoveSection?.pin || pinToRemoveSection.pin.length < 4} className="flex-1 h-6 text-xs">
                                OK
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

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
        <CollapsibleSection
          title="Notificações"
          description="Lembretes e alertas"
          icon={<Bell className="w-5 h-5" />}
          badge={notificationPermission === 'granted' ? 'Ativo' : undefined}
        >
          {notificationsSupported ? (
            <div className="space-y-3">
              {/* Permissão */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {notificationPermission === 'granted' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {notificationPermission === 'granted' ? 'Ativado' : notificationPermission === 'denied' ? 'Bloqueado' : 'Não configurado'}
                  </span>
                </div>
                {notificationPermission !== 'granted' ? (
                  <Button
                    onClick={async () => {
                      await requestNotificationPermission();
                      await requestPushPermission();
                    }}
                    size="sm"
                    disabled={notificationPermission === 'denied'}
                  >
                    Ativar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const sent = await sendTestNotification();
                      toast[sent ? 'success' : 'error'](sent ? 'Notificação enviada!' : 'Erro');
                    }}
                  >
                    Testar
                  </Button>
                )}
              </div>

              {notificationPermission === 'denied' && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 p-2 rounded bg-yellow-500/10">
                  ⚠️ Bloqueado pelo navegador. Vá nas configurações do navegador para permitir.
                </p>
              )}

              {notificationPermission === 'granted' && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Check-in */}
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <div>
                        <p className="text-sm font-medium">Check-in diário</p>
                        {checkinReminderEnabled && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <Input
                              type="time"
                              value={checkinReminderTime}
                              onChange={async (e) => {
                                setCheckinReminderTime(e.target.value);
                                await userSettingsService.saveNotificationSettings(userId, { checkinReminderTime: e.target.value });
                                scheduleCheckinReminder(e.target.value);
                              }}
                              className="h-6 w-24 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={checkinReminderEnabled}
                      onCheckedChange={async (checked) => {
                        setCheckinReminderEnabled(checked);
                        await userSettingsService.saveNotificationSettings(userId, { checkinReminderEnabled: checked });
                        if (checked) scheduleCheckinReminder(checkinReminderTime);
                      }}
                    />
                  </div>

                  {/* Hábitos */}
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <p className="text-sm font-medium">Lembretes de hábitos</p>
                        <p className="text-xs text-muted-foreground">Configure em cada hábito</p>
                      </div>
                    </div>
                    <Switch
                      checked={habitRemindersEnabled}
                      onCheckedChange={async (checked) => {
                        setHabitRemindersEnabled(checked);
                        await userSettingsService.saveNotificationSettings(userId, { habitRemindersEnabled: checked });
                        if (checked) scheduleHabitReminders();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Notificações não suportadas neste navegador
            </p>
          )}
        </CollapsibleSection>
      </div>

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

