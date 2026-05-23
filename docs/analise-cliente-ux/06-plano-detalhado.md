# Plano detalhado de execucao

Este plano organiza as melhorias em fases. A ideia e fazer uma coisa por vez, testar, e so entao seguir.

## Fase 0: Preparacao

Objetivo: garantir que vamos mexer com seguranca.

Tarefas:

- Confirmar ambiente local: `npm.cmd run lint`.
- Confirmar URL local do frontend e backend.
- Conferir `.env` sem expor segredos.
- Listar gateways realmente ativos: Mercado Pago e/ou InfinityPay.
- Confirmar regra comercial:
  - teste gratis e sempre 3 dias?
  - renovacao soma dias restantes?
  - cliente existente mantem mesmo login?
  - compra nova deve criar conta antes ou depois do pagamento?

Arquivos envolvidos:

- `.env.example`
- `docs/analise-cliente-ux/*`

Teste:

- TypeScript compila.
- Backend sobe localmente quando envs existem.

## Fase 1: Corrigir pos-pagamento

Objetivo: nenhum cliente pagar e ficar perdido.

Tarefas:

- Criar pagina `OrderStatusPage`.
- Criar rota no React: `/order-status`.
- Alterar `back_urls` do Mercado Pago para `/order-status?order=ID`.
- Criar endpoint publico seguro para consultar status basico do pedido.
- Quando pedido estiver pago e sem cliente, mostrar "Finalizar cadastro".
- Quando pedido estiver registrado, mostrar "Ir para painel".
- Quando pedido estiver pendente, mostrar "Aguardando pagamento".
- Quando pagamento falhar, mostrar voltar para checkout e suporte.

Arquivos provaveis:

- `src/App.tsx`
- `src/pages/OrderStatusPage.tsx`
- `server/routes/orders.ts`
- `server/routes/payments.ts`
- `server/services/mercadopago.ts`

Teste:

- Criar pedido novo.
- Simular pedido pendente.
- Simular pedido pago sem cliente.
- Simular pedido registrado.
- Conferir que cliente novo nao cai direto no dashboard sem token.

## Fase 2: Completar cadastro apos compra

Objetivo: transformar pagamento aprovado em cadastro simples.

Tarefas:

- Ajustar `CompleteRegistrationPage` para funcionar bem com pedido publico.
- Revisar `register-from-order`.
- Garantir que pedido pago sem cliente permite criar senha.
- Garantir que WhatsApp duplicado nao cria cliente duplicado.
- Depois de cadastrar, redirecionar para dashboard com boas-vindas.
- Corrigir dados de boas-vindas no dashboard se o state usado estiver diferente.

Arquivos provaveis:

- `src/pages/CompleteRegistrationPage.tsx`
- `src/pages/DashboardPage.tsx`
- `server/routes/auth.ts`
- `server/routes/orders.ts`

Teste:

- Pedido pago sem cliente -> finalizar cadastro -> dashboard.
- Pedido ja registrado -> login ou dashboard.
- Pedido inexistente -> erro amigavel.

## Fase 3: WhatsApp automatico apos pagamento

Objetivo: cliente receber o proximo passo mesmo se fechar o navegador.

Tarefas:

- No webhook Mercado Pago, quando cliente nao existir, enviar WhatsApp com link de completar cadastro.
- Reaproveitar servico existente em `server/services/whatsapp.ts`.
- Mensagem deve conter:
  - nome;
  - plano;
  - link;
  - suporte.
- Manter alerta Telegram, mas como acompanhamento.

Arquivos provaveis:

- `server/routes/payments.ts`
- `server/services/whatsapp.ts`

Teste:

- Simular webhook aprovado.
- Verificar log de envio.
- Confirmar que erro no WhatsApp nao quebra webhook.

## Fase 4: Melhorar checkout

Objetivo: compra mais rapida e clara.

Tarefas:

- Revisar tela do checkout.
- Esconder InfinityPay se nao estiver pronto ou configurado.
- Corrigir textos sem acento.
- Trocar fallback `#` por suporte.
- Melhorar mensagem "Voce sera redirecionado".
- Para usuario logado, mostrar claramente "Renovando sua assinatura".
- Para usuario novo, mostrar "Depois do pagamento voce cria sua senha".

Arquivos provaveis:

