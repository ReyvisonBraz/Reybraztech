# 📱 Guia 2 — Evolution API (WhatsApp OTP)

> **Objetivo:** Usar a Evolution API para enviar **códigos de verificação (OTP)** via WhatsApp ao cliente para:
> - Cadastro (verificação do número)
> - Login sem senha (OTP no lugar da senha)
> - Recuperação de senha

---

## O que é a Evolution API?

A Evolution API é uma **interface para controlar o WhatsApp** programaticamente (parecida com o Baileys). Ela permite:
- Enviar mensagens de texto pelo WhatsApp
- Receber mensagens via webhook
- Gerenciar múltiplas instâncias (várias contas WhatsApp)

---

## Arquitetura do Fluxo OTP

```
Cliente no site → Pede código → Backend gera código aleatório
    → Backend salva código no banco (com validade de 5 min)
    → Backend chama Evolution API → WhatsApp envia o código ao cliente
    → Cliente digita o código no site → Backend valida → Libera acesso
```

---

## PARTE 1 — Configurar a Evolution API

### Opção A — Usar Evolution API em nuvem (mais fácil)

1. Acesse [evolution-api.com](https://evolution-api.com) ou use uma instância própria
2. Use o serviço do **Typebot** ou **Make.com** para conectar se quiser a forma mais simples
3. Crie uma instância e conecte seu número de WhatsApp escaneando o QR Code

### Opção B — Hospedar no Railway/Render (recomendado para produção)

Você pode rodar a Evolution API gratuitamente:

```bash
# clonar o repositório
git clone https://github.com/EvolutionAPI/evolution-api
cd evolution-api

# instalar e configurar
npm install
cp .env.example .env
# editar .env com suas configurações

# subir
npm run build && npm start
```

> Após subir, a API estará em: `http://localhost:8080`

### Conectar o WhatsApp

```bash
# 1. Criar instância
POST http://localhost:8080/instance/create
Headers: apikey: SUA_GLOBAL_API_KEY
Body: {
  "instanceName": "reybraztech",
  "qrcode": true
}

# 2. Ver o QR Code
GET http://localhost:8080/instance/connect/reybraztech

# 3. Escanear com o WhatsApp do número que vai enviar as mensagens
```

---

## PARTE 2 — Preparar o Banco de Dados

### Criar a tabela de tokens OTP

No **SQL Editor do Supabase** (ou no `database.ts` do SQLite), adicione:

```sql
CREATE TABLE otp_tokens (
  id BIGSERIAL PRIMARY KEY,
  whatsapp TEXT NOT NULL,        -- número do cliente
  token TEXT NOT NULL,           -- o código de 6 dígitos
  type TEXT NOT NULL,            -- 'register', 'login', 'reset_password'
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX idx_otp_whatsapp ON otp_tokens(whatsapp);
```

Se ainda estiver usando **SQLite**, adicione ao `server/database.ts`:

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp TEXT NOT NULL,
    token TEXT NOT NULL,
    type TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);
```

---

## PARTE 3 — Backend: Serviço de OTP

### Criar o arquivo `server/services/otp.ts`

```typescript
// server/services/otp.ts
import db from '../database.js';

/**
 * Gera um código OTP aleatório de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Salva o token OTP no banco.
 * - Invalida tokens anteriores do mesmo número e tipo
 * - O token expira em 5 minutos
 */
