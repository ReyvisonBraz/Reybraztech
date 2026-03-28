# 📘 Guia 00 — Visão Geral do Projeto

> **Última atualização:** Março de 2026  
> Este é o guia vivo do projeto. Aqui você aprende como tudo funciona, como está organizado e o que pode ser melhorado.

---

## 🗺️ Visão Geral

O projeto é uma **plataforma completa de streaming por assinatura** com frontend + backend, dividida em duas partes que conversam entre si:

| Camada | Tecnologia | Porta | Comando |
|--------|-----------|-------|---------|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS | `3000` | `npm run dev` |
| **Backend** | Node.js + Express + TypeScript | `3001` | `npm run server` |
| **Banco de Dados** | Supabase (PostgreSQL) | — | Nuvem |

> O frontend faz chamadas HTTP (`fetch`) para o backend, que interage com o banco Supabase na nuvem.

---

## 📁 Estrutura de Pastas

```
Reybraztech/
├── src/                        ← Frontend (React)
│   ├── App.tsx                 ← Roteador principal (define as URLs)
│   ├── main.tsx                ← Ponto de entrada (força modo escuro)
│   ├── index.css               ← Estilos globais, paleta de cores, classes utilitárias
│   ├── config/
│   │   └── api.ts              ← URL central da API (dev vs produção)
│   ├── lib/
│   │   └── utils.ts            ← Helper cn() para shadcn/ui
│   ├── pages/
│   │   ├── LandingPage.tsx     ← Página inicial (marketing)
│   │   ├── CheckoutPage.tsx    ← Escolha de plano e pagamento
│   │   ├── RegisterPage.tsx    ← Cadastro de novo cliente (3 etapas + OTP)
│   │   ├── LoginPage.tsx       ← Tela de login (senha ou OTP WhatsApp)
│   │   ├── DashboardPage.tsx   ← Painel do cliente logado
│   │   └── AdminPage.tsx       ← Painel administrativo (rota oculta)
│   └── components/             ← Peças reutilizáveis de interface
│       ├── Navbar.tsx          ← Cabeçalho de navegação (modo escuro fixo)
│       ├── Footer.tsx          ← Rodapé
│       ├── FloatingWhatsApp.tsx← Botão flutuante do WhatsApp
│       ├── ContentCarousel.tsx ← Carrossel de conteúdo animado
│       ├── ProtectedRoute.tsx  ← Guarda das rotas privadas (com verificação de expiração JWT)
│       ├── web-gl-shader.tsx   ← Onda WebGL animada do fundo
│       └── ui/                 ← Componentes shadcn/ui (button, input, etc.)
│
├── server/                     ← Backend (Express/Node.js)
│   ├── index.ts                ← Servidor Express (com Helmet + Rate Limit)
│   ├── database.ts             ← Conexão com Supabase (PostgreSQL via `postgres`)
│   ├── middleware/
│   │   ├── auth.ts             ← Middleware JWT (verifica token)
│   │   └── admin.ts            ← Middleware Admin (verifica is_admin)
│   ├── routes/
│   │   ├── auth.ts             ← /api/auth/* (login e registro com validação Zod)
│   │   ├── dashboard.ts        ← /api/dashboard (dados do cliente)
│   │   ├── otp.ts              ← /api/otp/* (envio e verificação de códigos OTP)
│   │   └── admin.ts            ← /api/admin/* (gerenciamento de clientes)
│   ├── services/
│   │   ├── otp.ts              ← Geração, salvamento e validação de códigos OTP
│   │   └── whatsapp.ts         ← Integração SendPulse (envio de mensagens WhatsApp)
│   └── scripts/
│       ├── make-admin.ts       ← Script para promover um usuário a admin
│       └── migrate-admin.ts    ← Script de migração da coluna is_admin
│
├── .env                        ← Variáveis de ambiente (Chaves Supabase e SendPulse)
└── vite.config.ts              ← Configuração do Vite (proxy e aliases)
```

---

## 🎨 Identidade Visual (Paleta de Cores)

O projeto usa **modo escuro fixo** (classe `dark` sempre ativa no `<html>`).

| Cor | Código | Uso |
|-----|--------|-----|
| **Cyan** | `#22d3ee` | Cor principal, botões primários, bordas glow |
| **Blue** | `#3b82f6` | Destaques secundários |
| **Purple/Magenta** | `#d946ef` | Acento, destaques e gradient |
| **Dark BG** | `#020617` | Fundo da página |
| **Slate Dark** | `#0f172a` | Cards, elementos de fundo |

O gradiente logo é: `cyan → blue → purple` (usado em `.gradient-logo` e `.text-gradient`).

---

## 🗄️ Banco de Dados (Supabase / PostgreSQL)

### Tabela `clients`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária, gerada pelo Supabase |
| `name` | TEXT | Nome completo |
| `whatsapp` | TEXT UNIQUE | Número do WhatsApp (Login) |
| `device` | TEXT | Dispositivo (Android, Smart TV, etc.) |
| `email` | TEXT | E-mail (Opcional, Login) |
| `password_hash` | TEXT | Senha criptografada com bcrypt |
| `plan` | TEXT | Plano contratado (mensal, trimestral…) |
| `status` | TEXT | `Ativo` / `Inativo` / `Pendente` |
| `days_remaining` | INTEGER | Dias restantes na assinatura |
| `app_account` | TEXT | Login do app do cliente |
| `app_password` | TEXT | Senha do app do cliente |
| `created_at` | TIMESTAMPTZ | Data/hora do cadastro |

