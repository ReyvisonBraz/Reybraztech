# 🔍 Auditoria Completa do Projeto Reybraztech

**Data:** 26/04/2026  
**Versão:** 1.0  
**Escopo:** Análise completa backend + frontend + DevOps + Segurança

---

## 📋 RESUMO EXECUTIVO

Projeto full-stack robusto com React + Express + Supabase. Stack moderna, código bem organizado, mas com oportunidades significativas de melhoria em segurança, performance e manutenção. O projeto demonstra maturidade técnica com uso de Zod, JWT, rate limiting, e middleware de autenticação.

---

## 🚨 PRIORIDADE CRÍTICA (Corrigir Imediatamente)

### 1. Segurança — Variáveis de Ambiente

| Arquivo | Problema |
|---------|----------|
| `.env.example` (linha 15) | `FRONTEND_URL=` vazio — permite qualquer origem CORS |
| `server/index.ts` (linha 53-63) | CORS aceita `/.vercel\.app$/` — regex muito permissiva, permite apps de terceiros no mesmo domínio |

**Recomendação:**
```typescript
// CORS restritivo — apenas origens conhecidas
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://reybraztech.pages.dev',
  'https://reybraztech.vercel.app',
];
app.use(cors({
  origin: allowedOrigins, // não regex genérico
  credentials: true,
}));
```

### 2. Segurança — Rate Limiting Fraco

| Rota | Limite Atual | Risco |
|------|-------------|-------|
| `/api/auth/login` | 10/15min | OK — protege contra brute force |
| `/api/auth` (geral) | 50/15min | **Baixo demais para uso normal** |
| `/api/dashboard` | 50/15min | **Grave** — polling do frontend pode consumir rapidamente |

**Recomendação:**
- `/api/auth`: manter 10/15min (já bom)
- `/api/dashboard`: aumentar para **200/15min**
- Adicionar rate limit para **`/api/auth/register`**: **20/15min** (atualmente sem limite específico)

### 3. Segurança — Senha Admin em Texto Plano

| Local | Problema |
|-------|----------|
| `server/routes/admin.ts:22` | `starhome_password !== envPassword` — comparação direta de string |
| `AdminPage.tsx:78-79` | Senha verificada e armazenada em `sessionStorage` em texto plano |

**Recomendação:**
- Usar `bcrypt.compare()` para comparar senhas
- Armazenar hash da senha admin no `.env`
- Adicionar expiração forçada da verificação admin (ex: 15 min)

---

## 🔴 PRIORIDADE ALTA

### 4. Segurança — Validação de Input

| Rota | Problema |
|------|----------|
| `auth.ts:152` | `cleanPhone = identifier.replace(/[\s\-\(\)]/g, '')` — remove caracteres mas não valida se resultado é numérico |
| `RegisterPage.tsx:265` | Input WhatsApp aceita qualquer string — não valida formato brasileiro |
| `otp.ts:143` | `newPassword.length < 6` — validação mínima sem verificação de força |

**Recomendação:**
```typescript
// Validar WhatsApp brasileiro
const cleanPhone = identifier.replace(/\D/g, '');
if (cleanPhone.length < 10 || cleanPhone.length > 13) {
  res.status(400).json({ error: 'WhatsApp inválido.' });
  return;
}
```

### 5. Performance — Cold Start do Render

| Componente | Impacto |
|-----------|---------|
| `App.tsx:58-62` | `useEffect` faz fetch no `/api/health` em **TODAS** as pages |
| `DashboardPage.tsx:184-219` | Fetch do dashboard executa em toda renderização se não houver token |
| `AdminPage.tsx:230-233` | Duplo fetch inicial: `fetchClients(1)` + `fetchStats()` simultâneos |

**Recomendação:**
- Fetch do health apenas no primeiro mount (App.tsx)
- Adicionar `AbortController` para cancelar fetch em компонента unmount
- Implementar **stale-while-revalidate** pattern para dados do dashboard

### 6. Performance — Bundle Size

| Componente | Tamanho | Impacto |
|-----------|---------|---------|
| `three` + `lucide-react` | ~150KB minificado | Atraso na renderização |
| `motion/react` | ~50KB | Carregado em todas as páginas |
| WebGL Shader | GPU intensive | Pode causar lag em dispositivos modestos |

**Recomendação:**
```typescript
// Lazy load de heavy dependencies
const WebGLShader = lazy(() => import('../components/web-gl-shader').then(m => ({ default: m.WebGLShader })));

// Já implementado — manter consistência
const Three = lazy(() => import('three').then(m => ({ default: m.Three })));
```

