import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Target, 
  Heart, 
  Wallet, 
  Activity, 
  CheckSquare, 
  Brain, 
  Clock, 
  Dumbbell, 
  BarChart3, 
  Briefcase, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Wrench,
  Trophy,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Visão da Vida', color: 'text-indigo-500', activeBg: 'bg-indigo-500' },
  { id: 'checkin', icon: CheckSquare, label: 'Check-in Diário', color: 'text-emerald-500', activeBg: 'bg-emerald-500' },
  { id: 'habits', icon: Target, label: 'Hábitos', color: 'text-purple-500', activeBg: 'bg-purple-500' },
  // { id: 'mood', icon: Heart, label: 'Humor & Emoções', color: 'text-pink-500', activeBg: 'bg-pink-500' }, // Arquivado
  { id: 'finance', icon: Wallet, label: 'Financeiro', color: 'text-blue-500', activeBg: 'bg-blue-500' },
  { id: 'goals', icon: Sparkles, label: 'Metas & Objetivos', color: 'text-yellow-500', activeBg: 'bg-yellow-500' },
  { id: 'health', icon: Dumbbell, label: 'Saúde', color: 'text-orange-500', activeBg: 'bg-orange-500' },
  { id: 'routines', icon: Clock, label: 'Rotinas', color: 'text-cyan-500', activeBg: 'bg-cyan-500' },
  { id: 'journal', icon: BookOpen, label: 'Diário', color: 'text-rose-500', activeBg: 'bg-rose-500' },
  // { id: 'work', icon: Briefcase, label: 'Vida Profissional', color: 'text-slate-500', activeBg: 'bg-slate-500' }, // Arquivado
  { id: 'ai', icon: Brain, label: 'IA Coach', color: 'text-violet-500', activeBg: 'bg-violet-500' },
  { id: 'reports', icon: BarChart3, label: 'Relatórios', color: 'text-teal-500', activeBg: 'bg-teal-500' },
  { id: 'achievements', icon: Trophy, label: 'Conquistas', color: 'text-amber-500', activeBg: 'bg-amber-500' },
  { id: 'social', icon: Users, label: 'Comunidade', color: 'text-sky-500', activeBg: 'bg-sky-500' },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed left-0 top-0 h-screen glass-strong border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-4 border-b border-sidebar-border"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-bold text-lg text-sidebar-foreground">LifeOS</h1>
                <p className="text-xs text-muted-foreground">Sua vida em foco</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Menu */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                activeSection === item.id
                  ? cn(item.activeBg, "text-white shadow-lg")
                  : cn("text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground", item.color)
              )}
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  activeSection === item.id 
                    ? "bg-white/20" 
                    : "bg-sidebar-accent/30"
                )}
              >
                <item.icon className="w-4 h-4" />
              </motion.div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-r-full", item.activeBg)}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-3 border-t border-sidebar-border"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 rounded-xl hover:bg-sidebar-accent/50 transition-colors"
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </motion.div>
        </motion.button>
      </motion.div>
    </motion.aside>
  );
}
