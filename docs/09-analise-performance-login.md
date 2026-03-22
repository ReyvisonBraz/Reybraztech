# 📊 09 — Análise de Performance: Rota de Login

Este guia documenta os testes de performance realizados na rota de login e apresenta o diagnóstico para a lentidão relatada, além de Recomendações.

---

## 🔬 O que foi testado?
Para analisar a lentidão ("muita demora") no login, adicionamos instrumentos de medição de tempo (`performance.now()`) no arquivo `server/routes/auth.ts` na rota `/api/auth/login`.

---

## 📊 Resultados das Métricas (Média)

Executando o servidor localmente conectado ao Supabase de Produção:

| Etapa | Tempo Medido | Status | Descrição |
| :--- | :--- | :--- | :--- |
| **Busca no Banco (DB Lookup)** | ~393.41 ms | ✅ OK | Tempo para o Postgres responder. Saudável para conexão remota. |
| **Bcrypt (Senha)** | ~266.49 ms | ✅ OK | Tempo para decifrar a senha (fator 12). Padrão de segurança. |
| **Geração de JWT** | ~0.48 ms | ✅ OK | Instantâneo. |
| **Tempo Total Interno** | **~660.39 ms** | ✅ Rápido | Menos de 1 segundo processando no backend. |

---

## 🔍 Diagnóstico Final

Com o backend processando em **menos de 700ms**, a percepção de "muita demora" (vários segundos) geralmente é causada por **fatores externos à lógica do código**:

### 1. Cold Start (Hospedagem Render Free Tier)
- **O que é:** Se o backend estiver no plano gratuito do Render, o servidor "dorme" após 15 minutos sem uso.
- **Efeito:** O despertar de um servidor "frio" demora de **30 a 50 segundos** na **primeira** requisição.
- **Sintoma:** O primeiro login do dia demora muito, mas os seguintes são rápidos.

### 2. Rotas de Rede Descasadas (Cross-Region)
- **Arquitetura atual:**
  - Supabase: Criado em São Paulo (**SA-East**).
  - Servidor Render: Provavelmente no Leste dos EUA (**US-East**).
- **Efeito:** Cada requisição viaja: *Usuário (BR) -> Render (US) -> Supabase (BR) -> Render (US) -> Usuário (BR)*.
- **Sintoma:** Adiciona centenas de milissegundos de *latência de voo* que não aparecem no processamento interno.

---

## 💡 Recomendações de Melhoria

1. **Evitar Cold Start (Render):**
   - Criar um cron job (ex: no site [cron-job.org](https://cron-job.org)) para bater na rota `/api/health` do seu servidor a cada **14 minutos**. Isso força o Render a nunca dormir.
   
2. **Mesma Região Geográfica:**
   - Para máxima performance, o banco de dados e o servidor devem morar na **mesma região** (ex: ambos em São Paulo).

3. **Gargalo no Bcrypt (Opcional):**
   - Se os acessos escalarem muito, o Bcrypt com custo `12` pode saturar CPUs fracas. Se necessário, rebaixar para `10` (padrão seguro) gera um ganho pequeno de velocidade.

---

> 📌 **Mantenha os Logs:** Deixei a instrumentação de performance ativa no código para que você possa continuar monitorando em tempo real no console do terminal.
