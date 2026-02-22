# Guia de Estudos do Projeto

## 🗺️ Roteiro: Como seu projeto funciona

Seu projeto é uma aplicação web moderna construída com:
*   **React** (Biblioteca para criar as interfaces)
*   **Vite** (Ferramenta que faz o projeto rodar rápido no seu computador)
*   **TypeScript** (Um JavaScript mais seguro, que ajuda a evitar erros)
*   **Tailwind CSS** (Onde as cores e posições são definidas diretamente no código, pelas "classes")

**O caminho das pedras (Arquitetura básica):**
1.  **`package.json`**: É como se fosse a "lista de compras" do seu projeto. Ele guarda o nome de todas as bibliotecas que você baixou (como o instalador de ícones `lucide-react`) e os comandos para rodar o projeto (ex: `npm run dev`).
2.  **`src/main.tsx`**: É o "motor de partida". Ele pega todo o seu código React e injeta dentro do arquivo `index.html` para aparecer no navegador.
3.  **`src/App.tsx`**: É o grande "Caminho" (Roteador) do seu site. Se você olhar o código dele, vai ver várias tags `<Route path="/algo" ... />`. É aqui que você diz: *"Quando o usuário acessar /login, mostre a tela LoginPage"*.
4.  **`src/pages/`**: Essa pasta guarda as páginas inteiras do seu site (Página inicial, Checkout, Dashboard, Login e Registro).

---

## 📁 Como o Projeto está Organizado Agora (Páginas vs Componentes)

Para deixar o projeto profissional e fácil de dar manutenção, dividimos a estrutura de telas em duas pastas principais:

1.  **`src/pages/` (Páginas Inteiras):** Aqui ficam as telas completas que o usuário acessa. (Ex: `LandingPage.tsx`, `LoginPage.tsx`). Elas são como o "chassi" do carro.
2.  **`src/components/` (Componentes Reaproveitáveis):** Aqui ficam os pedacinhos da interface que se repetem ou que são independentes. (Ex: O cabeçalho `Navbar.tsx`, o rodapé `Footer.tsx` e o botão `FloatingWhatsApp.tsx`). Eles são como os "pneus e bancos" que você encaixa no chassi.

---

## 🔐 A Lógica de Login (Preparada para o Futuro)

No arquivo `src/pages/LoginPage.tsx`, a função `handleLogin` foi construída com `async/await`. Isso significa que o JavaScript "espera" uma resposta chegar de algum lugar antes de prosseguir. 

Atualmente, há um `setTimeout` (uma pausa programada) de 1.5 segundos apenas para simular a internet. Porém, deixamos um código bem didático comentado (`fetch(...)`) que mostra exatamente como você deve conectar a sua futura API ou Banco de Dados para validar senhas reais!

---

## 🛠️ Mão na Massa: Como fazer alterações (Exemplos Práticos)

O seu projeto usa o **Tailwind CSS**. Isso significa que as cores e margens não ficam em um arquivo `.css` separado, mas sim escritas direto na tag do HTML, dentro de `className="..."`.

### 1. Como mudar o texto (ou "comentários") de um botão
Para mudar o que está escrito na tela, basta encontrar a tag html correspondente e trocar o texto que fica entre a abertura `>` e o fechamento `<`.
*   **Exemplo no seu `App.tsx` (linha 82-87):**
    ```tsx
    // Atualmente:
    <LogIn className="w-5 h-5" />
    Entrar na Conta
    
    // Como alterar:
    <LogIn className="w-5 h-5" />
    Acessar meu Painel
    ```

### 2. Como alterar cores
Procure pelas classes que começam com `bg-` (background/fundo) ou `text-` (cor do texto) seguidas da cor e de um número (que é a intensidade, de 50 a 900).
*   **Exemplo:** O botão flutuante do WhatsApp no `App.tsx` (linha 128) está assim: `className="... bg-green-500 ..."`.
*   **Como alterar:** Se quiser deixar o botão azul, você só precisa trocar `bg-green-500` por `bg-blue-500`. Ou vermelho: `bg-red-500`.

### 3. Como ajustar a posição de um elemento
A posição é controlada por classes de margem (`m`, `mt`, `mb`, `ml`, `mr`) e espaçamento interno (`p`, `pt`, `pb`, etc).
*   **Exemplo:** No `App.tsx`, a caixa de login tem uma classe `mt-10` (margem no topo tamanho 10) e `pt-8` (padding no topo tamanho 8).
*   **Como alterar:** Se você quiser empurrá-la mais para baixo, pode trocar `mt-10` por `mt-16`. 
*   **Outro Exemplo (Botão fixo do WhatsApp):** Ele está com a classe `bottom-6 right-6` (6 unidades de distância do fundo e da direita). Se quiser que ele fique mais colado no canto da tela, mude para `bottom-2 right-2`.

### 4. Como adicionar um redirecionador (Link)
Depende de para onde você quer enviar o usuário:

**Para outra página do SEU MESMO SITE (Use a tag `<Link>`):**
*   **Exemplo (linha 93 do `App.tsx`):**
    ```tsx
    // Para redirecionar para uma nova página chamada "sobre"
    <Link to="/sobre" className="text-cyan-400">
      Ir para a página Sobre
    </Link>
    ```

**Para um site EXTERNO como Instagram ou Google (Use a tag normal `<a>`):**
*   **Exemplo (linha 124 do `App.tsx`):**
    ```tsx
    <a href="https://instagram.com/seu.perfil" target="_blank" className="bg-pink-500">
      Nosso Instagram
    </a>
    ```

**Dica de ouro:** Quando quiser achar algo específico para mudar, como um botão onde está escrito "Comprar", use o atalho **Ctrl + F** (ou Cmd + F no Mac) diretamente na sua IDE (como o VSCode) e digite a palavra "Comprar". Ele vai direto para a linha que você precisa mexer!
