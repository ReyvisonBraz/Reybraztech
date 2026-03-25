/**
 * Configuração central da API.
 * Em produção na Vercel (onde back e front estão no mesmo domínio), a base já é `""`.
 * Em desenvolvimento na sua máquina local, usa `http://localhost:3001`
 */
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
