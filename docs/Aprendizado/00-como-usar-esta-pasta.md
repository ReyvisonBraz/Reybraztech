# Como Usar Esta Pasta

> Esta pasta é o seu mapa de aprendizado do projeto Reybraztech.
> Diferente de `docs/Leitura/` (que é referência técnica) e `docs/contexto-etapas/` (que é backlog de tarefas),
> aqui o objetivo é **você entender como tudo funciona de verdade**.

---

## Ordem sugerida de leitura

```
01-mapa-do-projeto.md       ← Comece aqui. Entenda o todo antes das partes.
02-tecnologias.md           ← O que é cada ferramenta e por que foi escolhida.
03-frontend-react.md        ← Como a interface funciona (React, rotas, componentes).
04-backend-express.md       ← Como o servidor funciona (Express, rotas, middlewares).
05-banco-supabase.md        ← Como os dados são armazenados e acessados.
06-autenticacao-jwt-otp.md  ← Como o sistema sabe quem é você.
07-scraper-puppeteer.md     ← O robô que automatiza o painel StarHome.
08-onde-continuar.md        ← O que falta e por onde seguir.
```

---

## Dica de abordagem

Antes de ler qualquer arquivo desta pasta, abra o arquivo de código correspondente no editor.
Leia o código junto com a explicação. A teoria sem o código não fixa.

Exemplo:
- Lendo `03-frontend-react.md`? Abra `src/App.tsx` no lado.
- Lendo `06-autenticacao-jwt-otp.md`? Abra `server/routes/auth.ts`.

---

## Onde estão os outros documentos

| Pasta | Para que serve |
|-------|---------------|
| `docs/Leitura/` | Referência técnica completa (estrutura, API, banco, deploy) |
| `docs/contexto-etapas/` | Lista do que falta implementar, com passo a passo |
| `docs/Aprendizado/` | **Esta pasta** — para entender, não só executar |
