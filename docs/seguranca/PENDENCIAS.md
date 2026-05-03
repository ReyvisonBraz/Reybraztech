# Pendências de Segurança — Reybraztech

> Correções que precisam de mais planejamento antes de implementar.

---

## 1. 🔴 CRÍTICO — Senhas de clientes em JSONs rastreados no git

**Arquivos afetados:**
- `docs/clients_2026-04-03_15h37.json`
- `docs/clients_2026-04-01_02h25.json`
- `docs/clients_2026-03-28_16h41.json`
- `docs/Leitura/clients_2026-03-26_14h43.json`

**Problema:** Esses arquivos contêm centenas de senhas reais de clientes (`"password": "xxxxxx"`) e estão no histórico do git. Qualquer pessoa com acesso ao repositório pode ver.

**Como resolver:**
1. Adicionar `docs/clients_*.json` e `docs/Leitura/clients_*.json` ao `.gitignore`
2. Remover do histórico com `git filter-branch` ou [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
3. Alternativa: rotacionar todas as senhas do painel StarHome

**Risco:** ALTO — senhas reais de produção expostas


## 2. 🟠 ALTO — JWT armazenado em localStorage (vulnerável a XSS)

**Arquivos:** `LoginPage.tsx`, `RegisterPage.tsx`, `TrialPage.tsx`, `CompleteRegistrationPage.tsx`, `DashboardPage.tsx`

**Problema:** O JWT é salvo em `localStorage`, acessível a qualquer JavaScript na mesma origem. Se existir XSS no site, atacante rouba o token.

**Como resolver:**
1. Backend: setar JWT em cookie `httpOnly` + `secure` + `sameSite: 'strict'`
2. Backend: adicionar proteção CSRF (token/cabeçalho customizado)
3. Frontend: remover `localStorage.setItem('reyb_token', ...)` de todas as páginas
4. Frontend: adicionar `credentials: 'include'` em todos os `fetch()`
5. Middleware: ler token do cookie em vez do header `Authorization`

**Risco:** ALTO — se houver XSS, todas as contas são comprometidas


## 3. 🟠 ALTO — Logout não invalida token no servidor

**Arquivo:** `server/routes/auth.ts`

**Problema:** Não existe rota `/logout`. Quando usuário clica "Sair", só remove o token do localStorage. O JWT continua válido por até 8h. Se o token foi roubado antes do logout, o atacante mantém acesso.

**Como resolver:**
- **Opção A (simples):** Criar tabela `token_blacklist` no banco. No logout, inserir o `jti` do token. Middleware verifica blacklist.
- **Opção B (robusta):** Implementar refresh tokens. Access token expira em 15min, refresh token (httpOnly cookie) dura 7 dias. No logout, invalidar o refresh token.

**Risco:** ALTO — token roubado permanece válido


## 4. 🟡 MÉDIO — Telegram: injeção de HTML via nome do cliente

**Arquivos:** `server/index.ts:90-97`, `server/routes/auth.ts:88-94`, `server/routes/dashboard.ts:88-94`, `server/utils/logger.ts:56-60`

**Problema:** Nomes de clientes (ex: `</b><script>alert(1)</script><b>`) são interpolados em mensagens HTML do Telegram sem sanitização, podendo quebrar a formatação.

**Como resolver:**
1. Criar função `sanitizeTelegram(text: string): string` que escapa `<`, `>`, `&`
2. Aplicar em todos os lugares onde dados de usuário são interpolados em `parse_mode: 'HTML'`

**Risco:** BAIXO (Telegram só permite tags limitadas, mas pode quebrar notificações)


## 5. 🟡 MÉDIO — Logs do Telegram expõem conteúdo de mensagens

**Arquivo:** `server/utils/logger.ts:140, 230`

**Problema:** Os primeiros 50-200 caracteres de cada mensagem Telegram são logados, podendo conter dados sensíveis.

**Como resolver:**
1. Remover ou truncar logs que mostram conteúdo de mensagens
2. Logar apenas metadados (tipo de comando, não o texto)

**Risco:** BAIXO (logs são locais/vercel, mas expõem dados em caso de vazamento de logs)


## 6. 🟡 MÉDIO — Enumeração de contas via OTP

**Arquivo:** `server/routes/otp.ts:35-37`

**Problema:** `/api/otp/send` retorna 404 se WhatsApp não existe. Atacante pode enumerar contas registradas.

**Como resolver:**
- Sempre retornar sucesso (200) mesmo que o número não exista, mas só enviar WhatsApp se existir.
- Mensagem: `"Se o número estiver cadastrado, você receberá um código."`

**Risco:** MÉDIO — vazamento de base de usuários


## 7. 🟡 MÉDIO — Timing attack no login

**Arquivo:** `server/routes/auth.ts:173-180`

**Problema:** `bcrypt.compare()` só roda se usuário existe. Diferença de ~200ms permite atacante distinguir "usuário existe" de "não existe".

**Como resolver:**
- Sempre rodar `bcrypt.compare()` mesmo quando usuário não existe (usar um hash dummy)

**Risco:** BAIXO (requer medição precisa de latência de rede)


## 8. 🟢 BAIXO — Checkbox "Lembrar" não funciona

**Arquivo:** `src/pages/LoginPage.tsx:603`

**Problema:** O checkbox "Lembrar" é puramente decorativo — não tem `onChange` e nunca é lido.

**Como resolver:**
- Se implementar httpOnly cookies (item 2), usar cookie persistente quando checkbox marcado
- Ou remover o checkbox para não confundir o usuário

---

## Checklist de deploy

- [ ] Rodar `vercel --prod` após cada correção aplicada
- [ ] Testar login/logout após mudanças de auth
- [ ] Verificar se admin console continua funcionando (scraper proxy)
- [ ] Verificar se WhatsApp OTP continua funcionando (rate limit)
- [ ] Rotacionar `JWT_SECRET` e `SCRAPER_API_KEY` periodicamente
