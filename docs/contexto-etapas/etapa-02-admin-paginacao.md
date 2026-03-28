# Etapa 02 — Paginação no Admin

**Prioridade:** 🔴 Alta
**Status:** ❌ Pendente
**Depende de:** Etapa 01 (recomendado fazer em sequência)

---

## Contexto

A rota `GET /api/admin/clients` retorna **todos os clientes de uma vez**. Com centenas de usuários isso vai travar o banco e a UI. Precisa de paginação.

---

## O que precisa ser feito

### Backend
- Arquivo: `server/routes/admin.ts`
- Modificar a rota `GET /api/admin/clients` para aceitar query params: `?page=1&limit=20`
- Usar `LIMIT` e `OFFSET` no SQL
- Retornar junto o total de registros para calcular páginas: `{ data: [...], total: 150, page: 1, limit: 20 }`

### Frontend
- Arquivo: `src/pages/AdminPage.tsx`
- Adicionar controles de paginação abaixo da tabela (botões Anterior / Próximo + indicador "Página X de Y")
- Ao mudar de página, faz nova requisição com `?page=X`

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/routes/admin.ts` | Adicionar LIMIT/OFFSET na query |
| `src/pages/AdminPage.tsx` | Adicionar controles de paginação na UI |

---

## Passo a Passo

1. Ler `server/routes/admin.ts` para ver a query atual
2. Adaptar para: `SELECT * FROM clients LIMIT $1 OFFSET $2`
3. Calcular offset: `(page - 1) * limit`
4. Fazer também `SELECT COUNT(*) FROM clients` para retornar o total
5. No frontend, adicionar estado `currentPage` e botões de navegação
6. Testar com dados reais

---

## Critério de Conclusão
- [ ] Rota retorna no máximo 20 clientes por vez
- [ ] Passar `?page=2` retorna o segundo bloco
- [ ] Frontend exibe controles de página funcionando
- [ ] Total de clientes é exibido na UI ("Mostrando 1-20 de 150")
