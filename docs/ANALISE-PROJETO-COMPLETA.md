# 📋 DOCUMENTAÇÃO COMPLETA DO PROJETO REYBRAZTECH

## Visão Geral do Sistema

Este projeto é uma **plataforma SaaS de IPTV** (Streaming de TV pela internet). O sistema permite que clientes realizem cadastro, comprem planos de assinatura, acessem um painel com suas credenciais e sincronizem dados do painel StarHome (fornecedor de conteúdo).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA GERAL DO SISTEMA                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   FRONTEND   │───▶│   BACKEND    │───▶│  DATABASE    │                  │
│  │   (React)    │    │  (Express)   │    │ (PostgreSQL) │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │  Páginas do  │    │   Rotas API  │    │   Tabelas    │                  │
│  │   Usuário    │    │   (REST)     │    │  do Banco    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 ESTRUTURA DE PASTAS DO PROJETO

```
Reybraztech/
├── 📂 api/                    # Arquivo de entrada para deploy na Vercel
│   └── index.ts              # Exporta o app do servidor
│
├── 📂 server/                 # Backend - API principal
│   ├── index.ts              # Configuração principal do Express.js
│   ├── database.ts           # Conexão com PostgreSQL (Supabase)
│   │
│   ├── 📂 routes/            # Rotas da API (endpoints)
│   │   ├── auth.ts           # Login, registro, recuperação de senha
│   │   ├── dashboard.ts      # Dados do painel do cliente
│   │   ├── admin.ts          # Gestão de clientes (admin)
│   │   ├── payments.ts       # Webhook do MercadoPago
│   │   ├── orders.ts         # Criação de pedidos e trials
│   │   ├── otp.ts            # Códigos de verificação
│   │   └── scraper.ts        # Integração com o scraper
│   │
│   ├── 📂 middleware/        # Verificações de segurança
│   │   ├── auth.ts           # Verifica token JWT do usuário
│   │   └── admin.ts          # Verifica se é administrador
│   │
│   ├── 📂 services/          # Lógica de serviços externos
│   │   ├── whatsapp.ts      # Envio de mensagens via SendPulse
│   │   ├── mercadopago.ts   # Integração com pagamento
│   │   └── otp.ts           # Geração e verificação de códigos OTP
│   │
│   ├── 📂 utils/             # Funções utilitárias
│   │   └── logger.ts         # Sistema de logs + Telegram (950 linhas!)
│   │
│   └── 📂 scripts/           # Scripts de manutenção (migrações)
│       ├── migrate-starhome-columns.ts
│       ├── migrate-admin.ts
│       └── make-admin.ts
│
├── 📂 src/                    # Frontend - Aplicação React
│   ├── main.tsx              # Entry point do React
│   ├── App.tsx               # Configuração de rotas (Router)
│   ├── index.css             # Estilos globais (Tailwind CSS)
│   │
│   ├── 📂 config/            # Configurações do frontend
│   │   └── api.ts            # URL da API (desenvolvimento vs produção)
│   │
│   ├── 📂 components/        # Componentes reutilizáveis
│   │   ├── Navbar.tsx        # Barra de navegação superior
│   │   ├── Footer.tsx        # Rodapé do site
│   │   ├── ProtectedRoute.tsx # Protege rotas autenticadas
│   │   └── ui/               # Componentes de UI (botões, inputs, etc)
│   │
│   ├── 📂 pages/            # Páginas principais
│   │   ├── LandingPage.tsx   # Página inicial (hero, planos)
│   │   ├── LoginPage.tsx     # Login de usuários
│   │   ├── RegisterPage.tsx  # Cadastro de novos usuários
│   │   ├── DashboardPage.tsx # Painel do cliente logado
│   │   ├── CheckoutPage.tsx  # Página de pagamento
│   │   ├── TrialPage.tsx     # Solicitação de teste grátis
│   │   ├── AdminPage.tsx     # Painel administrativo
│   │   └── CompleteRegistrationPage.tsx # Finalizar cadastro pós-pagamento
│   │
│   ├── 📂 hooks/             # Custom hooks do React
│   │   └── useMousePosition.ts # Hook para posição do mouse
│   │
│   ├── 📂 lib/              # Funções utilitárias
│   │   └── utils.ts          # Funções auxiliares (clsx, etc)
│   │
│   └── 📂 utils/            # Utilitários do frontend
│       └── openSendPulseChat.ts # Abre chat do WhatsApp
│
├── 📂 scraper/               # Bot de sincronização (Puppeteer)
│   ├── src/
│   │   ├── index.ts          # Entry point do scraper
│   │   ├── login.ts          # Login no painel StarHome
│   │   ├── scrape.ts         # Extração de dados dos clientes
│   │   ├── update-db.ts      # Atualiza banco de dados
│   │   ├── export.ts         # Exporta dados (JSON/CSV)
│   │   ├── captcha.ts        # Resolução de CAPTCHA
│   │   ├── telegram.ts       # Notificações Telegram
│   │   └── server.ts         # Servidor do scraper (para API)
│   │
│   ├── package.json          # Dependências do scraper
│   └── cookies/              # Cookies de sessão salvos
│
├── 📂 public/                # Arquivos estáticos públicos
│   ├── logo/                 # Logo do projeto
│   └── carrossel/            # Imagens do carrossel
│
├── 📂 docs/                  # Documentação do projeto
│   └── *.md                  # Arquivos de documentação
│
├── 📂 .env.example           # Exemplo de variáveis de ambiente
├── 📂 package.json           # Scripts e dependências principais
├── 📂 tsconfig.json          # Configuração do TypeScript
├── 📂 vite.config.ts         # Configuração do Vite
└── 📂 vercel.json            # Configuração de deploy Vercel
```

