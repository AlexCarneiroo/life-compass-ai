import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Sparkles } from 'lucide-react';

interface PlaceholderSectionProps {
  title: string;
  description: string;
  emoji: string;
}

export function PlaceholderSection({ title, description, emoji }: PlaceholderSectionProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="max-w-md text-center p-8">
        <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-6 animate-bounce-soft">
          <span className="text-4xl">{emoji}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Construction className="w-4 h-4" />
          <span>Em desenvolvimento</span>
        </div>
        <Button variant="outline" className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Notificar quando disponível
        </Button>
      </Card>
    </div>
  );
}
