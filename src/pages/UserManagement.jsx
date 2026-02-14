import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { userApi } from '../api/api';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_admin: false,
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await userApi.list(0, 100);
            setUsers(response.users || []);
        } catch (err) {
            setError('Erro ao carregar usuários: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                is_admin: user.is_admin,
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                is_admin: false,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            is_admin: false,
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingUser) {
                // Atualizar
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    is_admin: formData.is_admin,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await userApi.update(editingUser.id, updateData);
                setSuccess('Usuário atualizado com sucesso!');
            } else {
                // Criar
                await userApi.create(formData);
                setSuccess('Usuário criado com sucesso!');
            }

            handleCloseModal();
            loadUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) {
            return;
        }

        try {
            await userApi.delete(userId);
            setSuccess('Usuário excluído com sucesso!');
            loadUsers();
        } catch (err) {
            setError('Erro ao excluir: ' + err.message);
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="Carregando usuários..." />;
    }

    return (
        <Layout>
            <div className="page-header">
                <h1 className="page-title">👥 Gerenciamento de Usuários</h1>
                <p className="page-subtitle">Administre os usuários do sistema</p>
            </div>

            <div className="page-content">
                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {success}
                        <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
                    </div>
                )}

                {/* Actions */}
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        ➕ Novo Usuário
                    </button>
                </div>

                {/* Users Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Usuários ({users.length})</h3>
                    </div>

                    {users.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>Nenhum usuário cadastrado.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>ID</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Nome</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>E-mail</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Tipo</th>
                                        <th style={{ padding: 'var(--space-sm)', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 'var(--space-sm)' }}>{user.id}</td>
                                            <td style={{ padding: 'var(--space-sm)' }}>{user.name}</td>
                                            <td style={{ padding: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>{user.email}</td>
                                            <td style={{ padding: 'var(--space-sm)' }}>
                                                <span
                                                    className="question-skill"
                                                    style={{
                                                        background: user.is_admin ? 'rgba(124, 58, 237, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                                                        color: user.is_admin ? 'var(--color-accent)' : 'var(--color-primary)'
                                                    }}
                                                >
                                                    {user.is_admin ? 'Admin' : 'Usuário'}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleOpenModal(user)}
                                                    style={{ marginRight: 'var(--space-xs)' }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    style={{ color: 'var(--color-error)' }}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="loading-overlay" onClick={handleCloseModal} style={{ cursor: 'pointer' }}>
                        <div className="card" style={{ maxWidth: '450px', width: '90%' }} onClick={e => e.stopPropagation()}>
                            <div className="card-header">
                                <h3 className="card-title">
                                    {editingUser ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                                    <label>Nome</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                                    <label>E-mail</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                                    <label>Senha {editingUser && '(deixe em branco para manter)'}</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!editingUser}
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            name="is_admin"
                                            className="checkbox"
                                            checked={formData.is_admin}
                                            onChange={handleChange}
                                        />
                                        <label>Administrador</label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                    <button type="submit" className="btn btn-primary">
                                        {editingUser ? '💾 Salvar' : '➕ Criar'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
