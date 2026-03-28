# Etapa 07 — Refresh Token

**Prioridade:** 🟡 Média
**Status:** ❌ Pendente
**Depende de:** nada (independente)

---

## Contexto

O token JWT tem tempo de expiração. Quando expira, o usuário é **deslogado abruptamente** sem aviso. O correto é renovar o token silenciosamente em background enquanto o usuário está ativo.

---

## O que precisa ser feito

### Backend
- Criar rota `POST /api/auth/refresh`
- Aceita um refresh token (cookie HttpOnly ou body)
- Valida o refresh token e retorna novo access token
- Refresh tokens devem ter vida mais longa (ex: 7 dias vs 1h do access token)

### Frontend
- Interceptar requisições com resposta 401
- Tentar refresh automaticamente
- Se refresh falhar, aí sim redirecionar para login
- Arquivo provável: `src/utils/api.ts` ou onde o axios/fetch está configurado

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/routes/auth.ts` | Adicionar rota de refresh |
| `src/utils/api.ts` (ou equivalente) | Interceptor de 401 |

---

## Passo a Passo

1. Ler `server/routes/auth.ts` para entender como o JWT é gerado hoje
2. No login, gerar dois tokens: access (curto) + refresh (longo)
3. Salvar refresh token em cookie HttpOnly
4. Criar rota POST `/api/auth/refresh` que valida o cookie e devolve novo access token
5. No frontend, configurar interceptor que chama refresh ao receber 401
6. Testar: deixar token expirar e verificar que a sessão continua

---

## Critério de Conclusão
- [ ] Usuário não é deslogado enquanto o refresh token for válido
- [ ] Refresh token expirado redireciona para login com mensagem clara
- [ ] Refresh token armazenado em cookie HttpOnly (não localStorage)