export function saveOTP(whatsapp: string, token: string, type: string): void {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Invalidar tokens anteriores do mesmo número/tipo
  db.prepare(`
    UPDATE otp_tokens SET used = 1
    WHERE whatsapp = ? AND type = ? AND used = 0
  `).run(whatsapp, type);

  // Salvar o novo token
  db.prepare(`
    INSERT INTO otp_tokens (whatsapp, token, type, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(whatsapp, token, type, expiresAt);
}

/**
 * Valida o token OTP.
 * Retorna true se válido, false se inválido/expirado/já usado.
 */
export function verifyOTP(whatsapp: string, token: string, type: string): boolean {
  const record = db.prepare(`
    SELECT * FROM otp_tokens
    WHERE whatsapp = ? AND token = ? AND type = ?
    AND used = 0 AND expires_at > datetime('now', 'localtime')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(whatsapp, token, type) as any;

  if (!record) return false;

  // Marcar como usado
  db.prepare('UPDATE otp_tokens SET used = 1 WHERE id = ?').run(record.id);
  return true;
}
```

---

### Criar o serviço `server/services/whatsapp.ts`

```typescript
// server/services/whatsapp.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'reybraztech';

/**
 * Formata o número para o padrão internacional (55 + DDD + número)
 * Entrada: '11999998888' → Saída: '5511999998888'
 */
function formatWhatsApp(number: string): string {
  // Remove tudo que não é número
  const digits = number.replace(/\D/g, '');
  // Se já tem 55 na frente, retorna como está
  if (digits.startsWith('55') && digits.length === 13) return digits;
  // Senão, adiciona o 55
  return `55${digits}`;
}

/**
 * Envia uma mensagem de texto via WhatsApp usando a Evolution API
 */
export async function sendWhatsApp(number: string, message: string): Promise<boolean> {
  const formattedNumber = formatWhatsApp(number);

  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao enviar WhatsApp:', errorText);
      return false;
    }

    console.log(`✅ WhatsApp enviado para ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('Falha na conexão com Evolution API:', error);
    return false;
  }
}

/**
 * Envia um OTP de verificação via WhatsApp
 */
export async function sendOTPMessage(
  number: string,
  otp: string,
  type: 'register' | 'login' | 'reset_password'
): Promise<boolean> {
  const messages = {
    register: `🔐 *Reybraztech — Verificação de Cadastro*\n\nSeu código de verificação é:\n\n*${otp}*\n\n⏰ Válido por 5 minutos.\nNão compartilhe este código com ninguém.`,
    login: `🔑 *Reybraztech — Código de Login*\n\nSeu código de acesso é:\n\n*${otp}*\n\n⏰ Válido por 5 minutos.\nNão compartilhe este código com ninguém.`,
    reset_password: `🔓 *Reybraztech — Redefinir Senha*\n\nSeu código para redefinir a senha é:\n\n*${otp}*\n\n⏰ Válido por 5 minutos.\nSe você não solicitou isso, ignore esta mensagem.`,
  };

  return sendWhatsApp(number, messages[type]);
}
```

---

## PARTE 4 — Rotas do Backend para OTP

### Criar `server/routes/otp.ts`

```typescript
// server/routes/otp.ts
import { Router } from 'express';
import { generateOTP, saveOTP, verifyOTP } from '../services/otp.js';
import { sendOTPMessage } from '../services/whatsapp.js';
import db from '../database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * POST /api/otp/send
 * Body: { whatsapp: '11999998888', type: 'login' | 'register' | 'reset_password' }
 * Envia um código OTP para o número informado
 */
router.post('/send', async (req, res) => {
  const { whatsapp, type } = req.body;

  if (!whatsapp || !type) {
    return res.status(400).json({ error: 'WhatsApp e tipo são obrigatórios.' });
  }

  // Para login/reset, verificar se o número existe no banco
  if (type === 'login' || type === 'reset_password') {
    const client = db.prepare('SELECT id FROM clients WHERE whatsapp = ?').get(whatsapp) as any;
    if (!client) {
      return res.status(404).json({ error: 'Número não encontrado. Faça o cadastro primeiro.' });
    }
  }

  const token = generateOTP();
  saveOTP(whatsapp, token, type);

  const sent = await sendOTPMessage(whatsapp, token, type as any);

  if (!sent) {
    return res.status(500).json({ error: 'Não foi possível enviar o código. Tente novamente.' });
  }

  res.json({ message: 'Código enviado com sucesso!' });
});

/**
 * POST /api/otp/verify-login
 * Body: { whatsapp: '11999998888', token: '123456' }
 * Verifica o OTP e retorna o JWT de sessão
 */
router.post('/verify-login', async (req, res) => {
  const { whatsapp, token } = req.body;

  const valid = verifyOTP(whatsapp, token, 'login');

  if (!valid) {
    return res.status(401).json({ error: 'Código inválido ou expirado.' });
  }

  const client = db.prepare('SELECT * FROM clients WHERE whatsapp = ?').get(whatsapp) as any;

  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const jwtToken = jwt.sign(
    { id: client.id, email: client.email },
    process.env.JWT_SECRET!,
    { expiresIn: '2h' }
  );

  res.json({ token: jwtToken, name: client.name });
});

/**
 * POST /api/otp/reset-password
 * Body: { whatsapp: '11999998888', token: '123456', newPassword: 'novasenha' }
 * Verifica o OTP e atualiza a senha
 */
router.post('/reset-password', async (req, res) => {
  const { whatsapp, token, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  const valid = verifyOTP(whatsapp, token, 'reset_password');

  if (!valid) {
    return res.status(401).json({ error: 'Código inválido ou expirado.' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  db.prepare('UPDATE clients SET password_hash = ? WHERE whatsapp = ?').run(newHash, whatsapp);

  res.json({ message: 'Senha redefinida com sucesso!' });
});

export default router;
```

---

### Registrar a rota em `server/index.ts`

```typescript
// Adicione ao server/index.ts junto das outras rotas:
import otpRoutes from './routes/otp.js';

app.use('/api/otp', otpRoutes);
```

---

## PARTE 5 — Variáveis de Ambiente

Adicione ao `.env`:

```bash
# == EVOLUTION API (WhatsApp) ==
EVOLUTION_API_URL=https://sua-evolution-api.onrender.com
EVOLUTION_API_KEY=sua_chave_da_api_aqui
EVOLUTION_INSTANCE=reybraztech
```

---

## PARTE 6 — Frontend: Página de Login com OTP

Na `LoginPage.tsx`, adicione uma aba de login por WhatsApp:

```tsx
// Lógica de login por WhatsApp OTP
const [step, setStep] = useState<'whatsapp' | 'code'>('whatsapp');
const [whatsapp, setWhatsapp] = useState('');
const [otpCode, setOtpCode] = useState('');

// Passo 1: Pedir o código
async function requestOTP() {
  await fetch('/api/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, type: 'login' }),
  });
  setStep('code'); // vai para o campo de código
}

// Passo 2: Verificar o código
async function verifyOTP() {
  const res = await fetch('/api/otp/verify-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, token: otpCode }),
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('reyb_token', data.token);
    navigate('/dashboard');
  }
}
```

---

## Resumo das Rotas OTP Criadas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/otp/send` | Envia código OTP via WhatsApp |
| `POST` | `/api/otp/verify-login` | Verifica código e faz login |
| `POST` | `/api/otp/reset-password` | Verifica código e redefine senha |

---

## Checklist Final

- [ ] Evolution API rodando e conectada ao WhatsApp
- [ ] Tabela `otp_tokens` criada no banco
- [ ] `server/services/otp.ts` criado
- [ ] `server/services/whatsapp.ts` criado
- [ ] `server/routes/otp.ts` criado
- [ ] Rota registrada no `server/index.ts`
- [ ] Variáveis de ambiente adicionadas ao `.env`
- [ ] Frontend atualizado para suportar login via WhatsApp
