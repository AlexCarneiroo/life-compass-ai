import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { expenseCategories } from '@/lib/constants';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/lib/firebase/finance';
import { FinancialEntry } from '@/types';

export function FinanceWidget() {
  const { userId } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [userId]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await financeService.getAll(userId);
      setEntries(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Gera dados da semana (últimos 7 dias)
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliza para início do dia
  
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateStr = date.toISOString().split('T')[0];
    
    // Busca todas as despesas deste dia
    const dayEntries = entries.filter(e => {
      const entryDate = String(e.date).split('T')[0];
      return entryDate === dateStr && e.type === 'expense';
    });
    
    const dayExpenses = dayEntries.reduce((sum, e) => sum + e.amount, 0);
    const dayName = days[date.getDay()];
    
    return { 
      day: dayName, 
      value: dayExpenses,
      date: dateStr 
    };
  });

  const recentTransactions = entries.slice(0, 4);

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span>💰</span> Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Card */}
        <div className="gradient-primary rounded-xl p-4 text-primary-foreground">
          <p className="text-sm opacity-80">Saldo do mês</p>
          <p className="text-2xl font-bold">
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>R$ {totalIncome.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1 opacity-80">
              <ArrowDownRight className="w-4 h-4" />
              <span>R$ {totalExpenses.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Weekly Expenses Chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Gastos da semana</p>
          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === weeklyData.length - 1 
                          ? 'hsl(175, 70%, 45%)' 
                          : 'hsl(var(--muted))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Transações recentes</p>
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhuma transação ainda</p>
          ) : (
            recentTransactions.map((transaction) => {
            const category = expenseCategories.find(c => c.name === transaction.category);
            return (
              <div key={transaction.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category?.icon || '📝'}</span>
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${
                  transaction.type === 'income' ? 'text-success' : 'text-foreground'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                </span>
              </div>
            );
          }))}
        </div>
      </CardContent>
    </Card>
  );
}
