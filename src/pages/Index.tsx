import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { PINModal } from '@/components/ui/PINModal';
import { useAuth } from '@/hooks/useAuth';
import { userSettingsService } from '@/lib/firebase/userSettings';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load componentes pesados
const HabitsSection = lazy(() => import('@/components/sections/HabitsSection').then(m => ({ default: m.HabitsSection })));
const CheckinSection = lazy(() => import('@/components/sections/CheckinSection').then(m => ({ default: m.CheckinSection })));
const FinanceSection = lazy(() => import('@/components/sections/FinanceSection').then(m => ({ default: m.FinanceSection })));
const HealthSection = lazy(() => import('@/components/sections/HealthSection').then(m => ({ default: m.HealthSection })));
const RoutinesSection = lazy(() => import('@/components/sections/RoutinesSection').then(m => ({ default: m.RoutinesSection })));
const GoalsSection = lazy(() => import('@/components/sections/GoalsSection').then(m => ({ default: m.GoalsSection })));
const JournalSection = lazy(() => import('@/components/sections/JournalSection').then(m => ({ default: m.JournalSection })));
const AICoachSection = lazy(() => import('@/components/sections/AICoachSection').then(m => ({ default: m.AICoachSection })));
const ReportsSection = lazy(() => import('@/components/sections/ReportsSection').then(m => ({ default: m.ReportsSection })));
const SettingsSection = lazy(() => import('@/components/sections/SettingsSection').then(m => ({ default: m.SettingsSection })));

// Componente de loading skeleton
const SectionSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  </div>
);

// Mapeamento de IDs de seção para nomes
const sectionNames: Record<string, string> = {
  dashboard: 'Visão da Vida',
  habits: 'Hábitos',
  checkin: 'Check-in Diário',
  finance: 'Financeiro',
  goals: 'Metas & Objetivos',
  health: 'Saúde',
  routines: 'Rotinas',
  journal: 'Diário',
  ai: 'IA Coach',
  reports: 'Relatórios',
  tools: 'Ferramentas',
  settings: 'Configurações',
};

const Index = () => {
  const { userId } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [isPINModalOpen, setIsPINModalOpen] = useState(false);
  const [protectedSections, setProtectedSections] = useState<string[]>([]);
  const [verifiedSections, setVerifiedSections] = useState<Set<string>>(new Set());

  // Carregar seções protegidas
  useEffect(() => {
    if (userId) {
      loadProtectedSections();
    }
  }, [userId]);

  // Carregar seções verificadas do sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('verifiedSections');
    if (stored) {
      try {
        setVerifiedSections(new Set(JSON.parse(stored)));
      } catch (error) {
        logger.error('Erro ao carregar seções verificadas:', error);
      }
    }
  }, []);

  const loadProtectedSections = async () => {
    try {
      const settings = await userSettingsService.getOrCreate(userId);
      setProtectedSections(settings.protectedSections || []);
    } catch (error) {
      logger.error('Erro ao carregar seções protegidas:', error);
    }
  };

  // Salvar seções verificadas no sessionStorage
  const saveVerifiedSections = (sections: Set<string>) => {
    sessionStorage.setItem('verifiedSections', JSON.stringify(Array.from(sections)));
  };

  // Verificar se a seção está protegida e requer PIN
  const checkSectionAccess = useCallback((sectionId: string): boolean => {
    // Dashboard e Settings nunca precisam de PIN
    if (sectionId === 'dashboard' || sectionId === 'settings') {
      return true;
    }

    // Se a seção não está protegida, permite acesso
    if (!protectedSections.includes(sectionId)) {
      return true;
    }

    // Se já foi verificado nesta sessão, permite acesso
    if (verifiedSections.has(sectionId)) {
      return true;
    }

    // Precisa verificar PIN
    return false;
  }, [protectedSections, verifiedSections]);

  // Handler para mudança de seção
  const handleSectionChange = useCallback((sectionId: string) => {
    if (checkSectionAccess(sectionId)) {
      setActiveSection(sectionId);
    } else {
      setPendingSection(sectionId);
      setIsPINModalOpen(true);
    }
  }, [checkSectionAccess]);

  // Handler para verificação de PIN
  const handleVerifyPIN = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const isValid = await userSettingsService.verifyPin(userId, pin);
      if (isValid && pendingSection) {
        // Adicionar seção às verificadas
        const newVerified = new Set(verifiedSections);
        newVerified.add(pendingSection);
        setVerifiedSections(newVerified);
        saveVerifiedSections(newVerified);
        
        // Mudar para a seção
        setActiveSection(pendingSection);
        setPendingSection(null);
        return true;
      }
      return isValid;
    } catch (error) {
      logger.error('Erro ao verificar PIN:', error);
      return false;
    }
  }, [userId, pendingSection, verifiedSections]);

  // Listener para atualizar seções protegidas quando mudarem
  useEffect(() => {
    const handleSettingsUpdate = () => {
      if (userId) {
        loadProtectedSections();
        // Limpar verificações quando as configurações mudarem
        setVerifiedSections(new Set());
        sessionStorage.removeItem('verifiedSections');
      }
    };

    window.addEventListener('pin-settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('pin-settings-updated', handleSettingsUpdate);
    };
  }, [userId]);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'habits':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <HabitsSection />
          </Suspense>
        );
      case 'checkin':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <CheckinSection />
          </Suspense>
        );
      case 'finance':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <FinanceSection />
          </Suspense>
        );
      case 'goals':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <GoalsSection />
          </Suspense>
        );
      case 'health':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <HealthSection />
          </Suspense>
        );
      case 'routines':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <RoutinesSection />
          </Suspense>
        );
      case 'journal':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <JournalSection />
          </Suspense>
        );
      case 'ai':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <AICoachSection />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <ReportsSection />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <SettingsSection />
          </Suspense>
        );
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav activeSection={activeSection} onSectionChange={handleSectionChange} />
      
      <div className={cn(
        "transition-all duration-300",
        "lg:ml-64", // Desktop sidebar margin
        "pt-14 pb-16 lg:pt-0 lg:pb-0" // Mobile header/footer padding (reduzido para h-16 do menu)
      )}>
        <div className="hidden lg:block">
          <Header onSectionChange={handleSectionChange} />
        </div>
        
        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* PIN Modal */}
      <PINModal
        open={isPINModalOpen}
        onClose={() => {
          setIsPINModalOpen(false);
          setPendingSection(null);
        }}
        onVerify={handleVerifyPIN}
        sectionName={pendingSection ? sectionNames[pendingSection] : undefined}
      />
    </div>
  );
};

export default Index;
