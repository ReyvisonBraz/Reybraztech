# 🎬 Reybraztech — Plataforma de Streaming por Assinatura

> Sistema completo de streaming IPTV com frontend moderno, backend seguro e integração WhatsApp.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Banco de Dados** | Supabase (PostgreSQL na nuvem) |
| **Autenticação** | JWT + OTP via WhatsApp (SendPulse API) |
| **Deploy** | Frontend → Cloudflare Pages · Backend → Render |

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js instalado e variáveis de ambiente configuradas no `.env` (veja `.env.example`).

**Terminal 1 — Backend:**
```bash
npm run server
```
> Saída esperada: `🚀 Servidor Reybraztech Online! → http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
npm run dev
```
> Acesse: `http://localhost:3000`

---

## 📂 Documentação

Toda a documentação técnica e didática está na pasta [`docs/`](./docs/README.md), numerada de 00 a 07.

Leia o [índice dos guias](./docs/README.md) para começar.

---

## 📌 Status Atual

- ✅ Frontend com 6 páginas (Landing, Login, Register, Checkout, Dashboard, Admin)
- ✅ Backend Express com Helmet, Rate Limit e validação Zod
- ✅ Banco Supabase (PostgreSQL) em produção
- ✅ OTP WhatsApp via SendPulse
- ✅ Deploy: Cloudflare Pages + Render
- ✅ Painel Admin (rota oculta `/admlogin`)
- 🟡 Ações admin (ativar/inativar clientes) — próximo passo
- 🔵 Mercado Pago (pagamento automático) — futuro
