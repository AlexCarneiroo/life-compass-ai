import { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Visão da Vida', emoji: '🏠' },
  { id: 'checkin', icon: CheckSquare, label: 'Check-in Diário', emoji: '✅' },
  { id: 'habits', icon: Target, label: 'Hábitos', emoji: '🎯' },
  { id: 'mood', icon: Heart, label: 'Humor & Emoções', emoji: '💖' },
  { id: 'finance', icon: Wallet, label: 'Financeiro', emoji: '💰' },
  { id: 'goals', icon: Sparkles, label: 'Metas & Objetivos', emoji: '⭐' },
  { id: 'health', icon: Dumbbell, label: 'Saúde', emoji: '💪' },
  { id: 'routines', icon: Clock, label: 'Rotinas', emoji: '⏰' },
  { id: 'journal', icon: BookOpen, label: 'Diário', emoji: '📔' },
  { id: 'work', icon: Briefcase, label: 'Vida Profissional', emoji: '💼' },
  { id: 'ai', icon: Brain, label: 'IA Coach', emoji: '🤖' },
  { id: 'reports', icon: BarChart3, label: 'Relatórios', emoji: '📊' },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg text-sidebar-foreground">LifeOS</h1>
              <p className="text-xs text-muted-foreground">Sua vida em foco</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                activeSection === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="text-lg">{item.emoji}</span>
              {!collapsed && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
