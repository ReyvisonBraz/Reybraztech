# Fase 2: Refatoração de Páginas

> **Objetivo:** Quebrar páginas grandes em componentes menores e mais manuteníveis

---

## Tarefas

### 2.1 Quebrar LandingPage em componentes menores
**Arquivo de origem:** `src/pages/LandingPage.tsx` (1063 linhas)

A LandingPage é muito grande. Quebrar em componentes menores.

**Estrutura proposta:**

```
src/pages/LandingPage/
├── index.tsx              # Exporta todos os componentes
├── Hero.tsx               # Seção hero (linhas ~180)
├── Compatibility.tsx     # Seção dispositivos (linhas ~420)
├── Pricing.tsx           # Seção preços (linhas ~860)
├── Features.tsx          # Seção features (linhas ~970)
└── FAQ.tsx               # Seção FAQ (linhas ~1040)
```

**Passos:**
1. Criar pasta `src/pages/LandingPage/`
2. Criar cada arquivo de componente
3. Mover código de cada seção para arquivo próprio
4. Consolidar em `index.tsx` com re-exports
5. Atualizar import em `App.tsx`

**Componentes a criar:**

#### Hero.tsx
```typescript
// src/pages/LandingPage/Hero.tsx
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { PlayCircle, ArrowRight, Terminal, ChevronDown } from 'lucide-react';
import { SpecialText } from '../../components/SpecialText';
import { openSendPulseChat } from '../../utils/openSendPulseChat';

export function Hero() {
  // Mover todo o código da seção Hero existente aqui
  // Manter imports e estilos originais
}
```

#### Compatibility.tsx
```typescript
// src/pages/LandingPage/Compatibility.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Mover código da seção Compatibility existente
```

#### Pricing.tsx
```typescript
// src/pages/LandingPage/Pricing.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
// Mover código da seção Pricing existente
```

#### Features.tsx
```typescript
// src/pages/LandingPage/Features.tsx
import { motion } from 'motion/react';
// Mover código da seção Features existente
```

#### FAQ.tsx
```typescript
// src/pages/LandingPage/FAQ.tsx
import { motion } from 'motion/react';
// Mover código da seção FAQ existente
```

#### index.tsx
```typescript
// src/pages/LandingPage/index.tsx
export { Hero } from './Hero';
export { Compatibility } from './Compatibility';
export { Pricing } from './Pricing';
export { Features } from './Features';
export { FAQ } from './FAQ';
```

---

### 2.2 Extrair WelcomeModal do Dashboard
**Arquivo de origem:** `src/pages/DashboardPage.tsx:159-290`

O modal de boas-vindas está inline. Extrair para componente próprio.

**Destino:** `src/components/WelcomeModal.tsx`

```typescript
// src/components/WelcomeModal.tsx
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  welcomeData: {
    whatsapp: string;
    password: string;
    email: string;
  } | null;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, welcomeData, onClose }: WelcomeModalProps) {
  // Mover todo o código do modal inline aqui
  // Manter funcionalidade de copy to clipboard
}
```

**Após criar:**
- Simplificar `DashboardPage.tsx` - remover código inline do modal
- Importar e usar `<WelcomeModal />`

---

### 2.3 Quebrar AdminPage em sub-componentes
**Arquivo de origem:** `src/pages/AdminPage.tsx` (639 linhas)

A página de admin tem muita lógica inline. Quebrar em componentes menores.

**Estrutura proposta:**

```
src/components/admin/
├── ClientTable.tsx        # Tabela de clientes
├── ClientRow.tsx          # Linha individual de cliente
├── Pagination.tsx         # Controles de paginação
├── ActionModals.tsx       # Todos os modais (ativar, sync, link)
├── SyncModal.tsx          # Modal de sincronização
├── ActivateModal.tsx      # Modal de ativação
├── LinkStarhomeModal.tsx  # Modal para vincular StarHome
└── index.ts               # Re-exports
```

**Cada componente:**

#### ClientTable.tsx
```typescript
// src/components/admin/ClientTable.tsx
import { Client } from '../../pages/AdminPage';

interface ClientTableProps {
  clients: Client[];
  onClientAction: (client: Client) => void;
  onLinkStarhome: (client: Client) => void;
  loading: boolean;
}

export function ClientTable({ clients, onClientAction, onLinkStarhome, loading }: ClientTableProps) {
  // Mover código da tabela existente
}
```

#### ActionModals.tsx
```typescript
// src/components/admin/ActionModals.tsx
import { Client } from '../../pages/AdminPage';
// Criar um componente que gerencia todos os modais
// Ou separar em arquivos individuais
```

---

### 2.4 Criar ClientCard para visualização mobile
**Arquivo de origem:** `src/pages/DashboardPage.tsx:505-522`

O histórico de pagamentos tem card layout para mobile. Criar componente reutilizável.

**Destino:** `src/components/PaymentCard.tsx`

```typescript
// src/components/PaymentCard.tsx
interface PaymentCardProps {
  date: string;
  plan: string;
  value: string;
  status: string;
}

export function PaymentCard({ date, plan, value, status }: PaymentCardProps) {
  return (
    <div className="glass p-6 rounded-3xl flex justify-between items-center">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{date}</p>
        <h4 className="text-lg font-black text-slate-900 dark:text-white capitalize">{plan}</h4>
        <p className="text-slate-500 font-bold">{value}</p>
      </div>
      <div className="text-right">
        <div className="text-2xl mb-1">{status === 'Pago' ? '✅' : '❌'}</div>
        <p className={`text-xs font-black uppercase ${status === 'Pago' ? 'text-green-500' : 'text-red-500'}`}>
          {status}
        </p>
      </div>
    </div>
  );
}
```

---

## Checklist de Conclusão

- [ ] 2.1 LandingPage quebrada em componentes menores
- [ ] 2.2 WelcomeModal extraído do Dashboard
- [ ] 2.3 AdminPage quebrada em sub-componentes
- [ ] 2.4 PaymentCard criado para reutilização

---

## Notas

- Manter estilos e funcionalidades originais
- Após quebra, verificar se tudo continua funcionando
- Usar TypeScript para tipagem dos componentes
- Manter arquivos na pasta correta (pages vs components)
