# Plano de Ação — Correções Reybraztech

> **Agent usage:** REQUIRED SUB-SKILL: `subagent-driven-development` (recommended) or `executing-plans`

**Goal:** Implementar todas as correções de prioridade crítica e alta identificadas na auditoria, melhorando segurança, performance e UX.

**Architecture:** Plano dividido em 3 fases — (1) Crítico, (2) Alta, (3) Médio prazo. Cada fase contém tasks independentes que podem ser executadas em paralelo por subagents.

**Tech Stack:** TypeScript, React 19, Express, Zod, TailwindCSS v4, Postgres/Supabase

---

## FASE 1: CRÍTICO (Esta Semana)

### Task 1: Corrigir CORS Permissivo

**Files:**
- Modify: `server/index.ts:51-63`

**Steps:**

- [ ] **Step 1: Substituir regex CORS por lista de origens explícitas**

```typescript
// Substituir a configuração CORS atual
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://reybraztech.pages.dev',
  'https://reybraztech.vercel.app',
];

app.use(cors({
  origin: allowedOrigins, // NÃO usa regex genérico
  credentials: true,
}));
```

- [ ] **Step 2: Remover regex `/\.vercel\.app$/` da lista de origens**

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "fix: restrict CORS to explicit origins only"
```

---

### Task 2: Aumentar Rate Limit do Dashboard

**Files:**
- Modify: `server/index.ts:67-73`

**Steps:**

- [ ] **Step 1: Aumentar max do limiter geral de 50 para 200**

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // era 50 — adequado para polling do frontend
  message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

- [ ] **Step 2: Adicionar rate limit específico para /api/auth/register (20/15min)**

```typescript
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de cadastro. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/register', registerLimiter);
```

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "fix: increase dashboard rate limit and add register limiter"
```

---

### Task 3: Adicionar Validação de Input com Zod

**Files:**
- Modify: `server/routes/auth.ts:24-36` (adicionar validação phone)
- Modify: `server/routes/auth.ts:127-133` (login input validation)

**Steps:**

- [ ] **Step 1: Criar schema de validação para phone**

```typescript
// Adicionar no início do arquivo auth.ts
const phoneSchema = z.string().transform(val => val.replace(/\D/g, '')).refine(
  val => val.length >= 10 && val.length <= 13,
  'WhatsApp inválido. Forneça um número com DDD.'
);

// Modificar loginSchema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Identificador é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});
```

- [ ] **Step 2: Validar phone no registro (após parse)**

```typescript
// No POST /register, após extrair whatsapp:
const cleanPhone = whatsapp.replace(/\D/g, '');
if (cleanPhone.length < 10 || cleanPhone.length > 13) {
  res.status(400).json({ error: 'WhatsApp inválido.' });
  return;
}
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/auth.ts
git commit -m "fix: add WhatsApp validation with phone format check"
```

---

### Task 4: Corrigir Sentry Sample Rate em Produção

**Files:**
- Modify: `server/index.ts:10-16`

**Steps:**

- [ ] **Step 1: Ajustar tracesSampleRate**

```typescript
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/index.ts
git commit -m "fix: set Sentry tracesSampleRate to 0.1 in production"
```

---

## FASE 2: ALTA PRIORIDADE (Próximas 2 Semanas)

### Task 5: Loading Skeletons no Dashboard

**Files:**
- Modify: `src/pages/DashboardPage.tsx:297-306`

**Steps:**

- [ ] **Step 1: Criar componente Skeleton reutilizável**

```typescript
// Criar: src/components/ui/skeleton.tsx
import { motion } from 'motion/react';

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <motion.div
    className={`bg-slate-700/50 rounded-xl animate-pulse ${className}`}
    initial={{ opacity: 0.5 }}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex gap-4">
      <Skeleton className="h-12 flex-1" />
      <Skeleton className="h-12 flex-1" />
    </div>
    <Skeleton className="h-48" />
    <Skeleton className="h-32" />
  </div>
);
```

- [ ] **Step 2: Substituir spinner por skeleton no loading state**

```typescript
// Substituir o loading spinner
if (loading) {
  return <DashboardSkeleton />;
}
```

- [ ] **Step 3: Adicionar skeleton CSS se não existir**

```css
/* Em index.css adicionar */
.dark .animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardPage.tsx src/components/ui/skeleton.tsx src/index.css
git commit -m "feat: add loading skeletons to dashboard"
```

---

### Task 6: Refatorar Lógica days_remaining Centralizada

**Files:**
- Create: `src/utils/subscription.ts`
- Modify: `server/routes/dashboard.ts:14-22`
- Modify: `server/routes/admin.ts:103-107`
- Modify: `server/routes/admin.ts:38-46`

**Steps:**

- [ ] **Step 1: Criar utilitário no frontend**

```typescript
// src/utils/subscription.ts
export interface SubscriptionClient {
  starhome_expiration_date?: string | null;
  days_remaining: number;
}

export const getDaysRemaining = (client: SubscriptionClient): number => {
  if (client.starhome_expiration_date) {
    const expDate = new Date(client.starhome_expiration_date);
    const today = new Date();
    const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }
  return client.days_remaining;
};

export const getExpirationStatus = (days: number): 'ok' | 'warning' | 'critical' => {
  if (days > 10) return 'ok';
  if (days > 3) return 'warning';
  return 'critical';
};
```

