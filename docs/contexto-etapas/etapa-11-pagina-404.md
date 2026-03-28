# Etapa 11 — Página 404

**Prioridade:** 🟢 Baixa
**Status:** ❌ Pendente
**Depende de:** nada

---

## Contexto

URLs inválidas (ex: `/pagina-que-nao-existe`) não mostram nada ou mostram tela em branco. Precisa de uma página 404 elegante com link de volta ao início.

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `src/App.tsx` (ou onde estão as rotas) | Adicionar rota catch-all `*` |
| `src/pages/NotFoundPage.tsx` | Arquivo novo — página 404 |

---

## Passo a Passo

1. Criar `src/pages/NotFoundPage.tsx` com mensagem amigável e botão "Voltar ao início"
2. Abrir o arquivo de rotas (provavelmente `src/App.tsx`)
3. Adicionar como última rota: `<Route path="*" element={<NotFoundPage />} />`

---

## Critério de Conclusão
- [ ] Acessar URL inválida mostra a página 404
- [ ] Botão "Voltar" redireciona para `/`
- [ ] Visual consistente com o resto do site
