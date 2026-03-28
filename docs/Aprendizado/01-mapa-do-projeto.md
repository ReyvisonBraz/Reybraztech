# Mapa do Projeto

## O que é este projeto?

Uma **plataforma SaaS de streaming por assinatura** (IPTV).
Clientes pagam para assistir conteúdo. Você gerencia tudo: cadastro, pagamento, acesso, renovação.

---

## Os 3 grandes módulos

```
┌─────────────────────────────────────────────────────────────┐
│                     REYBRAZTECH                             │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   FRONTEND   │    │   BACKEND    │    │   SCRAPER    │  │
│  │  (React/TS)  │◄──►│ (Express/TS) │    │(Puppeteer/TS)│  │
│  │  porta 3000  │    │  porta 3001  │    │  roda manual │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
│                      ┌──────▼───────┐                       │
│                      │   SUPABASE   │                       │
│                      │ (PostgreSQL) │                       │
│                      │   na nuvem   │                       │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## O que cada módulo faz

### Frontend (`src/`)
A interface que o usuário vê no navegador.
- Página de marketing (LandingPage)
- Tela de cadastro com verificação via WhatsApp (3 etapas)
- Tela de login (senha ou código OTP)
- Painel do cliente (mostra dados e assinatura)
- Painel admin (gerencia todos os clientes)

### Backend (`server/`)
O servidor que processa tudo nos bastidores.
- Recebe as requisições do frontend
- Valida dados, autentica usuários
- Lê e escreve no banco de dados
- Envia mensagens WhatsApp (OTP, alertas)
- Processa pagamentos (Mercado Pago)

### Scraper (`scraper/`)
Um robô independente, não conectado ao frontend/backend.
- Faz login automático no painel StarHome (sistema de IPTV externo)
- Extrai dados dos clientes de lá
- Renova serviços automaticamente
- Usa Puppeteer (controla um navegador real por baixo)

---

## Fluxo completo de um cliente novo

```
1. Cliente acessa o site (LandingPage)
2. Clica em "Assinar" → vai para CheckoutPage (escolhe o plano)
3. Clica em "Cadastrar" → vai para RegisterPage
   3a. Preenche nome, WhatsApp, dispositivo
   3b. Envia mensagem para o bot WhatsApp (abre janela de 24h)
   3c. Recebe código OTP no WhatsApp → confirma
   3d. Define senha e e-mail (opcional)
4. Backend cria o registro no banco (tabela clients)
5. Cliente faz login → recebe token JWT
6. Acessa o dashboard com seus dados
7. Quando renovar → admin ativa via painel admin
8. Scraper renova no painel StarHome automaticamente (futuro)
```

---

## Fluxo de autenticação simplificado

```
Browser                  Backend               Banco
  │                         │                    │
  │── POST /api/auth/login ─►│                    │
  │   {whatsapp, password}   │── SELECT clients ─►│
  │                         │◄─ {hash, dados} ───│
  │                         │ (bcrypt.compare)    │
  │◄─ {token: "eyJ..."} ────│                    │
  │                         │                    │
  │ (salva no localStorage) │                    │
  │                         │                    │
  │── GET /api/dashboard ──►│                    │
  │   Authorization: Bearer │                    │
  │                         │ (verifica JWT)      │
  │◄─ {dados do cliente} ───│                    │
```

---

## Estrutura de arquivos — resumo rápido

```
Reybraztech/
├── src/              ← Frontend (React)
│   ├── pages/        ← Cada página do site
│   ├── components/   ← Peças reutilizáveis
│   ├── config/       ← URL da API
│   └── hooks/        ← Lógica React reutilizável
│
├── server/           ← Backend (Express)
│   ├── routes/       ← Endpoints da API (/auth, /admin, /otp...)
│   ├── middleware/   ← Verificações (JWT, admin)
│   ├── services/     ← Integrações externas (WhatsApp, Mercado Pago)
│   └── scripts/      ← Utilitários de manutenção (make-admin, etc)
│
├── scraper/          ← Robô (Puppeteer)
│   └── src/
│       ├── login.ts  ← Login no painel StarHome
│       ├── scrape.ts ← Extrai dados dos clientes
│       ├── renew.ts  ← Renova serviços
│       ├── captcha.ts← Resolve captchas (2captcha API)
│       └── telegram.ts← Notificações e comandos via Telegram
│
├── docs/             ← Documentação
│   ├── Leitura/      ← Referência técnica
│   ├── contexto-etapas/ ← Backlog de implementação
│   └── Aprendizado/  ← Esta pasta
│
├── .env              ← Variáveis de ambiente (nunca commita!)
├── package.json      ← Dependências do frontend + backend
└── scraper/package.json ← Dependências do scraper
```
