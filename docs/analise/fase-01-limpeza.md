# Fase 1: Limpeza e Organização

> **Objetivo:** Extrair funções reutilizáveis para hooks e utils, preparar codebase para refatorações futuras

---

## Tarefas

### 1.1 Criar hook useScrollToTop
**Arquivo de origem:** `src/App.tsx:19-34`

Extrair a função ScrollToTop para um hook reutilizável.

**Destino:** `src/hooks/useScrollToTop.ts`

```typescript
// Novo arquivo: src/hooks/useScrollToTop.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
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
}
```

**Após criar:**
- Remover função ScrollToTop de `src/App.tsx`
- Usar hook: `useScrollToTop()` no componente App

---

### 1.2 Criar arquivo de animações
**Arquivo de origem:** `src/pages/LandingPage.tsx:8-23`

Extrair variantes de animação para arquivo reutilizável.

**Destino:** `src/utils/animations.ts`

```typescript
// Novo arquivo: src/utils/animations.ts
export const fadeSlideUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export const fadeSlideLeft = {
  hidden: { opacity: 0, x: -30, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
};

export const fadeScale = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(10px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};

export const smoothTransition = { duration: 0.7, ease: [0.25, 0.4, 0, 1] };

export const staggerContainer = {
  visible: { transition: { staggerChildren: 0.1 } },
};
```

**Após criar:**
- Importar de `src/utils/animations.ts` em todos os componentes que usam

---

### 1.3 Criar hook useApi
**Arquivo de origem:** Padrão repetido em `src/pages/DashboardPage.tsx` e `src/pages/AdminPage.tsx`

Criar hook reutilizável para fazer requisições autenticadas.

**Destino:** `src/hooks/useApi.ts`

```typescript
// Novo arquivo: src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { API_URL } from '../config/api';

interface UseApiOptions {
  authenticated?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (options: {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: object;
  }) => Promise<T | null>;
}

export function useApi<T>(options: UseApiOptions = {}): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (reqOptions: {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: object;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const token = options.authenticated ? localStorage.getItem('reyb_token') : null;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${reqOptions.endpoint}`, {
        method: reqOptions.method || 'GET',
        headers,
        body: reqOptions.body ? JSON.stringify(reqOptions.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options.authenticated]);

  return { data, loading, error, execute };
}
```

---

### 1.4 Criar schemas Zod centralizados
**Arquivo de origem:** `server/routes/auth.ts`

Extrair schemas Zod para arquivo compartilhado.

**Destino:** `server/schemas/index.ts`

```typescript
// Novo arquivo: server/schemas/index.ts
import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'WhatsApp/E-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  device: z.string().min(1, 'Informe o dispositivo'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const registerFromOrderSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido inválido'),
  device: z.string().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const updateClientStatusSchema = z.object({
  status: z.enum(['Ativo', 'Inativo']).optional(),
  days_remaining: z.number().min(1).optional(),
  starhome_account: z.string().optional(),
});

export const starhomeLinkSchema = z.object({
  starhome_account: z.string().min(1, 'Código StarHome é obrigatório'),
});
```

**Após criar:**
- Importar schemas em `server/routes/auth.ts`
- Importar schemas em `server/routes/admin.ts`

---

### 1.5 Criar utilitário de eventos
**Arquivo de origem:** `server/routes/auth.ts:11-21`

Mover função de logging de eventos para utilitário.

**Destino:** `server/utils/events.ts`

```typescript
// Novo arquivo: server/utils/events.ts
import sql from '../database.js';

export async function logLoginEvent(
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

export async function logAdminAction(
  action: string,
  adminId: number,
  targetClientId: number,
  details?: string
) {
  try {
    await sql`
      INSERT INTO admin_logs (action, admin_id, target_client_id, details)
      VALUES (${action}, ${adminId}, ${targetClientId}, ${details || null})
    `;
  } catch (err: any) {
    console.error('Erro ao salvar log de admin:', err.message);
  }
}
```

---

## Checklist de Conclusão

- [ ] 1.1 useScrollTop criado e aplicado
- [ ] 1.2 Animações extraídas para utils
- [ ] 1.3 useApi criado (opcional - usar só se necessário)
- [ ] 1.4 Schemas Zod centralizados
- [ ] 1.5 Eventos centralizados

---

## Notas

- Execute uma tarefa por vez
- Teste após cada mudança
- Commit após completar cada subtarefa
