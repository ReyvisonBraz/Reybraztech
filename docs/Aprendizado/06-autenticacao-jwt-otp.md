# Autenticação — JWT e OTP WhatsApp

> Abra `server/routes/auth.ts`, `server/middleware/auth.ts` e `server/services/otp.ts`.

---

## Os 3 sistemas de autenticação do projeto

1. **Login com senha** → JWT clássico
2. **Login com OTP WhatsApp** → código temporário por WhatsApp
3. **Registro com OTP** → verifica que o WhatsApp é real antes de criar a conta

---

## JWT — como funciona na prática

### O que é um JWT

Um JWT é uma string em 3 partes separadas por ponto:

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFiYy4uLiIsImlzX2FkbWluIjpmYWxzZX0.HMAC_signature
     HEADER                          PAYLOAD                           SIGNATURE
```

- **Header:** algoritmo usado (HS256)
- **Payload:** dados do usuário (id, is_admin, expiração) — **leguível por qualquer um**
- **Signature:** HMAC com `JWT_SECRET` — **só o servidor pode gerar**

**Importante:** o payload não é criptografado, apenas assinado. Não coloque senha ou dados sensíveis no JWT.

---

### Fluxo de login com senha

```
1. POST /api/auth/login { whatsapp: "11999...", password: "minhasenha" }

2. Servidor:
   - Valida dados com Zod
   - SELECT * FROM clients WHERE whatsapp = '11999...'
   - bcrypt.compare("minhasenha", client.password_hash) → true ou false
   - Se false → 401 Unauthorized
   - Se true  → jwt.sign({ id: client.id, is_admin: false }, JWT_SECRET, { expiresIn: '2h' })

3. Resposta: { token: "eyJ...", user: { name, plan, status... } }

4. Frontend:
   - localStorage.setItem('reyb_token', token)
   - navigate('/dashboard')
```

---

### Como o token é verificado nas rotas protegidas

```
GET /api/dashboard
Headers: { Authorization: "Bearer eyJ..." }

Middleware (auth.ts):
  1. Extrai o token do header
  2. jwt.verify(token, JWT_SECRET) → decodifica e valida assinatura
  3. Verifica se não expirou (jwt cuida disso automaticamente)
  4. Se inválido → 401
  5. Se válido  → req.user = { id: "...", is_admin: false }
  6. next() → vai para a rota
```

---

### Onde o token fica no frontend

```ts
// Salvar após login
localStorage.setItem('reyb_token', token);

// Usar nas requisições
const token = localStorage.getItem('reyb_token');
fetch('/api/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
});

// Remover no logout
localStorage.removeItem('reyb_token');
```

O `ProtectedRoute.tsx` lê o token, decodifica com `jwt-decode` (sem verificar assinatura — só lê o payload) e checa se `exp > Date.now() / 1000`.

---

## OTP WhatsApp — como funciona

### Por que OTP?

O WhatsApp OTP serve para **provar que o número de WhatsApp é real e pertence à pessoa**.
Sem isso, alguém poderia cadastrar o número de outra pessoa.

---

### Fluxo de registro com OTP

```
ETAPA 1 — Dados pessoais
  Frontend: preenche nome, whatsapp, dispositivo → salva no estado local

ETAPA 2 — Verificação WhatsApp
  1. Usuário envia mensagem para o bot SendPulse (abre janela de 24h)
  2. Frontend: POST /api/otp/send { whatsapp: "11999...", type: "register" }
  3. Servidor:
     - Gera código aleatório de 6 dígitos: Math.floor(100000 + Math.random() * 900000)
     - INSERT INTO otp_tokens (whatsapp, token, type, expires_at) VALUES (...)
       expires_at = now() + interval '5 minutes'
     - Envia via SendPulse para o WhatsApp do usuário
  4. Usuário digita o código recebido
  5. Frontend: POST /api/otp/verify-register { whatsapp, token: "123456" }
  6. Servidor:
     - SELECT * FROM otp_tokens WHERE whatsapp = $1 AND token = $2 AND used = false AND expires_at > now()
     - Se encontrou → UPDATE otp_tokens SET used = true
     - Retorna { verified: true }

ETAPA 3 — Senha e confirmação
  Frontend: POST /api/auth/register com todos os dados + senha
  Servidor:
     - Valida tudo com Zod
     - bcrypt.hash(password, 10) → gera hash
     - INSERT INTO clients (...)
```

---

### Fluxo de login com OTP

```
1. POST /api/otp/send { whatsapp, type: "login" }
   → Servidor gera código e envia via WhatsApp

2. POST /api/otp/verify-login { whatsapp, token }
   → Servidor verifica o token
   → Se válido: gera JWT igual ao login com senha e retorna

3. Frontend salva o JWT — idêntico ao login com senha a partir daqui
```

---

### Fluxo de recuperação de senha

```
1. Usuário clica "Esqueci minha senha"
2. POST /api/otp/send { whatsapp, type: "reset_password" }
3. Recebe código no WhatsApp
4. POST /api/otp/reset-password { whatsapp, token, newPassword }
   → Verifica token → bcrypt.hash(newPassword) → UPDATE clients SET password_hash
```

---

## Integração SendPulse — como o WhatsApp é enviado

O SendPulse é uma plataforma de automação de marketing com suporte a WhatsApp Business.

**Fluxo de autenticação OAuth2 da API:**
```
1. POST https://api.sendpulse.com/oauth/access_token
   { grant_type: "client_credentials", client_id, client_secret }
   → Retorna { access_token: "..." }

2. POST https://api.sendpulse.com/whatsapp/contacts/sendByPhone
   Headers: { Authorization: "Bearer access_token" }
   Body: { bot_id, phone: "5511999...", message: { text: "Seu código: 123456" } }
```

**Limitação importante:** o WhatsApp Business só permite enviar mensagens para quem enviou mensagem primeiro nas últimas 24h. Por isso, o usuário precisa mandar uma mensagem para o bot antes de receber o OTP.

---

## Admin — como funciona o controle de acesso

```ts
// No JWT gerado no login:
{ id: "uuid", is_admin: true }  // admin
{ id: "uuid", is_admin: false } // cliente normal

// Middleware admin.ts verifica:
if (!req.user.is_admin) return res.status(403).json({ error: 'Acesso negado' });
```

**Como promover um usuário a admin:**
```bash
tsx server/scripts/make-admin.ts
# Edite o arquivo para colocar o whatsapp do usuário
```

Isso faz: `UPDATE clients SET is_admin = true WHERE whatsapp = '...'`
