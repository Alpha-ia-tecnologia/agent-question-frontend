import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import QuestionCard from '../components/QuestionCard';
import SkillGroup from '../components/SkillGroup';
import LoadingSpinner from '../components/LoadingSpinner';
import { questionsApi } from '../api/api';
import { evaluationData } from '../data/evaluationData';
import ComponentGroup from '../components/ComponentGroup';
import GradeGroup from '../components/GradeGroup';

export default function ValidatedQuestions() {
    const [questions, setQuestions] = useState([]);
    const [counts, setCounts] = useState({ total: 0, validated: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filtro de validação: 'all', 'validated', 'pending'
    const [validationFilter, setValidationFilter] = useState('all');

    const fetchCounts = useCallback(async () => {
        try {
            const data = await questionsApi.getCounts();
            setCounts(data);
        } catch (err) {
            console.error('Erro ao buscar contadores:', err);
        }
    }, []);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const params = { limit: 200 };
            if (validationFilter === 'validated') params.validated = true;
            else if (validationFilter === 'pending') params.validated = false;

            const data = await questionsApi.list(params);

            // Para questões com image_url, monta a URL completa
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
    }, [validationFilter]);

    useEffect(() => {
        fetchQuestions();
        fetchCounts();
    }, [fetchQuestions, fetchCounts]);

    // Agrupar por componente curricular e skill
    const { groupedByComponent, sortedComponents } = useMemo(() => {
        const inferComponent = (question) => {
            if (question.curriculum_component) return question.curriculum_component;
            const skill = question.skill || '';
            const idSkill = question.id_skill || '';
            // Estrutura: evaluationData[model].components[compKey][gradeKey] = [{ code, description }]
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

        const byComponent = {};
        questions.forEach(question => {
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

        const componentOrder = ['LP', 'MT', 'OTHER'];
        const sorted = Object.keys(byComponent).sort((a, b) => {
            return (componentOrder.indexOf(a) === -1 ? 99 : componentOrder.indexOf(a)) -
                (componentOrder.indexOf(b) === -1 ? 99 : componentOrder.indexOf(b));
        });

        return { groupedByComponent: byComponent, sortedComponents: sorted };
    }, [questions]);

    const handleToggleValidation = async (question) => {
        const newValidated = !question.validated;
        try {
            await questionsApi.toggleValidation(question.id, newValidated);

            // Atualiza local
            setQuestions(prev =>
                prev.map(q =>
                    q.id === question.id ? { ...q, validated: newValidated } : q
                )
            );

            // Atualiza contadores
            setCounts(prev => ({
                ...prev,
                validated: newValidated ? prev.validated + 1 : prev.validated - 1,
                pending: newValidated ? prev.pending - 1 : prev.pending + 1,
            }));

            setSuccess(newValidated ? '✓ Questão validada!' : 'Validação removida');
            setTimeout(() => setSuccess(''), 2500);
        } catch (err) {
            setError('Erro ao atualizar validação: ' + err.message);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <LoadingSpinner text="Carregando questões do banco de dados..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-header">
                <h1 className="page-title">✅ Validação de Questões</h1>
                <p className="page-subtitle">
                    Revise e valide a qualidade das questões geradas, organizadas por habilidade.
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

                {/* Stats + Filters */}
                <div className="validation-stats-bar">
                    <div className="validation-counters">
                        <div className="validation-counter">
                            <span className="validation-counter-value">{counts.total}</span>
                            <span className="validation-counter-label">Total</span>
                        </div>
                        <div className="validation-counter validated">
                            <span className="validation-counter-value">{counts.validated}</span>
                            <span className="validation-counter-label">Validadas</span>
                        </div>
                        <div className="validation-counter pending">
                            <span className="validation-counter-value">{counts.pending}</span>
                            <span className="validation-counter-label">Pendentes</span>
                        </div>
                        {counts.total > 0 && (
                            <div className="validation-progress-wrapper">
                                <div className="validation-progress-bar">
                                    <div
                                        className="validation-progress-fill"
                                        style={{ width: `${(counts.validated / counts.total) * 100}%` }}
                                    />
                                </div>
                                <span className="validation-progress-text">
                                    {Math.round((counts.validated / counts.total) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${validationFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setValidationFilter('all')}
                        >
                            Todas ({counts.total})
                        </button>
                        <button
                            className={`filter-tab ${validationFilter === 'validated' ? 'active' : ''}`}
                            onClick={() => setValidationFilter('validated')}
                        >
                            ✓ Validadas ({counts.validated})
                        </button>
                        <button
                            className={`filter-tab ${validationFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setValidationFilter('pending')}
                        >
                            ○ Pendentes ({counts.pending})
                        </button>
                    </div>
                </div>

                {/* Question List */}
                {questions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            {validationFilter === 'validated' ? '🏆' : validationFilter === 'pending' ? '📋' : '📝'}
                        </div>
                        <h3 className="empty-state-title">
                            {validationFilter === 'validated'
                                ? 'Nenhuma questão validada ainda'
                                : validationFilter === 'pending'
                                    ? 'Todas as questões foram validadas!'
                                    : 'Nenhuma questão salva no banco de dados'}
                        </h3>
                        <p>
                            {validationFilter === 'all'
                                ? 'Gere questões e salve para que elas apareçam aqui para validação.'
                                : 'Tente outro filtro.'}
                        </p>
                        {validationFilter !== 'all' && (
                            <button
                                className="btn btn-secondary"
                                style={{ marginTop: 'var(--space-md)' }}
                                onClick={() => setValidationFilter('all')}
                            >
                                Ver Todas
                            </button>
                        )}
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
                                                                    <QuestionCard
                                                                        key={question.id}
                                                                        question={question}
                                                                        onToggleValidation={handleToggleValidation}
                                                                        isGeneratingImage={false}
                                                                    />
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
            </div>
        </Layout>
    );
}
