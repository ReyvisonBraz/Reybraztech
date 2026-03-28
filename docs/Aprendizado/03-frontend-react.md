# Frontend — Como o React Funciona Aqui

> Abra `src/App.tsx` enquanto lê este arquivo.

---

## Como o React inicia

```
index.html          ← HTML base com <div id="root">
  └── src/main.tsx  ← Monta o app React nesse #root
        └── src/App.tsx  ← Define as rotas (URLs)
              ├── /           → LandingPage.tsx
              ├── /login      → LoginPage.tsx
              ├── /register   → RegisterPage.tsx
              ├── /checkout   → CheckoutPage.tsx
              ├── /dashboard  → DashboardPage.tsx (protegida)
              └── /admlogin   → AdminPage.tsx (protegida + admin)
```

O `main.tsx` força o modo escuro adicionando a classe `dark` no `<html>`.

---

## Roteamento — como as URLs funcionam

O React Router não recarrega a página — ele apenas troca o componente renderizado.

```tsx
// src/App.tsx (simplificado)
<Routes>
  <Route path="/"          element={<LandingPage />} />
  <Route path="/login"     element={<LoginPage />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>        // ← Guarda de rota
      <DashboardPage />
    </ProtectedRoute>
  } />
</Routes>
```

**Para navegar entre páginas, sempre use `<Link to="/rota">` — nunca `<a href>`.** O `<a href>` recarrega a página inteira e quebra o SPA.

---

## ProtectedRoute — como as rotas privadas funcionam

`src/components/ProtectedRoute.tsx` é um componente "guarda".
Antes de renderizar a página, ele:
1. Verifica se existe `reyb_token` no `localStorage`
2. Decodifica o JWT e verifica se não expirou
3. Se inválido → redireciona para `/login`
4. Se válido → renderiza o filho (a página)

```tsx
// Uso em App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

---

## Como o frontend fala com o backend

Toda comunicação usa `fetch` (ou `axios`) para a URL `/api/...`.

```tsx
// Exemplo em LoginPage.tsx
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ whatsapp, password })
});
const data = await response.json();
```

O Vite tem um **proxy** em `vite.config.ts` que redireciona `/api/*` para `http://localhost:3001` em desenvolvimento. Em produção, o backend fica em outro domínio.

A URL base da API fica centralizada em `src/config/api.ts`:
```ts
export const API_URL = import.meta.env.VITE_API_URL || '';
```

---

## Componentes — peças reutilizáveis

Um componente React é uma função que retorna JSX (HTML-like):

```tsx
// src/components/Navbar.tsx (simplificado)
export function Navbar() {
  return (
    <nav className="bg-slate-900 border-b border-cyan-500/20">
      <Link to="/">Início</Link>
      <Link to="/login">Entrar</Link>
    </nav>
  );
}
```

### Componentes desta pasta

| Componente | O que faz |
|-----------|-----------|
| `Navbar.tsx` | Cabeçalho de navegação |
| `Footer.tsx` | Rodapé do site |
| `FloatingWhatsApp.tsx` | Botão flutuante de contato WhatsApp |
| `ContentCarousel.tsx` | Carrossel animado de conteúdo |
| `ProtectedRoute.tsx` | Guarda de rotas privadas |
| `PasswordRecoveryModal.tsx` | Modal de recuperação de senha |
| `web-gl-shader.tsx` | Onda animada em WebGL (fundo da LandingPage) |
| `ui/button.tsx` | Botão padronizado (shadcn/ui) |
| `ui/input.tsx` | Input padronizado (shadcn/ui) |

---

## Páginas — o que cada uma faz

### LandingPage (`/`)
Página de marketing. Apresenta o serviço, planos e CTA (Call to Action).
Tem a onda WebGL animada no fundo, carrossel de conteúdo e botão de WhatsApp flutuante.

### CheckoutPage (`/checkout`)
Exibe os planos disponíveis. Futuramente terá integração com Mercado Pago.

### RegisterPage (`/register`)
Cadastro em **3 etapas** controlado por um estado `step`:
- Step 1: Dados pessoais (nome, WhatsApp, dispositivo)
- Step 2: Verificação via WhatsApp (OTP)
- Step 3: Senha e e-mail opcional

### LoginPage (`/login`)
Duas formas de login:
- Senha: `whatsapp/email + senha` → `POST /api/auth/login`
- OTP: `whatsapp` → recebe código → `POST /api/otp/verify-login`

Após login, salva o JWT em `localStorage` como `reyb_token`.

### DashboardPage (`/dashboard`)
Painel do cliente logado. Mostra:
- Dados pessoais (nome, dispositivo, plano)
- Credenciais do app (app_account, app_password)
- Histórico de pagamentos
- Dias restantes na assinatura

### AdminPage (`/admlogin`)
Rota "oculta" (não aparece no menu). Acessa com JWT de usuário `is_admin = true`.
Lista todos os clientes. Futuramente: ativar/desativar, paginação, etc.

---

## Estilização — como o Tailwind funciona aqui

O projeto usa **modo escuro fixo** (classe `dark` no `<html>`). Paleta principal:

```
Fundo:    bg-slate-950  (#020617)
Cards:    bg-slate-900  (#0f172a)
Primário: text-cyan-400 / bg-cyan-500
Bordas:   border-cyan-500/20 (20% de opacidade)
```

Classes utilitárias importantes:
- `gradient-logo` → gradiente cyan→blue→purple (definida em `src/index.css`)
- `text-gradient` → aplica o gradiente em texto
- `glow-cyan` → sombra brilhante cyan

---

## Estado e efeitos — os hooks mais usados

```tsx
// useState: guarda um valor que muda (re-renderiza o componente)
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// useEffect: executa código quando o componente monta ou uma dependência muda
useEffect(() => {
  fetchDashboardData(); // busca dados ao montar
}, []); // [] = só na montagem

// useNavigate: navega programaticamente
const navigate = useNavigate();
navigate('/dashboard');
```
