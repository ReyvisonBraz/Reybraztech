# 📱 Guia 2 — SendPulse API (WhatsApp OTP)

> **Objetivo:** Usar a **SendPulse** (provedor oficial da API do WhatsApp Business) para enviar **códigos de verificação (OTP)** via WhatsApp para:
> - Cadastro (verificação do número)
> - Login sem senha (OTP no lugar da senha)
> - Recuperação de senha

---

## O que é a SendPulse?

A SendPulse é uma **plataforma de automação de marketing** que oferece, entre outros serviços, acesso à **API oficial do WhatsApp Business**. Diferente de soluções não-oficiais (como Baileys ou Evolution API), a SendPulse:

- ✅ É **provedora oficial** da Meta para a API do WhatsApp Business
- ✅ Possui **chaves de API oficiais** (sem risco de ban por uso de API não-oficial)
- ✅ Suporta **múltiplos canais** de WhatsApp na mesma conta
- ✅ Permite envio de mensagens de texto e **templates aprovados pela Meta**
- ✅ Oferece painel visual para gerenciar mensagens, contatos e fluxos

> 💡 Como você já tem **2 WhatsApps de atendimento logados na SendPulse**, basta usar as chaves de API que a plataforma disponibiliza.

---

## Arquitetura do Fluxo OTP

```
Cliente no site → Pede código → Backend gera código aleatório (6 dígitos)
    → Backend salva código no banco (com validade de 5 min)
    → Backend autentica na SendPulse (OAuth2) → Envia mensagem via WhatsApp
    → Cliente recebe o código no WhatsApp → Digita no site → Backend valida
```

---

## PARTE 1 — Obter as Credenciais da SendPulse

### Passo 1 — Acessar as Chaves de API

1. Faça login em [sendpulse.com](https://sendpulse.com)
2. Vá em **Configurações → API**
3. Copie os dois valores:
   - **Client ID** → `SENDPULSE_CLIENT_ID`
   - **Client Secret** → `SENDPULSE_CLIENT_SECRET`

### Passo 2 — Identificar o Nome do Canal WhatsApp

1. No painel da SendPulse, vá em **Chatbots → WhatsApp**
2. Você verá seus 2 canais de WhatsApp conectados
3. Anote o **nome do bot** (ou nome do canal) — é o identificador que usaremos como `SENDPULSE_BOT_NAME`

> O nome do bot aparece na lista de chatbots e é usado na URL da API para identificar qual WhatsApp vai enviar a mensagem.

---

## PARTE 2 — Como funciona a Autenticação (OAuth2)

A API da SendPulse usa **OAuth2 com `client_credentials`**. Isso significa que:

1. Você envia suas credenciais (`client_id` + `client_secret`)
2. A SendPulse retorna um **access_token** válido por ~1 hora
3. Você usa esse token em todas as chamadas subsequentes

### Exemplo de obtenção do token:

```bash
POST https://api.sendpulse.com/oauth/access_token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "SEU_CLIENT_ID",
  "client_secret": "SEU_CLIENT_SECRET"
}
```

**Resposta:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## PARTE 3 — Preparar o Banco de Dados

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

## PARTE 4 — Backend: Serviço de OTP

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

## PARTE 5 — Backend: Serviço de WhatsApp (SendPulse)

### Criar o arquivo `server/services/whatsapp.ts`

```typescript
// server/services/whatsapp.ts

const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID!;
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET!;
const SENDPULSE_BOT_NAME = process.env.SENDPULSE_BOT_NAME!;

// ---- Cache do token OAuth2 ----
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtém um access_token da SendPulse via OAuth2.
 * Faz cache do token e só renova quando expirar.
 */
async function getAccessToken(): Promise<string> {
  // Se o token ainda é válido (com 60s de margem), reutiliza
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: SENDPULSE_CLIENT_ID,
      client_secret: SENDPULSE_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro ao obter token SendPulse:', errorText);
    throw new Error('Falha na autenticação com SendPulse');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  console.log('🔑 Token SendPulse obtido com sucesso!');
  return cachedToken!;
}

/**
 * Formata o número para o padrão internacional (55 + DDD + número)
 * Entrada: '11999998888' → Saída: '5511999998888'
 */
function formatWhatsApp(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length === 13) return digits;
  return `55${digits}`;
}

/**
 * Envia uma mensagem de texto via WhatsApp usando a API da SendPulse.
 * Usa o endpoint /whatsapp/contacts/sendByPhone
 */
export async function sendWhatsApp(number: string, message: string): Promise<boolean> {
  const formattedNumber = formatWhatsApp(number);

  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.sendpulse.com/whatsapp/contacts/sendByPhone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bot_name: SENDPULSE_BOT_NAME,
          phone: formattedNumber,
          message: {
            type: 'text',
            text: {
              body: message,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar WhatsApp via SendPulse:', errorText);
      return false;
    }

    console.log(`✅ WhatsApp enviado para ${formattedNumber} via SendPulse`);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com SendPulse:', error);
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

### Como funciona o serviço:

| Função | Descrição |
|--------|-----------|
| `getAccessToken()` | Obtém e cacheia o token OAuth2 da SendPulse (~1h de validade) |
| `formatWhatsApp()` | Converte `11999998888` → `5511999998888` |
| `sendWhatsApp()` | Envia mensagem de texto via API da SendPulse |
| `sendOTPMessage()` | Monta a mensagem formatada do OTP e envia |

---

## PARTE 6 — Rotas do Backend para OTP

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

## PARTE 7 — Variáveis de Ambiente

Adicione ao `.env`:

```bash
# == SENDPULSE (WhatsApp API Oficial) ==
SENDPULSE_CLIENT_ID=seu_client_id_aqui
SENDPULSE_CLIENT_SECRET=seu_client_secret_aqui
SENDPULSE_BOT_NAME=nome_do_seu_bot_whatsapp
```

> O `SENDPULSE_BOT_NAME` é o nome do canal WhatsApp que aparece na seção "Chatbots → WhatsApp" do painel da SendPulse.

E atualize o `.env.example`:

```bash
# == SENDPULSE (WhatsApp API Oficial) ==
SENDPULSE_CLIENT_ID=
SENDPULSE_CLIENT_SECRET=
SENDPULSE_BOT_NAME=
```

---

## PARTE 8 — Frontend: Página de Login com OTP

Na `LoginPage.tsx`, adicione uma aba de login por WhatsApp:

```tsx
// Lógica de login por WhatsApp OTP
const [step, setStep] = useState<'whatsapp' | 'code'>('whatsapp');
const [whatsapp, setWhatsapp] = useState('');
const [otpCode, setOtpCode] = useState('');

// Passo 1: Pedir o código
async function requestOTP() {
  const res = await fetch('/api/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, type: 'login' }),
  });

  if (res.ok) {
    setStep('code'); // vai para o campo de código
  } else {
    const data = await res.json();
    alert(data.error || 'Erro ao enviar código.');
  }
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
  } else {
    const data = await res.json();
    alert(data.error || 'Código inválido.');
  }
}
```

---

## PARTE 9 — Envio de Templates (Opcional, Avançado)

A SendPulse também permite enviar **templates aprovados pela Meta** — útil para mensagens padronizadas como alertas de vencimento:

```typescript
/**
 * Envia um template aprovado pela Meta via SendPulse.
 * Os templates devem ser criados e aprovados no painel da SendPulse.
 */