---

## 🔄 FLUXO DE DADOS - COMUNICAÇÃO ENTRE PARTES

### 1. Fluxo de Cadastro e Login

```
┌─────────────┐     POST /api/auth/register    ┌─────────────┐
│   Frontend  │ ──────────────────────────────▶│   Backend   │
│  (Register) │                                │  (Express)  │
└─────────────┘                                └──────┬──────┘
      │                                               │
      │ { name, whatsapp, password, device }         │
      │                                               ▼
      │                                        ┌─────────────┐
      │                                        │  PostgreSQL │
      │                                        │  (clients)  │
      │                                        └─────────────┘
      │                                               │
      │◀───────── { token, user } ──────────────────│
      │                                               │
      ▼                                               ▼
┌─────────────┐                               ┌─────────────┐
│  localStorage│                               │  SendPulse │
│  (guarda token)                              │ (WhatsApp)  │
└─────────────┘                               └─────────────┘
```

**Passo a passo:**
1. Usuário preenche formulário no frontend (RegisterPage.tsx)
2. Frontend envia POST para `/api/auth/register`
3. Backend valida dados com Zod (schema de validação)
4. Backend verifica se WhatsApp/email já existe no banco
5. Backend criptografa senha com bcrypt (12 rounds de segurança)
6. Backend insere cliente no banco de dados (tabela `clients`)
7. Backend gera token JWT com id do cliente
8. Backend envia mensagem de boas-vindas via WhatsApp (SendPulse)
9. Frontend guarda token no localStorage
10. Frontend redireciona para dashboard

### 2. Fluxo de Compra (MercadoPago)

