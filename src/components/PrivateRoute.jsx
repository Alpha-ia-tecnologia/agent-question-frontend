import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente de rota protegida.
 * Redireciona para /login se não autenticado.
 * Redireciona para / se adminOnly e usuário não é admin.
 */
export default function PrivateRoute({ children, adminOnly = false }) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Carregando...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
