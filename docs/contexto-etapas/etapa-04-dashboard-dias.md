# Etapa 04 — Exibir `days_remaining` no Dashboard

**Prioridade:** 🔴 Alta
**Status:** ❌ Pendente
**Depende de:** Etapa 03 (job precisa estar decrementando o valor)

---

## Contexto

O campo `days_remaining` existe no banco mas o cliente **não consegue ver quanto tempo resta** na assinatura. O dashboard precisa exibir isso com uma barra de progresso visual.

---

## O que precisa ser feito

### Backend
- Verificar se a rota que retorna os dados do usuário logado já inclui `days_remaining`
- Se não, adicionar ao SELECT em `server/routes/auth.ts` ou rota de perfil

### Frontend
- Arquivo: `src/pages/DashboardPage.tsx` (ou equivalente)
- Exibir: "X dias restantes na sua assinatura"
- Adicionar barra de progresso (ex: verde > 10 dias, amarelo 3-10, vermelho < 3)

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/routes/auth.ts` | Verificar se `days_remaining` é retornado |
| `src/pages/DashboardPage.tsx` | Adicionar componente visual |

---

## Passo a Passo

1. Verificar qual rota retorna dados do usuário logado (provavelmente `GET /api/auth/me` ou similar)
2. Confirmar que `days_remaining` está no response
3. No frontend, ler o valor e exibir:
   - Texto: "Plano ativo — X dias restantes"
   - Barra de progresso proporcional ao plano contratado (ex: 30 dias total)
4. Aplicar cores por urgência

---

## Critério de Conclusão
- [ ] Dashboard exibe os dias restantes do cliente logado
- [ ] Barra de progresso muda de cor conforme urgência
- [ ] Valor é atualizado a cada login (não fica em cache)
