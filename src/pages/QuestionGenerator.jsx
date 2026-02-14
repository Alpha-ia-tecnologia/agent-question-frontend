import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import GenerationProgress from '../components/GenerationProgress';
import { agentApi } from '../api/api';
import {
    evaluationData,
    curriculumComponents,
    grades,
    getFilteredSkills,
    getAvailableGrades
} from '../data/evaluationData';

export default function QuestionGenerator() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        countQuestions: 5,
        countAlternatives: 4,
        skill: '',
        proficiencyLevel: '',
        grade: '',
        curriculumComponent: '',
        useRealText: false,
        imageDependency: 'none',
        modelEvaluationType: 'SAEB',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [progressEvents, setProgressEvents] = useState([]);

    // Dados do modelo atual
    const currentModel = useMemo(() =>
        evaluationData[formData.modelEvaluationType] || evaluationData['SAEB'],
        [formData.modelEvaluationType]);

    // Anos disponíveis baseados no modelo e componente selecionados
    const availableGrades = useMemo(() => {
        if (!formData.curriculumComponent) return [];
        return getAvailableGrades(formData.modelEvaluationType, formData.curriculumComponent);
    }, [formData.modelEvaluationType, formData.curriculumComponent]);

    // Habilidades filtradas baseadas no modelo, componente e ano
    const filteredSkills = useMemo(() => {
        if (!formData.curriculumComponent || !formData.grade) return [];
        return getFilteredSkills(
            formData.modelEvaluationType,
            formData.curriculumComponent,
            formData.grade
        );
    }, [formData.modelEvaluationType, formData.curriculumComponent, formData.grade]);

    // Efeito para limpar campos dependentes quando o modelo muda
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            curriculumComponent: '',
            grade: '',
            skill: '',
            proficiencyLevel: '',
        }));
    }, [formData.modelEvaluationType]);

    // Efeito para limpar ano e habilidade quando componente muda
    useEffect(() => {
        if (formData.curriculumComponent) {
            setFormData(prev => ({
                ...prev,
                grade: '',
                skill: '',
            }));
        }
    }, [formData.curriculumComponent]);

    // Efeito para limpar habilidade quando ano muda
    useEffect(() => {
        if (formData.grade) {
            setFormData(prev => ({
                ...prev,
                skill: '',
            }));
        }
    }, [formData.grade]);

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
        setIsLoading(true);
        setProgressEvents([]);

        try {
            const result = await agentApi.generateQuestionsStream(formData, (event) => {
                setProgressEvents((prev) => [...prev, event]);
            });

            if (result && result.questions) {
                // Questions are auto-saved to DB by the backend during generation
                // Just redirect to the validation page
                setTimeout(() => navigate('/validacao'), 1500);
            } else {
                setError('Nenhuma questão foi gerada. Tente novamente.');
                setIsLoading(false);
            }
        } catch (err) {
            setError(err.message || 'Erro ao gerar questões. Tente novamente.');
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            countQuestions: 5,
            countAlternatives: 4,
            skill: '',
            proficiencyLevel: '',
            grade: '',
            curriculumComponent: '',
            useRealText: false,
            imageDependency: 'none',
            modelEvaluationType: 'SAEB',
        });
    };

    if (isLoading) {
        return <GenerationProgress events={progressEvents} error={error} />;
    }

    return (
        <Layout>
            <div className="page-header">
                <h1 className="page-title">✨ Gerar Questões</h1>
                <p className="page-subtitle">Configure os parâmetros para gerar questões educacionais com IA</p>
            </div>

            <div className="page-content">
                <div className="card">
                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="generator-form">
                            {/* 1. Modelo de Avaliação */}
                            <div className="input-group">
                                <label htmlFor="modelEvaluationType">Modelo de Avaliação</label>
                                <select
                                    id="modelEvaluationType"
                                    name="modelEvaluationType"
                                    className="input"
                                    value={formData.modelEvaluationType}
                                    onChange={handleChange}
                                    required
                                >
                                    {Object.entries(evaluationData).map(([key, data]) => (
                                        <option key={key} value={key}>{data.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Componente Curricular */}
                            <div className="input-group">
                                <label htmlFor="curriculumComponent">Componente Curricular</label>
                                <select
                                    id="curriculumComponent"
                                    name="curriculumComponent"
                                    className="input"
                                    value={formData.curriculumComponent}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {curriculumComponents.map((comp) => (
                                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Ano/Série */}
                            <div className="input-group">
                                <label htmlFor="grade">Ano/Série</label>
                                <select
                                    id="grade"
                                    name="grade"
                                    className="input"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.curriculumComponent}
                                >
                                    <option value="">
                                        {formData.curriculumComponent
                                            ? 'Selecione...'
                                            : 'Selecione o componente primeiro'}
                                    </option>
                                    {availableGrades.length > 0 ? (
                                        availableGrades.map((grade) => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))
                                    ) : formData.curriculumComponent && (
                                        <>
                                            <optgroup label="Ensino Fundamental I">
                                                {grades.fundamentalI.map((g) => (
                                                    <option key={g.value} value={g.value}>{g.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Ensino Fundamental II">
                                                {grades.fundamentalII.map((g) => (
                                                    <option key={g.value} value={g.value}>{g.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Ensino Médio">
                                                {grades.medio.map((g) => (
                                                    <option key={g.value} value={g.value}>{g.label}</option>
                                                ))}
                                            </optgroup>
                                        </>
                                    )}
                                </select>
                                {formData.curriculumComponent && availableGrades.length > 0 && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        {availableGrades.length} ano(s) com habilidades cadastradas
                                    </p>
                                )}
                            </div>

                            {/* 4. Habilidade (Filtrada por Modelo, Componente e Ano) */}
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="skill">Habilidade (Descritor)</label>
                                <select
                                    id="skill"
                                    name="skill"
                                    className="input"
                                    value={formData.skill}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.grade}
                                >
                                    <option value="">
                                        {formData.grade
                                            ? 'Selecione a habilidade...'
                                            : 'Selecione o ano/série primeiro'}
                                    </option>
                                    {filteredSkills.map((skill) => (
                                        <option key={skill.code} value={`${skill.code} - ${skill.description}`}>
                                            {skill.code} - {skill.description}
                                        </option>
                                    ))}
                                </select>
                                {formData.grade && filteredSkills.length > 0 && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        {filteredSkills.length} habilidade(s) disponível(is) para {formData.modelEvaluationType} - {curriculumComponents.find(c => c.id === formData.curriculumComponent)?.name} - {formData.grade}
                                    </p>
                                )}
                                {formData.grade && filteredSkills.length === 0 && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '4px' }}>
                                        ⚠️ Nenhuma habilidade cadastrada para esta combinação. Selecione outro ano/série.
                                    </p>
                                )}
                            </div>

                            {/* 5. Nível de Proficiência */}
                            <div className="input-group">
                                <label htmlFor="proficiencyLevel">Nível de Proficiência</label>
                                <select
                                    id="proficiencyLevel"
                                    name="proficiencyLevel"
                                    className="input"
                                    value={formData.proficiencyLevel}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecione o nível...</option>
                                    {currentModel.proficiencyLevels.map((prof) => (
                                        <option key={prof.level} value={prof.level}>
                                            {prof.level}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 6. Quantidade de Questões */}
                            <div className="input-group">
                                <label htmlFor="countQuestions">Quantidade de Questões</label>
                                <input
                                    id="countQuestions"
                                    name="countQuestions"
                                    type="number"
                                    className="input"
                                    min="1"
                                    max="10"
                                    value={formData.countQuestions}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* 7. Quantidade de Alternativas */}
                            <div className="input-group">
                                <label htmlFor="countAlternatives">Alternativas por Questão</label>
                                <select
                                    id="countAlternatives"
                                    name="countAlternatives"
                                    className="input"
                                    value={formData.countAlternatives}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value={4}>4 alternativas (A-D)</option>
                                    <option value={5}>5 alternativas (A-E)</option>
                                </select>
                            </div>



                            {/* 9. Dependência de Imagem */}
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="imageDependency">🖼️ Dependência de Imagem</label>
                                <select
                                    id="imageDependency"
                                    name="imageDependency"
                                    className="input"
                                    value={formData.imageDependency}
                                    onChange={handleChange}
                                >
                                    <option value="none">Sem imagem - Questões resolvidas apenas com texto</option>
                                    <option value="optional">Imagem opcional - Ilustrativa, não essencial</option>
                                    <option value="required">Imagem obrigatória - Resolução depende da imagem</option>
                                </select>
                                {formData.imageDependency === 'required' && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '4px' }}>
                                        ⚠️ As questões serão geradas junto com as imagens automaticamente.
                                        A IA gerará e validará cada imagem durante o pipeline.
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="generator-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={!formData.skill || !formData.proficiencyLevel}
                                >
                                    ✨ Gerar Questões
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleReset}
                                >
                                    🔄 Limpar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
