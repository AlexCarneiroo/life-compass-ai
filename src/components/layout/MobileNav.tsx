import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Target, 
  Wallet, 
  Menu,
  Moon,
  Sun,
  CheckSquare,
  Dumbbell,
  Sparkles,
  Clock,
  BookOpen,
  Brain,
  BarChart3,
  User,
  Users,
  Settings,
  LogOut,
  Trophy,
  Bell,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { isAvatarURL, getAvatarIdFromURL, getAvatarById } from '@/lib/utils/avatars';

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Visão da Vida', icon: LayoutDashboard, color: 'text-indigo-500', activeBg: 'bg-indigo-500' },
  { id: 'checkin', label: 'Check-in Diário', icon: CheckSquare, color: 'text-emerald-500', activeBg: 'bg-emerald-500' },
  { id: 'habits', label: 'Hábitos', icon: Target, color: 'text-purple-500', activeBg: 'bg-purple-500' },
  { id: 'finance', label: 'Financeiro', icon: Wallet, color: 'text-blue-500', activeBg: 'bg-blue-500' },
  { id: 'goals', label: 'Metas & Objetivos', icon: Sparkles, color: 'text-yellow-500', activeBg: 'bg-yellow-500' },
  { id: 'health', label: 'Saúde', icon: Dumbbell, color: 'text-orange-500', activeBg: 'bg-orange-500' },
  { id: 'routines', label: 'Rotinas', icon: Clock, color: 'text-cyan-500', activeBg: 'bg-cyan-500' },
  { id: 'journal', label: 'Diário', icon: BookOpen, color: 'text-rose-500', activeBg: 'bg-rose-500' },
  { id: 'ai', label: 'IA Coach', icon: Brain, color: 'text-violet-500', activeBg: 'bg-violet-500' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, color: 'text-teal-500', activeBg: 'bg-teal-500' },
  { id: 'achievements', label: 'Conquistas', icon: Trophy, color: 'text-amber-500', activeBg: 'bg-amber-500' },
  { id: 'social', label: 'Comunidade', icon: Users, color: 'text-sky-500', activeBg: 'bg-sky-500' },
];

const quickNavItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Visão Geral', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', activeBg: 'bg-indigo-500', glow: 'shadow-indigo-500/30' },
  { id: 'checkin', icon: CheckSquare, label: 'Check-in', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', activeBg: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
  { id: 'health', icon: Dumbbell, label: 'Saúde', color: 'text-orange-500', bgColor: 'bg-orange-500/10', activeBg: 'bg-orange-500', glow: 'shadow-orange-500/30' },
  { id: 'habits', icon: Target, label: 'Hábitos', color: 'text-purple-500', bgColor: 'bg-purple-500/10', activeBg: 'bg-purple-500', glow: 'shadow-purple-500/30' },
];

export function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      {/* Top Mobile Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="lg:hidden fixed top-0 left-0 right-0 h-14 glass-strong border-b border-border/50 z-50 px-4 flex items-center justify-between"
      >
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </motion.div>
          <span className="font-bold">LifeOS</span>
        </motion.div>
        
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl relative z-50">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] p-0 glass-card border-border/50 z-[60]">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Notificações</h3>
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

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-xl relative z-50"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-50">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 glass-strong border-r border-sidebar-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">LifeOS</h1>
                    <p className="text-xs text-muted-foreground">Sua vida em foco</p>
                  </div>
                </div>
              </div>
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                      activeSection === item.id
                        ? cn(item.activeBg, "text-white shadow-lg")
                        : cn("text-foreground hover:bg-muted/50", item.color)
                    )}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        activeSection === item.id 
                          ? "bg-white/20" 
                          : "bg-muted/30"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                    </motion.div>
                    <span>{item.label}</span>
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-r-full", item.activeBg)}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* Profile Section */}
              <div className="p-3 border-t border-border/50 space-y-1">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center overflow-hidden">
                        {user?.photoURL ? (
                          isAvatarURL(user.photoURL) ? (
                            <div className="w-full h-full flex items-center justify-center text-lg bg-gradient-to-br from-primary/20 to-primary/5">
                              {getAvatarById(getAvatarIdFromURL(user.photoURL) || '')?.emoji || '👤'}
                            </div>
                          ) : (
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              className="w-full h-full rounded-lg object-cover"
                            />
                          )
                        ) : (
                          <User className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <span className="flex-1 text-left">{user?.displayName || user?.email || 'Meu Perfil'}</span>
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[60]">
                    <DropdownMenuLabel>Menu</DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => {
                        handleSectionChange('settings');
                      }}
                    >
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.header>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Background blur */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
        
        {/* Content */}
        <div className="relative flex items-center justify-around h-16 max-w-md mx-auto px-3">
          {quickNavItems.map((item, index) => {
            const isActive = activeSection === item.id;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSectionChange(item.id)}
                className="flex flex-col items-center justify-center flex-1 relative group"
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="bottomActiveBg"
                    className={cn("absolute inset-0 -mx-2 rounded-2xl", item.bgColor)}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Icon container */}
                <motion.div
                  className={cn(
                    "relative mb-1 transition-all duration-300",
                    isActive ? "scale-105" : "scale-100"
                  )}
                  animate={isActive ? { y: [-1, 0] } : { y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive 
                      ? cn(item.activeBg, "text-white shadow-md", item.glow)
                      : cn(item.bgColor, item.color, "group-hover:opacity-80")
                  )}>
                    <item.icon className={cn(
                      "transition-all duration-300",
                      isActive ? "w-5 h-5" : "w-4 h-4"
                    )} />
                  </div>
                  
                  {/* Glow effect when active */}
                  {isActive && (
                    <motion.div
                      className={cn("absolute inset-0 rounded-2xl blur-xl", item.bgColor)}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300 text-center leading-tight",
                  isActive 
                    ? item.color
                    : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.label}
                </span>
                
                {/* Bottom dot indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottomActiveDot"
                    className={cn("absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", item.activeBg)}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