```
┌─────────────┐     POST /api/orders/create    ┌─────────────┐
│   Frontend  │ ──────────────────────────────▶│   Backend   │
│ (Checkout)  │                                │  (Express)  │
└─────────────┘                                └──────┬──────┘
      │                                               │
      │ { name, whatsapp, plan }                      ▼
      │                                        ┌─────────────┐
      │                                        │  PostgreSQL │
      │                                        │(pending_orders)│
      │                                        └─────────────┘
      │                                               │
      │◀────────── { init_point } ───────────────────│
      │                                               │
      ▼                                               ▼
┌─────────────┐                               ┌─────────────┐
│ MercadoPago │◀── Redirect para checkout ───│             │
│  (Payment)  │                                │             │
└─────────────┘                                └─────────────┘
      │
      │ Pagamento aprovado
      ▼
┌─────────────┐     POST /api/payments/webhook
│  MercadoPago│ ──────────────────────────────▶
│             │     (paymentId, status)
└─────────────┘                                ┌─────────────┐
                                               │   Backend   │
                                               └──────┬──────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │  PostgreSQL │
                                               │(pending_orders)│
                                               │ status = 'paid'
                                               └─────────────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │  SendPulse  │
                                               │ (WhatsApp)  │
                                               └─────────────┘
```

### 3. Fluxo do Scraper (Sincronização StarHome)

```
┌─────────────┐     POST /api/admin/sync       ┌─────────────┐
│  Telegram   │ ──────────────────────────────▶│   Backend   │
│    Bot      │                                │  (Express)  │
└─────────────┘                                └──────┬──────┘
      │                                               │
      │ /sync                                         ▼
      │                                        ┌─────────────┐
      │                                        │  Scraper    │
      │                                        │  (servidor) │
      │                                        └──────┬──────┘
      │                                               │
      │                                               ▼
      │                                        ┌─────────────┐
      │                                        │  StarHome   │
      │                                        │   (Panel)   │
      │                                        └──────┬──────┘
      │                                               │ (Puppeteer)
      │                                               ▼
      │                                        ┌─────────────┐
      │                                        │  Extração   │
      │                                        │   (HTML)    │
      │                                        └──────┬──────┘
      │                                               │
      │                                               ▼
      │                                        ┌─────────────┐
      │                                        │  PostgreSQL │
      │                                        │  (clients)  │
      │                                        └─────────────┘
      │                                               │
      │◀──────────── Notificação ───────────────────┘
      │
      ▼
┌─────────────┐
│  Telegram   │
│    User     │
└─────────────┘
```

---

## 🗄️ BANCO DE DADOS - TABELAS E RELAÇÕES

### Diagrama de Entidade-Relacionamento Simplificado

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     clients      │       │   pending_orders │       │    payments      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◀──────│ client_id (FK)   │       │ id (PK)          │
│ name             │       │ id (PK)           │       │ client_id (FK)  │
│ whatsapp         │       │ name              │       │ plan             │
│ email            │       │ whatsapp          │       │ value            │
│ password_hash    │       │ plan              │       │ status           │
│ device           │       │ amount            │       │ paid_at          │
│ plan             │       │ status            │       └──────────────────┘
│ status           │       │ device            │
│ days_remaining   │       │ mp_payment_id     │
│ is_admin         │       │ paid_at           │
│ starhome_account │       └──────────────────┘
│ starhome_password│       ┌──────────────────┐
│ created_at       │       │   login_logs      │
└──────────────────┘       ├──────────────────┤
                           │ id (PK)           │
                           │ action            │
                           │ whatsapp          │
                           │ email             │
                           │ success           │
                           │ ip_address        │
                           │ created_at        │
                           └──────────────────┘
