# 🗺️ Guia 06 — Roadmap e Melhorias

> **Objetivo:** Um roadmap detalhado e incremental para evoluir o sistema Reybraztech, feito para ser seguido **um passo por dia**, aprendendo e entendendo cada conceito antes de avançar.

---

## 📊 Diagnóstico Atual do Projeto

Antes de planejar, precisamos saber **onde estamos**. Analisei todo o código e comparei com o que os guias 1–4 propõem:

### ✅ O que JÁ EXISTE e funciona:
| Item | Arquivo | Status |
|------|---------|--------|
| Frontend com 5 páginas | `src/pages/*.tsx` | ✅ Funcionando |
| Backend Express na porta 3001 | `server/index.ts` | ✅ Funcionando |
| Banco Supabase (PostgreSQL) | `server/database.ts` | ✅ Funcionando |
| Cadastro de clientes | `server/routes/auth.ts` | ✅ Funcionando |
| Login com JWT e OTP WhatsApp | `server/routes/auth.ts` | ✅ Funcionando |
| Dashboard protegido | `server/routes/dashboard.ts` | ✅ Funcionando |
| Middleware de autenticação | `server/middleware/auth.ts` | ✅ Funcionando |
| Animação WebGL de fundo | `src/components/web-gl-shader.tsx` | ✅ Funcionando |
| Componentes shadcn/ui | `src/components/ui/` | ✅ Funcionando |
| Deploy do Frontend | Cloudflare Pages | ✅ Funcionando |
| Deploy do Backend | Render | ✅ Funcionando |

### ⚠️ O que FALTA implementar (gaps entre docs e código):
| Item | Onde está descrito | Prioridade |
|------|-------------------|------------|
| JWT_SECRET é um valor fixo no código | Guia 02 (§1.1) | 🔴 Crítico |
| `.env.example` não tem `JWT_SECRET` | Guia 02 (§1.1) | 🔴 Crítico |
| Servidor NÃO valida variáveis de ambiente | Guia 02 (§1.2) | 🔴 Crítico |
| Sem `helmet` (headers de segurança) | Guia 02 (§2.1) | 🟡 Importante |
| Sem `express-rate-limit` (proteção contra brute-force) | Guia 02 (§2.1) | 🟡 Importante |
| Sem validação Zod nas rotas | Guia 02 (§2.3) | 🟡 Importante |
| `ProtectedRoute` não verifica expiração do token | Guia 02 (§3.3) | 🟡 Importante |
| `app_password` em texto puro no banco | Guia 02 (§4.1) | 🟡 Importante |
| Medidas Avançadas Anti-Bot (reCAPTCHA, Honeypot) | Guia 02 | 🟡 Importante |
| Sem Painel Admin | Roadmap (guia-do-projeto) | 🟢 Futuro |
| Sem node-cron (jobs) | Roadmap (guia-do-projeto) | 🟢 Futuro |
| Sem Mercado Pago | Roadmap (guia-do-projeto) | 🟢 Futuro |

---

## 🗓️ Roadmap — Um Passo por Dia

O plano está dividido em **Semanas**. Cada semana é uma área de foco. Cada dia é uma tarefa pequena e clara.

---

### 📦 SEMANA 1 — Segurança Básica (Guia 02, Nível 1 e 2)

> **Conceito para aprender:** "Antes de construir novas funcionalidades, proteja o que já existe."

#### Dia 1 — Gerar um JWT_SECRET seguro e configurar o `.env`
**O que você vai aprender:** O que é uma chave secreta e por que ela não pode ser previsível.

**O que fazer:**
1. Abrir o terminal e rodar:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Copiar o resultado e colocar no `.env`:
   ```
   JWT_SECRET=<o_valor_gerado>
   ```
3. Atualizar o `.env.example` para incluir:
   ```
   JWT_SECRET=coloque_aqui_um_segredo_longo_gerado_com_crypto
   ```

**Conceito:** A chave JWT é como a chave-mestra de um prédio. Se alguém a adivinha, pode forjar tokens e acessar qualquer conta.

- [x] Concluído

---

#### Dia 2 — Validação de variáveis de ambiente no servidor
**O que você vai aprender:** Como garantir que o servidor não suba sem configurações essenciais.

**O que fazer:**
No `server/index.ts`, logo após o `dotenv.config()`, adicionar:
```typescript
// O servidor NÃO pode rodar sem essas variáveis
const REQUIRED_ENV = ['JWT_SECRET'];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ ERRO FATAL: Variável "${key}" não encontrada no .env!`);
    process.exit(1); // fecha o servidor imediatamente
  }
}
```

E no `server/routes/auth.ts` e `server/middleware/auth.ts`, trocar:
```typescript
// ❌ ANTES (valor fixo = perigoso)
const JWT_SECRET = process.env.JWT_SECRET || 'reybraztech_secret_key_change_in_production';