### Tabela `payments`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGSERIAL | Chave primária |
| `client_id` | BIGINT | FK referenciando o cliente |
| `plan` | TEXT | Plano pago |
| `value` | TEXT | Valor pago |
| `status` | TEXT | Status (`Pago`) |
| `paid_at` | TIMESTAMPTZ | Data do pagamento |

### Tabela `otp_tokens`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGSERIAL | Chave primária |
| `whatsapp` | TEXT | Número do cliente |
| `token` | TEXT | Código OTP de 6 dígitos |
| `type` | TEXT | Tipo: `register`, `login`, `reset_password` |
| `used` | BOOLEAN | Se o código já foi usado |
| `expires_at` | TIMESTAMPTZ | Data/hora de expiração (5 min) |
| `created_at` | TIMESTAMPTZ | Data/hora de criação |

---

## 🔌 API — Rotas do Backend

### Autenticação — `/api/auth/`
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/register` | Cadastra novo cliente (com validação Zod) |
| `POST` | `/api/auth/login` | Login — retorna token JWT |

### OTP WhatsApp — `/api/otp/`
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/otp/send` | Envia código OTP via WhatsApp (SendPulse) |
| `POST` | `/api/otp/verify-login` | Verifica código e faz login |
| `POST` | `/api/otp/reset-password` | Verifica código e redefine senha |

### Painel do Cliente — `/api/dashboard/`
| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/dashboard` | Dados + histórico do cliente | **JWT** |

### Admin — `/api/admin/`
| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/admin/clients` | Lista todos os clientes | **JWT + Admin** |

### Saúde
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Verifica se o servidor está rodando |

---

## 🔐 Autenticação e Registro

### Registro em 3 Etapas (OTP WhatsApp)
1. Usuário preenche dados pessoais (Nome, WhatsApp, Dispositivo).
2. **Ativação via WhatsApp:** O usuário envia uma mensagem para o bot da SendPulse para abrir a janela de 24h. O backend envia um código OTP.
3. **Senhas e Opcionais:** O usuário confirma o OTP e define uma senha e e-mail (opcional).

### Login JWT
1. Usuário preenche WhatsApp ou e-mail + senha na `LoginPage.tsx`
2. Frontend faz `POST /api/auth/login`
3. Backend valida a credencial (WhatsApp/email) e a senha com `bcryptjs`
4. Se correto, gera token JWT (válido por 2h)
5. Frontend salva no `localStorage` (`reyb_token`)
6. Rotas protegidas enviam `Authorization: Bearer <token>`
7. `ProtectedRoute.tsx` redireciona para `/login` se sem token

---

## 🗺️ Rotas do Site

| URL | Componente | Protegida? |
|-----|-----------|------------|
| `/` | `LandingPage` | Não |
| `/checkout` | `CheckoutPage` | Não |
| `/login` | `LoginPage` | Não |
| `/register` | `RegisterPage` | Não |
| `/dashboard` | `DashboardPage` | **Sim** (JWT) |
| `/admlogin` | `AdminPage` | **Sim** (JWT + Admin) — rota oculta |

---

## 🚀 Como Rodar o Projeto

**Pré-requisitos:**
Configure as variáveis de ambiente no arquivo `.env` com as credenciais do Supabase e as chaves da API SendPulse.

**Terminal 1 — Backend:**
```bash
npm run server
```
Saída esperada: `🚀 Servidor Reybraztech Online! → http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Acesse: `http://localhost:3000`

> **Dica:** O Vite usa proxy automático — chamadas para `/api/...` são redirecionadas para `localhost:3001`.

---

## 🛠️ Como Fazer Alterações

### Mudar um texto
```tsx
// Antes
<h1>Bem-vindo ao sistema</h1>
// Depois
<h1>Bem-vindo à Reybraztech</h1>
```

### Mudar uma cor
```tsx
className="bg-green-500"  →  className="bg-cyan-500"
className="text-slate-400"  →  className="text-cyan-400"
```

### Adicionar nova página
1. Crie `src/pages/NovaPagina.tsx` e exporte o componente
2. Registre em `src/App.tsx`:
```tsx
import { NovaPagina } from './pages/NovaPagina';
<Route path="/nova-pagina" element={<NovaPagina />} />
```

### Navegação interna (use sempre `<Link>`)
```tsx
import { Link } from 'react-router-dom';
<Link to="/checkout">Ver Planos</Link>
```

---

## 🔮 Roadmap de Melhorias

> O roadmap completo e atualizado está em **[06-roadmap.md](./06-roadmap.md)**.
> Abaixo, apenas um resumo rápido do estado atual.

| Categoria | Feito | Pendente |
|-----------|-------|----------|
| **Segurança base** (Helmet, Rate Limit, Zod, JWT) | ✅ | — |
| **Admin** (estrutura + listagem) | ✅ | Ações ativar/desativar, paginação |
| **Recuperação de senha** | ✅ | — |
| **Monitoramento** (Winston, Sentry, Telegram) | ✅ | — |
| **Deploy** (Cloudflare + Render) | ✅ | — |
| **Automação** (node-cron, days_remaining) | — | ❌ Não iniciado |
| **Pagamentos** (Mercado Pago webhook) | 🟡 Links | ❌ Webhook pendente |
| **Refresh Token** | — | ❌ Pendente |
| **SEO, Testes, 404** | — | ❌ Pendente |

> **Onde parou:** Day 12 do [diário de bordo](./07-diario-de-bordo.md) — botões de ação no admin.
