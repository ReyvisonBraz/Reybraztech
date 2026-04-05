# 📋 Análise do Projeto Reybraztech

> **Última atualização:** Abril 2026

Este diretório contém a análise completa do projeto, organizada em fases para facilitar a implementação.

---

## 📁 Estrutura dos Arquivos

```
docs/analise/
├── 00-visao-geral.md      # Visão geral do projeto
├── fase-01-limpeza.md     # Fase 1: Limpeza e organização
├── fase-02-refatoracao.md # Fase 2: Refatoração de páginas
├── fase-03-melhorias.md   # Fase 3: Melhorias funcionais
├── fase-04-novas.md       # Fase 4: Novas funcionalidades
└── INDICE.md              # Este arquivo
```

---

## 🚀 Resumo das Fases

| Fase | Foco | Status | Complexidade |
|------|------|--------|--------------|
| Fase 1 | Limpeza e organização | ⏳ Pendente | Baixa |
| Fase 2 | Refatoração de páginas | ⏳ Pendente | Média |
| Fase 3 | Melhorias funcionais | ⏳ Pendente | Média/Alta |
| Fase 4 | Novas funcionalidades | ⏳ Pendente | Alta |

---

## 📊 O que foi analisado

### Frontend (src/)
- **8 páginas principais:** LandingPage, DashboardPage, AdminPage, LoginPage, RegisterPage, CheckoutPage, TrialPage, CompleteRegistrationPage
- **13+ componentes:** Navbar, Footer, ProtectedRoute, SpecialText, WebGL Shader, etc.
- **4 hooks:** useMousePosition (atual)

### Backend (server/)
- **7 rotas API:** auth, dashboard, admin, payments, orders, otp, scraper
- **3 serviços:** whatsapp, mercadopago, otp
- **2 middlewares:** auth, admin

---

## 🔧 Principais Funções Identificadas para Reutilização

### Frontend
1. `ScrollToTop` (App.tsx) → `useScrollToTop` hook
2. Animações motion (LandingPage) → `src/utils/animations.ts`
3. Fetch com token → `useApi` hook
4. Schemas Zod → `server/schemas/index.ts`
5. Log de eventos → `server/utils/events.ts`

### Backend
1. `logLoginEvent` (auth.ts) → `server/utils/events.ts`
2. Validação Zod (auth.ts) → `server/schemas/index.ts`
3. Cache OAuth2 (whatsapp.ts) → já implementado
4. Telegram Bot (index.ts) → pode isolar

---

## 📋 Como Usar

### Para começar uma fase:
1. Leia o arquivo da fase (ex: `fase-01-limpeza.md`)
2. Execute as tarefas na ordem listada
3. Teste após cada mudança
4. Commit após completar

### Para entender o projeto:
1. Comece por `00-visao-geral.md`
2. Leia a análise completa em `docs/ANALISE-PROJETO-COMPLETA.md`

---

## 🎯 Prioridades Recomendadas

### Imediato (Esta sessão)
1. ✅ Fase 1.1 - Criar useScrollToTop (5 min)
2. ✅ Fase 1.2 - Extrair animações (10 min)
3. ✅ Fase 1.4 - Centralizar schemas Zod (15 min)

### Próximas sessões
4. Fase 2.1 - Quebrar LandingPage
5. Fase 3.3 - Adicionar toast notifications
6. Fase 3.1 - Implementar refresh token

### Later
7. Fase 4.2 - Renovação automática
8. Fase 4.6 - React Query

---

## 📞 Suporte

Se tiver dúvidas sobre o código:
- Ver `docs/ANALISE-PROJETO-COMPLETA.md` para visão geral
- Ver `docs/Leitura/` para documentos de aprendizado
- Ver `docs/contexto-etapas/` para contexto histórico
