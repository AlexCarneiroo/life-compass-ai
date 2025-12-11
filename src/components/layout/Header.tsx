import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, Moon, Sun, Settings, LogOut, Trophy, Award, Check, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { userStatsService } from '@/lib/firebase/userStats';
import { UserStats, Badge } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function Header() {
  const { userId, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalHabitsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    loadStats();
    // Listener para atualizar quando ganhar XP ou badge
    const handleStatsUpdate = () => {
      loadStats();
    };
    window.addEventListener('stats-updated', handleStatsUpdate);
    return () => {
      window.removeEventListener('stats-updated', handleStatsUpdate);
    };
  }, [userId]);

  const loadStats = async () => {
    try {
      const userStats = await userStatsService.getOrCreate(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      navigate('/login');
    } catch (error) {
      // Erro já é tratado no authService
    }
  };

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const formattedDate = today.toLocaleDateString('pt-BR', options);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 glass-strong border-b border-border/50"
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-foreground">
            Olá! 👋
          </h2>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </motion.div>

        {/* Center - Search */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-xl px-4 py-2 w-80 border border-border/30"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </motion.div>

        {/* Right side */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* XP Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-1.5 border border-primary/20"
          >
            <motion.span 
              className="text-lg"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              ⚡
            </motion.span>
            <div className="text-sm">
              <span className="font-bold">{stats.xp.toLocaleString()}</span>
              <span className="text-primary/70"> XP</span>
            </div>
          </motion.div>

          {/* Level Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 gradient-indigo text-indigo-foreground rounded-full px-3 sm:px-4 py-1.5 shadow-lg"
          >
            <span className="text-sm font-bold">Nível {stats.level}</span>
          </motion.div>

          {/* Theme Toggle */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-xl"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </motion.div>

          {/* Notifications */}
          <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="relative rounded-xl">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <motion.span 
                      className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-xs font-bold text-accent-foreground"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 glass-card border-border/50 p-0">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="font-semibold">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} não lidas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await markAllAsRead();
                    }}
                    className="h-7 text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-sm">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((notification) => {
                      const Icon = notification.type === 'negative' 
                        ? AlertCircle 
                        : notification.type === 'positive'
                        ? CheckCircle
                        : Info;
                      
                      const iconColor = notification.type === 'negative'
                        ? 'text-red-500'
                        : notification.type === 'positive'
                        ? 'text-green-500'
                        : 'text-blue-500';

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer group",
                            !notification.read && "bg-primary/5"
                          )}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!notification.read) {
                              await markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5", iconColor)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  "font-semibold text-sm",
                                  !notification.read && "font-bold"
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-accent rounded-full mt-1.5 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card border-border/50">
              {/* Profile Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full gradient-indigo flex items-center justify-center shadow-lg">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {user?.displayName || user?.email || 'Meu Perfil'}
                    </p>
                    <p className="text-xs text-muted-foreground">Nível {stats.level}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">XP Total</span>
                    <span className="font-bold text-primary">{stats.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-indigo transition-all duration-500"
                      style={{ width: `${(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Próximo nível: {stats.xpToNextLevel.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-border/50">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{stats.totalHabitsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Hábitos</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{stats.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">Sequência</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{stats.badges.length}</p>
                    <p className="text-xs text-muted-foreground">Conquistas</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <DropdownMenuLabel className="px-2 py-1.5">Menu</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  setIsBadgesModalOpen(true);
                  setIsProfileOpen(false);
                }}
                className="cursor-pointer"
              >
                <Trophy className="w-4 h-4 mr-2 text-warning" />
                Ver Conquistas
                {stats.badges.length > 0 && (
                  <span className="ml-auto bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full">
                    {stats.badges.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Badges Modal */}
          <Dialog open={isBadgesModalOpen} onOpenChange={setIsBadgesModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  Minhas Conquistas
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {stats.badges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-2">Nenhuma conquista ainda</p>
                    <p className="text-sm text-muted-foreground">
                      Complete hábitos, faça check-ins e treine para desbloquear conquistas!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {stats.badges.map((badge) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                      >
                        <span className="text-5xl mb-2">{badge.icon}</span>
                        <p className="font-semibold text-sm text-center mb-1">{badge.name}</p>
                        <p className="text-xs text-muted-foreground text-center">{badge.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(badge.earnedDate).toLocaleDateString('pt-BR')}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </motion.header>
  );
}
