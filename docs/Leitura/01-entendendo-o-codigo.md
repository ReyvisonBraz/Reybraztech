# 📚 Guia 01 — Entendendo o Código por Partes

> **Objetivo:** Explicar o projeto inteiro de forma didática, como se estivesse lendo um mapa. Da parte mais simples à mais complexa.

---

## 🗺️ A Grande Imagem

Imagine o projeto como um **restaurante**:

| Analogia | Código | Responsabilidade |
|----------|--------|-----------------|
| O salão (o que o cliente vê) | **Frontend React** | Páginas, botões, formulários |
| A cozinha (os processos) | **Backend Node.js** | Regras de negócio, segurança |
| O estoque (onde ficam os dados) | **Banco de Dados Supabase (PostgreSQL)** | Clientes, planos, pagamentos |
| O cardápio (comunicação entre salão e cozinha) | **API REST** | Rotas HTTP `/api/...` |

---

## 📁 PARTE 1 — Estrutura de Arquivos

```
Reybraztech/
│
├── src/          ← FRONTEND (React) — Pasta principal do site visual
│   ├── pages/    ← As páginas do site (uma página = um arquivo)
│   ├── components/  ← Peças reutilizáveis (navbar, botões, etc)
│   ├── config/   ← Configurações (URL da API)
│   ├── hooks/    ← Lógica reutilizável
│   └── lib/      ← Utilitários (classes CSS dinâmicas)
│
├── server/       ← BACKEND (Node.js) — Pasta do servidor
│   ├── database.ts  ← Conexão com o banco de dados
│   ├── index.ts     ← Servidor principal (porta, middlewares)
│   ├── middleware/  ← Verificações intermediárias (ex: JWT)
│   └── routes/      ← As "portas" de entrada do servidor (API)
│
├── .env          ← Segredos (JWT, senhas, chaves de API)
├── package.json  ← Lista de dependências do projeto
└── vite.config.ts← Configurações do Vite (dev server)
```

**Regra de ouro:** Tudo em `src/` é **frontend** (o usuário pode ver). Tudo em `server/` é **backend** (secreto, no servidor).

---

## 🎨 PARTE 2 — Frontend (React + Vite)

### O que é React?
React é uma biblioteca JavaScript para construir interfaces. Em vez de escrever HTML estático, você escreve **componentes** — pedaços reutilizáveis de interface.

### Como as páginas funcionam

O arquivo `src/App.tsx` é o **mapa de rotas** do site:

```
URL acessada →  Componente exibido
--------------------------------
/             → LandingPage.tsx    (página inicial / marketing)
/login        → LoginPage.tsx      (formulário de login)
/register     → RegisterPage.tsx   (cadastro de novo cliente)
/checkout     → CheckoutPage.tsx   (escolha de plano)
/dashboard    → DashboardPage.tsx  (painel do cliente)
```

### Como um componente React funciona

```tsx
// src/pages/LoginPage.tsx (simplificado)
export function LoginPage() {
  // 1. Estado: variáveis que o React "observa"
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // 2. Ação: o que acontece ao clicar
  async function handleLogin() {
    const resposta = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    // ... tratar resposta
  }

  // 3. Interface visual (JSX — parece HTML, mas é JavaScript)
  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={senha} onChange={e => setSenha(e.target.value)} />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
```

### O ciclo completo de uma ação do usuário

```
Usuário clica em "Entrar"
→ handleLogin() é chamada
→ fetch('/api/auth/login') — envia os dados para o servidor
→ Servidor valida e retorna { token: '...' }
→ Frontend salva token no localStorage
→ Redireciona para /dashboard
```

---

## ⚙️ PARTE 3 — Backend (Node.js + Express)

### O que é Express?
Express é um framework Node.js para criar APIs HTTP. Ele define as "portas de entrada" do servidor.

### Como o servidor funciona

O `server/index.ts` é o ponto de entrada. Ele:
1. Cria o servidor Express
2. Define middlewares globais (CORS, JSON, etc.)
3. Registra as rotas (conecta URLs às funções)
4. Inicia o servidor na porta 3001

```typescript
// server/index.ts (simplificado)
import express from 'express';
import authRoutes from './routes/auth.js';

const app = express();

app.use(express.json()); // Permite receber JSON

app.use('/api/auth', authRoutes); // Registra as rotas de autenticação

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
```

### O que são Middlewares?

Middleware é uma função que **intercepta** a requisição antes de chegar na rota. Como um segurança na porta:

```
Requisição HTTP →  [CORS] → [JSON Parser] → [Auth Middleware] → Rota Final
```

O `server/middleware/auth.ts` verifica se o token JWT é válido antes de liberar o acesso ao dashboard.

---

## 🗄️ PARTE 4 — Banco de Dados

