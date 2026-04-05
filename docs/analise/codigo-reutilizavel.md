# 📚 Trechos de Código Reutilizáveis

> **Origem:** Análise completa do projeto Reybraztech

---

## 🎯 Trechos Identificados no Frontend

### 1. ScrollToTop
**Arquivo:** `src/App.tsx:19-34`

```typescript
// ORIGINAL - pode virara hook
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
};
```

---

### 2. Variantes de Animação (Motion)
**Arquivo:** `src/pages/LandingPage.tsx:8-23`

```typescript
// EXTRAIR PARA: src/utils/animations.ts
const fadeSlideUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const fadeSlideLeft = {
  hidden: { opacity: 0, x: -30, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(10px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.1 } },
};
```

---

### 3. Função copyToClipboard
**Arquivo:** `src/pages/DashboardPage.tsx:114-118`

```typescript
// REUTILIZÁVEL - criar hook ou utilitário
const copyToClipboard = (text: string, field: string) => {
  navigator.clipboard.writeText(text);
  setCopiedField(field);
  setTimeout(() => setCopiedField(''), 2000);
};
```

---

### 4. Loading State
**Arquivo:** `src/App.tsx:37-41`

```typescript
// COMPONENTE UI REUTILIZÁVEL
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
  </div>
);
```

---

### 5. Função isTokenValid
**Arquivo:** `src/components/ProtectedRoute.tsx:9-18`

```typescript
// JÁ ISOLADA - pode expandir
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp * 1000 > Date.now(); 
  } catch {
    return false;
  }
}
```

---

## 🎯 Trechos Identificados no Backend

### 1. logLoginEvent
**Arquivo:** `server/routes/auth.ts:11-21`

```typescript
// EXTRAIR PARA: server/utils/events.ts
async function logLoginEvent(
  action: string, 
  whatsapp?: string, 
  email?: string, 
  details?: string, 
  success: boolean = true, 
  ip?: string, 
  userAgent?: string
) {
  try {
    await sql`
      INSERT INTO login_logs (action, whatsapp, email, details, success, ip_address, user_agent)
      VALUES (${action}, ${whatsapp || null}, ${email || null}, ${details || null}, ${success}, ${ip || null}, ${userAgent || null})
    `;
  } catch (err: any) {
    console.error('Erro ao salvar log:', err.message);
  }
}
```

---

### 2. Schemas Zod
**Arquivo:** `server/routes/auth.ts:24-36`

```typescript
// EXTRAIR PARA: server/schemas/index.ts
const loginSchema = z.object({
  identifier: z.string().min(1, 'WhatsApp/E-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  device: z.string().min(1, 'Informe o dispositivo'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});
```

---

### 3. Cache Token OAuth2
**Arquivo:** `server/services/whatsapp.ts:4-38`

```typescript
// JÁ IMPLEMENTADO - não precisa mudar
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }
  // ... código para obter novo token
}
```

---

### 4. getPhoneVariants
**Arquivo:** `server/services/whatsapp.ts:48-69`

```typescript
// JÁ IMPLEMENTADO - função útil
function getPhoneVariants(number: string): string[] {
  const digits = number.replace(/\D/g, '');
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  const variants: string[] = [full];
  
  if (full.length === 13) {
    const ddd = full.slice(2, 4);
    const withoutNinth = `55${ddd}${full.slice(5)}`;
    variants.push(withoutNinth);
  } else if (full.length === 12) {
    const ddd = full.slice(2, 4);
    const withNinth = `55${ddd}9${full.slice(4)}`;
    variants.push(withNinth);
  }
  
  return variants;
}
```

---

### 5. Middleware verifyToken
**Arquivo:** `server/middleware/auth.ts:9-31`

```typescript
// JÁ ISOLADO - boa estrutura
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.clientId = decoded.id;
    req.clientEmail = decoded.email;
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
  }
};
```

---

## 📦 Bibliotecas Recomendadas

### Já no projeto (aproveitar melhor)

| Biblioteca | Uso Atual | Potencial |
|------------|-----------|-----------|
| `motion/react` | Animações básicas | Animações complexas, gestures, layouts |
| `zod` | Validação backend | Validação forms + resolvers |
| `lucide-react` | Ícones | Todos já instalados |
| `axios` | Instanciado, poco usado | Interceptors, cancelamento |

### Instalar (agregar valor)

| Biblioteca | Para que serve | Comando |
|------------|----------------|---------|
| `react-hook-form` | Forms + validação | `npm i react-hook-form` |
| `@hookform/resolvers` | Zod no form | `npm i @hookform/resolvers zod` |
| `@tanstack/react-query` | Server state, cache | `npm i @tanstack/react-query` |
| `sonner` | Toast notifications | `npm i sonner` |
| `date-fns` | Manipulação datas | `npm i date-fns` |
| `recharts` | Gráficos | `npm i recharts` |

---

## 🔗 Onde Buscar Soluções Externas

### Autenticação
- **JWT Refresh:** https://github.com/auth0/node-jsonwebtoken
- **React Hook Form:** https://react-hook-form.com/
- **React Query Auth:** https://tanstack.com/query/latest

### UI/UX
- **Sonner (toasts):** https://sonner.emilkowal.ski/
- **Framer Motion:** https://www.framer.com/motion/
- **Radix UI:** https://www.radix-ui.com/

### Backend
- **Zod Docs:** https://zod.dev/
- **Express Rate Limit:** https://express-rate-limit.miroslav-fulier.com/

### Utils
- **Date-fns:** https://date-fns.org/
- **clsx + tailwind-merge:** https://github.com/lukeed/clsx
