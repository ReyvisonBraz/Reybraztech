# 🗺️ Guia 06 — Roadmap do Projeto

> **Última atualização:** 27 de Março de 2026
> Este é o roadmap vivo do projeto. Cada item tem seu status real baseado no código implementado.

---

## 📊 Diagnóstico Atual

### O que JÁ EXISTE e funciona:
| Item | Onde | Status |
|------|------|--------|
| Frontend com 6 páginas (Landing, Login, Register, Checkout, Dashboard, Admin) | `src/pages/` | ✅ Produção |
| Backend Express com segurança em camadas | `server/index.ts` | ✅ Produção |
| Banco Supabase (PostgreSQL) na nuvem | `server/database.ts` | ✅ Produção |
| Autenticação JWT + OTP WhatsApp (SendPulse) | `server/routes/auth.ts`, `server/services/` | ✅ Produção |
| Painel Admin com listagem de clientes | `server/routes/admin.ts`, `src/pages/AdminPage.tsx` | ✅ Produção |
| Recuperação de senha com UX avançada | `src/components/PasswordRecoveryModal.tsx` | ✅ Produção |
| Segurança: Helmet, Rate Limit, Zod, JWT validado | `server/index.ts`, `server/routes/auth.ts` | ✅ Produção |
| Monitoramento: Winston + Sentry + Telegram Bot | `server/utils/logger.ts` | ✅ Produção |
| Deploy: Cloudflare Pages (front) + Render (back) | — | ✅ Produção |

---

## 🗓️ Roadmap — Visão Geral

### 🔴 Prioridade Alta — Essencial para o negócio

| # | Melhoria | Status | Detalhes |
|---|----------|--------|----------|
| 1 | **Ações do Admin (ativar/desativar clientes)** | ❌ Pendente | Rota `PATCH /api/admin/clients/:id/status` + botões na tabela. Parou no Day 12 do diário. |
| 2 | **Paginação no Admin** | ❌ Pendente | Listagem atual carrega todos os clientes de uma vez. Inviável com centenas de usuários. |
| 3 | **Job de contagem regressiva (`days_remaining`)** | ❌ Pendente | Instalar `node-cron`, criar `server/jobs/subscription.ts`. Decrementar diariamente e inativar vencidos. |
| 4 | **Exibir `days_remaining` no Dashboard** | ❌ Pendente | O campo existe no banco mas não aparece para o cliente. Adicionar barra de progresso visual. |
| 5 | **Alertas de vencimento por WhatsApp** | ❌ Pendente | Mensagem automática quando restam 3 dias. Usar template do SendPulse ou Evolution API. |

### 🟡 Prioridade Média — UX, robustez e pagamentos

| # | Melhoria | Status | Detalhes |
|---|----------|--------|----------|
| 6 | **Checkout Mercado Pago (webhook)** | 🟡 Parcial | Links de pagamento existem, mas webhook de confirmação tem TODO no código. Falta validar assinatura e ativar cliente automaticamente. |
| 7 | **Refresh Token** | ❌ Pendente | Token JWT expira e o usuário é deslogado sem aviso. Implementar refresh silencioso. |
| 8 | **Criptografia AES do `app_password`** | ❌ Pendente | Campo salvo em texto puro. Deve ser criptografado com AES (reversível, pois precisa descriptografar para exibir). |
| 9 | **Rate limit no envio de OTP** | ❌ Pendente | Endpoint `/api/otp/send` não tem rate limit próprio. Risco de spam de mensagens WhatsApp. |
| 10 | **CORS via variáveis de ambiente** | ❌ Pendente | Origens permitidas estão hardcoded no `server/index.ts`. Devem vir do `.env`. |

### 🟢 Prioridade Baixa — Profissionalismo e escala

| # | Melhoria | Status | Detalhes |
|---|----------|--------|----------|
| 11 | **Página 404** | ❌ Pendente | URLs inválidas caem no vazio. Criar página elegante com redirecionamento. |
| 12 | **SEO e meta tags (Open Graph)** | ❌ Pendente | Sem prévia ao compartilhar link no WhatsApp. Adicionar og:image, og:title, og:description. |
| 13 | **Testes automatizados** | ❌ Pendente | Vitest (frontend) e Jest (backend) para evitar regressões. |
| 14 | **Remover endpoint `/api/test-error`** | ❌ Pendente | Endpoint de teste que lança exceção. Não deve existir em produção. |
| 15 | **Graceful shutdown** | ❌ Pendente | Servidor não trata SIGTERM/SIGINT. Importante para deploys sem perda de conexão. |

---

## ✅ Checklist de Progresso Histórico

### Semana 1 — Segurança Básica (Concluída)
- [x] Dia 1: JWT_SECRET seguro no `.env`
- [x] Dia 2: Validação de variáveis de ambiente
- [x] Dia 3: Helmet + Rate Limit
- [x] Dia 4: Proxy do Vite
- [x] Dia 5: Validação Zod no registro

### Semana 2 — Frontend + Git (Concluída)
- [x] Dia 6: ProtectedRoute com verificação de expiração
- [x] Dia 7: `.gitignore` revisado e limpeza de `.db` do Git

### Semana 3 — Painel Admin (Parcial)
- [x] Dia 8: Coluna `is_admin` no banco (PostgreSQL)
- [x] Dia 9: Middleware admin (JWT + is_admin)
- [x] Dia 10: Rota GET `/api/admin/clients`
- [x] Dia 11: Frontend AdminPage com tabela e rota oculta `/admlogin`
- [ ] Dia 12: Ações ativar/inativar clientes

### Semana Especial — Integrações e UX (Concluída)
- [x] Migração para Supabase (PostgreSQL) em produção
- [x] Integração SendPulse (OTP WhatsApp)
- [x] Recuperação de senha com deep linking WhatsApp
- [x] OTP com parâmetro `consume` opcional
- [x] Monitoramento: Winston + Sentry + Telegram Bot
- [x] Deploy Cloudflare Pages + Render

### Semana 4 — Automação (Não iniciada)
- [ ] Dia 13: Job node-cron para countdown de `days_remaining`
- [ ] Dia 14: Exibir dias restantes no dashboard do cliente

### Semana 5+ — Integrações Avançadas (Não iniciada)
- [ ] Mercado Pago (webhook de pagamento)
- [ ] Refresh Token
- [ ] Criptografia AES

---

## 🐛 Bugs Conhecidos

| Bug | Onde | Severidade |
|-----|------|------------|
| `setStep(2); setStep(3)` — chamada duplicada inútil | `PasswordRecoveryModal.tsx` ~linha 98 | Baixa |
| `MERCADO_PAGO_ACCESS_TOKEN \|\| ''` — falha silenciosa se não configurado | `server/services/mercadopago.ts` | Média |
| Debug logs no `startTelegramBot()` deixados em produção | `server/utils/logger.ts` ~linhas 128-131 | Baixa |

---

> **Onde você parou:** Day 12 — Botões de ação no painel admin. Este é o próximo passo natural antes de avançar para automação (Semana 4).