### O que é o banco de dados?
É onde os dados ficam guardados permanentemente. Sem banco, tudo seria perdido ao desligar o servidor.

### Estrutura atual (Supabase / PostgreSQL)

O banco fica na **nuvem** (Supabase), acessível de qualquer lugar:

```
Supabase PostgreSQL
├── tabela: clients     ← Um registro por cliente
│   ├── id, name, email, whatsapp
│   ├── password_hash   ← Senha criptografada (nunca em texto puro)
│   ├── plan, status, days_remaining, is_admin
│   └── app_account, app_password
│
├── tabela: payments    ← Histórico de pagamentos
│   ├── id, client_id (liga ao cliente)
│   ├── plan, value, status
│   └── paid_at
│
└── tabela: otp_tokens  ← Códigos OTP de verificação
    ├── id, whatsapp, token, type
    ├── used, expires_at
    └── created_at
```

### Como o banco é acessado

O backend usa a biblioteca `postgres` (tagged template) para fazer perguntas ao banco:

```typescript
// Pergunta: "Me dê o cliente com este e-mail"
const [client] = await sql`SELECT * FROM clients WHERE email = ${email}`;

// Ação: "Insira um novo cliente"
await sql`INSERT INTO clients (name, email, password_hash) VALUES (${nome}, ${email}, ${hash})`;
```

> 💡 Repare que os valores são inseridos com `${}` direto no template — a biblioteca `postgres` faz a proteção contra SQL Injection automaticamente.

### Por que a senha é um "hash" e não a senha real?

Quando o usuário cadastra a senha "minha123", o sistema faz:
```
"minha123" → bcrypt(12 rounds) → "$2b$12$xyzABCxyz..." (hash)
```

O hash é **irreversível** — mesmo o dono do banco não pode saber a senha original. Na hora do login, o sistema compara o hash da senha digitada com o hash salvo.

---

## 🔐 PARTE 5 — Autenticação JWT

### O que é JWT (JSON Web Token)?

É um "ingresso" digital que o servidor entrega ao usuário após o login. Parece isso:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNjkwMDAwMDAwfQ.ASSINATURA_CRIPTOGRAFADA
```

São 3 partes separadas por `.`:
1. **Header:** tipo do token
2. **Payload:** dados dentro (id do usuário, e-mail, quando expira)
3. **Assinatura:** prova que o servidor gerou (não pode ser falsificada)

### Fluxo completo de login

```
1. Usuário entra email + senha
2. Servidor valida → gera JWT com validade de 2h
3. Frontend salva o JWT no localStorage("reyb_token")
4. Toda requisição protegida envia: "Authorization: Bearer <token>"
5. Servidor verifica a assinatura do token → libera ou bloqueia
6. Após 2h o token expira → usuário é redirecionado para /login
```

### ProtectedRoute — O guardião das páginas privadas

```tsx
// src/components/ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('reyb_token');
  
  if (!token) {
    return <Navigate to="/login" />; // Redireciona se não tem token
  }
  
  return children; // Libera o acesso
}
```

---

## 🌐 PARTE 6 — Como Frontend e Backend se Comunicam

### O problema: portas diferentes

- Frontend: porta **3000** (Vite dev server)
- Backend: porta **3001** (Express)

Um site em porta 3000 normalmente não pode chamar uma API em porta 3001 (regra de segurança do browser chamada **CORS**).

### A solução: Proxy do Vite

O `vite.config.ts` configura um proxy:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3001' // Redireciona /api/* para o backend
  }
}
```

Então quando o React faz `fetch('/api/auth/login')`, o Vite **internamente** chama `http://localhost:3001/api/auth/login`.

### Em produção

- Frontend está no **Cloudflare Pages** (ex: `https://reybraztech.pages.dev`)
- Backend está no **Render** (ex: `https://reybraztech-api.onrender.com`)
- O arquivo `src/config/api.ts` define qual URL usar:
  ```typescript
  export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
  ```
- Em produção, defina `VITE_API_URL` no Cloudflare Pages como a URL do backend

---

## 🔄 PARTE 7 — Fluxo Completo de Uso do Site

```
CADASTRO:
Cliente acessa /register
→ Preenche formulário
→ Frontend envia POST /api/auth/register
→ Backend valida dados, criptografa senha, salva no banco
→ Retorna sucesso → Frontend redireciona para /login

LOGIN:
Cliente acessa /login
→ Preenche email e senha
→ Frontend envia POST /api/auth/login
→ Backend valida senha (bcrypt.compare), gera JWT
→ Frontend salva token → redireciona para /dashboard

DASHBOARD:
Frontend envia GET /api/dashboard com token no header
→ Middleware auth.ts verifica o JWT
→ Backend busca dados do cliente no banco
→ Retorna dados → Frontend exibe para o usuário

LOGOUT:
Frontend remove o token do localStorage
→ ProtectedRoute detecta ausência → redireciona para /login
```

