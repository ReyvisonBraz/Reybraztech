# 📂 Docs — Guias do Projeto Reybraztech

Esta pasta contém os guias técnicos e didáticos do projeto. Leia na ordem numérica abaixo para melhor compreensão.

---

## 📖 Índice dos Guias

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 00 | [00-visao-geral.md](./00-visao-geral.md) | O ponto de partida: Visão geral da arquitetura, rotas, tabelas de BD e como rodar o projeto. (Roadmap oficial). |
| 01 | [01-entendendo-o-codigo.md](./01-entendendo-o-codigo.md) | Entendendo como o código funciona sob o capô, arquivo por arquivo de forma didática. |
| 02 | [02-seguranca.md](./02-seguranca.md) | Segurança do site e banco de dados — do básico ao avançado + anti-bot (reCAPTCHA, Honeypot, XSS, CSRF). |
| 03 | [03-banco-supabase.md](./03-banco-supabase.md) | Como o banco local foi migrado para o Supabase (PostgreSQL na nuvem). |
| 04 | [04-auth-whatsapp-otp.md](./04-auth-whatsapp-otp.md) | Integração da SendPulse API — envio de OTP via WhatsApp. |
| 05 | [05-hospedagem-deploy.md](./05-hospedagem-deploy.md) | Como foi feito o deploy do frontend (Vercel/Cloudflare Pages) e do backend (Render). |
| 06 | [06-roadmap-melhorias.md](./06-roadmap-melhorias.md) | Diário de plano de melhorias futuras (Jobs Cron, Mercado Pago, Painel Admin). |

---

## 🔮 Ordem de Implementação Sugerida e Status

```
✅ 00. Visão Geral e Setup Local — FEITO
      ↓
✅ 01. Entender o Código (Didático) — FEITO
      ↓
🔴 02. Aplicar Guia 02: Segurança básica e avançada — PRÓXIMO PASSO
      ↓
✅ 03. Estudar Guia 03: Supabase (Já validado em prod) — FEITO
      ↓
✅ 04. Estudar Guia 04: SendPulse OTP WhatsApp — FEITO
      ↓
✅ 05. Guia 05: Hospedagem Deploy — FEITO
      ↓
🔵 06. Guia 06: Novas Melhorias, Painel Admin e Integrações Futuras
```
