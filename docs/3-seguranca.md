# 🔒 Guia 3 — Segurança do Site e Banco de Dados

> **Objetivo:** Aplicar medidas de segurança reais, do nível mais básico ao avançado, para proteger o site, o banco de dados e os dados dos clientes.

---

## Por que segurança importa?

Seu site lida com dados de clientes reais (nome, WhatsApp, e-mail, senha, informações de plano). Uma falha de segurança pode:
- Expor dados privados dos clientes
- Permitir que alguém faça login como outro cliente
- Deixar hackers controlarem o banco de dados (SQL Injection)
- Derrubar o servidor (ataques de força bruta / DDoS)

---

## NÍVEL 1 — Correções Imediatas (Críticas)

### 1.1 — Trocar o JWT_SECRET

O `.env` atual tem:
```
JWT_SECRET=reybraztech_super_secret_key_2026_mude_em_producao
```

Isso é **inseguro**. Substitua por um segredo gerado aleatoriamente:

```bash
# Execute no terminal para gerar um segredo seguro:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Cole o resultado no `.env`:
```
JWT_SECRET=a1b2c3d4e5f6... (a string longa gerada)
```

---

### 1.2 — Validar variáveis de ambiente na inicialização

No `server/index.ts`, adicione no topo:

```typescript
// VALIDAÇÃO OBRIGATÓRIA — o servidor NÃO sobe sem essas variáveis
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ ERRO FATAL: Variável de ambiente "${key}" não definida!`);
    process.exit(1);
  }
}
```

---

### 1.3 — Verificar o `.gitignore`

O arquivo `.gitignore` deve incluir:

```gitignore
# Secrets — NUNCA commitar!
.env
*.env
.env.local
.env.production

# Banco de dados local
*.db
*.db-shm
*.db-wal
```

> Verifique com `git status` se o `.env` aparece. Se aparecer, ele NÃO está protegido!

---

## NÍVEL 2 — Proteção do Backend (Rate Limiting & Headers)

### 2.1 — Instalar pacotes de segurança

```bash
npm install helmet express-rate-limit cors
```

### 2.2 — Aplicar no `server/index.ts`

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// ---- HELMET: adiciona ~14 headers HTTP de segurança automaticamente ----
app.use(helmet());

// ---- CORS: limita quais domínios podem chamar a API ----
const allowedOrigins = [
  'http://localhost:3000',
  'https://reybraztech.netlify.app', // ← seu domínio real
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origem não permitida'));
    }
  },
}));

// ---- RATE LIMIT GERAL: máximo 100 requests por IP a cada 15 minutos ----
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api', generalLimiter);

// ---- RATE LIMIT para Login: apenas 5 tentativas por 15 minutos ----
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
app.use('/api/auth/login', loginLimiter);

// ---- RATE LIMIT para OTP: apenas 3 envios por número a cada 5 minutos ----
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: 'Muitos códigos solicitados. Aguarde 5 minutos.' },
});
app.use('/api/otp/send', otpLimiter);
```

---

### 2.3 — Validação de dados de entrada (evitar SQL Injection e XSS)

Instale o Zod para validar os dados recebidos pelo backend:

```bash
npm install zod
```

Exemplo de uso nas rotas:

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { email, password } = result.data; // dados já validados e limpos
  // ... resto da lógica
});
```

> O Zod **rejeita automaticamente** campos extras (prevenção de mass assignment) e valida tipos, prevenindo a maioria dos ataques de injeção.

---

## NÍVEL 3 — Proteção do Frontend

### 3.1 — Nunca armazenar dados sensíveis no localStorage

**❌ NUNCA faça isso:**
```typescript
localStorage.setItem('user_password', password);
localStorage.setItem('user_cpf', cpf);
```

**✅ O que é seguro guardar no localStorage:**
```typescript
localStorage.setItem('reyb_token', jwtToken); // ← só o token JWT, sem dados pessoais
```

---

### 3.2 — Headers de segurança no Vite (desenvolvimento)

No `vite.config.ts`, adicione headers de segurança:

```typescript
export default defineConfig({
  // ... configurações existentes
  server: {
    headers: {
      'X-Frame-Options': 'DENY',             // Previne clickjacking
      'X-Content-Type-Options': 'nosniff',   // Previne MIME sniffing
      'Referrer-Policy': 'strict-origin',    // Controla o header Referer
    },
  },
});
```

---

### 3.3 — Proteger o token JWT no frontend

No `ProtectedRoute.tsx`, adicione verificação extra:

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    // Verificar se o token não está expirado
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('reyb_token');
  
  if (!isTokenValid(token)) {
    // Limpar token inválido/expirado
    localStorage.removeItem('reyb_token');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

---

## NÍVEL 4 — Segurança do Banco de Dados

### 4.1 — Criptografar `app_password` (campo sensível)

O campo `app_password` no banco guarda a senha do app do cliente em **texto puro** — isso é perigoso. Use criptografia AES (reversível, pois você precisa descriptografar depois):

```bash
npm install crypto-js
npm install -D @types/crypto-js
```

```typescript
// server/utils/crypto.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // deve ter 32+ chars

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

> Adicione `ENCRYPTION_KEY=sua_chave_de_32_caracteres` ao `.env`.

---

### 4.2 — Row Level Security no Supabase

Se você migrar para o Supabase, ative o RLS para que nenhum dado vaze via API pública:

```sql
-- Ativar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;

-- Negar todo acesso público por padrão
-- (nosso backend usa service_role e tem acesso total bypassing RLS)
CREATE POLICY "deny_all_public" ON clients FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_public" ON payments FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_public" ON otp_tokens FOR ALL TO anon USING (false);
```

---

### 4.3 — Backup automático (SQLite local)

Se ainda usar SQLite, crie um script de backup diário:

```typescript
// server/backup.ts
import { execSync } from 'child_process';
import path from 'path';

const dbPath = path.resolve('./reybraztech.db');
const backupDir = path.resolve('./backups');

function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${backupDir}/backup-${timestamp}.db`;
  
  execSync(`cp ${dbPath} ${backupPath}`);
  console.log(`✅ Backup criado: ${backupPath}`);
}

backup();
```

---

## NÍVEL 5 — Segurança em Produção (Netlify + Render/Railway)

### 5.1 — Netlify: `_headers` file

Crie o arquivo `public/_headers` para adicionar headers de segurança ao Netlify:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com
```

---

### 5.2 — HTTPS em produção

- ✅ O Netlify já fornece HTTPS automático
- ✅ O Render/Railway já fornece HTTPS automático
- ✅ O Supabase já usa HTTPS

> Nunca use `http://` em produção. Certifique-se que todas as URLs no `.env` de produção usam `https://`.

---

## Checklist de Segurança

### Crítico (fazer hoje)
- [ ] Gerar novo `JWT_SECRET` com `crypto.randomBytes(64).toString('hex')`
- [ ] Confirmar que `.env` está no `.gitignore`
- [ ] Adicionar validação de variáveis de ambiente no servidor

### Importante (fazer em breve)
- [ ] Instalar e configurar `helmet`, `cors`, `express-rate-limit`
- [ ] Adicionar validação de entrada com Zod nas rotas
- [ ] Instalar `jwt-decode` e verificar expiração no `ProtectedRoute`
- [ ] Criptografar `app_password` com AES

### Produção
- [ ] Ativar RLS no Supabase
- [ ] Criar `public/_headers` no Netlify
- [ ] Garantir que todas as URLs de produção usam `https://`
- [ ] Configurar backup automático do banco

---

## Resumo Visual

```
CAMADAS DE SEGURANÇA
─────────────────────────────────────────────
[CLIENTE]   → HTTPS obrigatório
[FRONTEND]  → JWT validado, token sem dados sensíveis
[CORS]      → Apenas origens autorizadas
[RATE LIMIT]→ Bloqueia força bruta (login e OTP)
[HELMET]    → Headers HTTP de segurança
[VALIDAÇÃO] → Zod rejeita dados maliciosos
[SENHAS]    → bcrypt (12 rounds) — irreversível
[CAMPOS]    → AES para campos reversíveis (app_password)
[BANCO]     → RLS no Supabase + acesso só via backend
─────────────────────────────────────────────
```