### 7. UX/UI — Estados de Loading/Erro

| Página | Problema |
|--------|----------|
| `DashboardPage.tsx:297-306` | Loading spinner genérico sem skeleton |
| `AdminPage.tsx:396-401` | Loading com spinner, mas tabela pode mostrar dados velhos |
| `LoginPage.tsx` | Não há loading state visual durante autenticação (além do botão) |

**Recomendação:**
- Implementar **loading skeletons** com `@radix-ui/react-skeleton` ou similar
- Adicionar **toast notifications** para feedback de ações (ex: "Credenciais copiadas!")

### 8. DevOps — Scraper Timeout

| Configuração | Valor Atual | Problema |
|--------------|-------------|-----------|
| `scraper-runner.ts` | `timeout: 300000` (5 min) | Pode não ser suficiente para sync completo |
| Render (free tier) | Hiberna após 15 min | Scraper pode não acordar a tempo |

**Recomendação:**
- Aumentar timeout para **600000ms** (10 min)
- Implementar **retry com backoff exponencial**
- Considerar **dedicated worker** para sync em background

---

## 🟡 PRIORIDADE MÉDIA

### 9. Arquitetura — Estrutura de Arquivos

**Problemas encontrados:**
- `server/utils/logger.ts` — exporta muitas funções misturadas
- `server/services/` — arquivos de serviço não seguem padrão consistente
- `src/config/api.ts` — lógica de detecção de ambiente pode falhar

**Recomendação:**
```
server/
├── services/
│   ├── whatsapp.ts      # único arquivo
│   ├── telegram.ts      #拆分
│   └── otp.ts
├── middleware/
│   ├── auth.ts          # verifyToken
│   ├── admin.ts         # verifyAdmin
│   └── rate-limit.ts    # configurações centralizadas
└── utils/
    └── logger.ts        # manter mas documentar
```

### 10. UX/UI — Design System

| Aspecto | Status | Recomendação |
|---------|--------|---------------|
| **CSS Custom Properties** | Implementado (linha 18-35) | Falta documentação |
| **Dark/Light mode** | Implementado mas **light mode broken** | Testar e corrigir transições |
| **Glass morphism** | Usado em `src/index.css:108-113` | Consistente — OK |
| **Animações** | Múltiplos `@keyframes` customizados | Consolidar em CSS variables |

**Problema específico:** 
- Light mode (`index.css:133-134`) tem sombras de sombra de `border-primary/40` mas `primary` é `light` no `:root` — pode não aplicar corretamente

### 11. Código — Boas Práticas

| Local | Problema |
|-------|----------|
| `server/index.ts:478` | `if (!process.env.VERCEL)` — ambiente detectado incorretamente |
| `dashboard.ts:14` | `CASE WHEN... GREATEST...` — lógica complexa, repetir em 4+ lugares |
| `LoginPage.tsx:260-302` | `handleLogin` faz muita coisa — 40+ linhas sem拆分 |
| `AdminPage.tsx` | `renewPollRef` como `ReturnType<typeof setInterval>` — tipo fraco |

**Recomendação:**
```typescript
// Centralizar lógica de dias restantes
const getDaysRemaining = (client: ClientRow): number => {
  if (client.starhome_expiration_date) {
    return Math.max(0, differenceInDays(new Date(client.starhome_expiration_date), new Date()));
  }
  return client.days_remaining;
};
```

### 12. Segurança — Webhook SendPulse

| Aspecto | Status | Risco |
|---------|--------|-------|
| `server/index.ts:129-168` | Recebe payload sem validação de assinatura | **Alto** |
| Não há validação de IP/certificado do SendPulse | Qualquer um pode enviar mensagens | **Alto** |

**Recomendação:**
- Validar `X-SendPulse-Signature` header se disponível
- whitelist IPs do SendPulse no CORS
- Adicionar logging de payloads suspeitos

### 13. DevOps — Dependências

| Dependência | Versão | Preocupação |
|-------------|--------|-------------|
| `react@19.0.0` | Muy nueva | Possíveis incompatibilidades com libraries |
| `postgres@3.4.8` | Nova | Verificar suporte a Prepared Statements |
| `zod@4.3.6` | Beta | Migrar para `zod@3.x` estável quando possível |

---

## 🟢 PRIORIDADE BAIXA (Nice to Have)

### 14. UX/UI — Melhorias Visuais

- **Favicon** — verificar se existe e está otimizado
- **Meta tags** — og:image, og:description para SEO
- **Loading states** — skeleton screens em todas as páginas
- **Empty states** — mensagens quando não há dados (ex: histórico de pagamentos vazio)

