import { useState } from 'react';

/**
 * Componente de grupo de habilidades com accordion
 * Agrupa questões por skill com expand/collapse
 */
export default function SkillGroup({
    skillName,
    skillId,
    questions,
    children,
    defaultExpanded = true
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Calcula contadores
    const totalQuestions = questions?.length || 0;
    const validatedCount = questions?.filter(q => q.validated)?.length || 0;
    const progress = totalQuestions > 0 ? (validatedCount / totalQuestions) * 100 : 0;

    return (
        <div className={`skill-group ${isExpanded ? 'expanded' : ''}`}>
            <div
                className="skill-group-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="skill-group-info">
                    <div className="skill-group-icon">📚</div>
                    <div className="skill-group-text">
                        <h3 className="skill-group-title">{skillName}</h3>
                        {skillId && (
                            <span className="skill-group-id">{skillId}</span>
                        )}
                    </div>
                </div>

                <div className="skill-group-meta">
                    {/* Barra de progresso */}
                    <div className="skill-group-progress">
                        <div
                            className="skill-group-progress-bar"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Badge de contagem */}
                    <div className="skill-group-badge">
                        <span className="validated-count">{validatedCount}</span>
                        <span className="separator">/</span>
                        <span className="total-count">{totalQuestions}</span>
                    </div>

                    <span className={`skill-group-expand ${isExpanded ? 'expanded' : ''}`}>
                        ▼
                    </span>
                </div>
            </div>

            <div className={`skill-group-content ${isExpanded ? 'expanded' : ''}`}>
                {children}
            </div>
        </div>
    );
}
