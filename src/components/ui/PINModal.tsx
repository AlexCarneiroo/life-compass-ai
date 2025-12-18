import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PINModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  sectionName?: string;
}

export function PINModal({ open, onClose, onVerify, sectionName }: PINModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
      // Focar no input após a animação
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!pin || pin.length < 4) {
      setError(true);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const isValid = await onVerify(pin);
      
      if (isValid) {
        setPin('');
        onClose();
      } else {
        setError(true);
        setPin('');
        inputRef.current?.focus();
        toast.error('PIN incorreto');
      }
    } catch (error) {
      setError(true);
      setPin('');
      toast.error('Erro ao verificar PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Senha PIM Necessária
          </DialogTitle>
          <DialogDescription>
            {sectionName 
              ? `Esta seção está protegida. Digite seu PIN para acessar "${sectionName}".`
              : 'Esta seção está protegida. Digite seu PIN para continuar.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin-input">PIN</Label>
            <Input
              ref={inputRef}
              id="pin-input"
              type="password"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Apenas números
                if (value.length <= 8) {
                  setPin(value);
                  setError(false);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite seu PIN"
              maxLength={8}
              className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={loading}
              autoComplete="off"
            />
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4" />
                PIN incorreto. Tente novamente.
              </motion.div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !pin || pin.length < 4}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Verificar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}