```

### Descrição das Tabelas

#### 1. `clients` - Clientes Principais
```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,           -- Nome completo do cliente
    whatsapp VARCHAR(20) NOT NULL UNIQUE, -- WhatsApp (identificador principal)
    email VARCHAR(255),                    -- Email (opcional)
    device VARCHAR(50),                   -- Tipo de dispositivo (Android TV, etc)
    password_hash TEXT NOT NULL,           -- Senha criptografada (bcrypt)
    plan VARCHAR(20) DEFAULT 'mensal',    -- Plano atual (mensal, anual, etc)
    status VARCHAR(20) DEFAULT 'Ativo',   -- Status (Ativo, Inativo)
    days_remaining INTEGER DEFAULT 0,     -- Dias restantes do plano
    is_admin BOOLEAN DEFAULT false,        -- É administrador?
    app_account VARCHAR(255),              -- Conta no app (preenchido pelo scraper)
    app_password VARCHAR(255),             -- Senha no app (preenchido pelo scraper)
    starhome_account VARCHAR(255),         -- Código StarHome
    starhome_password TEXT,                -- Senha StarHome
    starhome_package VARCHAR(255),         -- Nome do pacote StarHome
    starhome_days_remaining INTEGER,       -- Dias restantes StarHome
    starhome_in_use VARCHAR(20),           -- Status de uso StarHome
    created_at TIMESTAMPTZ DEFAULT NOW()  -- Data de cadastro
);
```

**Por que esta tabela?**
- Armazena TODOS os dados do cliente
- Campo `starhome_*` permite integrar com painel do fornecedor
- `is_admin` controla quem pode acessar painel administrativo

#### 2. `pending_orders` - Pedidos Pendentes
```sql
CREATE TABLE pending_orders (
    id VARCHAR(50) PRIMARY KEY,            -- ID único do pedido
    name VARCHAR(255) NOT NULL,            -- Nome do cliente
    whatsapp VARCHAR(20) NOT NULL,         -- WhatsApp para contato
    plan VARCHAR(20) NOT NULL,             -- Plano escolhido (trial, mensal, etc)
    amount DECIMAL(10,2) NOT NULL,        -- Valor em reais
    status VARCHAR(20) DEFAULT 'pending',  -- Status: pending, paid, registered
    device VARCHAR(50),                    -- Tipo de dispositivo
    mp_preference_id VARCHAR(50),         -- ID do MercadoPago
    mp_payment_id VARCHAR(50),            -- ID do pagamento aprovado
    client_id UUID REFERENCES clients(id),-- Cliente vinculado (após registro)
    paid_at TIMESTAMPTZ,                  -- Data do pagamento
    registered_at TIMESTAMPTZ,            -- Data do registro completo
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Por que esta tabela?**
- Separa dados de COMPRA da conta do usuário
- Permite fluxo: criar pedido → pagar → vincular à conta
- Campos `mp_payment_id` e `paid_at` rastreiam pagamento

#### 3. `payments` - Histórico de Pagamentos
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) NOT NULL,
    plan VARCHAR(20) NOT NULL,             -- Plano do pagamento
    value DECIMAL(10,2) NOT NULL,         -- Valor pago
    status VARCHAR(20) NOT NULL,          -- Status (paid, pending, failed)
    paid_at TIMESTAMPTZ,                 -- Data do pagamento
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Por que esta tabela?**
- Histórico de pagamentos para o usuário ver no dashboard
- Não é essencial para funcionamento, mas agrega valor

