/**
 * Configuração central da API.
 * Em produção, defina VITE_API_URL no arquivo .env:
 *   VITE_API_URL=https://sua-api.onrender.com
 * Em desenvolvimento, usa localhost:3001 como padrão.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
