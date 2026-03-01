import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Componente que protege rotas privadas.
 * Se o usuário não tiver token JWT no localStorage, redireciona para /login.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const token = localStorage.getItem('reyb_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