#### 4. `login_logs` - Logs de Acesso
```sql
CREATE TABLE login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,          -- login, register, failed_login
    whatsapp VARCHAR(20),                 -- Whatsapp relacionado
    email VARCHAR(255),                   -- Email relacionado
    details TEXT,                         -- Detalhes adicionais
    ip_address VARCHAR(45),              -- IP do usuário
    user_agent TEXT,                      -- Navegador/dispositivo
    success BOOLEAN DEFAULT true,          -- Sucesso da operação
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Por que esta tabela?**
- Auditoria e segurança - rastrear tentativas de login
- Detectar comportamento suspeito (muitos failed_login)
- Resolver problemas de acesso de usuários

#### 5. `otp_tokens` - Códigos de Verificação
```sql
CREATE TABLE otp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp VARCHAR(20) NOT NULL,
    token VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL,            -- register, login, reset_password
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Por que esta tabela?**
- Armazena códigos OTP temporários
- Permite verificar identidade do usuário
- Expira automaticamente após 5 minutos

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Como funciona o JWT (JSON Web Token)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTENTICAÇÃO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. LOGIN                                                       │
│   ┌──────────┐    { identifier, password }    ┌──────────┐     │
│   │ Frontend │ ──────────────────────────────▶│ Backend  │     │
│   └──────────┘                                └─────┬────┘     │
│                                                     │           │
│                                                     ▼           │
│                                              ┌──────────┐     │
│                                              │ bcrypt   │     │
│                                              │ compare  │     │
│                                              └─────┬────┘     │
│                                                    │           │
│                                                    ▼           │
│                                              ┌──────────┐     │
│                                              │  JWT     │     │
│                                              │  Sign    │     │
│                                              └─────┬────┘     │
│                                                    │           │
│   ◀─────────── { token, user } ───────────────────┘           │
│                                                                  │
│   2. REQUISIÇÃO PROTEGIDA                                       │
│   ┌──────────┐    GET /api/dashboard      ┌──────────┐        │
│   │ Frontend │ ──────────────────────────▶│ Backend  │        │
│   │          │    Authorization: Bearer    │          │        │
│   └──────────┘    <token_jwt>             └─────┬────┘        │
│                                               │               │
│                                               ▼               │
│                                        ┌──────────────┐       │
│                                        │ verifyToken  │       │
│                                        │ (middleware) │       │
│                                        └──────┬───────┘       │
│                                               │               │
│                                               ▼               │
│                                        ┌──────────────┐       │
│                                        │ req.clientId │       │
│                                        │ definido     │       │
│                                        └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Estrutura do Token JWT

```javascript
// O token contém (payload):
{
  "id": "uuid-do-cliente",      // ID único no banco
  "email": "whatsapp@ou-email",  // Identificador do usuário
  "exp": 1714567890             // Timestamp de expiração (8h)
}

// Assinado com JWT_SECRET (do .env)
// Usuário NÃO pode alterar o token (dados encriptados/assinados)
```

### Middleware de Autenticação (server/middleware/auth.ts)

```typescript
export const verifyToken = (req, res, next) => {
    // 1. Pega o token do header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
    
    // 2. Se não tem token, niega acesso
    if (!token) {
        res.status(401).json({ error: 'Acesso negado.' });
        return;
    }
    
    // 3. Verifica se o token é válido (assinatura + expiração)
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.clientId = decoded.id;   // Define ID para as rotas usarem
        req.clientEmail = decoded.email;
        next();                       // Permite continuar
    } catch {
        res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};
```

### Middleware de Admin (server/middleware/admin.ts)

```typescript
export const verifyAdmin = async (req, res, next) => {
    try {
        if (!req.clientId) {
            res.status(401).json({ error: 'Não autorizado.' });
            return;
        }

        // Busca o status de admin do banco
        const [client] = await sql`
            SELECT is_admin FROM clients WHERE id = ${req.clientId}
        `;

        if (!client || !client.is_admin) {
            res.status(403).json({ error: 'Acesso restrito a administradores.' });
            return;
        }

        next();
    } catch (error) {
        logger.error('Erro na verificação de admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
```

---

## 🌐 FRONTEND - ARQUITETURA E COMPONENTES

### Estrutura de Rotas (App.tsx)

```typescript
// Lazy loading - cada página vira um chunk separado (carregamento sob demanda)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
// ... outras páginas

// Todas as rotas da aplicação
<Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/trial" element={<TrialPage />} />
    <Route path="/dashboard" element={
        <ProtectedRoute>           // Rota protegida!
            <DashboardPage />
        </ProtectedRoute>
    } />
    <Route path="/admlogin" element={
        <ProtectedRoute>
            <AdminPage />           // Apenas admins acessam
        </ProtectedRoute>
    } />
</Routes>
```

