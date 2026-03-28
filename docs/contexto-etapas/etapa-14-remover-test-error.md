# Etapa 14 — Remover `/api/test-error`

**Prioridade:** 🟢 Baixa
**Status:** ❌ Pendente
**Depende de:** nada (5 minutos de trabalho)

---

## Contexto

Existe um endpoint `GET /api/test-error` que lança uma exceção propositalmente para testar o Sentry. Não deve existir em produção — qualquer um pode chamar e gerar alertas falsos.

---

## Onde remover
- Localizar `test-error` em `server/index.ts` ou `server/routes/`
- Deletar o bloco da rota

---

## Critério de Conclusão
- [ ] `GET /api/test-error` retorna 404
- [ ] Sentry ainda funciona para erros reais
