# Etapa 16 — Automação de Renovação na Starhome

**Prioridade:** 🔴 Alta (alto valor para o negócio)
**Status:** ❌ Pendente — NÃO iniciar sem concluir a Etapa 00-B
**Depende de:** Etapa 00-B (mapeamento da Starhome) + Etapa 06 (webhook Mercado Pago)

---

## Contexto

Hoje o admin renova manualmente no painel da Starhome. O objetivo é que isso aconteça **automaticamente** em dois cenários:

1. **Cliente paga no checkout** → Mercado Pago confirma via webhook → sistema renova na Starhome
2. **Admin envia comando no Telegram** → informa qual cliente renovar → sistema renova na Starhome

O Puppeteer já está no projeto (foi usado para scraping anterior). A integração com o Telegram também já existe.

---

## Fluxo completo esperado

```
[Cliente paga] → [Webhook Mercado Pago] → [Identificar cliente pelo pagamento]
                                         → [Chamar serviço de renovação Starhome]
                                         → [Atualizar status + days_remaining no banco]
                                         → [Notificar admin via Telegram: "✅ Cliente X renovado"]

[Admin no Telegram] → [Comando /renovar @usuario ou /renovar ID]
                    → [Chamar serviço de renovação Starhome]
                    → [Atualizar banco]
                    → [Responder no Telegram: "✅ Feito"]
```

---

## O que já existe (base para esta etapa)

O scraper em `scraper/src/` já tem toda a infraestrutura pronta:
- Login com captcha + 2FA via Telegram (`login.ts`)
- Cookies de sessão para não precisar logar toda vez (`login.ts`)
- Navegação e leitura da lista de clientes (`scrape.ts`)
- Interface é **Ant Design** — seletores seguem padrão `.ant-table-row`, `.ant-pagination-*`

**Falta apenas:** a função de renovação (clicar nas 3 bolinhas → "Renovar" → confirmar).

---

## O que precisa ser feito

### Função de renovação (`scraper/src/renew.ts`)
- Arquivo novo
- Função: `renewClient(page: Page, account: string, months: number): Promise<boolean>`
- Localizar a linha do cliente pelo `account` na tabela
- Clicar no botão de ações (3 bolinhas) daquela linha
- Clicar em "Renovar"
- Preencher o campo de meses
- Clicar em confirmar
- Seletores virão do mapeamento da **Etapa 00-B**

### Trigger 1 — Via webhook Mercado Pago (Etapa 06)
- Ao confirmar pagamento, identificar o cliente pelo `client_id` ou whatsapp
- Chamar `renewClient(client.app_account, meses_do_plano)`
- Atualizar `status = 'Ativo'` e `days_remaining` no banco
- Enviar notificação no Telegram para o admin

### Trigger 2 — Via comando Telegram
- Novo comando no bot: `/renovar [conta_ou_id] [meses]`
- Buscar cliente no banco pelo `app_account` ou `id`
- Chamar `renewClient(...)`
- Atualizar banco
- Responder confirmação no Telegram

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/services/starhome.ts` | Arquivo novo — lógica de renovação |
| `server/routes/webhooks.ts` (Etapa 06) | Chamar starhome após pagamento confirmado |
| `server/utils/logger.ts` | Telegram bot — adicionar handler do comando /renovar |

---

## Riscos e cuidados

| Risco | Mitigação |
|-------|-----------|
| Starhome muda a interface e quebra o Puppeteer | Logar erros detalhados, notificar admin no Telegram |
| Renovar cliente errado | Sempre confirmar `app_account` antes de agir; logar tudo |
| Captcha no painel da Starhome | Verificado na Etapa 00-B; já temos integração com 2Captcha |
| Timeout na renovação | Definir timeout máximo de 30s; em caso de falha, notificar admin para fazer manual |

---

## Critério de Conclusão
- [ ] Pagamento aprovado no Mercado Pago renova o cliente na Starhome automaticamente
- [ ] Comando `/renovar` no Telegram funciona e confirma na resposta
- [ ] Banco atualizado com `status = 'Ativo'` e `days_remaining` correto
- [ ] Admin recebe notificação Telegram em caso de sucesso E de falha
- [ ] Falha na Starhome não derruba o servidor (tratamento de erro robusto)
