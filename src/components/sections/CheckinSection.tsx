import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moodEmojis } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { 
  Droplet, Moon, Zap, DollarSign, Dumbbell, 
  Brain, Heart, Coffee, BookOpen, Save,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

const moodReasons = [
  { id: 'work', label: 'Trabalho', icon: '💼' },
  { id: 'relationship', label: 'Relacionamento', icon: '💕' },
  { id: 'health', label: 'Saúde', icon: '🏥' },
  { id: 'money', label: 'Dinheiro', icon: '💰' },
  { id: 'family', label: 'Família', icon: '👨‍👩‍👧' },
  { id: 'personal', label: 'Pessoal', icon: '🧘' },
];

export function CheckinSection() {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<number | null>(null);
  const [moodReason, setMoodReason] = useState<string | null>(null);
  const [energy, setEnergy] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [water, setWater] = useState(4);
  const [sleep, setSleep] = useState(7);
  const [workout, setWorkout] = useState(false);
  const [expenses, setExpenses] = useState('');
  const [reflection, setReflection] = useState('');

  const totalSteps = 4;

  const handleSave = () => {
    toast.success('Check-in salvo com sucesso!', {
      description: 'Seu progresso foi registrado. Continue assim!'
    });
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Como você está se sentindo?</h2>
              <p className="text-muted-foreground mt-1">Escolha o emoji que melhor representa seu humor hoje</p>
            </div>
            
            <div className="flex justify-center gap-4">
              {moodEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setMood(index)}
                  className={cn(
                    "w-16 h-16 rounded-2xl text-3xl transition-all duration-300 hover:scale-110",
                    mood === index 
                      ? "bg-primary/20 ring-4 ring-primary scale-110 shadow-lg" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {mood !== null && (
              <div className="space-y-4 mt-8 animate-fade-in">
                <p className="text-center text-muted-foreground">O que mais influenciou seu humor?</p>
                <div className="grid grid-cols-3 gap-3">
                  {moodReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setMoodReason(reason.id)}
                      className={cn(
                        "p-4 rounded-xl flex flex-col items-center gap-2 transition-all",
                        moodReason === reason.id 
                          ? "bg-primary/20 ring-2 ring-primary" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <span className="text-2xl">{reason.icon}</span>
                      <span className="text-sm font-medium">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Energia & Produtividade</h2>
              <p className="text-muted-foreground mt-1">Como foi seu dia?</p>
            </div>

            {/* Energy */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                    <Zap className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Nível de Energia</p>
                    <p className="text-sm text-muted-foreground">Como está sua disposição?</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-accent">{energy}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Productivity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
                    <Brain className="w-6 h-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Produtividade</p>
                    <p className="text-sm text-muted-foreground">Quanto você conseguiu realizar?</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-success">{productivity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={productivity}
                onChange={(e) => setProductivity(Number(e.target.value))}
                className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-success"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Saúde & Finanças</h2>
              <p className="text-muted-foreground mt-1">Registre seus hábitos de hoje</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Droplet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Água</p>
                    <p className="text-xs text-muted-foreground">Copos de água</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setWater(Math.max(0, water - 1))}
                  >
                    -
                  </Button>
                  <span className="text-4xl font-bold w-16 text-center">{water}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setWater(water + 1)}
                  >
                    +
                  </Button>
                </div>
              </Card>

              {/* Sleep */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-energy/10 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-energy" />
                  </div>
                  <div>
                    <p className="font-semibold">Sono</p>
                    <p className="text-xs text-muted-foreground">Horas dormidas</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSleep(Math.max(0, sleep - 0.5))}
                  >
                    -
                  </Button>
                  <span className="text-4xl font-bold w-16 text-center">{sleep}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSleep(sleep + 0.5)}
                  >
                    +
                  </Button>
                </div>
              </Card>

              {/* Workout */}
              <Card 
                className={cn(
                  "p-5 cursor-pointer transition-all",
                  workout && "ring-2 ring-success bg-success/5"
                )}
                onClick={() => setWorkout(!workout)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    workout ? "bg-success/20" : "bg-muted"
                  )}>
                    <Dumbbell className={cn("w-5 h-5", workout ? "text-success" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-semibold">Exercício</p>
                    <p className="text-xs text-muted-foreground">Treinou hoje?</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className={cn(
                    "text-4xl",
                    workout ? "text-success" : "text-muted-foreground"
                  )}>
                    {workout ? '✓ Sim!' : '—'}
                  </span>
                </div>
              </Card>

              {/* Expenses */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold">Gastos</p>
                    <p className="text-xs text-muted-foreground">Total do dia</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border-0 text-xl font-semibold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Reflexão do Dia</h2>
              <p className="text-muted-foreground mt-1">O que você aprendeu hoje?</p>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold">Escreva sua reflexão</p>
              </div>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Hoje eu aprendi que... / Estou grato por... / Amanhã quero..."
                className="w-full h-40 p-4 rounded-xl bg-muted border-0 resize-none focus:ring-2 focus:ring-primary outline-none"
              />
            </Card>

            {/* Summary */}
            <Card className="p-6 gradient-primary text-primary-foreground">
              <h3 className="font-bold text-lg mb-4">Resumo do Check-in</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-3xl">{moodEmojis[mood || 0]}</span>
                  <p className="text-sm opacity-80 mt-1">Humor</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{energy}/10</span>
                  <p className="text-sm opacity-80 mt-1">Energia</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{water}</span>
                  <p className="text-sm opacity-80 mt-1">Copos água</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{sleep}h</span>
                  <p className="text-sm opacity-80 mt-1">Sono</p>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Check-in Diário</h1>
        <p className="text-muted-foreground mt-1">Registre seu dia e acompanhe seu progresso</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              "flex-1 h-2 rounded-full transition-all",
              i + 1 <= step ? "gradient-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-8">
        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        
        {step < totalSteps ? (
          <Button onClick={() => setStep(s => s + 1)}>
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button variant="success" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Check-in
          </Button>
        )}
      </div>
    </div>
  );
}
