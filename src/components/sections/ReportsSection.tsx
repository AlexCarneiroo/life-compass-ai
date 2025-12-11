import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  FileText,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { checkinService } from '@/lib/firebase/checkin';
import { habitsService } from '@/lib/firebase/habits';
import { financeService } from '@/lib/firebase/finance';
import { healthService } from '@/lib/firebase/health';
import { DailyCheckIn, Habit, FinancialEntry } from '@/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PeriodType = 'week' | 'month';

const COLORS = [
  'hsl(15, 85%, 55%)',
  'hsl(200, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 70%, 55%)',
  'hsl(45, 90%, 50%)',
  'hsl(300, 70%, 50%)',
  'hsl(30, 80%, 55%)',
];

export function ReportsSection() {
  const { userId } = useAuth();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [finances, setFinances] = useState<FinancialEntry[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  
  // Métricas calculadas
  const [metrics, setMetrics] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [habitCompletion, setHabitCompletion] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [insights, setInsights] = useState<{ achievements: string[]; improvements: string[]; recommendation: string }>({
    achievements: [],
    improvements: [],
    recommendation: '',
  });
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [checkInsData, habitsData, financesData, workoutsData] = await Promise.all([
        checkinService.getAll(userId),
        habitsService.getAll(userId),
        financeService.getAll(userId),
        healthService.getAllWorkouts(userId),
      ]);

      setCheckIns(checkInsData);
      setHabits(habitsData);
      setFinances(financesData);
      setWorkouts(workoutsData);

      calculateMetrics(checkInsData, habitsData, financesData, workoutsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const today = new Date();
    let startDate: Date;
    
    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    const endDate = new Date(today);
    return { startDate, endDate };
  };

  const calculateMetrics = (
    checkInsData: DailyCheckIn[],
    habitsData: Habit[],
    financesData: FinancialEntry[],
    workoutsData: any[]
  ) => {
    const { startDate, endDate } = getDateRange();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // Período anterior para comparação
    const previousStart = new Date(startDate);
    if (period === 'week') {
      previousStart.setDate(previousStart.getDate() - 7);
    } else {
      previousStart.setMonth(previousStart.getMonth() - 1);
    }
    const previousEnd = new Date(startDate);
    const previousStartStr = previousStart.toISOString().split('T')[0];
    const previousEndStr = previousEnd.toISOString().split('T')[0];

    // Filtra dados do período atual
    const currentCheckIns = checkInsData.filter(c => c.date >= startStr && c.date <= endStr);
    const previousCheckIns = checkInsData.filter(c => c.date >= previousStartStr && c.date < previousEndStr);
    
    const currentFinances = financesData.filter(f => f.date >= startStr && f.date <= endStr);
    const previousFinances = financesData.filter(f => f.date >= previousStartStr && f.date < previousEndStr);

    // Calcula métricas
    const moods = currentCheckIns.map(c => c.mood).filter(m => m > 0);
    const previousMoods = previousCheckIns.map(c => c.mood).filter(m => m > 0);
    const averageMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
    const previousAverageMood = previousMoods.length > 0 ? previousMoods.reduce((a, b) => a + b, 0) / previousMoods.length : 0;

    const productivities = currentCheckIns.map(c => c.productivity).filter(p => p > 0);
    const previousProductivities = previousCheckIns.map(c => c.productivity).filter(p => p > 0);
    const averageProductivity = productivities.length > 0 ? productivities.reduce((a, b) => a + b, 0) / productivities.length : 0;
    const previousAverageProductivity = previousProductivities.length > 0 ? previousProductivities.reduce((a, b) => a + b, 0) / previousProductivities.length : 0;

    // Hábitos completados
    const currentHabitsCompleted = habitsData.reduce((count, habit) => {
      const completed = habit.completedDates?.filter(date => date >= startStr && date <= endStr).length || 0;
      return count + completed;
    }, 0);
    const previousHabitsCompleted = habitsData.reduce((count, habit) => {
      const completed = habit.completedDates?.filter(date => date >= previousStartStr && date < previousEndStr).length || 0;
      return count + completed;
    }, 0);

    // Treinos
    const currentWorkouts = workoutsData.filter(w => w.date >= startStr && w.date <= endStr).length;
    const previousWorkouts = workoutsData.filter(w => w.date >= previousStartStr && w.date < previousEndStr).length;

    // Gastos
    const currentExpenses = currentFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const previousExpenses = previousFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);

    // Sono médio
    const sleeps = currentCheckIns.map(c => c.sleepHours).filter(s => s > 0);
    const previousSleeps = previousCheckIns.map(c => c.sleepHours).filter(s => s > 0);
    const averageSleep = sleeps.length > 0 ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : 0;
    const previousAverageSleep = previousSleeps.length > 0 ? previousSleeps.reduce((a, b) => a + b, 0) / previousSleeps.length : 0;

    setMetrics([
      { name: 'Humor Médio', current: averageMood.toFixed(1), previous: previousAverageMood.toFixed(1), unit: '/6', icon: '😊' },
      { name: 'Produtividade', current: averageProductivity.toFixed(1), previous: previousAverageProductivity.toFixed(1), unit: '/10', icon: '⚡' },
      { name: 'Hábitos Completados', current: currentHabitsCompleted, previous: previousHabitsCompleted, unit: '', icon: '🎯' },
      { name: 'Treinos', current: currentWorkouts, previous: previousWorkouts, unit: '', icon: '💪' },
      { name: 'Gastos Totais', current: currentExpenses, previous: previousExpenses, unit: 'R$', icon: '💰' },
      { name: 'Sono Médio', current: averageSleep.toFixed(1), previous: previousAverageSleep.toFixed(1), unit: 'h', icon: '😴' },
    ]);

    // Dados semanais/mensais para gráfico
    const weeks: any[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + (period === 'week' ? 1 : 6));
      if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
      
      const weekStartStr = current.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const weekCheckIns = checkInsData.filter(c => c.date >= weekStartStr && c.date <= weekEndStr);
      const weekFinances = financesData.filter(f => f.date >= weekStartStr && f.date <= weekEndStr);
      
      const weekMood = weekCheckIns.map(c => c.mood).filter(m => m > 0);
      const weekProductivity = weekCheckIns.map(c => c.productivity).filter(p => p > 0);
      const weekExpenses = weekFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
      
      weeks.push({
        week: period === 'week' 
          ? `${current.getDate()}/${current.getMonth() + 1}`
          : `Sem ${weeks.length + 1}`,
        humor: weekMood.length > 0 ? (weekMood.reduce((a, b) => a + b, 0) / weekMood.length) : 0,
        produtividade: weekProductivity.length > 0 ? (weekProductivity.reduce((a, b) => a + b, 0) / weekProductivity.length) : 0,
        gastos: weekExpenses,
      });
      
      current.setDate(current.getDate() + (period === 'week' ? 1 : 7));
    }
    setWeeklyData(weeks);

    // Conclusão de hábitos
    const habitCompletionData = habitsData.map(habit => {
      const completed = habit.completedDates?.filter(date => date >= startStr && date <= endStr).length || 0;
      const totalDays = period === 'week' ? 7 : new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
      const percentage = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
      return { name: habit.name, value: percentage };
    }).filter(h => h.value > 0).slice(0, 10);
    setHabitCompletion(habitCompletionData);

    // Gastos por categoria
    const categoryMap = new Map<string, number>();
    currentFinances.filter(f => f.type === 'expense').forEach(f => {
      const category = f.category || 'Outros';
      categoryMap.set(category, (categoryMap.get(category) || 0) + f.amount);
    });
    
    const expensesData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value: Math.round(value),
      color: COLORS[index % COLORS.length],
    })).sort((a, b) => b.value - a.value);
    setExpensesByCategory(expensesData);

    // Insights
    generateInsights(
      averageMood, previousAverageMood,
      averageProductivity, previousAverageProductivity,
      currentHabitsCompleted, previousHabitsCompleted,
      currentExpenses, previousExpenses,
      averageSleep, previousAverageSleep,
      currentWorkouts, previousWorkouts
    );
  };

  const generateInsights = (
    mood: number, prevMood: number,
    productivity: number, prevProductivity: number,
    habits: number, prevHabits: number,
    expenses: number, prevExpenses: number,
    sleep: number, prevSleep: number,
    workouts: number, prevWorkouts: number
  ) => {
    const achievements: string[] = [];
    const improvements: string[] = [];

    if (mood > prevMood) {
      achievements.push(`Humor médio melhorou de ${prevMood.toFixed(1)} para ${mood.toFixed(1)} (+${((mood - prevMood) / prevMood * 100).toFixed(0)}%)`);
    } else if (mood < prevMood) {
      improvements.push(`Humor médio diminuiu de ${prevMood.toFixed(1)} para ${mood.toFixed(1)}`);
    }

    if (productivity > prevProductivity) {
      achievements.push(`Produtividade aumentou de ${prevProductivity.toFixed(1)} para ${productivity.toFixed(1)}`);
    } else if (productivity < prevProductivity) {
      improvements.push(`Produtividade diminuiu de ${prevProductivity.toFixed(1)} para ${productivity.toFixed(1)}`);
    }

    if (habits > prevHabits) {
      achievements.push(`Completou ${habits} hábitos (${habits - prevHabits} a mais que no período anterior)`);
    } else if (habits < prevHabits) {
      improvements.push(`Hábitos completados diminuíram de ${prevHabits} para ${habits}`);
    }

    if (expenses < prevExpenses) {
      achievements.push(`Economizou R$ ${(prevExpenses - expenses).toFixed(2)} comparado ao período anterior`);
    } else if (expenses > prevExpenses) {
      improvements.push(`Gastos aumentaram de R$ ${prevExpenses.toFixed(2)} para R$ ${expenses.toFixed(2)}`);
    }

    if (sleep > prevSleep) {
      achievements.push(`Sono médio melhorou de ${prevSleep.toFixed(1)}h para ${sleep.toFixed(1)}h`);
    } else if (sleep < prevSleep && sleep < 7) {
      improvements.push(`Sono médio está abaixo do recomendado (${sleep.toFixed(1)}h)`);
    }

    if (workouts > prevWorkouts) {
      achievements.push(`Realizou ${workouts} treinos (${workouts - prevWorkouts} a mais)`);
    }

    let recommendation = '';
    if (sleep < 7) {
      recommendation = 'Seu sono está abaixo do recomendado. Tente manter uma rotina de sono consistente, indo dormir e acordando no mesmo horário todos os dias.';
    } else if (productivity < 6) {
      recommendation = 'Sua produtividade está baixa. Considere fazer pausas regulares, manter-se hidratado e organizar suas tarefas por prioridade.';
    } else if (mood < 3) {
      recommendation = 'Seu humor está baixo. Tente praticar atividades que você gosta, fazer exercícios leves e manter contato com pessoas queridas.';
    } else if (habits < 10) {
      recommendation = 'Tente completar mais hábitos regularmente. A consistência é a chave para o sucesso!';
    } else {
      recommendation = 'Parabéns! Você está mantendo um bom ritmo. Continue assim e tente melhorar ainda mais!';
    }

    setInsights({ achievements, improvements, recommendation });
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const exportToCSV = () => {
    const { startDate, endDate } = getDateRange();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const periodData = checkIns.filter(c => c.date >= startStr && c.date <= endStr);
    
    // CSV de Check-ins
    const checkInsCSV = [
      ['Data', 'Humor', 'Energia', 'Produtividade', 'Gastos', 'Água (litros)', 'Sono (horas)'],
      ...periodData.map(c => [
        c.date,
        c.mood || '',
        c.energy || '',
        c.productivity || '',
        c.expenses || '',
        c.waterLiters !== undefined ? c.waterLiters : (c.waterGlasses ? (c.waterGlasses * 0.25) : ''),
        c.sleepHours || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    // CSV de Finanças
    const financesCSV = [
      ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição'],
      ...finances.filter(f => f.date >= startStr && f.date <= endStr).map(f => [
        f.date,
        f.type === 'income' ? 'Receita' : 'Despesa',
        f.category || '',
        f.amount,
        f.description || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    // Combina tudo
    const csvContent = `Relatório ${period === 'week' ? 'Semanal' : 'Mensal'}\n\nCHECK-INS\n${checkInsCSV}\n\nFINANÇAS\n${financesCSV}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${period === 'week' ? 'semanal' : 'mensal'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const exportToPDF = async () => {
    setGeneratingPDF(true);
    try {
      const { startDate, endDate } = getDateRange();
      const periodName = period === 'week' ? 'Semanal' : 'Mensal';
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      // Dados para tabelas
      const periodCheckIns = checkIns.filter(c => c.date >= startStr && c.date <= endStr);
      const periodFinances = finances.filter(f => f.date >= startStr && f.date <= endStr);
      
      // Cria o PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;
      
      // Função auxiliar para adicionar nova página se necessário
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };
      
      // Função para adicionar texto com quebra de linha automática
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color[0], color[1], color[2]);
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        checkNewPage(lines.length * (fontSize * 0.4) + 5);
        
        lines.forEach((line: string) => {
          pdf.text(line, margin, yPos);
          yPos += fontSize * 0.4;
        });
        yPos += 3;
      };
      
      // Cabeçalho
      addText(`Relatório ${periodName}`, 20, true, [27, 58, 181]);
      addText('Life Compass AI', 10, false, [100, 100, 100]);
      yPos += 5;
      
      addText(`Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`, 10, false, [100, 100, 100]);
      addText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 10, false, [100, 100, 100]);
      yPos += 10;
      
      // Métricas Principais
      checkNewPage(20);
      addText('📊 Métricas Principais', 16, true, [27, 58, 181]);
      yPos += 5;
      
      metrics.forEach(m => {
        checkNewPage(15);
        const current = parseFloat(m.current) || 0;
        const previous = parseFloat(m.previous) || 0;
        const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
        const isPositive = m.name === 'Gastos Totais' ? change < 0 : change > 0;
        const changeSymbol = change > 0 ? '↑' : (change < 0 ? '↓' : '→');
        
        const currentText = m.unit === 'R$' 
          ? `R$ ${current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : `${m.current}${m.unit}`;
        const previousText = m.unit === 'R$'
          ? `R$ ${previous.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : `${m.previous}${m.unit}`;
        
        addText(`${m.icon} ${m.name}: ${currentText}`, 12, true);
        addText(`   ${changeSymbol} ${Math.abs(change).toFixed(0)}% vs período anterior (${previousText})`, 10, false, [100, 100, 100]);
        yPos += 3;
      });
      
      yPos += 10;
      
      // Check-ins do Período
      if (periodCheckIns.length > 0) {
        checkNewPage(30);
        addText('📝 Check-ins do Período', 16, true, [27, 58, 181]);
        yPos += 5;
        
        // Cabeçalho da tabela
        checkNewPage(10);
        pdf.setFillColor(27, 58, 181);
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('Data', margin + 2, yPos);
        pdf.text('Humor', margin + 35, yPos);
        pdf.text('Energia', margin + 50, yPos);
        pdf.text('Produt.', margin + 65, yPos);
        pdf.text('Gastos', margin + 80, yPos);
        pdf.text('Água', margin + 105, yPos);
        pdf.text('Sono', margin + 120, yPos);
        yPos += 8;
        
        // Linhas da tabela
        pdf.setTextColor(0, 0, 0);
        periodCheckIns.slice(0, 20).forEach((c, index) => { // Limita a 20 para não ficar muito longo
          checkNewPage(8);
          if (index % 2 === 0) {
            pdf.setFillColor(249, 249, 249);
            pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
          }
          
          pdf.setFontSize(9);
          pdf.text(new Date(c.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), margin + 2, yPos);
          pdf.text(c.mood?.toString() || '-', margin + 35, yPos);
          pdf.text(c.energy?.toString() || '-', margin + 50, yPos);
          pdf.text(c.productivity?.toString() || '-', margin + 65, yPos);
          pdf.text(c.expenses ? `R$ ${c.expenses.toFixed(2)}` : '-', margin + 80, yPos);
          const water = c.waterLiters !== undefined ? c.waterLiters : (c.waterGlasses ? (c.waterGlasses * 0.25) : 0);
          pdf.text(water > 0 ? `${water.toFixed(1)}L` : '-', margin + 105, yPos);
          pdf.text(c.sleepHours ? `${c.sleepHours}h` : '-', margin + 120, yPos);
          yPos += 8;
        });
        
        yPos += 10;
      }
      
      // Transações Financeiras
      if (periodFinances.length > 0) {
        checkNewPage(30);
        addText('💰 Transações Financeiras', 16, true, [27, 58, 181]);
        yPos += 5;
        
        // Cabeçalho da tabela
        checkNewPage(10);
        pdf.setFillColor(27, 58, 181);
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('Data', margin + 2, yPos);
        pdf.text('Tipo', margin + 30, yPos);
        pdf.text('Categoria', margin + 50, yPos);
        pdf.text('Valor', margin + 100, yPos);
        pdf.text('Descrição', margin + 130, yPos);
        yPos += 8;
        
        // Linhas da tabela
        pdf.setTextColor(0, 0, 0);
        periodFinances.slice(0, 20).forEach((f, index) => { // Limita a 20
          checkNewPage(8);
          if (index % 2 === 0) {
            pdf.setFillColor(249, 249, 249);
            pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
          }
          
          pdf.setFontSize(9);
          pdf.text(new Date(f.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), margin + 2, yPos);
          pdf.text(f.type === 'income' ? 'Receita' : 'Despesa', margin + 30, yPos);
          pdf.text((f.category || '-').substring(0, 15), margin + 50, yPos);
          pdf.setTextColor(f.type === 'income' ? 5 : 220, f.type === 'income' ? 150 : 38, f.type === 'income' ? 105 : 38);
          pdf.text(`${f.type === 'income' ? '+' : '-'} R$ ${f.amount.toFixed(2)}`, margin + 100, yPos);
          pdf.setTextColor(0, 0, 0);
          pdf.text((f.description || '-').substring(0, 20), margin + 130, yPos);
          yPos += 8;
        });
        
        yPos += 10;
      }
      
      // Gastos por Categoria
      if (expensesByCategory.length > 0) {
        checkNewPage(30);
        addText('📊 Gastos por Categoria', 16, true, [27, 58, 181]);
        yPos += 5;
        
        expensesByCategory.forEach(cat => {
          checkNewPage(10);
          addText(`${cat.name}: R$ ${cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 11, false);
        });
        
        yPos += 10;
      }
      
      // Insights da IA
      checkNewPage(30);
      addText('🤖 Insights da IA', 16, true, [27, 58, 181]);
      yPos += 5;
      
      if (insights.achievements.length > 0) {
        addText('✅ Conquistas', 14, true, [5, 150, 105]);
        insights.achievements.forEach(achievement => {
          addText(`  • ${achievement}`, 10, false, [5, 150, 105]);
        });
        yPos += 5;
      }
      
      if (insights.improvements.length > 0) {
        addText('⚠️ Pontos de Melhoria', 14, true, [220, 38, 38]);
        insights.improvements.forEach(improvement => {
          addText(`  • ${improvement}`, 10, false, [220, 38, 38]);
        });
        yPos += 5;
      }
      
      if (insights.recommendation) {
        checkNewPage(15);
        addText('💡 Recomendação Principal', 14, true, [245, 158, 11]);
        addText(insights.recommendation, 11, false);
      }
      
      // Rodapé
      yPos = pageHeight - margin - 10;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Relatório gerado automaticamente pelo Life Compass AI', pageWidth / 2, yPos, { align: 'center' });
      
      // Salva o PDF
      const fileName = `relatorio-${period === 'week' ? 'semanal' : 'mensal'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getPeriodLabel = () => {
    const { startDate, endDate } = getDateRange();
    if (period === 'week') {
      return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
    } else {
      return endDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <span>📊</span> Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Análises semanais e mensais do seu progresso</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button 
            className="gradient-primary text-primary-foreground" 
            onClick={exportToPDF}
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado.</p>
            <p className="text-sm text-muted-foreground mt-2">Faça check-ins e registre atividades para ver seus relatórios aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const current = parseFloat(metric.current) || 0;
              const previous = parseFloat(metric.previous) || 0;
              const change = getChange(current, previous);
              const isPositive = metric.name === 'Gastos Totais' ? change < 0 : change > 0;
              
              return (
                <Card key={metric.name} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{metric.icon}</span>
                      <div className={cn(
                        "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                        isPositive ? "bg-green-500/10 text-green-500" : 
                        change === 0 ? "bg-muted text-muted-foreground" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {change > 0 ? <TrendingUp className="w-3 h-3" /> : 
                         change < 0 ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {Math.abs(change).toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-2xl font-bold">
                      {metric.unit === 'R$' ? `R$ ${current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${metric.current}${metric.unit}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{metric.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anterior: {metric.unit === 'R$' ? `R$ ${previous.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${metric.previous}${metric.unit}`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row */}
          {weeklyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolution Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Evolução {period === 'week' ? 'Semanal' : 'Mensal'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line type="monotone" dataKey="humor" stroke="hsl(var(--primary))" strokeWidth={2} name="Humor" />
                        <Line type="monotone" dataKey="produtividade" stroke="hsl(var(--accent))" strokeWidth={2} name="Produtividade" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Expenses Pie Chart */}
              {expensesByCategory.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PieChart className="w-5 h-5 text-accent" />
                      Gastos por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] flex items-center">
                      <ResponsiveContainer width="60%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value) => [`R$ ${value}`, '']}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {expensesByCategory.map((cat) => (
                          <div key={cat.name} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="flex-1 text-muted-foreground">{cat.name}</span>
                            <span className="font-medium">R$ {cat.value.toLocaleString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Habit Completion */}
          {habitCompletion.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  🎯 Conclusão de Hábitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitCompletion} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [`${value}%`, 'Conclusão']}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          <Card className="gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resumo {period === 'week' ? 'Semanal' : 'Mensal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.achievements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-500 mb-3">✅ Conquistas</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {insights.achievements.map((achievement, index) => (
                        <li key={index}>• {achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.improvements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-500 mb-3">⚠️ Pontos de Melhoria</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {insights.improvements.map((improvement, index) => (
                        <li key={index}>• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {insights.recommendation && (
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <h4 className="font-semibold mb-2">💡 Recomendação Principal</h4>
                  <p className="text-sm text-muted-foreground">
                    {insights.recommendation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
