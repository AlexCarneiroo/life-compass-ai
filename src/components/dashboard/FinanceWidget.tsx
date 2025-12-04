import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { mockFinancialEntries, mockWeeklyData, expenseCategories } from '@/lib/mockData';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

export function FinanceWidget() {
  const totalIncome = mockFinancialEntries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalExpenses = mockFinancialEntries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpenses;

  const weeklyData = mockWeeklyData.days.map((day, index) => ({
    day,
    value: mockWeeklyData.expenses[index],
  }));

  const recentTransactions = mockFinancialEntries.slice(0, 4);

  return (
    <Card>
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
                      fill={index === weeklyData.length - 1 ? 'hsl(175, 70%, 45%)' : 'hsl(var(--muted))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Transações recentes</p>
          {recentTransactions.map((transaction) => {
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
          })}
        </div>
      </CardContent>
    </Card>
  );
}
