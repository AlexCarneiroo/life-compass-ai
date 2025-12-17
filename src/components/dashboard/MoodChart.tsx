import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { moodEmojis } from '@/lib/constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { checkinService } from '@/lib/firebase/checkin';
import { DailyCheckIn } from '@/types';

export function MoodChart() {
  const { userId } = useAuth();
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckIns();
    
    // Listener para recarregar apenas quando um check-in for salvo
    const handleCheckinSaved = () => {
      loadCheckIns();
    };
    window.addEventListener('checkin-saved', handleCheckinSaved);
    
    return () => {
      window.removeEventListener('checkin-saved', handleCheckinSaved);
    };
  }, [userId]);

  const loadCheckIns = async () => {
    try {
      setLoading(true);
      const allCheckIns = await checkinService.getAll(userId);
      
      // Pega os últimos 7 dias
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const last7DaysData: DailyCheckIn[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const checkIn = allCheckIns.find(c => {
          const checkInDate = String(c.date).split('T')[0];
          return checkInDate === dateStr;
        });
        
        if (checkIn) {
          last7DaysData.push(checkIn);
        }
      }
      
      setCheckIns(last7DaysData);
    } catch (error) {
      console.error('Erro ao carregar check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gera dados da semana (últimos 7 dias)
  // Sempre mostra os 7 dias, mesmo sem dados
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliza para início do dia
  
  const data = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    const dateStr = date.toISOString().split('T')[0];
    
    // Busca o check-in correspondente a este dia
    const checkIn = checkIns.find(c => {
      const checkInDate = String(c.date).split('T')[0];
      return checkInDate === dateStr;
    });
    
    // Se encontrou check-in, usa os dados; senão, retorna null
    const hasData = checkIn !== undefined;
    
    return {
      day: days[date.getDay()], // Nome do dia da semana
      date: dateStr, // Para debug
      mood: hasData && checkIn.mood ? ((checkIn.mood - 1) * (10 / 5)) : null, // 1-6 -> 0-10
      energy: hasData && checkIn.energy ? checkIn.energy : null,
      productivity: hasData && checkIn.productivity ? checkIn.productivity : null,
    };
  });

  const moods = checkIns.map(c => c.mood).filter(m => m > 0);
  const averageMood = moods.length > 0 
    ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1)
    : '0';

  return (
    <Card variant="glass" className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex-col items-center justify-between">
          <CardTitle className="flex items-center mb-4 gap-2">
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
        {loading ? (
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : checkIns.length === 0 ? (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">Nenhum dado ainda</p>
            <p className="text-sm text-muted-foreground">Faça um check-in para ver sua evolução</p>
          </div>
        ) : (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                interval={0}
              />
              <YAxis 
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-md)',
                }}
                formatter={(value: any) => {
                  if (value === null || value === undefined) {
                    return 'Sem dados';
                  }
                  return value.toFixed(1);
                }}
                labelFormatter={(label) => {
                  const item = data.find(d => d.day === label);
                  return item ? `Data: ${item.date}` : label;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="mood" 
                stroke="hsl(175, 70%, 45%)" 
                strokeWidth={2}
                fillOpacity={0.6} 
                fill="url(#colorMood)"
                connectNulls={false}
                isAnimationActive={true}
              />
              <Area 
                type="monotone" 
                dataKey="energy" 
                stroke="hsl(15, 85%, 55%)" 
                strokeWidth={2}
                fillOpacity={0.6} 
                fill="url(#colorEnergy)"
                connectNulls={false}
                isAnimationActive={true}
              />
              <Area 
                type="monotone" 
                dataKey="productivity" 
                stroke="hsl(150, 60%, 45%)" 
                strokeWidth={2}
                fillOpacity={0.6} 
                fill="url(#colorProd)"
                connectNulls={false}
                isAnimationActive={true}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {!loading && checkIns.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Humor médio:</span>
          <span className="text-2xl">
            {moods.length > 0 
              ? moodEmojis[Math.max(0, Math.min(5, Math.round(Number(averageMood)) - 1))] 
              : '😐'}
          </span>
          <span className="font-bold text-foreground">
            {moods.length > 0 ? `${averageMood}/6` : 'Sem dados'}
          </span>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