- `src/pages/CheckoutPage.tsx`
- `server/routes/payments.ts`

Teste:

- Cliente novo compra.
- Cliente logado renova.
- Gateway indisponivel mostra suporte.

## Fase 5: Melhorar trial

Objetivo: aumentar ativacao do teste gratis.

Tarefas:

- Adicionar mascara/normalizacao visual do WhatsApp.
- Tratar erro de WhatsApp ja cadastrado.
- Criar CTA para login quando o numero ja existe.
- Padronizar textos para "3 dias".
- Adicionar suporte contextual em cada etapa.
- Registrar etapa onde cliente clicou "Nao consegui".

Arquivos provaveis:

- `src/pages/TrialPage.tsx`
- `server/routes/dashboard.ts`
- `server/routes/auth.ts`

Teste:

- Trial novo.
- Trial com numero ja cadastrado.
- Cliente confirma que funcionou.
- Cliente confirma que nao funcionou.

## Fase 6: Melhorar dashboard e renovacao

Objetivo: cliente renovar sem pedir ajuda.

Tarefas:

- Melhorar card "Renovar Agora".
- Mostrar dias restantes com linguagem simples.
- Adicionar selecao rapida de planos no dashboard.
- Corrigir botao suporte.
- Explicar regra de renovacao.
- Se pagamento aprovado, atualizar dashboard ou instruir reload.

Arquivos provaveis:

- `src/pages/DashboardPage.tsx`
- `src/pages/CheckoutPage.tsx`
- `server/routes/orders.ts`
- `server/routes/payments.ts`

Teste:

- Cliente ativo renova.
- Cliente vencido renova.
- Cliente sem login solicita acesso.

## Fase 7: Revisar regra de renovacao no backend

Objetivo: evitar trocar login ou perder dias por erro.

Tarefas:

- Confirmar se dias devem somar ou substituir.
- Se somar, ajustar webhook.
- Se cliente ja tem `app_account`, nao atribuir outro login automaticamente.
- Registrar pedido como renovacao.
- Melhorar historico de pagamentos.

Arquivos provaveis:

- `server/routes/payments.ts`
- `server/routes/orders.ts`
- `server/routes/dashboard.ts`

Teste:

- Cliente com login renova.
- Cliente sem login compra.
- Pool vazio.
- Historico aparece correto.

## Fase 8: Scraper e admin

Objetivo: scraper confiavel e renovacao sem risco.

Tarefas:

- Confirmar se `server/scraper-runner.ts` esta em uso.
- Se nao estiver, remover script legado ou marcar como deprecated.
- Mudar renovacao admin para fluxo:
  - buscar cliente;
  - mostrar dados;
  - confirmar;
  - renovar por account.
- Adicionar dry-run no admin.
- Melhorar mensagens de 2FA.
- Registrar sync/renew em historico.

Arquivos provaveis:

- `package.json`
- `server/scraper-runner.ts`
- `server/routes/scraper.ts`
- `src/pages/AdminPage.tsx`
- `src/components/admin/LiveConsole.tsx`
- `reybraztech-scraper/src/server.ts`
- `reybraztech-scraper/src/renew.ts`

Teste:

- `/health`.
- `/ready`.
- Search por account.
- Search por nome.
- Renew dry-run.
- Renew real com account confirmado.

## Fase 9: Organizacao e refatoracao

Objetivo: reduzir manutencao dificil depois que o funil estiver correto.

Tarefas:

- Centralizar planos.
- Separar componentes grandes da landing.
- Separar componentes grandes do dashboard.
- Criar API client/helper para fetch.
- Criar textos/mensagens compartilhadas.
- Revisar encoding e microcopy.

Arquivos provaveis:

- `src/pages/LandingPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/config/*`
- `src/lib/*`
- `server/routes/*`

Teste:

- TypeScript.
- Navegacao visual.
- Fluxos principais.

## Ordem recomendada

1. Fase 1: pos-pagamento.
2. Fase 2: cadastro pos-compra.
3. Fase 3: WhatsApp automatico.
4. Fase 4: checkout.
5. Fase 6 e 7: renovacao.
6. Fase 8: scraper/admin.
7. Fase 5: trial.
8. Fase 9: refatoracao.

Motivo: primeiro fechamos vazamento de venda, depois melhoramos experiencia, depois limpamos estrutura.