### Padrão de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│              EXEMPLO: Fluxo de Dados no Dashboard               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DashboardPage.tsx                                              │
│  │                                                              │
│  │  1. useEffect() executa ao carregar                         │
│  │     ├── Pega token do localStorage                           │
│  │     ├── Fetch para /api/dashboard                            │
│  │     │   └── Envia Authorization: Bearer <token>              │
│  │     └── Define dados no state 'user'                        │
│  │                                                              │
│  ▼                                                              │
│  Renderização Condicional                                       │
│  │                                                              │
│  ├─ Se loading: mostra spinner                                  │
│  ├─ Se error: mostra mensagem de erro                          │
│  └─ Se sucesso: mostra dados do usuário                        │
│      │                                                          │
│      ├─ Nome, WhatsApp, Plano                                   │
│      ├─ Credenciais do app (StarHome)                           │
│      ├─ Histórico de pagamentos                                  │
│      └─ Botões: Renovar, Sair                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Gerenciamento de Estado

```typescript
// Frontend usa apenas localStorage para persistência
// (não usa Redux, Zustand, ou Context API)

// localStorage usado:
localStorage.getItem('reyb_token')   // JWT do usuário logado
localStorage.getItem('reyb_user')     // Dados do usuário (cache opcional)

// Padrão: toda requisição autenticada inclui o token
const response = await fetch(`${API_URL}/api/dashboard`, {
    headers: { 
        Authorization: `Bearer ${localStorage.getItem('reyb_token')}` 
    }
});
```

### Componentes Principais

#### ProtectedRoute.tsx
Protege rotas que precisam de autenticação:
```typescript
export const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('reyb_token');

    if (!isTokenValid(token)) {
        if (token) localStorage.removeItem('reyb_token');
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
```

#### Navbar.tsx
Barra de navegação com:
- Logo
- Links para seções (Início, Dispositivos, Planos, FAQ)
- Botão de Login/Área do Cliente
- Botão Admin (se usuário for admin)
- Menu mobile

---

## 📊 SCRAPER - SINCRONIZAÇÃO STARHOME

### O que o scraper faz

```
┌─────────────────────────────────────────────────────────────────┐
│                    O QUE O SCRAPER FAZ                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOGIN NO PAINEL STARHOME                                    │
│     ├─ Abre navegador (Puppeteer/Playwright)                   │
│     ├─ Acessa panel.web.starhome.vip                            │
│     └─ Faz login com credenciais do .env                       │
│                                                                  │
│  2. EXTRAÇÃO DE DADOS                                           │
│     ├─ Navega para lista de contas                              │
│     ├─ Configura 100 itens por página                           │
│     ├─ Percorre todas as páginas                                │
│     └─ Extrai: account, senha, dias restantes, pacote, etc     │
│                                                                  │
│  3. ATUALIZAÇÃO DO BANCO                                        │
│     ├─ Compara dados novos com existentes                      │
│     ├─ Atualiza clientes que já existem                        │
│     └─ Adiciona novos clientes                                  │
│                                                                  │
│  4. RELATÓRIO                                                   │
│     ├─ Salva JSON/CSV com dados extraídos                      │
│     └─ Envia notificação Telegram (status)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Arquivos do Scraper

| Arquivo | Função |
|---------|--------|
| `index.ts` | Entry point, parse argumentos, coordena execução |
| `login.ts` | Faz login no painel StarHome com Puppeteer |
| `scrape.ts` | Extrai dados da tabela de clientes |
| `update-db.ts` | Atualiza o banco de dados com os dados extraídos |
| `export.ts` | Exporta dados para JSON e CSV |
| `captcha.ts` | Lida com CAPTCHA (se necessário) |
| `telegram.ts` | Envia notificações para Telegram |

### Modos de Execução

```bash
# Modo busca rápida - procura um cliente específico
npm run scraper -- --search=conta123 --by=nome

