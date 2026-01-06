/**
 * Componente completo para gerenciar notificações push
 * Inclui: ativação, status, teste e feedback visual
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { checkBackendHealth, sendCheckinReminder } from '@/lib/services/notificationBackend';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NotificationManager() {
  const { userId } = useAuth();
  const {
    isSupported,
    hasPermission,
    requestPermission,
    sendTestNotification,
    scheduledReminders,
  } = usePushNotifications();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [testing, setTesting] = useState(false);

  // Verifica status do backend
  useEffect(() => {
    const checkStatus = async () => {
      setBackendStatus('checking');
      const isOnline = await checkBackendHealth();
      setBackendStatus(isOnline ? 'online' : 'offline');
    };

    checkStatus();
    // Verifica a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleActivate = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notificações ativadas com sucesso!');
    } else {
      toast.error('Permissão de notificações negada. Ative manualmente nas configurações do navegador.');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const sent = await sendTestNotification();
      if (sent) {
        toast.success('Notificação de teste enviada!');
      } else {
        toast.error('Erro ao enviar notificação de teste');
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    } finally {
      setTesting(false);
    }
  };

  const handleTestBackend = async () => {
    if (!userId) return;
    
    setTesting(true);
    try {
      const result = await sendCheckinReminder(userId);
      if (result.success) {
        toast.success('Notificação enviada via backend!');
      } else {
        toast.error(result.message || 'Erro ao enviar notificação');
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação via backend');
    } finally {
      setTesting(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Notificações não são suportadas neste navegador
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const permissionStatus = {
    granted: {
      label: 'Ativado',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      badge: 'Ativo',
    },
    denied: {
      label: 'Bloqueado',
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      badge: 'Bloqueado',
    },
    default: {
      label: 'Não configurado',
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      badge: 'Pendente',
    },
  };

  const status = permissionStatus[hasPermission ? 'granted' : Notification.permission] || permissionStatus.default;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      {/* Status Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Gerencie notificações push e lembretes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da Permissão */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', status.bgColor)}>
                <StatusIcon className={cn('w-5 h-5', status.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Permissão do Navegador</span>
                  <Badge variant="secondary">{status.badge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {status.label}
                </p>
              </div>
            </div>
            {!hasPermission && (
              <Button onClick={handleActivate} size="sm">
                Ativar Notificações
              </Button>
            )}
          </div>

          {/* Status do Backend */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                backendStatus === 'online' ? 'bg-emerald-500/10' : 
                backendStatus === 'offline' ? 'bg-red-500/10' : 
                'bg-yellow-500/10'
              )}>
                {backendStatus === 'checking' ? (
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                ) : backendStatus === 'online' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Backend de Notificações</span>
                  <Badge variant={backendStatus === 'online' ? 'default' : 'destructive'}>
                    {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Verificando...'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {backendStatus === 'online' 
                    ? 'Backend funcionando corretamente'
                    : backendStatus === 'offline'
                    ? 'Backend não disponível - usando apenas Firestore'
                    : 'Verificando conexão...'}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          {hasPermission && (
            <div className="flex gap-2">
              <Button
                onClick={handleTest}
                disabled={testing}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Testar Notificação Local
                  </>
                )}
              </Button>
              {backendStatus === 'online' && userId && (
                <Button
                  onClick={handleTestBackend}
                  disabled={testing}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Testar Via Backend
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Lembretes Agendados */}
          {scheduledReminders.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Lembretes Ativos</h4>
              <div className="space-y-2">
                {scheduledReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                    <span className="capitalize">{reminder.type}</span>
                    <Badge variant="outline">{reminder.time}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações */}
      {!hasPermission && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">Como ativar notificações</h4>
                <p className="text-sm text-muted-foreground">
                  Clique em "Ativar Notificações" acima. Se o navegador pedir permissão, 
                  clique em "Permitir" para receber lembretes de hábitos, check-ins e insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasPermission && backendStatus === 'offline' && (
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">Backend offline</h4>
                <p className="text-sm text-muted-foreground">
                  O backend de notificações não está disponível. As notificações locais 
                  continuarão funcionando, mas notificações agendadas do servidor podem não funcionar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



