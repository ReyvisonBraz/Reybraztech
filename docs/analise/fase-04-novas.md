# Fase 4: Novas Funcionalidades

> **Objetivo:** Implementar features pendentes e melhorias avançadas

---

## Tarefas

### 4.1 Testar Webhook Mercado Pago (já implementado)
**Status:** O webhook já está implementado em `server/routes/payments.ts`. Precisa testar em produção.

**Verificar:**
- [ ] Webhook está funcionando corretamente
- [ ] Pagamentos estão sendo processados
- [ ] Clientes estão recebendo WhatsApp de confirmação

**Se não funcionar, troubleshooting:**
```bash
# 1. Verificar se URL do webhook está configurada no Mercado Pago
# 2. Verificar logs no Telegram
# 3. Verificar tabela pending_orders no banco
```

---

### 4.2 Sistema de Renovação Automática
**Contexto:** Criar cron job para decrementar dias_remaining automaticamente.

**Criar script de renovação:**
```typescript
// server/scripts/daily-renewal.ts
import sql from '../database.js';
import logger from '../utils/logger.js';
import { sendExpirationWarning, sendSubscriptionExpired } from '../services/whatsapp.js';

export async function runDailyRenewal() {
  logger.info('🔄 Iniciando renovação diária...');

  // 1. Decrementar dias de todos os clientes ativos
  const result = await sql`
    UPDATE clients 
    SET days_remaining = days_remaining - 1 
    WHERE status = 'Ativo' AND days_remaining > 0
    RETURNING id, name, whatsapp, days_remaining, plan
  `;

  logger.info(`🔢 ${result.length} clientes atualizados`);

  // 2. Verificar quem expireu (days_remaining = 0)
  const expiredClients = result.filter(c => c.days_remaining === 0);
  
  for (const client of expiredClients) {
    // Atualizar status para Inativo
    await sql`
      UPDATE clients SET status = 'Inativo' WHERE id = ${client.id}
    `;
    
    // Enviar WhatsApp
    await sendSubscriptionExpired(client.whatsapp, client.name);
    
    logger.info(`❌ Cliente ${client.name} expirou`);
  }

  // 3. Enviar alerta para quem vai expirar em 3 dias
  const warningClients = await sql`
    SELECT id, name, whatsapp 
    FROM clients 
    WHERE status = 'Ativo' AND days_remaining = 3
  `;

  for (const client of warningClients) {
    await sendExpirationWarning(client.whatsapp, client.name);
  }

  logger.info('✅ Renovação diária concluída');
}

// Executar se chamado diretamente
if (process.argv[1] === __filename) {
  runDailyRenewal()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Erro na renovação:', err);
      process.exit(1);
    });
```

**Configurar cron job no Render:**
```bash
# Scheduled Jobs no Render
# Command: node dist/scripts/daily-renewal.js
# Frequency: Daily (meia-noite horário de Brasília)
```

**Adicionar funções no whatsapp.ts:**
```typescript
// server/services/whatsapp.ts - adicionar
export async function sendExpirationWarning(whatsapp: string, name: string): Promise<boolean> {
  const message = `⚠️ *Reybraztech — Aviso de Expiração*\n\nOlá ${name}!\n\nFaltam apenas *3 dias* para seu plano expirar.\n\nRenove agora para não perder o acesso:\n${process.env.FRONTEND_URL}/dashboard\n\nÉ rápido e fácil! 🚀`;
  
  return sendWhatsApp(whatsapp, message);
}

export async function sendSubscriptionExpired(whatsapp: string, name: string): Promise<boolean> {
  const message = `😢 *Reybraztech — Assinatura Expirada*\n\nOlá ${name}!\n\nSua assinatura venceu e o acesso foi temporariamente suspenso.\n\nPara voltar a assistir, renove agora:\n${process.env.FRONTEND_URL}/checkout\n\nEstamos esperando por você! 📺`;
  
  return sendWhatsApp(whatsapp, message);
}
```

---

### 4.3 Sistema de Notificações Push
**Contexto:** Adicionar service worker para notificações push.

**Criar service worker:**
```typescript
// public/sw.ts
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Reybraztech';
  const options = {
    body: data.body || 'Você tem uma nova mensagem',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/',
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
```

**Registrar no frontend:**
```typescript
// src/main.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.ts')
    .then((registration) => {
      console.log('SW registrado:', registration);
    })
    .catch((error) => {
      console.log('SW registro falhou:', error);
    });
}
```

---

### 4.4 Dark/Light Mode Toggle
**Contexto:** Já tem modo escuro. Adicionar toggle para alternar.

**Criar hook:**
```typescript
// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('reyb_theme') as Theme;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('light', stored === 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('reyb_theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  return { theme, toggleTheme };
}
```

**Criar botão de toggle:**
```typescript
// src/components/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      aria-label="Alternar tema"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
```

---

### 4.5 Dashboard Analytics (Simple)
**Contexto:** Adicionar gráficos simples no dashboard admin.

**Instalar biblioteca:**
```bash
npm install recharts
```

**Criar componente de gráficos:**
```typescript
// src/components/admin/StatsCharts.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsData {
  label: string;
  value: number;
}

interface StatsChartsProps {
  plans: StatsData[];
  status: StatsData[];
}

export function StatsCharts({ plans, status }: StatsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="glass p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-4">Planos</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={plans}>
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                background: '#0f172a', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass p-6 rounded-3xl">
        <h3 className="text-lg font-bold text-white mb-4">Status</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={status}>
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                background: '#0f172a', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

### 4.6 Sistema de Cache no Frontend
**Contexto:** Usar React Query para cache e refetch automático.

**Instalar:**
```bash
npm install @tanstack/react-query
```

**Configurar:**
```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000,   // 30 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

**Usar em páginas:**
```typescript
// src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';

function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  // render data
}
```

---

## Checklist de Conclusão

- [ ] 4.1 Webhook testado e funcionando
- [ ] 4.2 Renovação automática implementada
- [ ] 4.3 Notificações push configuradas
- [ ] 4.4 Theme toggle implementado
- [ ] 4.5 Gráficos no admin
- [ ] 4.6 Cache com React Query

---

## Notas

- Testar em staging antes de produção
- Monitorar custos de API (Mercado Pago, SendPulse)
- Adicionar testes antes de deploy
