# 📂 Docs — Guias do Projeto Reybraztech

Esta pasta contém os guias técnicos e didáticos do projeto. Leia na ordem abaixo para melhor compreensão.

---

## 📖 Índice dos Guias

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 1 | [1-supabase-setup.md](./1-supabase-setup.md) | Como migrar do SQLite para o Supabase (PostgreSQL na nuvem) |
| 2 | [2-sendpulse-whatsapp.md](./2-sendpulse-whatsapp.md) | Integração da SendPulse API — envio de OTP via WhatsApp (API oficial) para login, cadastro e recuperação de senha |
| 3 | [3-seguranca.md](./3-seguranca.md) | Segurança do site e banco de dados — do básico ao avançado + anti-bot (reCAPTCHA, Honeypot, XSS, CSRF) |
| 4 | [4-entendendo-o-projeto.md](./4-entendendo-o-projeto.md) | Entendendo o projeto por partes, de forma didática |
| 5 | [5-melhorias-e-integracoes.md](./5-melhorias-e-integracoes.md) | Painel Admin, Automações (Jobs) e Integração Mercado Pago |

---

## 🔮 Ordem de Implementação Sugerida

```
1. Ler o Guia 4 (entender o projeto todo)
      ↓
2. Aplicar o Guia 3 (segurança básica — não custa nada e é crítico)
      ↓
3. Implementar o Guia 1 (Supabase — banco em produção)
      ↓
4. Implementar o Guia 2 (SendPulse — OTP WhatsApp)
      ↓
5. Seguir o Guia 5 (Novas Melhorias e Integrações)
```

---

> Para a visão geral do projeto e roadmap de melhorias, veja: [`guia-do-projeto.md`](../guia-do-projeto.md)
