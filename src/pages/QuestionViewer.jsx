import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import QuestionCard from '../components/QuestionCard';
import SkillGroup from '../components/SkillGroup';
import LoadingSpinner from '../components/LoadingSpinner';
import { agentApi, docApi, questionsApi } from '../api/api';
import { evaluationData } from '../data/evaluationData';
import ComponentGroup from '../components/ComponentGroup';
import GradeGroup from '../components/GradeGroup';

export default function QuestionViewer() {
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFileName, setExportFileName] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filtro de validação
    const [validationFilter, setValidationFilter] = useState('all'); // 'all', 'validated', 'pending'

    // Estado para regeneração de imagem
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [regenerateInstructions, setRegenerateInstructions] = useState('');
    const [questionToRegenerate, setQuestionToRegenerate] = useState(null);
    const [syncDistractors, setSyncDistractors] = useState(true);

    const [isLoading, setIsLoading] = useState(true);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await questionsApi.list({ limit: 200 });
            const questionsWithImages = (data.questions || []).map(q => {
                if (q.image_url && !q.image_base64) {
                    const imageUrl = q.image_url.startsWith('http')
                        ? q.image_url
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${q.image_url}`;
                    return { ...q, imageFromServer: imageUrl };
                }
                return q;
            });
            setQuestions(questionsWithImages);
        } catch (err) {
            setError('Erro ao carregar questões: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    // Agrupar questões por componente curricular, série e skill
    const { groupedByComponent, sortedComponents } = useMemo(() => {
        // Aplica filtro de validação
        let filtered = questions;
        if (validationFilter === 'validated') {
            filtered = questions.filter(q => q.validated);
        } else if (validationFilter === 'pending') {
            filtered = questions.filter(q => !q.validated);
        }

        // Ordena do mais recente para o mais antigo
        const sorted = [...filtered].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        // Infere componente curricular a partir do skill usando evaluationData
        const inferComponent = (question) => {
            if (question.curriculum_component) return question.curriculum_component;
            const skill = question.skill || '';
            const idSkill = question.id_skill || '';
            for (const [modelKey, model] of Object.entries(evaluationData)) {
                for (const [compKey, compGrades] of Object.entries(model.components || {})) {
                    for (const [gradeKey, skillsList] of Object.entries(compGrades)) {
                        if (!Array.isArray(skillsList)) continue;
                        if (skillsList.some(s => s.code === idSkill || s.description === skill)) {
                            return compKey;
                        }
                    }
                }
            }
            return 'OTHER';
        };

        // Agrupa: componente → série → skill → questões
        const byComponent = {};
        sorted.forEach(question => {
            const comp = inferComponent(question);
            const grade = question.grade || 'Sem série';
            const skill = question.skill || 'Sem categoria';

            if (!byComponent[comp]) byComponent[comp] = {};
            if (!byComponent[comp][grade]) byComponent[comp][grade] = {};
            if (!byComponent[comp][grade][skill]) {
                byComponent[comp][grade][skill] = {
                    skillId: question.id_skill,
                    questions: []
                };
            }
            byComponent[comp][grade][skill].questions.push(question);
        });

        // Ordena componentes (LP, MT, OTHER)
        const componentOrder = ['LP', 'MT', 'OTHER'];
        const sortedComps = Object.keys(byComponent).sort((a, b) => {
            return (componentOrder.indexOf(a) === -1 ? 99 : componentOrder.indexOf(a)) -
                (componentOrder.indexOf(b) === -1 ? 99 : componentOrder.indexOf(b));
        });

        return { groupedByComponent: byComponent, sortedComponents: sortedComps };
    }, [questions, validationFilter]);

    // Flag para empty check
    const hasQuestions = sortedComponents.length > 0;

    // Todas as questões filtradas para contagem
    const allFilteredQuestions = useMemo(() => {
        return sortedComponents.flatMap(comp =>
            Object.values(groupedByComponent[comp]).flatMap(gradeGroups =>
                Object.values(gradeGroups).flatMap(g => g.questions)
            )
        );
    }, [groupedByComponent, sortedComponents]);

    // Contadores
    const counters = useMemo(() => {
        const total = questions.length;
        const validated = questions.filter(q => q.validated).length;
        return { total, validated, pending: total - validated };
    }, [questions]);



    const handleToggleValidation = async (question) => {
        const newValidated = !question.validated;
        try {
            await questionsApi.toggleValidation(question.id, newValidated);
            setQuestions(prev => prev.map(q =>
                q.id === question.id ? { ...q, validated: newValidated } : q
            ));
            setSuccess(newValidated ? 'Questão validada!' : 'Validação removida');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Erro ao atualizar validação: ' + err.message);
        }
    };

    const handleGenerateImage = async (question) => {
        setIsGeneratingImage(true);
        setError('');
        try {
            const response = await agentApi.generateImage(question);
            setQuestions(prev => prev.map(q =>
                q.id === question.id
                    ? { ...q, image_base64: response.image_base64, imageFromServer: response.image_url || null }
                    : q
            ));
            setSuccess('Imagem gerada e salva com sucesso!');
            return response.image_base64;
        } catch (err) {
            setError('Erro ao gerar imagem: ' + err.message);
            return null;
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const openRegenerateModal = (question) => {
        setQuestionToRegenerate(question);
        setRegenerateInstructions('');
        setShowRegenerateModal(true);
    };

    const handleRegenerateImage = async () => {
        if (!questionToRegenerate || !regenerateInstructions.trim()) {
            setError('Por favor, forneça instruções para correção da imagem.');
            return;
        }
        setIsGeneratingImage(true);
        setError('');
        setShowRegenerateModal(false);
        try {
            // Envia a imagem atual para edição (não gera do zero)
            const existingImage = questionToRegenerate.image_base64 || null;
            const response = await agentApi.regenerateImage(questionToRegenerate, regenerateInstructions, syncDistractors, existingImage);
            setQuestions(prev => prev.map(q => {
                if (q.id !== questionToRegenerate.id) return q;
                const updated = { ...q, image_base64: response.image_base64 };
                // Aplica distratores atualizados se disponíveis
                if (response.distractors_updated && response.alternatives) {
                    updated.alternatives = q.alternatives.map(alt => {
                        const updatedAlt = response.alternatives.find(a => a.letter === alt.letter);
                        if (updatedAlt && updatedAlt.modified) {
                            return { ...alt, distractor: updatedAlt.distractor };
                        }
                        return alt;
                    });
                }
                return updated;
            }));
            const successMsg = response.distractors_updated
                ? 'Imagem regenerada e distratores atualizados com sucesso! 🔄'
                : 'Imagem regenerada com sucesso!';
            setSuccess(successMsg);
            setQuestionToRegenerate(null);
            setRegenerateInstructions('');
        } catch (err) {
            setError('Erro ao regenerar imagem: ' + err.message);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleUpdateQuestion = (questionId, updatedFields) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, ...updatedFields } : q
        ));
        setSuccess('Questão atualizada com sucesso!');
    };



    const handleExport = async () => {
        if (!exportFileName.trim()) {
            setError('Digite um nome para o arquivo');
            return;
        }

        setIsExporting(true);
        setError('');

        try {
            const questionsToExport = questions;

            const formattedQuestions = questionsToExport.map(q => ({
                question_number: q.question_number,
                id_skill: q.id_skill,
                skill: q.skill,
                proficiency_level: q.proficiency_level,
                proficiency_description: q.proficiency_description,
                title: q.title,
                text: q.text,
                source: q.source,
                question_statement: q.question_statement,
                alternatives: q.alternatives,
                correct_answer: q.correct_answer,
                explanation_question: q.explanation_question,
                ...(q.image_base64 && { image_base64: q.image_base64 }),
                ...(!q.image_base64 && (q.image_url || q.imageFromServer) && {
                    image_url: q.image_url || q.imageFromServer
                }),
            }));

            await docApi.generateDocx(formattedQuestions, exportFileName);
            await docApi.downloadDocx(exportFileName);

            setSuccess('Documento exportado com sucesso!');
            setShowExportModal(false);
            setExportFileName('');
        } catch (err) {
            setError('Erro ao exportar: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };



    if (isLoading) {
        return <LoadingSpinner text="Carregando questões..." />;
    }

    if (isExporting) {
        return <LoadingSpinner text="Gerando documento DOCX..." />;
    }

    return (
        <Layout>
            <div className="page-header">
                <h1 className="page-title">📝 Minhas Questões</h1>
                <p className="page-subtitle">
                    {counters.total} {counters.total === 1 ? 'questão gerada' : 'questões geradas'}
                    {counters.validated > 0 && (
                        <span className="validated-badge"> • ✓ {counters.validated} validadas</span>
                    )}
                </p>
            </div>

            <div className="page-content">
                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button
                            onClick={() => setError('')}
                            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {success}
                        <button
                            onClick={() => setSuccess('')}
                            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Actions Bar */}
                {questions.length > 0 && (
                    <div className="card actions-card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="actions-bar">
                            <div className="actions-left">
                                <button className="btn btn-primary" onClick={() => navigate('/gerar-questoes')}>
                                    ✨ Gerar Mais
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
                                    📥 Exportar
                                </button>
                            </div>

                            {/* Filtros de validação */}
                            <div className="filter-tabs">
                                <button
                                    className={`filter-tab ${validationFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setValidationFilter('all')}
                                >
                                    Todas ({counters.total})
                                </button>
                                <button
                                    className={`filter-tab ${validationFilter === 'validated' ? 'active' : ''}`}
                                    onClick={() => setValidationFilter('validated')}
                                >
                                    ✓ Validadas ({counters.validated})
                                </button>
                                <button
                                    className={`filter-tab ${validationFilter === 'pending' ? 'active' : ''}`}
                                    onClick={() => setValidationFilter('pending')}
                                >
                                    ○ Pendentes ({counters.pending})
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Questions List - Grouped by Component and Skill */}
                {questions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3 className="empty-state-title">Nenhuma questão gerada ainda</h3>
                        <p>Comece gerando suas primeiras questões com IA.</p>
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ marginTop: 'var(--space-lg)' }}
                            onClick={() => navigate('/gerar-questoes')}
                        >
                            ✨ Gerar Questões
                        </button>
                    </div>
                ) : !hasQuestions ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3 className="empty-state-title">Nenhuma questão encontrada</h3>
                        <p>Tente outro filtro.</p>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setValidationFilter('all')}
                        >
                            Ver Todas
                        </button>
                    </div>
                ) : (
                    <div className="skill-groups-list">
                        {sortedComponents.map(compId => {
                            const gradeGroups = groupedByComponent[compId];
                            const sortedGrades = Object.keys(gradeGroups);
                            const allCompQuestions = sortedGrades.flatMap(g =>
                                Object.values(gradeGroups[g]).flatMap(s => s.questions)
                            );
                            return (
                                <ComponentGroup
                                    key={compId}
                                    componentId={compId}
                                    questions={allCompQuestions}
                                    defaultExpanded={false}
                                >
                                    {sortedGrades.map(grade => {
                                        const skillGroups = gradeGroups[grade];
                                        const sortedSkillNames = Object.keys(skillGroups).sort();
                                        const allGradeQuestions = sortedSkillNames.flatMap(s => skillGroups[s].questions);
                                        return (
                                            <GradeGroup
                                                key={grade}
                                                grade={grade}
                                                questions={allGradeQuestions}
                                                defaultExpanded={false}
                                            >
                                                {sortedSkillNames.map(skillName => {
                                                    const group = skillGroups[skillName];
                                                    return (
                                                        <SkillGroup
                                                            key={skillName}
                                                            skillName={skillName}
                                                            skillId={group.skillId}
                                                            questions={group.questions}
                                                            defaultExpanded={false}
                                                        >
                                                            <div className="questions-list">
                                                                {group.questions.map((question) => (
                                                                    <div key={question.id} style={{ position: 'relative' }}>
                                                                        <QuestionCard
                                                                            question={question}
                                                                            onGenerateImage={handleGenerateImage}
                                                                            onRegenerateImage={openRegenerateModal}
                                                                            onUpdateQuestion={handleUpdateQuestion}
                                                                            onToggleValidation={handleToggleValidation}
                                                                            isGeneratingImage={isGeneratingImage}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </SkillGroup>
                                                    );
                                                })}
                                            </GradeGroup>
                                        );
                                    })}
                                </ComponentGroup>
                            );
                        })}
                    </div>
                )}

                {/* Export Modal */}
                {showExportModal && (
                    <div
                        className="loading-overlay"
                        onClick={() => setShowExportModal(false)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div
                            className="card"
                            style={{ maxWidth: '400px', width: '90%' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="card-header">
                                <h3 className="card-title">📥 Exportar para DOCX</h3>
                            </div>

                            <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                                <label>Nome do arquivo</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: questoes-5ano-portugues"
                                    value={exportFileName}
                                    onChange={(e) => setExportFileName(e.target.value)}
                                />
                            </div>

                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                                {`Todas as ${questions.length} questões serão exportadas.`}
                            </p>

                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <button className="btn btn-primary" onClick={handleExport}>
                                    📥 Exportar
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Regenerate Image Modal */}
                {showRegenerateModal && (
                    <div
                        className="loading-overlay"
                        onClick={() => setShowRegenerateModal(false)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div
                            className="card"
                            style={{ maxWidth: '500px', width: '90%' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="card-header">
                                <h3 className="card-title">🖼️ Regenerar Imagem</h3>
                            </div>

                            <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                                <label>Instruções para correção</label>
                                <textarea
                                    className="input"
                                    placeholder="Ex: Mostre exatamente 3 maçãs vermelhas em cima de uma mesa, não inclua números..."
                                    value={regenerateInstructions}
                                    onChange={(e) => setRegenerateInstructions(e.target.value)}
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
                                Descreva o que precisa ser corrigido ou melhorado na imagem.
                            </p>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', cursor: 'pointer', fontSize: '0.875rem' }}>
                                <input
                                    type="checkbox"
                                    checked={syncDistractors}
                                    onChange={(e) => setSyncDistractors(e.target.checked)}
                                />
                                🔄 Sincronizar distratores com a nova imagem
                            </label>

                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <button className="btn btn-primary" onClick={handleRegenerateImage}>
                                    🔄 Regenerar
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowRegenerateModal(false)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout >
    );
}
