# Guia de Configuração de Env Vars — Reybraztech

## 📋 Resumo Rápido

Você tem **3 serviços** e precisa configurar env vars em **3 painéis diferentes**.

---

## 🔑 Passo 1: Gerar a SCRAPER_API_KEY (só precisa fazer 1 vez)

Abra o terminal e rode:
```bash
openssl rand -hex 32
```
**Copie o resultado.** Essa chave vai somente nos dois serviços server-side:
backend e scraper. Ela nunca deve ser configurada no frontend.

---

## 🎯 Passo 2: Configurar cada painel

### RENDER → BACKEND (servidor principal)

| Variável | Valor | Obrigatória? |
|----------|-------|:---:|
| `JWT_SECRET` | Chave secreta longa para tokens | ✅ |
| `DATABASE_URL` | Connection string do Supabase | ✅ |
| `SCRAPER_API_KEY` | A chave gerada no Passo 1 | ✅ |
| `SCRAPER_URL` | `https://reybraztech-scraper.onrender.com` | ✅ |
| `TELEGRAM_BOT_TOKEN` | Token do @BotFather | Sim* |
| `TELEGRAM_CHAT_ID` | Seu chat ID | Sim* |
| `SENDPULSE_CLIENT_ID` | Client ID SendPulse | Sim* |
| `SENDPULSE_CLIENT_SECRET` | Client Secret SendPulse | Sim* |
| `SENDPULSE_BOT_ID` | Bot ID SendPulse | Sim* |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token MP | Sim* |
| `FRONTEND_URL` | `https://reybraztech.vercel.app` | Não |
| `SENTRY_DSN` | DSN do Sentry | Não |
| `PORT` | `3001` | Não |

*Sim se usa essas funcionalidades

---

### RENDER → SCRAPER (serviço Puppeteer)

| Variável | Valor | Obrigatória? |
|----------|-------|:---:|
| `DATABASE_URL` | **MESMA** do backend (Supabase) | ✅ |
| `SCRAPER_API_KEY` | **MESMA** chave do backend | ✅ |
| `PANEL_ACCOUNT` | Seu usuário StarHome | ✅ |
| `PANEL_PASSWORD` | Sua senha StarHome | ✅ |
| `TELEGRAM_BOT_TOKEN` | **MESMO** do backend | Sim* |
| `TELEGRAM_CHAT_ID` | **MESMO** do backend | Sim* |
| `PANEL_URL` | `https://panel.web.starhome.vip` | Não (já tem default) |
| `HEADLESS` | `true` | Não (já tem default) |
| `ITEMS_PER_PAGE` | `100` | Não (já tem default) |
| `PAGE_LIMIT` | `0` | Não (já tem default) |
| `TWO_CAPTCHA_API_KEY` | Key do 2Captcha | Não |
| `NODE_ENV` | `production` | ✅ (já está no render.yaml) |
| `PUPPETEER_CACHE_DIR` | `/opt/render/.cache/puppeteer` | ✅ (já está no render.yaml) |

---

### VERCEL → FRONTEND (React app)

| Variável | Valor | Obrigatória? |
|----------|-------|:---:|
| `VITE_API_URL` | Deixe **vazio** em produção | Não |
| `VITE_SENTRY_DSN` | DSN do Sentry browser | Não |

> **Segurança:** nunca configure tokens, senhas ou chaves com prefixo
> `VITE_`. Essas variáveis podem ser incorporadas ao JavaScript público do
> navegador. O frontend acessa o scraper somente por rotas autenticadas do
> backend; `SCRAPER_API_KEY` pertence exclusivamente ao backend e ao scraper.

### Migração de instalações antigas

Se `VITE_SCRAPER_API_KEY` já foi configurada ou publicada anteriormente,
considere `SCRAPER_API_KEY` comprometida:

1. remova `VITE_SCRAPER_API_KEY` de development, preview e production na Vercel;
2. gere uma nova `SCRAPER_API_KEY`;
3. configure o mesmo novo valor no backend e no scraper, sem expô-lo em logs;
4. faça redeploy dos dois serviços e valide a comunicação backend → scraper;
5. remova também `VITE_SCRAPER_API_KEY` dos arquivos `.env` locais.

---

## 🔗 O que é compartilhado entre serviços

| Variável | Backend | Scraper | Frontend |
|----------|:---:|:---:|:---:|
| `SCRAPER_API_KEY` | ✅ | ✅ (mesma) | ❌ |
| `DATABASE_URL` | ✅ | ✅ (mesma) | ❌ |
| `TELEGRAM_BOT_TOKEN` | ✅ | ✅ (mesmo) | ❌ |
| `TELEGRAM_CHAT_ID` | ✅ | ✅ (mesmo) | ❌ |

---

## 📁 Arquivos de referência no projeto

| Arquivo | Para quê |
|---------|----------|
| `.env.example` | Template completo de TODAS as vars |
| `.env.render-backend` | Lista pronta pro painel Render (Backend) |
| `.env.render-scraper` | Lista pronta pro painel Render (Scraper) |
| `.env.vercel-frontend` | Lista pronta pro painel Vercel (Frontend) |

---

## ⚠️ Checklist antes de deploy

- [ ] `SCRAPER_API_KEY` configurada no Render Backend
- [ ] `SCRAPER_API_KEY` configurada no Render Scraper (**mesma chave**)
- [ ] Nenhuma chave ou token configurado no Vercel com prefixo `VITE_`
- [ ] `DATABASE_URL` configurada no Render Backend
- [ ] `DATABASE_URL` configurada no Render Scraper (**mesma string**)
- [ ] `PANEL_ACCOUNT` e `PANEL_PASSWORD` no Render Scraper
- [ ] `TELEGRAM_BOT_TOKEN` no Render Backend
- [ ] `TELEGRAM_BOT_TOKEN` no Render Scraper
- [ ] Redeploy do backend e do scraper após alterar `SCRAPER_API_KEY`