---

## 📦 PARTE 8 — Dependências Principais

### Frontend (`src/`)
| Pacote | Para que serve |
|--------|---------------|
| `react` + `react-dom` | Biblioteca de interface |
| `react-router-dom` | Navegação entre páginas |
| `vite` | Servidor de desenvolvimento rápido |
| `tailwindcss` | CSS utilitário (classes como `bg-cyan-500`) |
| `three.js` | Animação WebGL no fundo |

### Backend (`server/`)
| Pacote | Para que serve |
|--------|---------------|
| `express` | Servidor HTTP / API |
| `postgres` | Conexão com Supabase (PostgreSQL na nuvem) |
| `bcryptjs` | Criptografia de senhas |
| `jsonwebtoken` | Geração e validação de tokens JWT |
| `cors` | Controle de origens permitidas |
| `helmet` | Headers HTTP de segurança automáticos |
| `express-rate-limit` | Proteção contra força bruta / DDoS |
| `zod` | Validação de dados de entrada |

---

## 🛠️ PARTE 9 — Como Fazer Alterações com Segurança

### Alterar um texto na interface
→ Edite o arquivo em `src/pages/` correspondente à página

### Adicionar um novo campo no formulário de cadastro
1. Adicione o campo no HTML de `RegisterPage.tsx`
2. Adicione o campo na validação do backend (`server/routes/auth.ts`)
3. Adicione o campo na tabela do banco (`server/database.ts`)

### Mudar uma cor
→ Edite `src/index.css` (paleta principal) ou use a classe Tailwind diretamente

### Adicionar uma nova rota de API
1. Crie ou edite um arquivo em `server/routes/`
2. Registre no `server/index.ts` com `app.use('/api/novarota', novaRoute)`

### Como testar se o backend está funcionando
```bash
# No terminal, testar a rota de saúde:
curl http://localhost:3001/api/health

# Ou abra no navegador:
http://localhost:3001/api/health
```

---

## 🗺️ Mapa Mental do Projeto

```
REYBRAZTECH
│
├── FRONTEND (src/)
│   ├── App.tsx → define as rotas
│   ├── config/api.ts → URL da API (dev vs produção)
│   ├── pages/ → uma página por arquivo
│   │   ├── LandingPage → vitrine do produto
│   │   ├── LoginPage → entrada do cliente (senha ou OTP)
│   │   ├── RegisterPage → cadastro (3 etapas + OTP)
│   │   ├── CheckoutPage → planos
│   │   ├── DashboardPage → área do cliente
│   │   └── AdminPage → painel admin (rota oculta /admlogin)
│   └── components/ → peças reutilizáveis
│       ├── Navbar, Footer, FloatingWhatsApp
│       ├── ProtectedRoute → guarda rotas com verificação de expiração JWT
│       └── web-gl-shader → animação de fundo
│
├── BACKEND (server/)
│   ├── index.ts → servidor na porta 3001 (Helmet + Rate Limit)
│   ├── database.ts → conexão com Supabase (PostgreSQL)
│   ├── middleware/
│   │   ├── auth.ts → verifica JWT
│   │   └── admin.ts → verifica is_admin
│   ├── routes/
│   │   ├── auth.ts → /register e /login (com Zod)
│   │   ├── dashboard.ts → dados do cliente
│   │   ├── otp.ts → envio e verificação OTP
│   │   └── admin.ts → gerenciamento de clientes
│   └── services/
│       ├── otp.ts → geração/validação de códigos OTP
│       └── whatsapp.ts → integração SendPulse
│
├── BANCO (Supabase na nuvem)
│   ├── clients → dados dos clientes (+ is_admin)
│   ├── payments → histórico financeiro
│   └── otp_tokens → códigos de verificação
│
└── CONFIGURAÇÃO
    ├── .env → segredos (JWT, Supabase, SendPulse)
    ├── vite.config.ts → proxy dev
    └── package.json → dependências
```

---

## Próximos passos sugeridos

1. ✅ **Guia 02** → Segurança básica (Helmet, Rate Limit, Zod, jwt-decode) — **JÁ FEITO**
2. ✅ **Guia 03** → Migrar para Supabase — **JÁ FEITO**
3. ✅ **Guia 04** → OTP WhatsApp (SendPulse) — **JÁ FEITO**
4. ✅ **Guia 05** → Deploy (Cloudflare Pages + Render) — **JÁ FEITO**
5. 🟡 **Guia 06** → Implementar ações do Admin (ativar/inativar) — PRÓXIMO
6. 🟡 **Integrar Mercado Pago** → Ativar clientes automaticamente após pagamento
