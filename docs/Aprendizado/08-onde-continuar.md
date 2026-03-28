# Onde Continuar — Roteiro de Aprendizado e Implementação

> Este arquivo conecta o que você aprendeu com o que precisa ser feito.
> Leia depois de ter passado pelos outros arquivos desta pasta.

---

## Estado atual do projeto (Março 2026)

O que está funcionando:
- Frontend completo (landing, checkout, registro, login, dashboard, admin básico)
- Backend com auth (JWT + OTP), rotas de dashboard e admin (listagem)
- Banco de dados estruturado (clients, payments, otp_tokens)
- Monitoramento (Winston, Sentry, Telegram)
- Deploy (Cloudflare + Render + Vercel)
- Scraper com login, extração e renovação no StarHome

O que ainda falta (em ordem de prioridade):
- Ações no admin (ativar/desativar clientes, definir dias)
- Paginação no admin
- Job automático de contagem regressiva de dias
- Dashboard mostrando os dias restantes
- Alertas de vencimento via WhatsApp
- Integração real com Mercado Pago (webhook)
- Refresh Token (JWT expira em 2h atualmente)

---

## Roteiro sugerido para aprender implementando

### Fase 1 — Entender o que já existe (1-2 semanas)
Objetivo: conseguir rodar, ler e entender cada parte sem medo.

```
Semana 1:
  [ ] Rode o projeto localmente (npm run server + npm run dev)
  [ ] Leia src/App.tsx e entenda todas as rotas
  [ ] Abra o DevTools (F12) e veja as requisições ao fazer login
  [ ] Leia server/routes/auth.ts linha por linha
  [ ] Leia server/middleware/auth.ts — entenda o JWT

Semana 2:
  [ ] Leia server/routes/admin.ts — entenda a query SQL
  [ ] Abra o Supabase Dashboard e veja a tabela clients
  [ ] Rode o scraper com HEADLESS=false e veja o robô em ação
  [ ] Leia scraper/src/login.ts — entenda o fluxo de automação
```

---

### Fase 2 — Primeira implementação real (Etapa 01)
**O que implementar:** Ações do Admin (ativar/desativar clientes)

**Por que começar aqui:** é a etapa mais próxima do que já existe. Você adiciona rotas no backend e botões no frontend — sem novos serviços externos.

**Arquivo guia:** `docs/contexto-etapas/etapa-01-admin-acoes.md`

**Conceitos que você vai praticar:**
- Adicionar nova rota no Express (PATCH `/api/admin/clients/:id/status`)
- Fazer UPDATE no banco com SQL
- Adicionar botão no React que chama essa rota
- Gerenciar estado de loading/erro no frontend

**Armadilha conhecida:** ao ativar um cliente, defina também `days_remaining`.
Se deixar 0, o job de contagem regressiva vai inativar o cliente imediatamente.

---

### Fase 3 — Paginação e Jobs (Etapas 02 e 03)
**Etapa 02:** Paginação no admin — aprende `LIMIT`, `OFFSET`, `COUNT` em SQL e como paginar no frontend.

**Etapa 03:** Job de contagem regressiva — aprende `node-cron` (tarefas agendadas), roda todo dia à meia-noite e faz `days_remaining = days_remaining - 1` para cada cliente ativo.

---

### Fase 4 — Dashboard e Alertas (Etapas 04 e 05)
**Etapa 04:** Exibir dias restantes no dashboard do cliente — muito simples, já está no banco, só falta mostrar.

**Etapa 05:** Alertas de vencimento — combina o job (Etapa 03) com o WhatsApp (já implementado). Quando `days_remaining <= 3`, envia mensagem de aviso.

---

### Fase 5 — Automação completa (Etapa 16)
**O que é:** Integrar o scraper ao backend. Quando admin clicar em "Renovar", o sistema roda o `renewClient()` do scraper automaticamente.

**Pré-requisito:** entender bem o scraper (Etapa 00-B).

---

## Conceitos para estudar em paralelo

### Se você não conhece:

**HTTP e APIs REST**
- O que são métodos GET, POST, PATCH, DELETE
- O que são status codes (200, 201, 400, 401, 403, 404, 500)
- O que são headers (Content-Type, Authorization)

**SQL básico**
- SELECT, WHERE, ORDER BY, LIMIT
- INSERT INTO ... VALUES
- UPDATE ... SET ... WHERE
- JOIN (para quando precisar cruzar clients com payments)

**JavaScript assíncrono**
- O que é `async/await`
- O que é uma Promise
- Por que `await` e o que acontece sem ele

**TypeScript básico**
- O que são interfaces e types
- O que são generics simples (`Array<string>`)
- O que significa `!` no final (non-null assertion)

---

## Onde encontrar respostas

| Dúvida | Onde buscar |
|--------|------------|
| Como X funciona no projeto | `docs/Leitura/` — referência técnica completa |
| O que implementar a seguir | `docs/contexto-etapas/INDICE.md` |
| Como fazer em Express/React | Documentação oficial (expressjs.com, react.dev) |
| Erro específico | Copie a mensagem e busque no Google/Stack Overflow |
| Conceito de TypeScript | typescriptlang.org/docs |
| SQL | postgresql.org/docs ou sqlzoo.net |

---

## Uma dica final

Antes de implementar qualquer coisa nova, responda:
1. **O que exatamente preciso fazer?** (seja específico)
2. **Quais arquivos vou modificar?** (liste todos)
3. **O banco precisa mudar?** (nova coluna, nova tabela?)
4. **Como vou testar?** (o que espero ver funcionando?)

Quando você conseguir responder essas 4 perguntas com clareza, a implementação é só execução.
