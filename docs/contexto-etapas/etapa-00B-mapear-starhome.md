# Etapa 00-B — Mapear o Painel da Starhome

**Prioridade:** 🔴 Alta (pré-requisito para a automação)
**Status:** ❌ Pendente — fazer com calma, sessão dedicada
**Depende de:** nada (independente, mas deve ser feita ANTES da Etapa 16)

---

## Contexto

O scraper (`scraper/src/`) já faz login, resolve captcha, lida com 2FA via Telegram e extrai todos os clientes. O que **ainda não foi mapeado** é o fluxo de **renovação**: clicar nas 3 bolinhas de um cliente específico → "Renovar" → confirmar os meses.

O objetivo desta etapa é mapear apenas esse fluxo restante.

---

## O que já está mapeado e funcionando

| Item | Status | Onde no código |
|------|--------|----------------|
| URL do painel | ✅ `https://panel.web.starhome.vip` | `scraper/src/index.ts` |
| Login com captcha (2Captcha) | ✅ Funcionando | `scraper/src/login.ts` + `captcha.ts` |
| 2FA via Telegram | ✅ Funcionando | `scraper/src/login.ts` → `handle2FA()` |
| Cookies de sessão salvos | ✅ Funcionando | `scraper/src/login.ts` → `saveCookies()` |
| Navegação até lista de clientes | ✅ `#/account/list` | `scraper/src/scrape.ts` |
| Paginação completa | ✅ Funcionando | `scraper/src/scrape.ts` → `goToNextPage()` |
| Extração de dados (account, password, dias, etc.) | ✅ Funcionando | `scraper/src/scrape.ts` → `extractTableData()` |
| Framework da interface | ✅ **Ant Design** | Confirmado pelos seletores `.ant-table-row` |

---

## O que FALTA mapear

Apenas o fluxo de renovação de um cliente específico:

1. Localizar a linha do cliente na tabela pelo `account`
2. Encontrar e clicar no botão de 3 bolinhas (menu de ações) dessa linha
3. Identificar o seletor do item "Renovar" no dropdown
4. Identificar a estrutura do modal que aparece (campo de meses, botão confirmar)
5. Confirmar e verificar a resposta

---

## Como mapear (sessão dedicada)

1. Rodar o scraper com `HEADLESS=false` para ver o navegador
2. Após login, ir manualmente até a lista de clientes
3. Abrir DevTools (`F12`) → aba **Elements** e **Network**
4. Clicar nas 3 bolinhas de um cliente de **teste** (não cliente real)
5. Anotar o seletor HTML do menu e dos itens
6. Clicar em "Renovar" e anotar o seletor do modal, do input de meses e do botão confirmar
7. Confirmar e registrar a requisição de rede gerada

---

## Mapeamento da renovação (preencher na sessão)

```
Seletor do botão 3 bolinhas por linha: _______________
Seletor do item "Renovar" no dropdown: _______________
Seletor do modal de renovação: _______________
Seletor do input de meses: _______________
Seletor do botão confirmar: _______________

Requisição gerada:
  Método: _______________
  URL: _______________
  Body: _______________
  Response de sucesso: _______________
```

---

## Resultado esperado

Com esses seletores mapeados, a Etapa 16 pode implementar a função `renewClient(account, months)` no scraper com segurança.
