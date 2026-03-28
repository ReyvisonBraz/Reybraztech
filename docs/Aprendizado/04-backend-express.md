# Backend — Como o Express Funciona Aqui

> Abra `server/index.ts` enquanto lê este arquivo.

---

## Como o servidor inicia

```
npm run server
  └── tsx server/index.ts
        ├── Configura Helmet (segurança)
        ├── Configura CORS (permite o frontend acessar)
        ├── Configura Rate Limit (anti-spam)
        ├── Registra as rotas (/api/auth, /api/otp, etc.)
        └── Escuta na porta 3001
```

---

## Anatomia de uma rota Express

```ts
// server/routes/auth.ts (simplificado)
router.post('/login', async (req, res) => {
  // 1. Pega os dados do corpo da requisição
  const { whatsapp, password } = req.body;

  // 2. Valida com Zod
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

  // 3. Busca no banco
  const [client] = await sql`SELECT * FROM clients WHERE whatsapp = ${whatsapp}`;

  // 4. Verifica senha
  const valid = await bcrypt.compare(password, client.password_hash);

  // 5. Gera token JWT e retorna
  const token = jwt.sign({ id: client.id }, process.env.JWT_SECRET!);
  return res.json({ token });
});
```

**Padrão:** toda rota é async, valida entrada, consulta banco, retorna JSON.

---

## Estrutura de rotas

```
/api/health          → Verifica se o servidor está vivo (GET)

/api/auth/register   → Cria novo cliente (POST)
/api/auth/login      → Login com senha (POST)

/api/otp/send        → Envia código OTP via WhatsApp (POST)
/api/otp/verify-login    → Verifica OTP e faz login (POST)
/api/otp/reset-password  → Verifica OTP e redefine senha (POST)

/api/dashboard       → Dados do cliente logado (GET) [JWT]

/api/admin/clients   → Lista todos os clientes (GET) [JWT + Admin]
```

---

## Middlewares — o que executam antes das rotas

### `server/middleware/auth.ts`
Verifica o token JWT em rotas protegidas.

```ts
// Como funciona:
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Sem token' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  req.user = decoded; // adiciona dados do usuário na requisição
  next(); // passa para a próxima função (a rota)
}
```

**Como usar em uma rota:**
```ts
router.get('/dashboard', authMiddleware, async (req, res) => {
  // req.user.id já está disponível aqui
});
```

### `server/middleware/admin.ts`
Executa DEPOIS do `authMiddleware`. Verifica se `req.user.is_admin === true`.

```ts
// Proteção dupla: JWT + admin
router.get('/clients', authMiddleware, adminMiddleware, async (req, res) => {
  // só chega aqui se for JWT válido E admin
});
```

---

## Banco de dados — como as queries funcionam

```ts
// server/database.ts
import postgres from 'postgres';
export const sql = postgres(process.env.DATABASE_URL!);
```

O `sql` é uma **tagged template literal** — você escreve SQL direto:

```ts
// SELECT
const clients = await sql`SELECT * FROM clients ORDER BY created_at DESC`;

// INSERT com parâmetros seguros (previne SQL injection)
await sql`INSERT INTO clients (name, whatsapp) VALUES (${name}, ${whatsapp})`;

// UPDATE
await sql`UPDATE clients SET status = 'Ativo' WHERE id = ${id}`;

// Desestruturação do primeiro resultado
const [client] = await sql`SELECT * FROM clients WHERE id = ${id}`;
```

Os valores passados como `${variavel}` são automaticamente escapados — **não há risco de SQL injection**.

---

## Serviços — integrações externas

### `server/services/whatsapp.ts` — SendPulse
Envia mensagens WhatsApp via API SendPulse.
- Usado para enviar códigos OTP no cadastro, login e recuperação de senha.
- Usa OAuth2 para autenticar (pega token a cada chamada).

### `server/services/otp.ts` — Geração de OTP
- Gera código de 6 dígitos aleatório
- Salva na tabela `otp_tokens` com expiração de 5 minutos
- Verifica se o código enviado bate com o salvo e se não expirou

### `server/services/mercadopago.ts` — Pagamentos
- Ainda em desenvolvimento (só tem links de pagamento, webhook pendente)

---

## Scripts de manutenção (`server/scripts/`)

| Script | Para que serve | Como usar |
|--------|---------------|-----------|
| `make-admin.ts` | Promove um usuário a admin | `tsx server/scripts/make-admin.ts` |
| `migrate-admin.ts` | Adiciona coluna `is_admin` no banco | Rodado uma vez na migração |
| `check-indexes.ts` | Verifica índices do banco | Auditoria de performance |
| `test-login-speed.ts` | Mede tempo de resposta do login | Debug de performance |
| `test-telegram-trigger.ts` | Testa notificações do Telegram | Debug de alertas |
| `test-whatsapp-raw.ts` | Testa envio direto de WhatsApp | Debug de integração |

---

## Logger — como os logs funcionam

```ts
// server/utils/logger.ts
import winston from 'winston';

// Usa assim nas rotas:
logger.info('Login realizado', { userId: client.id });
logger.warn('Tentativa de login inválida', { whatsapp });
logger.error('Erro no banco', { error: err.message });
```

Em produção, os logs são enviados também para o Sentry (erros críticos) e opcionalmente para o Telegram.

---

## Variáveis de ambiente usadas no backend

```bash
# .env
DATABASE_URL=postgresql://...    # Conexão com Supabase
JWT_SECRET=...                   # Chave para assinar tokens JWT
SENDPULSE_ID=...                 # API SendPulse (WhatsApp OTP)
SENDPULSE_SECRET=...
SENDPULSE_ADDRESS_BOOK_ID=...
MERCADO_PAGO_ACCESS_TOKEN=...    # Pagamentos
SENTRY_DSN=...                   # Monitoramento de erros
TELEGRAM_BOT_TOKEN=...           # Alertas e comandos
TELEGRAM_CHAT_ID=...
```

**Nunca commite o `.env` no git.** O `.env.example` mostra as variáveis sem os valores reais.
