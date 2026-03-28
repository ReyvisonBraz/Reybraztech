# Etapa 05 — Alertas de vencimento por WhatsApp

**Prioridade:** 🔴 Alta
**Status:** ❌ Pendente
**Depende de:** Etapa 03 (job de countdown rodando)

---

## Contexto

Quando restam 3 dias para vencer a assinatura, o cliente deve receber uma mensagem automática no WhatsApp avisando para renovar. A integração com SendPulse (OTP) já existe — pode ser reutilizada.

---

## O que precisa ser feito

### Dentro do job (`server/jobs/subscription.ts`)
- Após decrementar `days_remaining`, verificar quem chegou a exatamente 3 dias
- Para cada um, enviar mensagem WhatsApp via SendPulse

### Serviço de envio
- Reutilizar `server/services/sendpulse.ts` (já existe para OTP)
- Ou criar função separada para mensagens de alerta (template diferente do OTP)

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/jobs/subscription.ts` | Adicionar lógica de alerta no job |
| `server/services/sendpulse.ts` | Verificar se suporta envio de mensagem livre ou só OTP |

---

## Passo a Passo

1. Ler `server/services/sendpulse.ts` para entender a API disponível
2. No job, após o UPDATE, fazer SELECT de clientes com `days_remaining = 3`
3. Para cada cliente, chamar o serviço de WhatsApp com mensagem de renovação
4. Logar envios no Winston para auditoria
5. Testar com número real de teste

---

## Mensagem sugerida
```
Olá, {nome}! Sua assinatura Reybraztech vence em 3 dias.
Renove agora para não perder o acesso: {link_checkout}
```

---

## Critério de Conclusão
- [ ] Mensagem chega no WhatsApp do cliente quando `days_remaining` = 3
- [ ] Não envia mensagem duplicada (verificar idempotência)
- [ ] Logs registram cada envio com sucesso/erro
