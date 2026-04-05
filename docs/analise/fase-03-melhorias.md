# Fase 3: Melhorias Funcionais

> **Objetivo:** Adicionar funcionalidades que melhoram a experiência do usuário e a manutenção do código

---

## Tarefas

### 3.1 Implementar Refresh Token
**Contexto:** JWT expira em 8h. Precisamos implementar refresh token para manter usuário logado.

**Arquivos envolvidos:**
- `server/routes/auth.ts`
- `server/middleware/auth.ts`
- `src/components/ProtectedRoute.tsx`

**Passos:**

#### Backend - Nova rota de refresh
```typescript
// server/routes/auth.ts - adicionar nova rota
router.post('/refresh-token', verifyToken, async (req: AuthRequest, res: Response) => {
  const JWT_SECRET = process.env.JWT_SECRET!;
  
  // Gerar novo token
  const newToken = jwt.sign(
    { id: req.clientId, email: req.clientEmail },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  
  res.json({ token: newToken });
});
```

#### Frontend - Interceptador de token
```typescript
// src/hooks/useAuth.ts - criar hook completo
import { useState, useEffect, createContext, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('reyb_token');
    const storedUser = localStorage.getItem('reyb_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verificar se token está prestes a expirar (menos de 1 hora)
      const decoded = jwtDecode<{ exp: number }>(storedToken);
      const oneHour = 60 * 60 * 1000;
      
      if (decoded.exp * 1000 - Date.now() < oneHour) {
        // Chamar refresh token endpoint
        refreshToken(storedToken);
      }
    }
  }, []);

  const refreshToken = async (currentToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      
      if (response.ok) {
        const { token: newToken } = await response.json();
        setToken(newToken);
        localStorage.setItem('reyb_token', newToken);
      }
    } catch (error) {
      console.error('Erro ao fazer refresh token:', error);
    }
  };

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('reyb_token', token);
    localStorage.setItem('reyb_user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('reyb_token');
    localStorage.removeItem('reyb_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

### 3.2 Adicionar Loading States Consistentes
**Contexto:** Cada página tem seu próprio spinner. Padronizar.

**Criar componente Loading:**
```typescript
// src/components/ui/loading.tsx
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ size = 'md', text }: LoadingProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className={`${sizes[size]} border-4 border-cyan-500 border-t-transparent rounded-full animate-spin`} />
        {text && <p className="text-slate-400">{text}</p>}
      </div>
    </div>
  );
}
```

**Usar em todas as páginas:**
- DashboardPage.tsx
- AdminPage.tsx
- LoginPage.tsx
- RegisterPage.tsx

---

### 3.3 Implementar Toast Notifications
**Contexto:** Feedback ao usuário em ações (sucesso/erro).

**Instalar biblioteca:**
```bash
npm install sonner
```

**Criar componente Toast:**
```typescript
// src/components/ui/toast.tsx
import { Toaster, toast } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      toastOptions={{
        style: {
          background: 'rgba(2, 6, 23, 0.95)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
        },
      }}
    />
  );
}

// Funções helper
export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showInfo = (message: string) => toast.info(message);
```

**Usar no App.tsx:**
```typescript
import { ToastProvider } from './components/ui/toast';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      {/* ...resto do app */}
    </BrowserRouter>
  );
}
```

**Exemplos de uso:**
```typescript
import { showSuccess, showError } from './components/ui/toast';

// Após login bem-sucedido
showSuccess('Login realizado com sucesso!');

// Após erro
showError('Credenciais inválidas');
```

---

### 3.4 Adicionar Validação Client-side Zod
**Contexto:** Validação apenas no backend. Adicionar no frontend também.

**Instalar:**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Criar hook de validação:**
```typescript
// src/hooks/useFormValidation.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schemas de validação
export const loginFormSchema = z.object({
  identifier: z.string().min(1, 'WhatsApp/E-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  device: z.string().min(1, 'Informe o dispositivo'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;

// Hook
export function useLoginForm() {
  return useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });
}

export function useRegisterForm() {
  return useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });
}
```

**Usar nos forms:**
```typescript
// LoginPage.tsx
import { useLoginForm } from '../hooks/useFormValidation';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useLoginForm();
  
  // ... rest of component
}
```

---

### 3.5 Criar Hook useAuth Global
**Contexto:** Gerenciar estado do usuário globalmente.

**Destino:** `src/hooks/useAuth.ts`

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config/api';

interface User {
  name: string;
  plan: string;
  status: string;
  whatsapp: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('reyb_token');
    const storedUser = localStorage.getItem('reyb_user');

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode<{ exp: number }>(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('reyb_token');
          localStorage.removeItem('reyb_user');
        }
      } catch {
        localStorage.removeItem('reyb_token');
        localStorage.removeItem('reyb_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('reyb_token', newToken);
    localStorage.setItem('reyb_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('reyb_token');
    localStorage.removeItem('reyb_user');
  };

  const refreshAuth = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { token: newToken } = await response.json();
        setToken(newToken);
        localStorage.setItem('reyb_token', newToken);
      }
    } catch (error) {
      console.error('Erro ao refresh auth:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        loading, 
        login, 
        logout, 
        isAuthenticated: !!token && !!user,
        refreshAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Checklist de Conclusão

- [ ] 3.1 Refresh token implementado
- [ ] 3.2 Loading states padronizados
- [ ] 3.3 Toast notifications funcionando
- [ ] 3.4 Validação client-side com Zod
- [ ] 3.5 useAuth global criado

---

## Notas

- Fazer uma tarefa por vez
- Testar cada funcionalidade após implementar
- Commit após cada tarefa completa
