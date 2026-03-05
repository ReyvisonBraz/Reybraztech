# 🗄️ Guia 1 — Implementação do Supabase

> **Objetivo:** Substituir o banco SQLite local pelo Supabase (PostgreSQL na nuvem), de forma didática e no padrão manual — sem usar ORM, sem "magia", passo a passo.

---

## O que é o Supabase?

O Supabase é um **banco de dados PostgreSQL hospedado na nuvem**, com uma interface visual online (como o phpMyAdmin, mas muito mais moderno). Ele oferece:

- ✅ Banco de dados PostgreSQL real
- ✅ Interface web para ver/editar dados
- ✅ Autenticação pronta (mas vamos usar a nossa própria com JWT)
- ✅ API automática (usaremos para acessar o banco)
- ✅ Free tier generoso (500MB, perfeito para começar)

---

## PARTE 1 — Criar o banco no site do Supabase

### Passo 1 — Criar um novo Projeto

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Escolha um nome: `reybraztech`
4. Crie uma **senha forte** para o banco (salve ela com segurança!)
5. Escolha a região: **South America (São Paulo)** para menor latência
6. Clique em **"Create new project"** e aguarde ~2 minutos

---

### Passo 2 — Criar as Tabelas

No menu lateral, vá em **"SQL Editor"** e cole o SQL abaixo para criar as mesmas tabelas que já existem no SQLite:

```sql
-- Tabela de clientes
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  device TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'mensal',
  status TEXT NOT NULL DEFAULT 'Ativo',
  days_remaining INTEGER DEFAULT 0,
  app_account TEXT,
  app_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pago',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por email ser mais rápida
CREATE INDEX idx_clients_email ON clients(email);
```

> Clique em **"Run"** para executar. Vá em **"Table Editor"** para confirmar que criou.

---

### Passo 3 — Pegar as credenciais de conexão

No menu lateral, vá em **"Settings" → "API"**

Você vai precisar de 3 valores:
1. **Project URL** → ex: `https://xxxxxxxxxxx.supabase.co`
2. **anon / public key** → chave pública (pode aparecer no frontend)
3. **service_role key** → chave secreta (NUNCA no frontend!)

E também da **Connection String** do banco (para conectar direto via PostgreSQL):
- Vá em **"Settings" → "Database"**
- Copie a **"Connection string" → URI** (modo **Transaction**)
- Será algo como: `postgresql://postgres:[SUA-SENHA]@db.xxxxxxxxxxx.supabase.co:5432/postgres`

---

## PARTE 2 — Configurar o Projeto Local

### Passo 4 — Instalar o driver do PostgreSQL

O projeto usa `better-sqlite3`. Vamos trocar pelo `postgres` (driver leve e moderno):

```bash
# Remover o driver SQLite
npm uninstall better-sqlite3

# Instalar o driver PostgreSQL
npm install postgres
npm install -D @types/node
```

---

### Passo 5 — Atualizar o arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e adicione as variáveis do Supabase:

```bash
# == BANCO DE DADOS SUPABASE ==
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGci... (sua chave anon)
SUPABASE_SERVICE_KEY=eyJhbGci... (sua chave service_role — SEGREDO!)
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJECT_ID.supabase.co:5432/postgres
```

> ⚠️ **NUNCA suba o arquivo `.env` para o GitHub!** O `.gitignore` já garante isso.

---

### Passo 6 — Reescrever o `server/database.ts`

Substitua todo o conteúdo do arquivo `server/database.ts` pelo seguinte:

```typescript
// server/database.ts
import postgres from 'postgres';

// A CONNECTION STRING vem do .env (segredo!)
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL não definida no .env!');
}

// Cria a conexão principal com o banco
const sql = postgres(connectionString, {
  ssl: 'require', // Supabase exige SSL
  max: 10,        // máximo de 10 conexões simultâneas
  idle_timeout: 20,
});

console.log('✅ Conectado ao Supabase (PostgreSQL)!');

export default sql;
```

---

### Passo 7 — Atualizar as rotas do backend

O `postgres` usa uma sintaxe de query diferente do SQLite. Veja como fica:

**ANTES (SQLite — `better-sqlite3`):**
```typescript
const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email);
```

**DEPOIS (Supabase — `postgres`):**
```typescript
const [client] = await sql`SELECT * FROM clients WHERE email = ${email}`;
```

A diferença principal é que o `postgres` é **assíncrono** (usa `await`) e usa **template literals** para evitar SQL Injection automaticamente.

---

#### Exemplo completo: `server/routes/auth.ts`

```typescript
import sql from '../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, whatsapp, device, email, password, plan } = req.body;

  try {
    // Verificar se o email já existe
    const [existing] = await sql`
      SELECT id FROM clients WHERE email = ${email}
    `;

    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }

    // Criptografar a senha
    const password_hash = await bcrypt.hash(password, 12);

    // Inserir o novo cliente
    const [newClient] = await sql`
      INSERT INTO clients (name, whatsapp, device, email, password_hash, plan)
      VALUES (${name}, ${whatsapp}, ${device}, ${email}, ${password_hash}, ${plan})
      RETURNING id, name, email, plan, status
    `;

    res.status(201).json({ message: 'Cadastro realizado!', client: newClient });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [client] = await sql`
      SELECT * FROM clients WHERE email = ${email}
    `;

    if (!client) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordOk = await bcrypt.compare(password, client.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: client.id, email: client.email },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );

    res.json({ token, name: client.name });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
```

---

## PARTE 3 — Segurança no Supabase (Row Level Security)

No menu do Supabase, vá em **"Authentication" → "Policies"**.

Por padrão, o Supabase bloqueia acesso externo direto se você ativar o **Row Level Security (RLS)**. Como vamos acessar o banco **pelo nosso backend** (usando a `service_role key`), o backend tem acesso total — isso é seguro.

Para proteger de acesso direto via API pública:

```sql
-- Ativar RLS nas tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Nenhum acesso público direto (nosso backend usa service_role, não precisa de policy)
-- As leituras e escritas acontecem apenas pelo nosso servidor Node.js
```

---

## PARTE 4 — Variáveis de Ambiente no Netlify/GitHub

### No Netlify (Frontend)
1. Vá no painel do projeto no Netlify
2. **"Site Settings" → "Environment variables"**
3. Adicione: `VITE_API_URL = https://sua-api.onrender.com` (URL do seu backend hospedado)

### No Render/Railway (Backend)
Adicione todas as variáveis do `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## Resumo do que mudou

| Item | Antes (SQLite) | Depois (Supabase) |
|------|---------------|-------------------|
| Banco | Arquivo `.db` local | PostgreSQL na nuvem |
| Driver | `better-sqlite3` (síncrono) | `postgres` (assíncrono) |
| Backup | Manual | Automático pelo Supabase |
| Acesso visual | Nenhum | Interface web completa |
| Produção | Não funciona no Netlify | Funciona em qualquer servidor |

---

## Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Tabelas `clients` e `payments` criadas via SQL Editor
- [ ] Credenciais copiadas para o `.env`
- [ ] `npm uninstall better-sqlite3` e `npm install postgres`
- [ ] `server/database.ts` reescrito
- [ ] Rotas do backend atualizadas (async/await)
- [ ] RLS ativado no Supabase
- [ ] Variáveis de ambiente configuradas no Netlify e no host do backend
