import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const decoded = jwtDecode<{ exp: number }>(token);
        // exp está em segundos, Date.now() em ms
        return decoded.exp * 1000 > Date.now(); 
    } catch {
        // Se o token for malformado (ex: lixo), falha silenciosamente e rejeita
        return false;
    }
}

/**
 * Componente que protege rotas privadas.
 * Se o token for inválido ou estiver expirado, redireciona para /login.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const token = localStorage.getItem('reyb_token');

    if (!isTokenValid(token)) {
        if (token) localStorage.removeItem('reyb_token'); // remove lixo ou token expirado
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
