import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { HabitsSection } from '@/components/sections/HabitsSection';
import { CheckinSection } from '@/components/sections/CheckinSection';
import { MoodSection } from '@/components/sections/MoodSection';
import { FinanceSection } from '@/components/sections/FinanceSection';
import { HealthSection } from '@/components/sections/HealthSection';
import { RoutinesSection } from '@/components/sections/RoutinesSection';
import { GoalsSection } from '@/components/sections/GoalsSection';
import { JournalSection } from '@/components/sections/JournalSection';
import { WorkSection } from '@/components/sections/WorkSection';
import { AICoachSection } from '@/components/sections/AICoachSection';
import { ReportsSection } from '@/components/sections/ReportsSection';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

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
        return <GoalsSection />;
      case 'health':
        return <HealthSection />;
      case 'routines':
        return <RoutinesSection />;
      case 'journal':
        return <JournalSection />;
      case 'work':
        return <WorkSection />;
      case 'ai':
        return <AICoachSection />;
      case 'reports':
        return <ReportsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className={cn(
        "transition-all duration-300",
        "lg:ml-64", // Desktop sidebar margin
        "pt-14 pb-20 lg:pt-0 lg:pb-0" // Mobile header/footer padding
      )}>
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <main className="p-4 sm:p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Index;
