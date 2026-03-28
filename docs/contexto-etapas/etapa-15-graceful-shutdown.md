# Etapa 15 — Graceful Shutdown

**Prioridade:** 🟢 Baixa
**Status:** ❌ Pendente
**Depende de:** nada

---

## Contexto

Quando o Render faz deploy ou reinicia o servidor, envia `SIGTERM`. O servidor atual ignora o sinal e é morto abruptamente, podendo interromper requisições em andamento.

---

## O que precisa ser feito

- Arquivo: `server/index.ts`
- Escutar `SIGTERM` e `SIGINT`
- Parar de aceitar novas conexões
- Aguardar requisições em andamento terminarem
- Fechar conexão com o banco
- Encerrar o processo com código 0

---

## Código base

```ts
process.on('SIGTERM', () => {
  server.close(() => {
    // fechar pool do banco
    process.exit(0);
  });
});
```

---

## Critério de Conclusão
- [ ] `kill -SIGTERM <pid>` encerra o servidor sem matar requisições ativas
- [ ] Log "servidor encerrado graciosamente" aparece no Winston
