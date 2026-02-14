import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { questionsApi } from '../api/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const [totalQuestions, setTotalQuestions] = useState(0);

    useEffect(() => {
        questionsApi.getCounts()
            .then(data => setTotalQuestions(data.total || 0))
            .catch(() => setTotalQuestions(0));
    }, []);

    return (
        <Layout>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Bem-vindo ao gerador de questões educacionais com IA</p>
            </div>

            <div className="page-content">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon primary">✨</div>
                        <div>
                            <div className="stat-value">{totalQuestions}</div>
                            <div className="stat-label">Questões Geradas</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon accent">🎯</div>
                        <div>
                            <div className="stat-value">AI</div>
                            <div className="stat-label">Powered by Gemini</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon success">📄</div>
                        <div>
                            <div className="stat-value">DOCX</div>
                            <div className="stat-label">Exportação Disponível</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon warning">🖼️</div>
                        <div>
                            <div className="stat-value">+</div>
                            <div className="stat-label">Imagens Ilustrativas</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="card-header">
                        <h3 className="card-title">🚀 Ações Rápidas</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => navigate('/gerar-questoes')}
                        >
                            ✨ Gerar Novas Questões
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={() => navigate('/questoes')}
                        >
                            📝 Ver Minhas Questões
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📌 Funcionalidades</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>🎯 Geração Inteligente</h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Crie questões de múltipla escolha alinhadas com habilidades BNCC, SAEB e outros referenciais.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>📊 Níveis de Proficiência</h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Configure o nível de dificuldade de acordo com a escala de proficiência desejada.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>📄 Textos Autênticos</h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Opte por usar textos de referência autênticos ou gerados por IA para as questões.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>🖼️ Imagens Ilustrativas</h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Gere imagens ilustrativas para complementar suas questões usando IA multimodal.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>📥 Exportação DOCX</h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Exporte suas questões para documento Word formatado e pronto para uso.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>💡 Explicações Detalhadas</h4>
                            <p style={{ fontSize: '0.875rem' }}>
                                Cada questão vem com explicação do gabarito para facilitar a correção.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
