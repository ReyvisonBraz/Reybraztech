# Banco de Dados — Como o Supabase/PostgreSQL Funciona Aqui

> Abra `server/database.ts` e `server/routes/auth.ts` enquanto lê.

---

## O que é o Supabase

O Supabase hospeda um banco PostgreSQL na nuvem.
Você acessa via URL de conexão direta (como qualquer PostgreSQL).
Não há ORM — as queries são **SQL puro** via driver `postgres`.

---

## As 3 tabelas do projeto

### `clients` — Tabela principal

```sql
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  whatsapp        TEXT UNIQUE NOT NULL,
  device          TEXT,
  email           TEXT,
  password_hash   TEXT NOT NULL,
  plan            TEXT,
  status          TEXT DEFAULT 'Pendente',  -- 'Ativo', 'Inativo', 'Pendente'
  days_remaining  INTEGER DEFAULT 0,
  app_account     TEXT,
  app_password    TEXT,
  is_admin        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Pontos importantes:**
- `status` é TEXT com os valores `'Ativo'`, `'Inativo'`, `'Pendente'` — não é boolean
- `app_account` e `app_password` são as credenciais do cliente no painel IPTV (StarHome)
- `password_hash` guarda o hash bcrypt — **nunca a senha em texto**
- `is_admin` controla acesso ao painel administrativo

---

### `payments` — Histórico de pagamentos

```sql
CREATE TABLE payments (
  id         BIGSERIAL PRIMARY KEY,
  client_id  UUID REFERENCES clients(id),
  plan       TEXT,
  value      TEXT,
  status     TEXT DEFAULT 'Pago',
  paid_at    TIMESTAMPTZ DEFAULT now()
);
```

---

### `otp_tokens` — Códigos de verificação temporários

```sql
CREATE TABLE otp_tokens (
  id         BIGSERIAL PRIMARY KEY,
  whatsapp   TEXT NOT NULL,
  token      TEXT NOT NULL,
  type       TEXT NOT NULL,  -- 'register', 'login', 'reset_password'
  used       BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Como funciona o OTP:**
1. Usuário pede o código → `INSERT` em `otp_tokens` com `expires_at = now() + 5 minutes`
2. Sistema envia o código via WhatsApp
3. Usuário digita o código → `SELECT` onde `token = $1 AND used = false AND expires_at > now()`
4. Se encontrou → `UPDATE otp_tokens SET used = true` + faz o que precisa (login, registro, reset)

---

## Como as queries são escritas

O projeto usa **tagged template literals** com o driver `postgres`:

```ts
import { sql } from '../database';

// SELECT todos
const clients = await sql`
  SELECT id, name, whatsapp, status, plan, days_remaining
  FROM clients
  ORDER BY created_at DESC
`;

// SELECT com filtro (parâmetro sanitizado automaticamente)
const [client] = await sql`
  SELECT * FROM clients WHERE whatsapp = ${whatsapp}
`;
// client = undefined se não encontrou (por isso o [client] desestrutura)

// INSERT
const [newClient] = await sql`
  INSERT INTO clients (name, whatsapp, password_hash, device, plan)
  VALUES (${name}, ${whatsapp}, ${hash}, ${device}, ${plan})
  RETURNING *
`;
// RETURNING * devolve o registro criado

// UPDATE
await sql`
  UPDATE clients
  SET status = 'Ativo', days_remaining = ${days}
  WHERE id = ${id}
`;
```

---

## Entendendo o `RETURNING *`

Sem `RETURNING *`, um `INSERT` ou `UPDATE` não retorna nada.
Com `RETURNING *`, retorna o registro completo após a operação.

```ts
// Sem RETURNING: retorna []
await sql`INSERT INTO clients (...) VALUES (...)`;

// Com RETURNING: retorna o registro criado
const [newClient] = await sql`INSERT INTO clients (...) VALUES (...) RETURNING *`;
console.log(newClient.id); // UUID gerado pelo banco
```

---

## Padrão de acesso ao banco no projeto

```ts
// ✅ Correto: desestrutura o primeiro resultado
const [client] = await sql`SELECT * FROM clients WHERE id = ${id}`;
if (!client) return res.status(404).json({ error: 'Não encontrado' });

// ✅ Correto: pega todos os resultados
const clients = await sql`SELECT * FROM clients`;
// clients é um array

// ❌ Errado: sql retorna array, não objeto direto
const client = await sql`SELECT * FROM clients WHERE id = ${id}`;
client.name // undefined! precisa ser client[0].name
```

---

## Índices e performance

Colunas com muitas buscas devem ter índice:

```sql
CREATE INDEX idx_clients_whatsapp ON clients(whatsapp);
CREATE INDEX idx_otp_tokens_whatsapp ON otp_tokens(whatsapp);
```

O script `server/scripts/check-indexes.ts` verifica quais índices existem.

---

## Como acessar o banco direto (Supabase Dashboard)

1. Acesse o painel em supabase.com
2. Vá em "Table Editor" para ver os dados visualmente
3. Vá em "SQL Editor" para rodar queries diretamente

**Útil para:**
- Debugar dados sem rodar o servidor
- Fazer operações de manutenção (promover admin, limpar tokens expirados)
- Verificar se um INSERT está chegando corretamente
