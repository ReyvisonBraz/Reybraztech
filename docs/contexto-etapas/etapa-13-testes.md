# Etapa 13 — Testes Automatizados

**Prioridade:** 🟢 Baixa
**Status:** ❌ Pendente
**Depende de:** melhor fazer após as etapas de alta prioridade estarem estáveis

---

## Contexto

Sem testes, qualquer mudança pode quebrar algo silenciosamente. Vitest para o frontend e Jest para o backend.

---

## O que precisa ser feito

### Frontend (Vitest)
- Instalar `vitest` e `@testing-library/react`
- Testar componentes críticos: Login, Register, PasswordRecoveryModal

### Backend (Jest)
- Instalar `jest` e `supertest`
- Testar rotas críticas: auth, admin, OTP

---

## Critério de Conclusão
- [ ] `npm test` roda sem erro
- [ ] Cobertura mínima nas rotas de autenticação
- [ ] CI pode rodar os testes automaticamente
