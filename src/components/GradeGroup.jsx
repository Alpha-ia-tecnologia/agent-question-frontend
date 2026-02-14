import { useState } from 'react';

export default function GradeGroup({
    grade,
    questions,
    children,
    defaultExpanded = true
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const totalQuestions = questions?.length || 0;
    const validatedCount = questions?.filter(q => q.validated)?.length || 0;

    return (
        <div className={`grade-group ${isExpanded ? 'expanded' : ''}`}>
            <button
                className="grade-group__header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <div className="grade-group__title">
                    <span className="grade-group__icon">🎓</span>
                    <h3 className="grade-group__name">{grade}</h3>
                    <span className="grade-group__badge">{totalQuestions} questões</span>
                    {validatedCount > 0 && (
                        <span className="grade-group__validated">
                            ✅ {validatedCount}
                        </span>
                    )}
                </div>
                <span className={`grade-group__chevron ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                </span>
            </button>

            {isExpanded && (
                <div className="grade-group__content">
                    {children}
                </div>
            )}
        </div>
    );
}
