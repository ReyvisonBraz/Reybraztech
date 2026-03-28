# Etapa 01 — Ações do Admin (ativar/desativar clientes)

**Prioridade:** 🔴 Alta
**Status:** ❌ Pendente (parou aqui no Day 12)
**Depende de:** nada (pode iniciar agora)

---

## Contexto

O painel admin (`/admlogin`) já lista todos os clientes em uma tabela, mas **não tem botões de ação**. O admin precisa conseguir ativar ou inativar qualquer cliente manualmente.

> ⚠️ **Atenção:** Esta etapa é apenas o controle manual no nosso sistema.
> A renovação real no painel da Starhome ainda é feita manualmente pelo admin.
> A automação disso será tratada nas **Etapas 00-B e 16**.

---

## Correções importantes (vs. plano original)

| Campo errado no plano | Campo correto no banco |
|-----------------------|------------------------|
| `active` (boolean) | `status` (TEXT: `'Ativo'` ou `'Inativo'`) |

Ao **ativar** um cliente, o admin também precisa informar quantos dias está concedendo (`days_remaining`), pois sem isso o job de countdown (Etapa 03) inativaria o cliente imediatamente.

---

## O que precisa ser feito

### Backend
- Criar rota `PATCH /api/admin/clients/:id/status`
- Arquivo: `server/routes/admin.ts`
- Body esperado: `{ "status": "Ativo" | "Inativo", "days_remaining": number }`
  - `days_remaining` só é obrigatório quando `status = "Ativo"`
- Deve atualizar os campos `status` e `days_remaining` na tabela `clients`
- Protegida pelo middleware admin (JWT + `is_admin`)

### Frontend
- Arquivo: `src/pages/AdminPage.tsx`
- Adicionar coluna "Ações" na tabela existente
- Botão **"Desativar"** para clientes Ativos
- Botão **"Ativar"** para clientes Inativos — ao clicar, abre um pequeno modal/prompt perguntando quantos dias conceder (padrão: 30)
- Atualiza a tabela localmente após sucesso (sem reload)

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/routes/admin.ts` | Adicionar a rota PATCH |
| `src/pages/AdminPage.tsx` | Adicionar botões e modal de dias |

---

## Passo a Passo

1. Abrir `server/routes/admin.ts` e ler o código existente
2. Adicionar após a rota GET:
   ```ts
   router.patch('/clients/:id/status', async (req, res) => {
     const { id } = req.params;
     const { status, days_remaining } = req.body;
     // UPDATE clients SET status = $1, days_remaining = $2 WHERE id = $3
   });
   ```
3. Abrir `src/pages/AdminPage.tsx` e localizar a `<table>`
4. Adicionar coluna "Ações" com os botões
5. Ao clicar em "Ativar", mostrar input de dias antes de confirmar
6. Testar: logar como admin, ativar/inativar e verificar que `days_remaining` foi salvo

---

## Critério de Conclusão
- [ ] Admin consegue desativar um cliente (`status = 'Inativo'`)
- [ ] Admin consegue ativar um cliente informando os dias (`status = 'Ativo'`, `days_remaining = X`)
- [ ] A mudança persiste após recarregar a página
- [ ] Rota retorna 403 se chamada sem token admin