### 15. Performance — Cache Strategy

- Adicionar **Service Worker** mais robusto (já existe `public/sw.js`)
- Implementar **IndexedDB** para cache offline de dados do usuário
- Considerar **React Query** para cache de requisições API

### 16. Monitoramento

| Ferramenta | Status | Gaps |
|------------|--------|------|
| Sentry | Implementado | Não configura `sampleRate` para produção (linha 14: `tracesSampleRate: 1.0`) |
| Logs Winston | Implementado | Não há log rotation configurado |
| Vercel Analytics | Implementado | Falta **Core Web Vitals** tracking |

**Recomendação:**
```typescript
// Sentry — sample rate em produção deve ser ~0.1
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

---

## 📊 MATRIZ DE PRIORIDADES

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              MATRIZ DE PRIORIDADE                       │
├───────────┬─────────────────────┬───────────────────┬───────────────────┤
│           │      IMPACTO         │     ESFORÇO      │    RECOMENDAÇÃO   │
├───────────┼─────────────────────┼───────────────────┼───────────────────┤
│ CRÍTICO   │                     │                   │                   │
│ Segurança │ Rate limit fraco     │ Baixo             │ Implementar       │
│ Segurança │ CORS permissivo      │ Baixo             │ Corrigir regex    │
│ Segurança │ Admin sem hash       │ Baixo             │ Refatorar         │
│ Segurança │ Input validation     │ Médio             │ Adicionar Zod     │
│           │                     │                   │                   │
│ ALTA      │ Cold start Render    │ Médio             │ Otimizar fetch    │
│ UX/UI     │ Loading skeletons    │ Médio             │ Implementar       │
│ DevOps    │ Scraper timeout      │ Baixo             │ Aumentar timeout  │
│           │                     │                   │                   │
│ MÉDIA     │ Arquitetura         │ Alto              │ Planejar refactor │
│ Código    │ Código duplicado     │ Médio             │ Extrair utilitários│
│ DevOps    │ Sentry sample rate   │ Baixo             │ Corrigir          │
│           │                     │                   │                   │
│ BAIXA     │ Cache strategy       │ Alto              │ Roadmap           │
│ UX/UI     │ SEO meta tags        │ Baixo             │ Adicionar         │
│ DevOps    │ Log rotation         │ Médio             │ Configurar        │
└───────────┴─────────────────────┴───────────────────┴───────────────────┘
```

---

## ✅ CHECKLIST DE AÇÕES

### Imediato (Esta Semana)
- [ ] Corrigir CORS — remover regex genérico `/.vercel\.app$/`
- [ ] Aumentar rate limit do `/api/dashboard` para 200/15min
- [ ] Adicionar validação de WhatsApp com Zod
- [ ] Corrigir `tracesSampleRate` do Sentry para 0.1 em produção

### Curto Prazo (Próximas 2 Semanas)
- [ ] Implementar loading skeletons no Dashboard e Admin
- [ ] Refatorar lógica de `days_remaining` para função centralizada
- [ ] Aumentar timeout do scraper para 10 min
- [ ] Adicionar hash para senha admin Starhome
- [ ] Adicionar expiração forçada da verificação admin

### Médio Prazo (Próximo Mês)
- [ ] Migrar light mode para CSS custom properties corretamente
- [ ] Implementar React Query para cache de API
- [ ] Refatorar services em arquivos menores
- [ ] Adicionar retry com backoff para chamadas externas
- [ ] Configurar log rotation no Winston

### Longo Prazo (Roadmap)
- [ ] Implementar PWA offline-first completo
- [ ] Adicionar testes E2E (Playwright)
- [ ] Migrar para zod@3.x (estável)
- [ ] Implementar dashboard de métricas própria
- [ ] Considerar migração do scraper para Cloudflare Workers

---

## 📁 ARQUIVOS ANALISADOS

| Categoria | Arquivos |
|-----------|----------|
| **Backend** | `server/index.ts`, `server/database.ts`, `server/routes/auth.ts`, `server/routes/admin.ts`, `server/routes/otp.ts`, `server/routes/dashboard.ts` |
| **Frontend** | `src/App.tsx`, `src/pages/LandingPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/AdminPage.tsx` |
| **Config** | `package.json`, `vite.config.ts`, `tsconfig.json`, `.env.example` |
| **Estilização** | `src/index.css` |

---

*Documento gerado automaticamente via análise de código. Recomendamos revisões periódicas a cada ciclo de desenvolvimento.*
