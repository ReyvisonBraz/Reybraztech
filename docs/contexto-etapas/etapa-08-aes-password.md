# Etapa 08 — Criptografia AES do `app_password`

**Prioridade:** 🟡 Média
**Status:** ❌ Pendente
**Depende de:** nada (independente, mas sensível — testar bem)

---

## Contexto

O campo `app_password` (senha do app do cliente) está salvo em **texto puro** no banco. Precisa ser criptografado com AES (não hash, pois precisa ser descriptografado para exibir ao usuário).

---

## O que precisa ser feito

### Backend
- Instalar `crypto` (nativo no Node) ou `aes-js`
- Criar utilitário `server/utils/crypto.ts` com funções `encrypt(text)` e `decrypt(text)`
- Chave AES deve vir do `.env` (ex: `AES_SECRET_KEY`)
- Ao salvar `app_password`: criptografar
- Ao retornar `app_password`: descriptografar

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/utils/crypto.ts` | Arquivo novo — funções encrypt/decrypt |
| `server/routes/auth.ts` | Criptografar ao salvar, descriptografar ao retornar |
| `.env` | Adicionar `AES_SECRET_KEY` |

---

## Passo a Passo

1. Definir `AES_SECRET_KEY` de 32 bytes no `.env`
2. Criar `server/utils/crypto.ts`:
   ```ts
   import crypto from 'crypto';
   const key = Buffer.from(process.env.AES_SECRET_KEY!, 'hex');

   export function encrypt(text: string): string { ... }
   export function decrypt(encrypted: string): string { ... }
   ```
3. Localizar onde `app_password` é salvo no banco — criptografar antes do INSERT
4. Localizar onde `app_password` é retornado — descriptografar antes do response
5. Migrar dados existentes (script único para re-criptografar registros no banco)

---

## Atenção
- A chave AES não pode ser perdida — se perder, todos os `app_password` ficam ilegíveis
- Fazer backup do banco antes de rodar a migração

---

## Critério de Conclusão
- [ ] Novo `app_password` salvo criptografado no banco (não texto puro)
- [ ] Frontend continua recebendo a senha descriptografada normalmente
- [ ] Registros existentes migrados
- [ ] `AES_SECRET_KEY` documentada no `.env.example`
