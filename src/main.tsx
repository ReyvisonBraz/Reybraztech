import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Modo escuro fixo — sem alternância de tema
document.documentElement.classList.add('dark');
localStorage.removeItem('theme');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