// ✅ DEPOIS (obriga a usar o .env)
const JWT_SECRET = process.env.JWT_SECRET!;
```

**Conceito:** O `!` no TypeScript diz "eu sei que esse valor existe". Como já validamos no `index.ts`, é seguro.

- [x] Concluído

---

#### Dia 3 — Instalar e configurar Helmet + Rate Limit
**O que você vai aprender:** Como adicionar camadas de proteção HTTP automáticas.

**O que fazer:**
1. Instalar os pacotes:
   ```bash
   npm install helmet express-rate-limit
   ```
2. No `server/index.ts`, adicionar antes das rotas:
   ```typescript
   import helmet from 'helmet';
   import rateLimit from 'express-rate-limit';

   // Headers de segurança automáticos
   app.use(helmet());

   // Limitar requisições da API (100 por IP a cada 15 min)
   app.use('/api', rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,
     message: { error: 'Muitas requisições. Tente em 15 minutos.' },
   }));

   // Limitar tentativas de login (5 por IP a cada 15 min)
   app.use('/api/auth/login', rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5,
     message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
   }));
   ```

**Conceito:** `Helmet` adiciona ~14 headers HTTP automaticamente (como `X-Frame-Options`). `Rate Limit` impede ataques de força bruta — um hacker não pode tentar milhares de senhas por minuto.

- [x] Concluído

---

#### Dia 4 — Configurar o Proxy do Vite
**O que você vai aprender:** Como o frontend se comunica com o backend em desenvolvimento.

**O que fazer:**
No `vite.config.ts`, adicionar a configuração de proxy:
```typescript
server: {
  hmr: process.env.DISABLE_HMR !== 'true',
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

**Conceito:** Sem o proxy, o navegador bloqueia chamadas `fetch('/api/...')` porque vão para a porta 3000 (Vite) e não para a 3001 (Express). O proxy resolve isso redirecionando internamente.

- [x] Concluído

---

#### Dia 5 — Validação com Zod na rota de registro
**O que você vai aprender:** Como validar dados antes de processá-los.

**O que fazer:**
1. Instalar o Zod:
   ```bash
   npm install zod
   ```
2. No `server/routes/auth.ts`, trocar a validação manual por Zod no `/register`:
   ```typescript
   import { z } from 'zod';

   const registerSchema = z.object({
     name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
     whatsapp: z.string().min(10, 'WhatsApp inválido'),
     device: z.string().min(1, 'Informe o dispositivo'),
     email: z.string().email('E-mail inválido'),
     password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
   });

   router.post('/register', async (req, res) => {
     const result = registerSchema.safeParse(req.body);
     if (!result.success) {
       return res.status(400).json({ error: result.error.errors[0].message });
     }
     const { name, whatsapp, device, email, password } = result.data;
     // ... resto da lógica
   });
   ```

**Conceito:** `safeParse` tenta validar os dados. Se falhar, retorna os erros sem derrubar o servidor. É mais seguro e profissional que checar `if (!name)`.

- [x] Concluído

---

### 📦 SEMANA 2 — ProtectedRoute + `.gitignore` + Proxy (Guia 02, Nível 3)

#### Dia 6 — Melhorar o ProtectedRoute com verificação de expiração
**O que você vai aprender:** Como decodificar um JWT no frontend sem precisar do backend.

**O que fazer:**
1. Instalar o pacote:
   ```bash
   npm install jwt-decode
   ```
2. Atualizar `src/components/ProtectedRoute.tsx`:
   ```tsx
   import { Navigate } from 'react-router-dom';
   import { jwtDecode } from 'jwt-decode';
   import { ReactNode } from 'react';

   function isTokenValid(token: string | null): boolean {
     if (!token) return false;
     try {
       const decoded = jwtDecode<{ exp: number }>(token);
       return decoded.exp * 1000 > Date.now(); // exp está em segundos, Date.now() em ms
     } catch {
       return false;
     }
   }

   export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
     const token = localStorage.getItem('reyb_token');

     if (!isTokenValid(token)) {
       localStorage.removeItem('reyb_token'); // limpa token lixo
       return <Navigate to="/login" replace />;
     }

     return <>{children}</>;
   };
   ```

**Conceito:** Hoje o `ProtectedRoute` apenas verifica se o token _existe_. Mas se ele já expirou, o dashboard vai carregar e depois dar erro. Com `jwt-decode`, verificamos a expiração localmente.

- [x] Concluído

---

#### Dia 7 — Revisar o `.gitignore` e limpeza
**O que você vai aprender:** Quais arquivos NUNCA devem ir para o GitHub.

**O que fazer:**
1. Verificar o conteúdo atual do `.gitignore`
2. Garantir que contém:
   ```gitignore
   .env
   *.env
   .env.local
   .env.production
   *.db
   *.db-shm
   *.db-wal
   node_modules/
   dist/
   ```
3. Rodar `git status` para verificar que `.env` e `*.db` NÃO aparecem como tracked.

**Conceito:** Se o `.env` já foi commitado alguma vez, ele continua no histórico do Git, mesmo após adicionar ao `.gitignore`. Nesse caso, é preciso rodar `git rm --cached .env`.

- [x] Concluído

---

### 📦 SEMANA 3 — Painel Administrativo (Funcionalidade Nova!)

> **Conceito para aprender:** "Como criar CRUD (Create, Read, Update, Delete) completo."

#### Dia 8 — Criar a coluna `is_admin` no banco
**O que fazer:**
No `server/database.ts`, adicionar a coluna:
```sql
ALTER TABLE clients ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
```
E depois definir seu usuário como admin diretamente no banco.

**Conceito:** SQLite não permite `ALTER TABLE` com valores complexos, mas `INTEGER DEFAULT 0` funciona como booleano (0 = false, 1 = true).

- [x] Concluído

---

#### Dia 9 — Criar middleware de verificação admin
**O que fazer:**
Criar `server/middleware/admin.ts`:
```typescript
import { Response, NextFunction } from 'express';
import db from '../database.js';
import { AuthRequest } from './auth.js';

export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = db.prepare('SELECT is_admin FROM clients WHERE id = ?').get(req.clientId) as any;

  if (!client || !client.is_admin) {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return;
  }

  next();
};
```

**Conceito:** Middlewares são como "filtros em cadeia". A requisição passa por `verifyToken` → `verifyAdmin` → rota final. Se falhar em qualquer filtro, para ali.

- [x] Concluído

---

#### Dia 10 — Criar rota GET /api/admin/clients (listar clientes)
**O que fazer:**
Criar `server/routes/admin.ts` com a rota que lista todos os clientes, e registrar em `server/index.ts`.

**Conceito:** Esta será sua primeira rota protegida com **duas camadas** de middleware (auth + admin).

- [x] Concluído

---

#### Dia 11 — Criar a página `/admin` no frontend
**O que fazer:**
Criar `src/pages/AdminPage.tsx` com uma tabela que exibe os clientes (fetch dos dados da API).

**Conceito:** Aprender a usar `useEffect` para buscar dados da API e `useState` para armazená-los.

- [x] Concluído

---

#### Dia 12 — Adicionar ações: Ativar/Inativar clientes
**O que fazer:**
Criar rota `PATCH /api/admin/clients/:id/status` no backend e botões de ação na tabela do admin.

**Conceito:** `PATCH` é o verbo HTTP para atualizações parciais (diferente de `PUT` que substitui tudo).

- [ ] Concluído

---

### 📦 SEMANA 4 — Automação com Jobs (node-cron)

#### Dia 13 — Instalar node-cron e criar job de contagem regressiva
**O que fazer:**
1. `npm install node-cron`
2. Criar `server/jobs/subscription.ts` com a lógica de decrementar `days_remaining`
3. Registrar o job no `server/index.ts`

**Conceito:** Um **cron job** é uma tarefa agendada. `'0 0 * * *'` = meia-noite todo dia.

- [ ] Concluído

---

#### Dia 14 — Exibir `days_remaining` no Dashboard do cliente
**O que fazer:**
Atualizar `DashboardPage.tsx` para mostrar os dias restantes com um visual de barra de progresso.

**Conceito:** Dados que já existem no banco mas não são exibidos ao usuário = funcionalidade desperdiçada.

- [ ] Concluído

---

### 📦 SEMANA 5+ — Integrações Externas

> Essas são etapas mais avançadas. Os guias 03 e 04 já detalham tudo passo a passo.

| Semana | Foco | Guia |
|--------|------|------|
| 5 | Migrar para Supabase (PostgreSQL na nuvem) | [Guia 03](./03-banco-supabase.md) |
| 6 | Integrar SendPulse API (OTP WhatsApp) | [Guia 04](./04-auth-whatsapp-otp.md) |
| 7 | Integrar Mercado Pago (pagamentos automáticos) | Futuro guia |

---

## ✅ Checklist Geral de Progresso

### Semana 1 — Segurança Básica
- [x] Dia 1: JWT_SECRET seguro no `.env`
- [x] Dia 2: Validação de variáveis de ambiente
- [x] Dia 3: Helmet + Rate Limit
- [x] Dia 4: Proxy do Vite
- [x] Dia 5: Validação Zod no registro

### Semana 2 — Frontend + Git
- [x] Dia 6: ProtectedRoute com verificação de expiração
- [x] Dia 7: `.gitignore` revisado

### Semana 3 — Painel Admin
- [x] Dia 8: Coluna `is_admin` no banco
- [x] Dia 9: Middleware admin
- [x] Dia 10: Rota GET clientes
- [x] Dia 11: Página admin frontend
- [ ] Dia 12: Ações ativar/inativar

### Semana 4 — Automação
- [ ] Dia 13: Job de contagem regressiva
- [ ] Dia 14: Exibir dias restantes no dashboard

### Semana 5+ — Integrações
- [ ] Supabase (Guia 03)
- [ ] SendPulse (Guia 04)
- [ ] Mercado Pago

---

> **Dica:** Marque cada `[ ]` com `[x]` conforme você concluir. Assim você sempre sabe onde parou!
