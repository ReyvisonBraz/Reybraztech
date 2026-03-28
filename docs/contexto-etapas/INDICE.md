# Contexto das Etapas — Reybraztech

> Use este índice para retomar qualquer etapa sem perder o fio.
> Cada arquivo contém: o que fazer, arquivos envolvidos, passo a passo e critério de conclusão.

**Onde paramos:** Day 12 — Etapa 01 (Ações do Admin)

---

## ⚠️ Correções importantes registradas

- O campo de status no banco é `status TEXT ('Ativo'/'Inativo')`, **não** um boolean `active`
- Ao ativar um cliente, deve-se também informar `days_remaining` (senão o job inativa imediatamente)
- A renovação real é feita no painel da **Starhome** (IPTV). A automação disso está nas Etapas 00-B e 16 — **não implementar sem mapear antes**

---

## Etapas Pendentes

### 🔴 Alta Prioridade
| # | Etapa | Arquivo | Status |
|---|-------|---------|--------|
| 00-B | Mapear fluxo de renovação na Starhome (login/scraping já prontos) | [etapa-00B-mapear-starhome.md](etapa-00B-mapear-starhome.md) | 🟡 Parcial — falta só o fluxo de renovação |
| 1 | Ações do Admin (ativar/desativar + dias) | [etapa-01-admin-acoes.md](etapa-01-admin-acoes.md) | ❌ Pendente |
| 2 | Paginação no Admin | [etapa-02-admin-paginacao.md](etapa-02-admin-paginacao.md) | ❌ Pendente |
| 3 | Job de contagem regressiva (`days_remaining`) | [etapa-03-job-countdown.md](etapa-03-job-countdown.md) | ❌ Pendente |
| 4 | Exibir `days_remaining` no Dashboard | [etapa-04-dashboard-dias.md](etapa-04-dashboard-dias.md) | ❌ Pendente |
| 5 | Alertas de vencimento por WhatsApp | [etapa-05-alertas-whatsapp.md](etapa-05-alertas-whatsapp.md) | ❌ Pendente |
| 16 | Automação de renovação na Starhome | [etapa-16-automacao-starhome.md](etapa-16-automacao-starhome.md) | ❌ Pendente — aguarda 00-B |

### 🟡 Média Prioridade
| # | Etapa | Arquivo | Status |
|---|-------|---------|--------|
| 6 | Checkout Mercado Pago (webhook) | [etapa-06-mercadopago.md](etapa-06-mercadopago.md) | 🟡 Parcial |
| 7 | Refresh Token | [etapa-07-refresh-token.md](etapa-07-refresh-token.md) | ❌ Pendente |
| 8 | Criptografia AES do `app_password` | [etapa-08-aes-password.md](etapa-08-aes-password.md) | ❌ Pendente |
| 9 | Rate limit no envio de OTP | [etapa-09-rate-limit-otp.md](etapa-09-rate-limit-otp.md) | ❌ Pendente |
| 10 | CORS via variáveis de ambiente | [etapa-10-cors-env.md](etapa-10-cors-env.md) | ❌ Pendente |

### 🟢 Baixa Prioridade
| # | Etapa | Arquivo | Status |
|---|-------|---------|--------|
| 11 | Página 404 | [etapa-11-pagina-404.md](etapa-11-pagina-404.md) | ❌ Pendente |
| 12 | SEO e meta tags (Open Graph) | [etapa-12-seo.md](etapa-12-seo.md) | ❌ Pendente |
| 13 | Testes automatizados | [etapa-13-testes.md](etapa-13-testes.md) | ❌ Pendente |
| 14 | Remover `/api/test-error` | [etapa-14-remover-test-error.md](etapa-14-remover-test-error.md) | ❌ Pendente |
| 15 | Graceful Shutdown | [etapa-15-graceful-shutdown.md](etapa-15-graceful-shutdown.md) | ❌ Pendente |

---

## Bugs Conhecidos (corrigir junto com a etapa relevante)
| Bug | Arquivo | Severidade |
|-----|---------|------------|
| `setStep(2); setStep(3)` — chamada duplicada | `src/components/PasswordRecoveryModal.tsx` ~linha 98 | Baixa |
| `MERCADO_PAGO_ACCESS_TOKEN \|\| ''` — falha silenciosa | `server/services/mercadopago.ts` | Média |
| Debug logs em produção no `startTelegramBot()` | `server/utils/logger.ts` ~linhas 128-131 | Baixa |
