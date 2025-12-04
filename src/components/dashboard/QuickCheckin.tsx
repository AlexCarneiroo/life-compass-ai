import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moodEmojis } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Droplet, Moon, Zap, DollarSign, Dumbbell } from 'lucide-react';

export function QuickCheckin() {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(5);
  const [water, setWater] = useState(4);
  const [sleep, setSleep] = useState(7);
  const [workout, setWorkout] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span>✅</span> Check-in Rápido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mood Selection */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Como você está se sentindo?</p>
          <div className="flex justify-between">
            {moodEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => setMood(index)}
                className={cn(
                  "w-12 h-12 rounded-xl text-2xl transition-all duration-200 hover:scale-110",
                  mood === index 
                    ? "bg-primary/20 ring-2 ring-primary scale-110" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Energy Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">Energia</span>
            </div>
            <span className="text-sm font-semibold">{energy}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-warning"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Water */}
          <div className="p-3 rounded-xl bg-muted text-center">
            <Droplet className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="flex items-center justify-center gap-1">
              <button 
                onClick={() => setWater(Math.max(0, water - 1))}
                className="w-6 h-6 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                -
              </button>
              <span className="font-bold text-lg w-6">{water}</span>
              <button 
                onClick={() => setWater(water + 1)}
                className="w-6 h-6 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Copos</p>
          </div>

          {/* Sleep */}
          <div className="p-3 rounded-xl bg-muted text-center">
            <Moon className="w-5 h-5 text-energy mx-auto mb-1" />
            <div className="flex items-center justify-center gap-1">
              <button 
                onClick={() => setSleep(Math.max(0, sleep - 0.5))}
                className="w-6 h-6 rounded-full bg-card hover:bg-energy/10 transition-colors"
              >
                -
              </button>
              <span className="font-bold text-lg w-8">{sleep}</span>
              <button 
                onClick={() => setSleep(sleep + 0.5)}
                className="w-6 h-6 rounded-full bg-card hover:bg-energy/10 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Horas sono</p>
          </div>

          {/* Workout */}
          <button 
            onClick={() => setWorkout(!workout)}
            className={cn(
              "p-3 rounded-xl text-center transition-all",
              workout ? "bg-success/20 ring-2 ring-success" : "bg-muted"
            )}
          >
            <Dumbbell className={cn("w-5 h-5 mx-auto mb-1", workout ? "text-success" : "text-muted-foreground")} />
            <span className={cn("font-bold text-lg", workout ? "text-success" : "text-foreground")}>
              {workout ? '✓' : '—'}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Treinou?</p>
          </button>
        </div>

        <Button className="w-full" size="lg">
          Salvar Check-in
        </Button>
      </CardContent>
    </Card>
  );
}