# Modo sincronização completa - atualiza todos os clientes
npm run scraper -- --sync
```

---

## 🛠️ TECNOLOGIAS UTILIZADAS

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React 19 | Framework UI |
| Vite | Build tool |
| TypeScript | Tipagem |
| Tailwind CSS | Estilização |
| Motion | Animações |
| React Router | Rotas |
| Lucide React | Ícones |
| Three.js | Gráficos 3D (shader) |

### Backend
| Tecnologia | Uso |
|------------|-----|
| Express.js | Framework web |
| TypeScript | Tipagem |
| PostgreSQL | Banco de dados |
| JWT | Autenticação |
| bcryptjs | Criptografia de senhas |
| Zod | Validação de dados |
| Winston | Logs |
| Sentry | Monitoramento de erros |

### Integrações
| Serviço | Função |
|---------|--------|
| SendPulse | WhatsApp marketing |
| MercadoPago | Pagamentos |
| Telegram | Bot de gestão |
| Supabase | Banco PostgreSQL cloud |
| Vercel | Deploy do frontend |
| Render | Deploy do backend |

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### Críticos (Precisa Corrigir)

1. **Server/index.ts com 409 linhas** - O Bot Telegram está misturado no servidor
   - Arquivo muito grande, difícil de manter
   - Recomendação: Separar em `server/telegram-bot.ts`

2. **Logger.ts com 950 linhas** - Muita responsabilidade em um arquivo
   - Logs + Telegram + Webhooks tudo junto
   - Recomendação: Separar funcionalidades

3. **Sem tipagem completa** - Uso de `any` em vários pontos
   - Sem autocomplete, erros não pegos em compile
   - Recomendação: Criar interfaces para cada tabela

4. **Catch genéricos vazios** - `catch {}` em vários lugares
   - Erros silenciados, impossível debugar
   - Recomendação: Sempre logger os erros

5. **Webhook sem verificação** - payments.ts não valida assinatura
   - Qualquer um pode enviar pagamentos falsos
   - Recomendação: Verificar assinatura do MercadoPago

### Médios

6. **Scraper no mesmo processo do server** - server/routes/scraper.ts
   - Consome recursos extras
   - Recomendação: Separar em container próprio

7. **Validação Zod repetida** - Mesmo schema em múltiplos arquivos
   - Duplicação de código
   - Recomendação: Criar pasta de schemas centralizados

8. **Sem cache no frontend** - Requisições repetitivas
   - Recomendação: Implementar React Query

9. **Rate limit muito permissivo** - 50 req/15min
   - Pode gerar custos altos
   - Recomendação: Reduzir para 20 req/15min

### Baixos

10. **Sem testes automatizados** - Bugs podem passar despercebidos
11. **Sem README** - Dificuldade para novos devs
12. **Nome de arquivos inconsistente** - snake_case vs camelCase

---

## 🔧 PLANOS DE MELHORIAS

### Fase 1: Correções Críticas

1. Separar Bot Telegram do server/index.ts
2. Adicionar tipagem básica (interfaces)
3. Corrigir tratamento de erros (remover catch vazios)
4. Adicionar validação de webhook

### Fase 2: Melhorias de Segurança

5. Melhorar rate limit
6. Filtrar dados sensíveis nos logs
7. Adicionar verificação de IP

### Fase 3: Performance

8. Implementar cache no frontend (React Query)
9. Separar scraper em serviço próprio
10. Otimizar queries do banco

### Fase 4: Manutenibilidade

11. Reestruturar arquivos em módulos menores
12. Adicionar testes automatizados
13. Criar documentação completa (README)

---

## 📝 GLOSSÁRIO DE TERMOS

| Termo | Significado |
|-------|--------------|
| **JWT** | JSON Web Token - padrão para autenticação stateless |
| **bcrypt** | Algoritmo de hash de senhas (resistente a rainbow tables) |
| **Puppeteer** | Biblioteca Node.js para controlar Chrome headless |
| **Scraper** | Bot que extrai dados de sites automaticamente |
| **Webhook** | URL que recebe notificações de serviços externos |
| **Rate Limit** | Limite de requisições por período de tempo |
| **Middleware** | Função que executa entre requisição e resposta |
| **Zod** | Biblioteca de validação de schemas TypeScript |
| **Supabase** | Backend-as-a-Service com PostgreSQL |
| **SendPulse** | Plataforma de automação de mensagens |
| **MercadoPago** | Gateway de pagamentos brasileiro |
| **StarHome** | Provedor de IPTV (fornecedor de conteúdo) |
| **Lazy Loading** | Carregamento sob demanda (apenas quando necessário) |
| **OTP** | One-Time Password - senha temporária de uso único |

---

## 📞 COMO OBTER HELP

1. **Erros de autenticação**: Verificar `server/middleware/auth.ts`
2. **Problemas de banco**: Verificar `server/database.ts`
3. **Erros de pagamento**: Verificar `server/routes/payments.ts`
4. **Scraper não funciona**: Verificar `scraper/src/index.ts`
5. **Frontend não carrega**: Ver console do navegador e `src/App.tsx`

---

## 🔗 FLUXO COMPLETO DE USO

### Cenário: Novo cliente fazendo trial

```
1. Usuário acessa LandingPage
   ├─ Vê informações sobre os planos
   └─ Clica em "Teste Grátis 3 Dias"

