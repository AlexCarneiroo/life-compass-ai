import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function TestNotifications() {
  const { hasPermission, isSupported, requestPermission, sendTestNotification, scheduleCheckinReminder } = usePushNotifications();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-15));
    console.log(msg);
  };

  const handleRequestPermission = async () => {
    addLog('Solicitando permissão...');
    const granted = await requestPermission();
    addLog(`Permissão: ${granted ? 'Concedida ✅' : 'Negada ❌'}`);
  };

  const handleTestNotification = async () => {
    if (!hasPermission) {
      addLog('❌ Sem permissão - solicite primeiro');
      return;
    }
    addLog('Enviando notificação de teste...');
    const result = await sendTestNotification();
    addLog(`Resultado: ${result ? 'Sucesso ✅' : 'Falha ❌'}`);
  };

  const handleCheckServiceWorker = async () => {
    addLog('Verificando Service Worker...');
    try {
      if (!('serviceWorker' in navigator)) {
        addLog('❌ Service Worker não suportado');
        return;
      }
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      addLog(`SWs registrados: ${registrations.length}`);
      registrations.forEach(reg => {
        addLog(`  - Escopo: ${reg.scope}`);
      });

      const ready = await navigator.serviceWorker.ready;
      addLog(`✅ SW pronto: ${ready.scope}`);
    } catch (error) {
      addLog(`❌ Erro: ${error}`);
    }
  };

  const handleScheduleTest = async () => {
    if (!hasPermission) {
      addLog('❌ Sem permissão');
      return;
    }
    addLog('Agendando notificação em 5 segundos...');
    const now = new Date();
    const in5Seconds = new Date(now.getTime() + 5000);
    
    // Chamando manualmente o push service
    const { pushNotificationService } = await import('@/lib/services/pushNotifications');
    const timeoutId = pushNotificationService.scheduleNotification(
      {
        title: '⏰ Teste Agendado',
        body: 'Esta notificação foi agendada!',
        tag: 'test-scheduled',
      },
      in5Seconds
    );
    
    addLog(`Agendado com ID: ${timeoutId}`);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="p-4 bg-slate-900 text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm">🔔 Test Notificações</h3>
          <span className="text-xs">{isSupported ? '✅ Suportado' : '❌ Não suportado'}</span>
        </div>

        <div className="bg-slate-800 rounded p-2 mb-4 text-xs overflow-y-auto max-h-32 font-mono">
          {logs.length === 0 ? (
            <p className="text-slate-400">Logs apareçam aqui...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-slate-300">
                {log}
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Button
            size="sm"
            onClick={handleRequestPermission}
            variant={hasPermission ? 'default' : 'outline'}
          >
            {hasPermission ? '✅ Permissão' : 'Permitir'}
          </Button>
          <Button
            size="sm"
            onClick={handleTestNotification}
            disabled={!hasPermission}
          >
            Testar Notif
          </Button>
          <Button
            size="sm"
            onClick={handleCheckServiceWorker}
          >
            Check SW
          </Button>
          <Button
            size="sm"
            onClick={handleScheduleTest}
            disabled={!hasPermission}
          >
            Agendar 5s
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
          <p>Permissão: {hasPermission ? 'Sim ✅' : 'Não ❌'}</p>
          <p>Suportado: {isSupported ? 'Sim ✅' : 'Não ❌'}</p>
        </div>
      </Card>
    </div>
  );
}
