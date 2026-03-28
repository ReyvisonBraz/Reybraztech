# Etapa 09 — Rate Limit no Envio de OTP

**Prioridade:** 🟡 Média
**Status:** ❌ Pendente
**Depende de:** nada (independente)

---

## Contexto

O endpoint `POST /api/otp/send` não tem rate limit próprio. Um atacante pode chamar repetidamente e gerar **spam de mensagens WhatsApp**, gerando custo e bloqueio na conta SendPulse.

---

## O que precisa ser feito

- Adicionar rate limit específico para a rota de OTP: máximo de 3 tentativas por número de telefone a cada 10 minutos
- O rate limit global já existe no servidor, mas é muito permissivo para este endpoint

---

## Arquivos Envolvidos
| Arquivo | Papel |
|---------|-------|
| `server/routes/auth.ts` (ou onde o endpoint OTP está) | Adicionar middleware de rate limit |
| `server/index.ts` | Verificar rate limit global existente |

---

## Passo a Passo

1. Localizar onde `POST /api/otp/send` está definido
2. Criar rate limiter específico com `express-rate-limit`:
   ```ts
   const otpLimiter = rateLimit({
     windowMs: 10 * 60 * 1000, // 10 minutos
     max: 3,
     keyGenerator: (req) => req.body.phone, // limitar por telefone, não por IP
     message: 'Muitas tentativas. Aguarde 10 minutos.'
   });
   ```
3. Aplicar como middleware na rota de OTP
4. Testar: enviar 4 requisições seguidas e verificar que a 4ª retorna 429

---

## Critério de Conclusão
- [ ] Após 3 envios do mesmo número em 10 min, retorna 429
- [ ] Após 10 minutos, o número pode enviar novamente
- [ ] Rate limit por telefone (não por IP, pois usuários podem estar atrás de NAT)
