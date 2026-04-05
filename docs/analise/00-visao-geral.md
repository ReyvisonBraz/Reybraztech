# 📋 Análise Completa do Projeto Reybraztech

> **Última atualização:** Abril 2026
> **Objetivo:** Organizar código para facilitar manutenção e novas funcionalidades

---

## 🗂️ Estrutura do Projeto

```
Reybraztech/
├── src/                          # Frontend (React + Vite + TypeScript)
│   ├── App.tsx                   # Roteamento principal
│   ├── pages/                    # Páginas principais
│   ├── components/               # Componentes reutilizáveis
│   ├── hooks/                    # Hooks customizados
│   ├── utils/                    # Funções utilitárias
│   └── lib/                      # Bibliotecas/config
│
├── server/                       # Backend (Express + Node.js)
│   ├── routes/                   # Rotas API
│   ├── services/                 # Serviços externos
│   ├── middleware/               # Middlewares auth
│   ├── utils/                    # Utilitários
│   └── scripts/                  # Scripts standalone
│
└── docs/analise/                 # Documentação de análise (este arquivo)
```

---

## 📊 Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + WhatsApp OTP (SendPulse) |
| Pagamentos | Mercado Pago |
| Monitoramento | Sentry + Winston + Telegram |

---

## 🔄 Fluxo de Usuário

```
LandingPage → RegisterPage (3 etapas + OTP)
           → LoginPage → DashboardPage
           → CheckoutPage → Pagamento → CompleteRegistrationPage → DashboardPage
           → TrialPage → Cadastro Trial → DashboardPage
```

---

## 📦 Principais Funcionalidades

1. **Autenticação:** Login com WhatsApp/Email + senha, registro com validação Zod, JWT tokens
2. **OTP WhatsApp:** Envio e verificação via SendPulse
3. **Admin:** Dashboard com listagem paginada de clientes, ativar/desativar, vincular StarHome
4. **Pagamentos:** Integração Mercado Pago (links + webhook)
5. **Scraper:** Integração StarHome para dados de clientes
6. **Telegram Bot:** Comandos /status, /sync, /buscar, /logs
7. **Monitoramento:** Sentry + Winston + Telegram alerts
8. **UI:** Modo escuro, animações motion, WebGL shader

---

## 📂 Arquivos Principais (Lidos e Analisados)

### Frontend

| Arquivo | Linhas | Função Principal |
|---------|--------|------------------|
| `src/App.tsx` | 82 | Roteamento, lazy loading, wake-up server |
| `src/pages/LandingPage.tsx` | 1063 | Landing completa |
| `src/pages/DashboardPage.tsx` | 529 | Painel do cliente |
| `src/pages/AdminPage.tsx` | 639 | Gestão de clientes |
| `src/pages/LoginPage.tsx` | ~300 | Login |
| `src/pages/RegisterPage.tsx` | ~400 | Cadastro 3 etapas |
| `src/pages/CheckoutPage.tsx` | ~350 | Escolha de plano |
| `src/components/ProtectedRoute.tsx` | 34 | Guarda de rotas |

### Backend

| Arquivo | Linhas | Função Principal |
|---------|--------|------------------|
| `server/index.ts` | 412 | Servidor Express + Telegram Bot |
| `server/routes/auth.ts` | 343 | Registro/login |
| `server/routes/dashboard.ts` | 52 | Dados cliente |
| `server/routes/admin.ts` | 131 | Gestão clientes |
| `server/routes/payments.ts` | 131 | Mercado Pago |
| `server/services/whatsapp.ts` | 242 | SendPulse API |
| `server/services/otp.ts` | 52 | OTP geração/validação |
| `server/middleware/auth.ts` | 32 | Verificação JWT |
| `server/database.ts` | 58 | Conexão Supabase |

---

## 📌 Próximos Passos

Ver os arquivos em `docs/contexto-etapas/` para ver as tarefas organizadas em fases.

### Resumo das Fases

| Fase | Foco | Status |
|------|------|--------|
| Fase 1 | Limpeza e organização | ⏳ Pendente |
| Fase 2 | Refatoração de páginas | ⏳ Pendente |
| Fase 3 | Melhorias funcionais | ⏳ Pendente |
| Fase 4 | Novas funcionalidades | ⏳ Pendente |

---

## 🔧 Comandos do Projeto

```bash
# Development
npm run dev          # Frontend na porta 3000
npm run server       # Backend na porta 3001

# Build
npm run build        # Build production
npm run lint         # TypeScript check

# Scripts extras
npm run scraper      # Executar scraper
npm run migrate:starhome  # Migração StarHome
```
