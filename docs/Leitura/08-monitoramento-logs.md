# 08 — Monitoramento e Interpretação de Erros

Este guia ensina como fiscalizar o projeto Reybraztech e como interpretar os alertas técnicos que você recebe no celular.

## 1. O Sistema de Monitoramento

Seu projeto utiliza três camadas para garantir que você saiba de tudo:

- **Winston (Logs Locais)**: Grava cada ação do servidor na pasta `server/logs/`.
- **Telegram Bot**: Avisa instantaneamente no seu celular quando algo quebra.
- **Sentry**: Uma ferramenta profissional que mostra o "raio-x" de cada erro.

---

## 2. Como interpretar um Alerta no Telegram

Sempre que o bot enviar uma mensagem, foque nessas três partes:

### A. A Mensagem do Erro
É o texto curto que diz o que aconteceu.
Ex: `Error: Credenciais inválidas` ou `Error: DATABASE_URL não definida`.

### B. A Rota (Caminho)
Diz em qual URL o erro aconteceu.
Ex: `POST /api/auth/register`. Se for nesta rota, você sabe que o problema foi no cadastro de alguém.

### C. O Stack Trace (O segredo para iniciantes)
O Stack Trace parece assustador, mas você só precisa de **uma informação**: em qual arquivo e linha está o erro.

**Procure sempre a linha que menciona uma das suas pastas (`server/` ou `src/`):**
```text
Error: Algo quebrou!
    at <anonymous> (C:\...\server\routes\auth.ts:88:11)  <-- FOQUE AQUI!
    at Layer.handle (...)
    at next (...)
```
No exemplo acima, o erro está no arquivo `auth.ts`, na linha **88**.

---

## 3. Códigos de Status (Dicionário de Erros)

Seu servidor se comunica usando números. Entender eles ajuda a saber se o erro é no código ou se o usuário digitou algo errado:

- **400 (Bad Request)**: O usuário esqueceu de preencher algo obrigatório.
- **401 (Unauthorized)**: A senha está errada ou o login expirou.
- **409 (Conflict)**: O usuário já existe (ex: WhatsApp já cadastrado).
- **500 (Internal Server Error)**: **Atenção aqui!** Isso significa um erro real no código ou no banco de dados.

---

## 4. Boas Práticas de Segurança

- **Máscara de Erros**: Note que para o usuário final, o site mostra "Erro interno. Tente mais tarde". Isso evita que hackers saibam detalhes do seu banco de dados. O erro técnico REAL só vai para o **seu** Telegram.
- **Logs Estruturados**: Nunca use `console.log` para senhas ou dados sensíveis. O sistema de logs é configurado para ser limpo e informativo.

---

## 5. Como Testar o Alerta
Para garantir que tudo está funcionando, acesse:
`https://sua-url-do-servidor.com/api/test-error`

O Bot deve te mandar uma mensagem na hora!
