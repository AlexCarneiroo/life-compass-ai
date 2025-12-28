import { useState, useEffect } from 'react';
import { Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar botão apenas se for instalável e não estiver instalado
    if (isInstallable && !isInstalled) {
      // Verificar se já foi dispensado antes (localStorage)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast.success('App instalado com sucesso!');
      setIsVisible(false);
    } else {
      toast.error('Erro ao instalar o app');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:transform-none"
      >
        <div className="bg-background border border-border rounded-xl shadow-2xl p-4 max-w-sm mx-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gradient-indigo flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Instalar LifeOS</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Instale o app para acesso rápido e funcionalidade offline
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Instalar
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}





