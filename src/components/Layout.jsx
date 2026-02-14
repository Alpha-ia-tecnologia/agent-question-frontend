import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🎯</div>
                        <span className="sidebar-logo-text">Question AI</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Menu</div>
                        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                            <span className="nav-link-icon">📊</span>
                            Dashboard
                        </NavLink>
                        <NavLink to="/gerar-questoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-link-icon">✨</span>
                            Gerar Questões
                        </NavLink>
                        <NavLink to="/questoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-link-icon">📝</span>
                            Minhas Questões
                        </NavLink>
                        <NavLink to="/questoes-validadas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-link-icon">✅</span>
                            Validação
                        </NavLink>
                    </div>

                    {isAdmin && (
                        <div className="nav-section">
                            <div className="nav-section-title">Administração</div>
                            <NavLink to="/usuarios" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-link-icon">👥</span>
                                Usuários
                            </NavLink>
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                        <div className="user-details">
                            <div className="user-name">{user?.name || 'Usuário'}</div>
                            <div className="user-role">{isAdmin ? 'Administrador' : 'Colaborador'}</div>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleLogout} title="Sair">
                        🚪
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
