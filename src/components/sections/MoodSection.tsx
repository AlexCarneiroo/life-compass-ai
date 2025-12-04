import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moodEmojis, mockWeeklyData } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, Calendar, MessageCircle, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const motivationalQuotes = [
  { quote: "A felicidade não é algo pronto. Ela vem das suas próprias ações.", author: "Dalai Lama" },
  { quote: "O único modo de fazer um excelente trabalho é amar o que você faz.", author: "Steve Jobs" },
  { quote: "Acredite que você pode e você já está no meio do caminho.", author: "Theodore Roosevelt" },
];

const relationshipIdeas = [
  "Prepare um jantar especial",
  "Escreva uma carta de amor",
  "Planeje uma viagem surpresa",
  "Assista o filme favorito juntos",
  "Faça um álbum de fotos do casal",
];

export function MoodSection() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const moodData = mockWeeklyData.days.map((day, index) => ({
    day,
    mood: mockWeeklyData.mood[index],
    energy: mockWeeklyData.energy[index],
  }));

  const averageMood = (mockWeeklyData.mood.reduce((a, b) => a + b, 0) / mockWeeklyData.mood.length);
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Humor & Emoções</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seu bem-estar emocional</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="gradient" className="p-5">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{moodEmojis[Math.round(averageMood) - 1]}</span>
            <div>
              <p className="text-sm text-muted-foreground">Humor médio</p>
              <p className="text-2xl font-bold">{averageMood.toFixed(1)}/5</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-5 gradient-primary text-primary-foreground">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Tendência</p>
              <p className="text-2xl font-bold">+15% ↑</p>
              <p className="text-xs opacity-70">vs semana passada</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-5 gradient-accent text-accent-foreground">
          <div className="flex items-center gap-4">
            <Heart className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-sm opacity-80">Melhor dia</p>
              <p className="text-2xl font-bold">Quinta</p>
              <p className="text-xs opacity-70">Humor: 5/5</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mood Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📈</span> Evolução do Humor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(340, 70%, 55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(340, 70%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="hsl(340, 70%, 55%)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#moodGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mood Timeline */}
          <div className="flex justify-between mt-6">
            {mockWeeklyData.days.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDate(index)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all",
                  selectedDate === index 
                    ? "bg-primary/20 ring-2 ring-primary" 
                    : "hover:bg-muted"
                )}
              >
                <span className="text-2xl">{moodEmojis[mockWeeklyData.mood[index] - 1]}</span>
                <span className="text-xs text-muted-foreground mt-1">{day}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motivational Quote */}
        <Card className="p-6 gradient-energy text-energy-foreground">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-8 h-8 opacity-80 flex-shrink-0 mt-1" />
            <div>
              <p className="text-lg font-medium italic">"{randomQuote.quote}"</p>
              <p className="text-sm opacity-80 mt-2">— {randomQuote.author}</p>
            </div>
          </div>
        </Card>

        {/* Relationship Module */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span>💕</span> Relacionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm font-semibold mb-2">Ideias para melhorar</p>
              <ul className="space-y-2">
                {relationshipIdeas.slice(0, 3).map((idea, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="w-3 h-3 text-accent" />
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button variant="outline" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Adicionar data especial
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Register Mood Button */}
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Como você está se sentindo agora?</p>
        <div className="flex justify-center gap-4">
          {moodEmojis.map((emoji, index) => (
            <button
              key={index}
              className="w-14 h-14 rounded-xl text-3xl bg-muted hover:bg-muted/80 hover:scale-110 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
        <Button className="mt-6" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Humor
        </Button>
      </Card>
    </div>
  );
}
