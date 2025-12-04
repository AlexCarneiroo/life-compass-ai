import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { HabitsSection } from '@/components/sections/HabitsSection';
import { CheckinSection } from '@/components/sections/CheckinSection';
import { MoodSection } from '@/components/sections/MoodSection';
import { FinanceSection } from '@/components/sections/FinanceSection';
import { PlaceholderSection } from '@/components/sections/PlaceholderSection';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'habits':
        return <HabitsSection />;
      case 'checkin':
        return <CheckinSection />;
      case 'mood':
        return <MoodSection />;
      case 'finance':
        return <FinanceSection />;
      case 'goals':
        return <PlaceholderSection title="Metas & Objetivos" description="Defina e acompanhe suas metas pessoais e profissionais" emoji="⭐" />;
      case 'health':
        return <PlaceholderSection title="Saúde" description="Monitore seu peso, exercícios e bem-estar físico" emoji="💪" />;
      case 'routines':
        return <PlaceholderSection title="Rotinas Inteligentes" description="Crie rotinas personalizadas com timer e checklist" emoji="⏰" />;
      case 'journal':
        return <PlaceholderSection title="Diário" description="Escreva, grave áudios e receba insights da IA" emoji="📔" />;
      case 'work':
        return <PlaceholderSection title="Vida Profissional" description="Acompanhe projetos, metas de carreira e desenvolvimento" emoji="💼" />;
      case 'ai':
        return <PlaceholderSection title="IA Coach" description="Seu assistente pessoal para análises e sugestões" emoji="🤖" />;
      case 'reports':
        return <PlaceholderSection title="Relatórios" description="Análises semanais e mensais do seu progresso" emoji="📊" />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className={cn(
        "transition-all duration-300",
        "ml-64" // Default to expanded sidebar
      )}>
        <Header />
        
        <main className="p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Index;
