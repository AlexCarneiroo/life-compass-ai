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
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Visão da Vida', icon: LayoutDashboard },
  { id: 'checkin', label: 'Check-in Diário', icon: CheckSquare },
  { id: 'habits', label: 'Hábitos', icon: Target },
  // { id: 'mood', label: 'Humor & Emoções', icon: Heart }, // Arquivado
  { id: 'finance', label: 'Financeiro', icon: Wallet },
  { id: 'goals', label: 'Metas & Objetivos', icon: Sparkles },
  { id: 'health', label: 'Saúde', icon: Dumbbell },
  { id: 'routines', label: 'Rotinas', icon: Clock },
  { id: 'journal', label: 'Diário', icon: BookOpen },
  // { id: 'work', label: 'Vida Profissional', icon: Briefcase }, // Arquivado
  { id: 'ai', label: 'IA Coach', icon: Brain },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

const quickNavItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Visão Geral', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', activeBg: 'bg-indigo-500', glow: 'shadow-indigo-500/30' },
  { id: 'checkin', icon: CheckSquare, label: 'Check-in', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', activeBg: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
  { id: 'health', icon: Dumbbell, label: 'Saúde', color: 'text-orange-500', bgColor: 'bg-orange-500/10', activeBg: 'bg-orange-500', glow: 'shadow-orange-500/30' },
  { id: 'habits', icon: Target, label: 'Hábitos', color: 'text-purple-500', bgColor: 'bg-purple-500/10', activeBg: 'bg-purple-500', glow: 'shadow-purple-500/30' },
];

export function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setOpen(false);
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
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
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
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
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
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className="w-5 h-5" />
                    </motion.div>
                    <span>{item.label}</span>
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
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