export async function sendTemplateMessage(
  number: string,
  templateName: string,
  languageCode: string = 'pt_BR',
  variables: string[] = []
): Promise<boolean> {
  const formattedNumber = formatWhatsApp(number);

  try {
    const token = await getAccessToken();

    const components = variables.length > 0
      ? [{ type: 'body', parameters: variables.map(v => ({ type: 'text', text: v })) }]
      : [];

    const response = await fetch(
      'https://api.sendpulse.com/whatsapp/contacts/sendTemplateByPhone',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bot_name: SENDPULSE_BOT_NAME,
          phone: formattedNumber,
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar template:', errorText);
      return false;
    }

    console.log(`✅ Template "${templateName}" enviado para ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Falha ao enviar template:', error);
    return false;
  }
}
```

### Exemplo de uso:

```typescript
// Alerta de vencimento em 3 dias
await sendTemplateMessage(
  '11999998888',
  'alerta_vencimento',   // nome do template aprovado na Meta
  'pt_BR',
  ['João', '3']          // variáveis: {{1}} = nome, {{2}} = dias restantes
);
```

> ⚠️ Para usar templates, você precisa criá-los no painel da SendPulse e aguardar aprovação da Meta (~24h).

---

## Resumo das Rotas OTP

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/otp/send` | Envia código OTP via WhatsApp (SendPulse) |
| `POST` | `/api/otp/verify-login` | Verifica código e faz login |
| `POST` | `/api/otp/reset-password` | Verifica código e redefine senha |

---

## Diferenças: Evolution API vs SendPulse

| Item | Evolution API | SendPulse |
|------|--------------|-----------|
| Tipo | Não-oficial (Baileys) | **Oficial (Meta Partner)** |
| Autenticação | API Key simples | **OAuth2 (client_credentials)** |
| Risco de ban | ⚠️ Alto | ✅ Zero |
| Setup | Precisa hospedar servidor | ✅ Já pronto na nuvem |
| QR Code | Sim (escanear) | ✅ Não (já conectado) |
| Templates Meta | ❌ Não | ✅ Sim |
| Custo | Grátis (mas instável) | Free tier + custo por mensagem |

---

## Checklist Final

- [ ] Credenciais copiadas do painel SendPulse (`Client ID` e `Client Secret`)
- [ ] Nome do bot WhatsApp identificado
- [ ] Tabela `otp_tokens` criada no banco
- [ ] `server/services/otp.ts` criado
- [ ] `server/services/whatsapp.ts` criado (com autenticação SendPulse)
- [ ] `server/routes/otp.ts` criado
- [ ] Rota registrada no `server/index.ts`
- [ ] Variáveis de ambiente adicionadas ao `.env` e `.env.example`
- [ ] Frontend atualizado para suportar login via WhatsApp
- [ ] (Opcional) Templates de mensagem criados no painel da SendPulse
