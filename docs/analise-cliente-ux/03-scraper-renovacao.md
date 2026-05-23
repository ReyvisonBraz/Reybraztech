# Scraper, sync e renovacao

## O que existe hoje

Ha duas camadas relacionadas ao scraper:

1. `server/routes/scraper.ts`: proxy do backend principal para o scraper remoto.
2. `reybraztech-scraper/src/server.ts`: servidor real do scraper, com `/run`, `/job/:id`, `/jobs`, `/health`, `/ready`, `/2fa-status` e `/2fa`.

Tambem existe `server/scraper-runner.ts`, mas ele parece legado:

- script `package.json` aponta `scraper:server` para ele;
- ele usa `path.join(projectRoot, 'scraper')`;
- a pasta real no repo e `reybraztech-scraper`;
- tem `FINAL_CHAT_ID` fixo no codigo;
- usa comando com `npm install && npx ts-node...` em runtime.

Minha recomendacao: tratar `server/scraper-runner.ts` como candidato a remocao ou arquivamento depois de confirmar que nao esta em producao.

## Pontos fortes do scraper principal

- Jobs assicronos com arquivos em `output/jobs`.
- Controle de concorrencia: rejeita nova execucao se outra estiver rodando.
- Health check e ready check.
- Suporte a 2FA via endpoint.
- Busca, sync e renovacao usam o mesmo `/run`.
- Renovacao tem screenshots de debug e retry.
- Sync atualiza banco via `updateDatabase`.

## Riscos atuais

### S1. Jobs ficam em disco local

Em Render, disco pode ser efemero dependendo do plano. Os jobs servem para polling recente, mas nao devem ser considerados historico confiavel.

Melhoria:

- manter jobs em disco para simplicidade;
- registrar resumo do job no banco se precisar auditoria;
- mostrar no admin que historico e "recente".

### S2. Renovacao por nome pode renovar cliente errado

`renew-client` usa `clientName` e `searchBy` com default `buyer_name`. Busca por nome pode ter homonimos ou nomes parecidos.

Melhoria:

- preferir renovar por `starhome_account`;
- no admin, buscar primeiro e mostrar cliente encontrado;
- exigir confirmacao com account, nome, dias e pacote;
- depois chamar renew por account.

### S3. Regra comercial da renovacao precisa ser confirmada

O scraper adiciona pontos/renova no painel StarHome. No app, o webhook de pagamento atualiza `days_remaining` no cliente. Precisamos confirmar:

- renovar soma dias restantes ou substitui?
- qual plano StarHome corresponde a cada plano vendido?
- precisa renovar no StarHome automaticamente apos pagamento ou apenas atualizar app?
- o cliente usa `app_account` do pool ou `starhome_account` do painel?

### S4. Varios comandos Telegram chamam scraper diretamente

Existem comandos em `server/index.ts`, `server/utils/logger.ts` e no scraper. Isso espalha a logica.

Melhoria:

- manter um unico caminho oficial para sync/renew;
- comandos Telegram devem chamar backend principal ou scraper, mas nao ambos de formas diferentes;
- documentar envs obrigatorias.

## Plano recomendado para testar scraper

1. Rodar `/ready` no scraper e validar:
   - `apiKeyConfigured`;
   - `panelConfigured`;
   - `outputDirWritable`.
2. Rodar `/health` e confirmar `scraperRunning`.
3. Fazer busca por account conhecida.
4. Fazer busca por nome e conferir se retorna o cliente certo.
5. Fazer renovacao em `dry-run` por account.
6. Fazer renovacao real apenas depois de confirmar no painel.
7. Rodar sync completo e comparar:
   - total extraido;
   - total salvo no banco;
   - cliente especifico atualizado;
   - `starhome_last_sync` no dashboard.

## Melhorias provaveis para implementar

- Remover ou renomear script legado `scraper:server`.
- Adicionar endpoint de dry-run no proxy admin.
- Fazer renovacao sempre por account.
- Salvar resultado de renew em tabela de auditoria.
- Criar tela admin "Buscar -> Confirmar -> Renovar".
- Mostrar erro de 2FA de forma clara no admin.
- Validar `SCRAPER_URL` e `SCRAPER_API_KEY` na inicializacao do backend ou em tela de health.
