# Etapa 10 — CORS via Variáveis de Ambiente

**Prioridade:** 🟡 Média
**Status:** ❌ Pendente
**Depende de:** nada (independente)

---

## Contexto

As origens permitidas no CORS estão **hardcoded** em `server/index.ts`. Para mudar o domínio de produção é necessário alterar o código e fazer deploy. Deve vir do `.env`.

---

## O que precisa ser feito

- Mover as origens do CORS para variável de ambiente `CORS_ORIGINS`
- Suportar múltiplas origens separadas por vírgula: `CORS_ORIGINS=https://reybraztech.com,http://localhost:5173`

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/index.ts` | Ler CORS_ORIGINS do env |
| `.env` / `.env.example` | Adicionar variável |

---

## Passo a Passo

1. Abrir `server/index.ts` e localizar a configuração do CORS
2. Substituir array hardcoded por:
   ```ts
   const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];
   ```
3. Adicionar `CORS_ORIGINS` no `.env` e `.env.example`
4. Atualizar variável de ambiente no Render (produção)

---

## Critério de Conclusão
- [ ] Sem `CORS_ORIGINS` no env, bloqueia tudo (não aceita `*`)
- [ ] Com a variável configurada, origens listadas são aceitas
- [ ] `.env.example` documentado
