# Etapa 03 — Job de contagem regressiva (`days_remaining`)

**Prioridade:** 🔴 Alta
**Status:** ❌ Pendente
**Depende de:** Etapas 01 e 02 (admin funcional)

---

## Contexto

O campo `days_remaining` existe no banco (tabela `clients`) mas **nunca é decrementado**. Precisa de um job que rode todo dia à meia-noite, decremente 1 dia e inative clientes com `days_remaining <= 0`.

---

## O que precisa ser feito

### Instalar dependência
```bash
npm install node-cron
npm install -D @types/node-cron
```

### Criar o job
- Novo arquivo: `server/jobs/subscription.ts`
- Lógica:
  1. Decrementar `days_remaining` de todos os clientes ativos
  2. Inativar (`active = false`) quem chegou a 0

### Registrar o job no servidor
- Arquivo: `server/index.ts`
- Importar e iniciar o job ao subir o servidor

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/jobs/subscription.ts` | Arquivo novo — lógica do cron job |
| `server/index.ts` | Importar e iniciar o job |
| `package.json` | Adicionar dependência `node-cron` |

---

## Passo a Passo

1. Instalar `node-cron`
2. Criar `server/jobs/subscription.ts`:
   ```ts
   import cron from 'node-cron';
   import { db } from '../database';

   export function startSubscriptionJob() {
     // Roda todo dia à meia-noite
     cron.schedule('0 0 * * *', async () => {
       // UPDATE clients SET days_remaining = days_remaining - 1 WHERE active = true
       // UPDATE clients SET active = false WHERE days_remaining <= 0
     });
   }
   ```
3. Em `server/index.ts`, importar e chamar `startSubscriptionJob()`
4. Testar manualmente chamando a função uma vez com dados de teste

---

## Critério de Conclusão
- [ ] Job registrado e logando "iniciado" ao subir o servidor
- [ ] Após execução manual, `days_remaining` diminui 1 para clientes ativos
- [ ] Clientes com `days_remaining = 0` ficam com `active = false`
- [ ] Job não quebra se não houver clientes ativos