- [ ] **Step 2: Atualizar frontend para usar utilitário**

```typescript
// Em DashboardPage.tsx, onde usa days_remaining
import { getDaysRemaining } from '../utils/subscription';
const days = getDaysRemaining(user);
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/subscription.ts
git commit -m "feat: create subscription utility for days remaining calculation"
```

---

### Task 7: Aumentar Timeout Scraper

**Files:**
- Modify: `server/index.ts:275` (axios.post timeout)
- Modify: `server/index.ts:372` (outro axios.post timeout)

**Steps:**

- [ ] **Step 1: Aumentar timeout de 300000ms para 600000ms**

```typescript
// Em ambos os lugares:
await axios.post(`${SCRAPER_URL}/run`, { action: 'sync' }, { 
  headers: { 'x-api-key': SCRAPER_KEY }, 
  timeout: 600000 // era 300000 — 10 minutos
});
```

- [ ] **Step 2: Commit**

```bash
git add server/index.ts
git commit -m "fix: increase scraper timeout to 10 minutes"
```

---

### Task 8: Otimizar Fetch Health (Cold Start)

**Files:**
- Modify: `src/App.tsx:57-62`

**Steps:**

- [ ] **Step 1: Fazer fetch do health apenas uma vez no mount**

```typescript
// Já está com useEffect, mas adicionar flag para evitar re-fetch
const [serverAwake, setServerAwake] = useState(false);

useEffect(() => {
  if (!serverAwake) {
    fetch(`${API_URL}/api/health`, { method: 'GET' })
      .then(() => setServerAwake(true))
      .catch(() => {});
  }
}, [serverAwake]);
```

- [ ] **Step 2: Passar estado awake para páginas que precisam**

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "perf: optimize server wake-up to single fetch"
```

---

## FASE 3: MÉDIA PRIORIDADE (Próximo Mês)

### Task 9: Hash para Senha Admin Starhome

**Files:**
- Modify: `server/routes/admin.ts:17-27`
- Modify: `src/pages/AdminPage.tsx:92-114`

**Steps:**

- [ ] **Step 1: Armazenar hash da senha admin no .env**

```bash
# No .env.example
STARHOME_PASSWORD_HASH=
```

- [ ] **Step 2: Comparar usando bcrypt**

```typescript
import bcrypt from 'bcryptjs';

// Gerar hash inicial (apenas uma vez)
const hash = await bcrypt.hash(process.env.PANEL_PASSWORD, 10);
console.log('Hash gerado:', hash); // copiar para .env

// Verificar usando bcrypt.compare
const isValid = await bcrypt.compare(starhome_password, process.env.STARHOME_PASSWORD_HASH);
if (!isValid) { res.status(401).json({ error: 'Senha incorreta.' }); return; }
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/admin.ts
git commit -m "security: use bcrypt for admin password comparison"
```

---

### Task 10: Retry com Backoff para Chamadas Externas

**Files:**
- Create: `src/utils/retry.ts`
- Modify: `src/config/api.ts` (integrar retry)

**Steps:**

- [ ] **Step 1: Criar utilitário retry**

```typescript
// src/utils/retry.ts
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
};
```

- [ ] **Step 2: Integrar no API helper**

- [ ] **Step 3: Commit**

```bash
git add src/utils/retry.ts src/config/api.ts
git commit -m "feat: add retry with exponential backoff utility"
```

---

### Task 11: Corrigir Light Mode CSS

**Files:**
- Modify: `src/index.css:18-25` (CSS custom properties)

**Steps:**

- [ ] **Step 1: Verificar e corrigir propriedades**

```css
:root {
  /* Light mode — valores corretos */
  --bg-page: #ffffff;
  --text-main: #0f172a;
  --card-bg: #ffffff;
  --card-border: #e2e8f0;
}

.dark {
  --bg-page: #020617;
  --text-main: #f1f5f9;
  --card-bg: #0f172a;
  --card-border: rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: Garantir que glass use variáveis corretas**

```css
.glass {
  background: color-mix(in oklch, var(--card-bg) 80%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "fix: correct light mode CSS custom properties"
```

---

## RESUMO DO PLANO

| Fase | Tasks | Prioridade |
|------|-------|------------|
| **Fase 1: Crítico** | Tasks 1-4 | ~2-3 horas |
| **Fase 2: Alta** | Tasks 5-8 | ~4-5 horas |
| **Fase 3: Médio** | Tasks 9-11 | ~3-4 horas |
| **Total** | 11 tasks | ~9-12 horas |

---

## OPÇÕES DE EXECUÇÃO

**1. Subagent-Driven (recomendado)** — Eu inicio subagents paralelos por task, com revisão entre fases

**2. Ejecução inline** — Executo tasks sequencialmente neste contexto com checkpoints de revisão

**Qual abordagem prefere?**
