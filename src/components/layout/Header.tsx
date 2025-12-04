import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockUserStats } from '@/lib/mockData';

export function Header() {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const formattedDate = today.toLocaleDateString('pt-BR', options);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Olá! 👋
          </h2>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-4 py-2 w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* XP Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5">
            <span className="text-lg">⚡</span>
            <div className="text-sm">
              <span className="font-bold">{mockUserStats.xp}</span>
              <span className="text-primary/70"> XP</span>
            </div>
          </div>

          {/* Level Badge */}
          <div className="hidden sm:flex items-center gap-2 gradient-accent text-accent-foreground rounded-full px-4 py-1.5 shadow-sm">
            <span className="text-sm font-bold">Nível {mockUserStats.level}</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>

          {/* Profile */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
