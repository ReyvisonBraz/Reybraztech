# Etapa 1: Corrigir pos-pagamento

## Objetivo

Garantir que nenhum cliente pague e fique perdido.

Hoje o sistema ate cria pedido e processa webhook, mas o caminho depois do pagamento ainda nao esta fechado para cliente novo. A etapa 1 deve criar uma ponte clara entre:

1. cliente escolhe plano;
2. cliente paga no Mercado Pago;
3. cliente volta para o site;
4. site mostra status do pedido;
5. se pago, cliente finaliza cadastro;
6. cliente entra no painel.

## Problema atual

### 1. Mercado Pago volta para dashboard

Em `server/routes/orders.ts`, os `backUrls` usam:

- sucesso: `/dashboard?payment=success`
- pendente: `/dashboard?payment=pending`
- falha: `/checkout?plan=...&error=payment_failed`

Isso e aceitavel para cliente logado, mas ruim para cliente novo.

Cliente novo ainda nao tem token. Quando volta para `/dashboard`, a rota protegida manda para `/login`. Resultado: a pessoa acabou de pagar e pode cair numa tela de login sem saber qual senha usar.

### 2. Pedido pago sem cliente vira alerta manual

Em `server/routes/payments.ts`, quando o webhook aprova pagamento e nao encontra cliente em `clients`, o sistema:

- marca o pedido como `paid`;
- envia alerta no Telegram: pagamento sem cadastro;
- nao cria caminho automatico forte para o cliente finalizar.

Existe funcao de WhatsApp em `server/services/whatsapp.ts` que ja monta link para `/complete-registration?order=...`, mas o fluxo do webhook ainda nao usa isso como parte central dessa etapa.

### 3. Consulta de pedido exige JWT

Em `server/routes/orders.ts`, `GET /api/orders/:id` exige `verifyToken`.

Isso bloqueia uma pagina publica de status para cliente novo, porque ele ainda nao esta autenticado.

## Fluxo desejado

### Compra nova

1. Cliente entra em `/checkout?plan=mensal`.
2. Informa nome e WhatsApp.
3. Backend cria `pending_orders`.
4. Mercado Pago recebe `external_reference = orderId`.
5. `back_urls` apontam para `/order-status?order=orderId`.
6. Cliente paga.
7. Webhook marca pedido como `paid`.
8. Cliente volta para `/order-status?order=orderId`.
9. Pagina consulta endpoint publico seguro.
10. Se status for `paid` e ainda nao tiver `client_id`, mostra:
    - pagamento aprovado;
    - botao "Finalizar cadastro";
    - link para suporte.
11. Cliente clica e vai para `/complete-registration?order=orderId`.
12. Finaliza senha/dispositivo.
13. Sistema cria conta, marca pedido `registered` e manda para dashboard.

### Renovacao de cliente logado

1. Cliente logado vai para checkout.
2. Backend cria pedido por `/api/orders/renew`.
3. Mercado Pago tambem volta para `/order-status?order=orderId`.
4. Pagina de status detecta que o cliente esta logado.
5. Se pedido estiver `registered`, mostra sucesso e botao "Ir para painel".
6. Se ainda estiver `pending`, mostra aguardando pagamento.

## Nova pagina sugerida

Criar:

- `src/pages/OrderStatusPage.tsx`

Rota:

- `/order-status`

Estados da tela:

### Sem `order`

Mensagem:

- "Pedido nao encontrado"
- botao "Voltar para planos"
- botao "Falar com suporte"

### Pedido pendente

Mensagem:

- "Aguardando confirmacao do pagamento"
- "Se voce acabou de pagar via PIX/cartao, pode levar alguns segundos"
- botao "Atualizar status"
- botao "Abrir suporte"

### Pedido pago e sem cadastro

Mensagem:

- "Pagamento aprovado"
- resumo do plano e valor
- botao principal "Finalizar cadastro"
- texto: "Agora crie sua senha para acessar seu painel"

### Pedido registrado

Mensagem:

- "Acesso liberado"
- se tiver token local: botao "Ir para painel"
- se nao tiver token: botao "Entrar na minha conta"

### Pedido falhou/cancelado

Mensagem:

- "Pagamento nao confirmado"
- botao "Tentar novamente"
- botao "Falar com suporte"

## Endpoint publico seguro

Criar algo como:

`GET /api/orders/public/:id`

Retorno sugerido:

```json
{
  "id": "uuid",
  "status": "pending | paid | registered | cancelled",
  "plan": "mensal",
  "amount": 35,
  "created_at": "2026-05-22T...",
  "paid_at": "2026-05-22T...",
  "registered": false,
  "needs_registration": true
}
```

Nao retornar:

- senha;
- app_account;
- app_password;
- dados internos;
- informacoes sensiveis do pagamento.

Sobre WhatsApp/nome:

- Para privacidade, a pagina publica pode mostrar so plano, valor e status.
- Se quiser mostrar telefone, mascarar: `5591*****0497`.

## Mudancas no backend

### `server/routes/orders.ts`

Mudancas:

- Adicionar endpoint publico de status.
- Alterar `backUrls` em `/create`.
- Alterar `backUrls` em `/renew`.
- Em pedido recente reutilizado, tambem usar `/order-status`.

Ponto importante:

- O `orderId` ja existe antes de criar preferencia, entao da para montar URL:
  - `${frontendUrl}/order-status?order=${order.id}`

### `server/services/mercadopago.ts`

Mudancas:

- O fallback padrao tambem deveria apontar para `/order-status` quando houver external reference.
- Como a funcao recebe `externalReference`, pode usar:
  - `/order-status?order=${externalReference}`

