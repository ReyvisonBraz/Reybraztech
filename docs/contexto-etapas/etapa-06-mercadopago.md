# Etapa 06 — Checkout Mercado Pago (webhook)

**Prioridade:** 🟡 Média
**Status:** 🟡 Parcial
**Depende de:** nada (independente)

---

## Contexto

Os links de pagamento do Mercado Pago já existem no código, mas o **webhook de confirmação de pagamento tem um TODO** e não está implementado. Quando o cliente paga, o sistema não sabe e não ativa a conta automaticamente.

---

## O que precisa ser feito

### Backend
- Arquivo: `server/services/mercadopago.ts` — corrigir falha silenciosa do token
- Implementar o handler do webhook: `POST /api/webhooks/mercadopago`
- Validar a assinatura do Mercado Pago (header `x-signature`)
- Quando pagamento aprovado: ativar cliente + definir `days_remaining`

### Bug a corrigir junto
- `MERCADO_PAGO_ACCESS_TOKEN || ''` em `server/services/mercadopago.ts` — se a variável não existir, falha silenciosa. Deve lançar erro na inicialização.

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/services/mercadopago.ts` | Lógica de pagamento + corrigir bug do token |
| `server/routes/` | Criar rota do webhook |
| `server/index.ts` | Registrar a nova rota |

---

## Passo a Passo

1. Ler `server/services/mercadopago.ts` para entender o que já existe
2. Corrigir: trocar `|| ''` por validação que lança erro se token não configurado
3. Criar rota `POST /api/webhooks/mercadopago`
4. Implementar validação de assinatura (documentação do Mercado Pago)
5. Ao receber pagamento aprovado, atualizar `active = true` e `days_remaining = 30` (ou plano contratado)
6. Testar com webhook simulator do Mercado Pago

---

## Critério de Conclusão
- [ ] Webhook recebe notificação do Mercado Pago sem erro 500
- [ ] Assinatura inválida retorna 401
- [ ] Pagamento aprovado ativa o cliente automaticamente
- [ ] Bug do token silencioso corrigido
