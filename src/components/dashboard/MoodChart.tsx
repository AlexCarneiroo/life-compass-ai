import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { mockWeeklyData, moodEmojis } from '@/lib/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function MoodChart() {
  const data = mockWeeklyData.days.map((day, index) => ({
    day,
    mood: mockWeeklyData.mood[index],
    energy: mockWeeklyData.energy[index],
    productivity: mockWeeklyData.productivity[index],
  }));

  const averageMood = (mockWeeklyData.mood.reduce((a, b) => a + b, 0) / mockWeeklyData.mood.length).toFixed(1);

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>📈</span> Evolução Semanal
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Humor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted-foreground">Energia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Produtividade</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175, 70%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(175, 70%, 45%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(15, 85%, 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(15, 85%, 55%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="mood" 
                stroke="hsl(175, 70%, 45%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMood)" 
              />
              <Area 
                type="monotone" 
                dataKey="energy" 
                stroke="hsl(15, 85%, 55%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEnergy)" 
              />
              <Area 
                type="monotone" 
                dataKey="productivity" 
                stroke="hsl(150, 60%, 45%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorProd)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Humor médio:</span>
          <span className="text-2xl">{moodEmojis[Math.round(Number(averageMood)) - 1] || '😐'}</span>
          <span className="font-bold text-foreground">{averageMood}/5</span>
        </div>
      </CardContent>
    </Card>
  );
}
