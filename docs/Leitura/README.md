# Docs — Guias do Projeto Reybraztech

Documentação central do projeto. Estruturada como um curso intensivo de ADS, focando em problemas reais e soluções implementadas no código.

---

## Índice

| # | Arquivo | Conteúdo |
|---|---------|----------|
| **00** | [00-visao-geral.md](./00-visao-geral.md) | Arquitetura, stack, tabelas do banco, rotas da API e estrutura de pastas. |
| **01** | [01-entendendo-o-codigo.md](./01-entendendo-o-codigo.md) | Como Frontend e Backend se comunicam via Fetch/Proxy. Analogia do restaurante. |
| **02** | [02-seguranca.md](./02-seguranca.md) | Segurança em 6 níveis: JWT, Helmet, Rate Limit, Zod, Anti-Bot, CSP. |
| **03** | [03-banco-supabase.md](./03-banco-supabase.md) | Migração do SQLite para PostgreSQL na nuvem (Supabase). |
| **04** | [04-auth-whatsapp-otp.md](./04-auth-whatsapp-otp.md) | Integração SendPulse para envio de OTP via WhatsApp. |
| **05** | [05-hospedagem-deploy.md](./05-hospedagem-deploy.md) | Deploy: Cloudflare Pages (front) + Render (back). |
| **06** | [06-roadmap.md](./06-roadmap.md) | **Roadmap atualizado** com status real de cada item, bugs conhecidos e próximos passos. |
| **07** | [07-diario-de-bordo.md](./07-diario-de-bordo.md) | Log diário de cada implementação com explicações didáticas. |
| **08** | [08-monitoramento-logs.md](./08-monitoramento-logs.md) | Como interpretar alertas do Telegram Bot, Winston e Sentry. |
| **09** | [09-analise-performance-login.md](./09-analise-performance-login.md) | Diagnóstico de performance do login: cold start, latência cross-region, bcrypt. |
| **10** | [10-recuperacao-senha-e-ux.md](./10-recuperacao-senha-e-ux.md) | UX Engineering: bypass da regra de 24h da Meta + fluxo de consumo parcial de OTP. |
| **11** | [11-compilado-melhorias-gerais.md](./11-compilado-melhorias-gerais.md) | Compilado: CSS physics, regex sanitization, DOM shield, polling limits. |
| **ZZ** | [zz-arquivo/](./zz-arquivo) | Arquivo morto: docs substituídas por versões mais atuais. |

---

## Roadmap Acadêmico

> **Dica:** Não leia como livro. Abra um guia, depois abra o arquivo mencionado no VS Code e veja exatamente como foi implementado.

```
✅ 00. Analisar Tabelas e Pastas
      ↓
✅ 01. Estudar Client-Server via Fetch/Proxy
      ↓
✅ 02. Segurança (Helmet, Rate Limit, Zod, JWT)
      ↓
✅ 03-04. APIs em Nuvem (Supabase + SendPulse)
      ↓
✅ 05. Deploy (Cloudflare + Render)
      ↓
✅ 08-09. Monitoramento e Performance
      ↓
✅ 10-11. UX Avançada (Password Recovery, DOM Shield, OTP)
      ↓
🟡 06. Roadmap — ver próximos passos pendentes
```
