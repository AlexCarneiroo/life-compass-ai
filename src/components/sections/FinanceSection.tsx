import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { expenseCategories } from '@/lib/constants';
import { FinancialEntry } from '@/types';
import { cn } from '@/lib/utils';
import { 
  ArrowDownRight, ArrowUpRight, Plus, TrendingUp, TrendingDown,
  PieChart, Target, AlertTriangle, Lightbulb
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/lib/firebase/finance';
 

export function FinanceSection() {
  const { userId } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: 'Alimentação',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      return;
    }
    loadEntries();
  }, [userId]);

  const loadEntries = async () => {
    try {
      const data = await financeService.getAll(userId);
      setEntries(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    }
  };

  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome === 0
    ? '0'
    : Math.round(((totalIncome - totalExpenses) / totalIncome) * 100).toString();

  // Expenses by category
  const expensesByCategory = entries
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const handleOpenModal = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: 'Alimentação',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      type: 'expense',
      amount: '',
      category: 'Alimentação',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSaveEntry = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Por favor, insira um valor válido');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Por favor, preencha a descrição');
      return;
    }

    try {
      await financeService.create({
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
      }, userId);
      await loadEntries();
      toast.success(`${formData.type === 'income' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  const incomeCategories = ['Salário', 'Freelance', 'Investimentos', 'Outros'];

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => {
    const category = expenseCategories.find(c => c.name === name);
    return { name, value, color: category?.color || 'hsl(var(--muted))' };
  });

  // Gera dados reais da semana (últimos 7 dias)
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weeklyExpenses = Array.from({ length: 7 }, (_, index) => {
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

  const insights = [
    { type: 'warning', text: 'Você gastou 22% mais em Alimentação esta semana' },
    { type: 'success', text: 'Economia de R$ 200 em Transporte vs mês passado' },
    { type: 'tip', text: 'Se reduzir R$ 50/semana em Lazer, economizará R$ 200/mês' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex-col items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Controle seus gastos e alcance suas metas</p>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => setPeriod('week')} className={period === 'week' ? 'bg-muted' : ''}>
            Semana
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod('month')} className={period === 'month' ? 'bg-muted' : ''}>
            Mês
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenModal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'income' | 'expense') => 
                      setFormData({ ...formData, type: value, category: value === 'income' ? 'Salário' : 'Alimentação' })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === 'income' ? (
                        incomeCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))
                      ) : (
                        expenseCategories.map(cat => (
                          <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva a transação..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEntry} className='mb-3'>
                  Adicionar Transação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Balance Card */}
      <Card className="gradient-cyan text-cyan-foreground p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm opacity-80">Saldo atual</p>
            <p className="text-4xl font-bold mt-1">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+{savingsRate}% economizado</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Entradas</p>
                <p className="text-xl font-bold">R$ {totalIncome.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Saídas</p>
                <p className="text-xl font-bold">R$ {totalExpenses.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {pieData.map((category) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {category.value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyExpenses}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {weeklyExpenses.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.value > 100 ? 'hsl(15, 85%, 55%)' : 'hsl(175, 70%, 45%)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-muted-foreground">Alto</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                insight.type === 'warning' && "bg-accent/10",
                insight.type === 'success' && "bg-success/10",
                insight.type === 'tip' && "bg-primary/10"
              )}
            >
              {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-accent" />}
              {insight.type === 'success' && <TrendingDown className="w-5 h-5 text-success" />}
              {insight.type === 'tip' && <Lightbulb className="w-5 h-5 text-primary" />}
              <p className="text-sm">{insight.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações Recentes</CardTitle>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.map((transaction) => {
              const category = expenseCategories.find(c => c.name === transaction.category);
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{category?.icon || '📝'}</span>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-bold text-lg",
                    transaction.type === 'income' ? "text-success" : "text-foreground"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