Ou manter sem mudanca se todas as chamadas relevantes passarem `backUrls`.

### `server/routes/payments.ts`

Mudancas nesta etapa:

- Quando cliente nao existir, manter pedido como `paid`.
- Nao depender apenas do Telegram.
- Opcional nesta etapa: chamar `sendPaymentConfirmation`.

Observacao:

- O WhatsApp automatico pode ficar para Etapa 3, mas a Etapa 1 ja deve deixar a pagina de status pronta para resolver o fluxo mesmo sem WhatsApp.

## Mudancas no frontend

### `src/App.tsx`

Adicionar lazy import e rota:

- `/order-status`

### `src/pages/OrderStatusPage.tsx`

Responsabilidades:

- ler `order` da URL;
- consultar `/api/orders/public/:id`;
- mostrar estado visual;
- fazer polling leve enquanto `pending`;
- levar para `/complete-registration?order=...` quando `paid`;
- levar para `/dashboard` ou `/login` quando `registered`;
- oferecer suporte via WhatsApp.

### `src/pages/CheckoutPage.tsx`

Mudancas pequenas:

- Depois de criar pedido, continuar redirecionando para Mercado Pago.
- Guardar `reyb_pending_order` ainda pode ajudar.
- Se der erro/fallback, manter suporte.

## Decisoes que precisamos confirmar

### Decisao 1: status publico sem token basta?

Minha recomendacao: sim, desde que o retorno seja limitado e sem dados sensiveis.

Alternativa mais segura:

- criar `public_token` no pedido;
- URL ficaria `/order-status?order=ID&token=TOKEN`;
- endpoint validaria os dois.

Para agora, como `orderId` e UUID longo, podemos comecar com retorno minimo por `orderId`. Depois reforcamos com token se quiser.

### Decisao 2: compra nova deve cadastrar antes ou depois de pagar?

Minha recomendacao para venda rapida:

- antes de pagar: apenas nome + WhatsApp;
- depois de pagar: criar senha e completar cadastro.

Isso deixa checkout mais curto e reduz abandono.

### Decisao 3: pagina de status tambem deve atender renovacao?

Minha recomendacao: sim.

Uma pagina unica evita duplicar experiencia e facilita suporte:

- pedido novo;
- renovacao;
- pagamento pendente;
- pagamento aprovado;
- pagamento falhou.

## Plano de implementacao da Etapa 1

### 1. Backend: endpoint publico de pedido

Criar em `server/routes/orders.ts`:

- `GET /api/orders/public/:id`

Validar:

- id presente;
- buscar em `pending_orders`;
- retornar campos minimos;
- calcular `needs_registration`.

### 2. Backend: alterar backUrls

Em `server/routes/orders.ts`, trocar:

- `/dashboard?payment=success`
- `/dashboard?payment=pending`

por:

- `/order-status?order=${orderId}`

Para falha:

- `/order-status?order=${orderId}&payment=failure`

### 3. Frontend: criar pagina de status

Criar `src/pages/OrderStatusPage.tsx`.

Estados:

- loading;
- erro;
- pending;
- paid precisa cadastro;
- registered;
- failure.

### 4. Frontend: adicionar rota

Em `src/App.tsx`:

- lazy import;
- route `/order-status`.

### 5. Testar TypeScript

Rodar:

- `npm.cmd run lint`

### 6. Teste manual local

Sem depender de pagamento real, podemos testar com pedidos do banco ou simular status.

Cenarios:

- order inexistente;
- pending;
- paid sem client_id;
- registered com client_id;
- URL sem `order`.

## Criterio de pronto

A Etapa 1 esta pronta quando:

- cliente novo nunca volta do Mercado Pago para dashboard sem senha;
- `/order-status` mostra claramente o estado do pedido;
- pedido pago sem cliente mostra "Finalizar cadastro";
- pedido registrado mostra proximo passo certo;
- TypeScript compila;
- o fluxo antigo de renovacao logada nao quebra.

## Implementado em 2026-05-22

- Criado endpoint publico `GET /api/orders/public/:id` com retorno minimo do pedido.
- Alterados os `back_urls` de pedidos novos, pedidos recentes reutilizados e renovacoes para `/order-status?order=...`.
- Alterado fallback do servico Mercado Pago para usar `/order-status`.
- Criada pagina `src/pages/OrderStatusPage.tsx`.
- Adicionada rota React `/order-status`.
- `npm.cmd run lint` executado com sucesso.
- Vite iniciado em `http://localhost:3003/` porque as portas 3000, 3001 e 3002 estavam ocupadas.
- Validado via HTTP que `/order-status?order=teste-inexistente` responde `200`.
- Backend local iniciado em `http://localhost:3001` com Telegram/cron desativados para teste.
- Endpoint publico testado com pedidos existentes sem expor dados pessoais:
  - `registered`: retornou `registered: true` e `needs_registration: false`;
  - `pending`: retornou `registered: false` e `needs_registration: false`;
  - `paid` sem cadastro vinculado: retornou `needs_registration: true`.

Pendente para proxima rodada:

- Testar visualmente no navegador, pois o navegador interno da sessao nao estava disponivel.
- Testar visualmente os estados `pending`, `paid`, `registered` e `failure`.
- Etapa 3 ainda deve enviar WhatsApp automatico apos pagamento aprovado sem cadastro.

## O que nao mexer ainda

Para manter a etapa pequena, eu nao mexeria agora em:

- layout completo do checkout;
- regra de soma/substituicao de dias;
- atribuicao de login do pool;
- scraper;
- refatoracao grande de componentes;
- mascara de telefone do trial.

Esses ficam para as proximas etapas.
