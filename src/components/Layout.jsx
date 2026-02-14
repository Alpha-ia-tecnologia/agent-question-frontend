import { NavLink } from 'react-router-dom';

export default function Layout({ children }) {
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

                    <div className="nav-section">
                        <div className="nav-section-title">Administração</div>
                        <NavLink to="/usuarios" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-link-icon">👥</span>
                            Usuários
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">A</div>
                        <div className="user-details">
                            <div className="user-name">Administrador</div>
                            <div className="user-role">Acesso Livre</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
