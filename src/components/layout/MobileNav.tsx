import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Target, 
  Heart, 
  Wallet, 
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Visão da Vida', emoji: '🏠' },
  { id: 'checkin', label: 'Check-in Diário', emoji: '✅' },
  { id: 'habits', label: 'Hábitos', emoji: '🎯' },
  { id: 'mood', label: 'Humor & Emoções', emoji: '💖' },
  { id: 'finance', label: 'Financeiro', emoji: '💰' },
  { id: 'goals', label: 'Metas & Objetivos', emoji: '⭐' },
  { id: 'health', label: 'Saúde', emoji: '💪' },
  { id: 'routines', label: 'Rotinas', emoji: '⏰' },
  { id: 'journal', label: 'Diário', emoji: '📔' },
  { id: 'work', label: 'Vida Profissional', emoji: '💼' },
  { id: 'ai', label: 'IA Coach', emoji: '🤖' },
  { id: 'reports', label: 'Relatórios', emoji: '📊' },
];

const quickNavItems = [
  { id: 'dashboard', emoji: '🏠' },
  { id: 'habits', emoji: '🎯' },
  { id: 'mood', emoji: '💖' },
  { id: 'finance', emoji: '💰' },
];

export function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setOpen(false);
  };

  return (
    <>
      {/* Top Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-md border-b border-border z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-sm">✨</span>
          </div>
          <span className="font-bold">LifeOS</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span>✨</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg">LifeOS</h1>
                  <p className="text-xs text-muted-foreground">Sua vida em foco</p>
                </div>
              </div>
            </div>
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border z-50 px-2">
        <div className="flex items-center justify-around h-full">
          {quickNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all",
                activeSection === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-xl">{item.emoji}</span>
            </button>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-muted-foreground">
                <Menu className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Mais</span>
              </button>
            </SheetTrigger>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
