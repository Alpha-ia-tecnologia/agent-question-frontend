import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

/**
 * Decodifica o payload de um token JWT
 */
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        return JSON.parse(decoded);
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Verifica se há token e usuário salvo no localStorage
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                // Verifica se o token ainda é válido (não expirado)
                const payload = decodeToken(token);
                if (payload && payload.exp) {
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.exp > now) {
                        setUser(JSON.parse(savedUser));
                    } else {
                        // Token expirado, limpa dados
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                } else {
                    // Token sem expiração definida, usa o usuário salvo
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                // Erro ao verificar token, limpa dados
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await authApi.login(email, password);

        // Decodifica o token JWT para obter informações do usuário
        const token = response.token;
        const payload = decodeToken(token);

        if (!payload) {
            throw new Error('Token inválido recebido do servidor');
        }

        const userData = {
            email: payload.sub,
            isAdmin: payload.is_admin || false,
            name: email.split('@')[0], // Usa parte do email como nome
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        return userData;
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
