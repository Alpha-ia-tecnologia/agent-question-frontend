import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Falha ao fazer login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">🎯</div>
                        <h1 className="login-title">Question AI</h1>
                        <p className="login-subtitle">Gerador de Questões Educacionais</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Senha</label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isLoading}
                            style={{ width: '100%' }}
                        >
                            {isLoading ? '⏳ Entrando...' : '🚀 Entrar'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Não tem conta? Contate o administrador.
                    </p>
                </div>
            </div>
        </div>
    );
}