2. TrialPage
   ├─ Preenche nome, WhatsApp, dispositivo
   └─ Clica em "Solicitar Trial"

3. Backend (orders.ts)
   ├─ Cria pedido na tabela pending_orders
   ├─ Envia link do WhatsApp para confirmar
   └─ Status: 'pending'

4. Usuário envia mensagem no WhatsApp
   └─ Admin recebe notificação

5. Admin aprova via Telegram Bot
   ├─ Comando /trials (lista trials pendentes)
   └─ Comando /aprovar <id> (aprova o trial)

6. Backend atualiza status para 'paid'
   └─ Envia WhatsApp confirmando aprovação

7. Usuário completa registro
   ├─ Cria senha
   └─ Recebe token JWT

8. DashboardPage
   ├─ Mostra informações do cliente
   └─ Exibe credenciais do app
```

### Cenário: Renovação de Plano

```
1. Usuário logado no Dashboard
   ├─ Vê dias restantes do plano
   └─ Clica em "Renovar"

2. CheckoutPage
   ├─ Seleciona novo plano
   └─ Clica em "Pagar"

3. Backend (orders.ts)
   ├─ Cria preference no MercadoPago
   └─ Retorna init_point (URL de pagamento)

4. Usuário é redirecionado para MercadoPago
   ├─ Escolhe método de pagamento
   └─ Efetua pagamento

5. MercadoPago envia webhook
   ├─ Backend recebe notificação
   ├─ Atualiza status do pedido
   └─ Envia WhatsApp confirmando

6. Usuário retorna ao site
   ├─ Redirecionado para Dashboard
   └─ Vê plano atualizado
```

---

## 📋 VARIAVEIS DE AMBIENTE NECESSARIAS

### Backend (.env)

```bash
# Banco de dados
DATABASE_URL=postgresql://...

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# SendPulse (WhatsApp)
SENDPULSE_CLIENT_ID=...
SENDPULSE_CLIENT_SECRET=...
SENDPULSE_BOT_ID=...

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=...
PAYMENT_WEBHOOK_URL=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Scraper
PANEL_URL=https://panel.web.starhome.vip
PANEL_ACCOUNT=...
PANEL_PASSWORD=...
SCRAPER_URL=...
SCRAPER_API_KEY=...

# Monitoring
SENTRY_DSN=...
```

---

*Documento criado em Abril 2026*
*Para iniciantes entenderem o projeto Reybraztech*