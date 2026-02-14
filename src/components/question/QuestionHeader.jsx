/**
 * Cabeçalho do card de questão com número, skill e ícone de expansão
 */
export default function QuestionHeader({ questionNumber, skillId, isExpanded, isValidated, onToggle }) {
    return (
        <div className="question-header" onClick={onToggle}>
            <div className="question-number">
                <div className="question-badge">{questionNumber}</div>
                <div>
                    <strong>Questão {questionNumber}</strong>
                    <span className="question-skill">{skillId}</span>
                    {isValidated && <span className="validation-badge">✓ Validada</span>}
                </div>
            </div>
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                ▼
            </span>
        </div>
    );
}
