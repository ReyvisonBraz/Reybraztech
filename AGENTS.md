# AGENTS.md — Padrão de Trabalho do Projeto

Este arquivo é lido por qualquer agente de IA (Claude Code, Codex, opencode, etc.) e por humanos.
**Toda tarefa de correção, melhoria ou nova funcionalidade segue o fluxo abaixo.**

## Workflow Git/GitHub (obrigatório)

1. **Toda tarefa tem uma Issue no GitHub.** Crie a Issue antes de escrever qualquer código:
   - Título claro (imperativo): `fix: ...`, `feat: ...`, `chore: ...`, `refactor: ...`
   - Descrição: contexto, o que mudar, critérios de aceite, links úteis.
   - Labels: `bug`, `enhancement`, `feature`, `security`, `tech-debt`, `tests`, `ui`.
2. **Trabalhe em um branch por Issue:**
   - Nome do branch: `feat/descricao-curta`, `fix/descricao-curta`, `refactor/...`.
   - Um branch = uma Issue. Não misture tarefas no mesmo branch.
3. **Abra um Pull Request por Issue:**
   - A descrição do PR **DEVE mencionar a Issue** — use `Closes #<numero>` (fecha automaticamente ao merge) ou `Relates to #<numero>` (quando for parcial).
   - Padrão de corpo do PR:
     ```markdown
     ## O que mudou
     <resumo curto das mudanças>

     ## Como testar
     <passos de verificação>

     ## Issues
     Closes #<numero>
     ```
   - Alvo padrão: `main`/`master`.
4. **Deploy:** o deploy é disparado pelo merge do PR no branch principal (CI/CD). Não commitar direto na branch principal para tarefas de código — sempre via PR.
5. **Commits:** mensagem no formato Conventional Commits:
   `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`, `security:`.
   Mensagens descritivas no corpo quando houver contexto importante.

## Antes de abrir o PR (verificação)

- Rode o typecheck: `npm run lint` (Reybraztech) e o build do scraper.
- Não commite `.env` (ignorados) nem segredos.
- Revise seu próprio diff antes de publicar o PR.

## Estrutura do repositório (Reybraztech)

- `server/` — backend Express (rotas em `server/routes/`, serviços em `server/services/`).
- `src/` — frontend React 19 + Vite + Tailwind 4.
- `../reybraztech-scraper` — scraper Puppeteer do painel StarHome (repo separado).
- `../reybraztech-stack` — docker-compose e infra local (repo/pasta separada).
