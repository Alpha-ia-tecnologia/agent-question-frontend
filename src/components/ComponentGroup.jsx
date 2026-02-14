import { useState } from 'react';

const COMPONENT_CONFIG = {
    'LP': { name: 'Língua Portuguesa', icon: '📖', color: '#3b82f6' },
    'MT': { name: 'Matemática', icon: '📐', color: '#10b981' },
    'CN': { name: 'Ciências da Natureza', icon: '🔬', color: '#f59e0b' },
    'CH': { name: 'Ciências Humanas', icon: '🌍', color: '#8b5cf6' },
};

export default function ComponentGroup({
    componentId,
    questions,
    children,
    defaultExpanded = true
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const config = COMPONENT_CONFIG[componentId] || { name: componentId, icon: '📚', color: '#6366f1' };

    const totalQuestions = questions?.length || 0;
    const validatedCount = questions?.filter(q => q.validated)?.length || 0;

    return (
        <div className="component-group" style={{ '--component-color': config.color }}>
            <button
                className="component-group__header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <div className="component-group__title">
                    <span className="component-group__icon">{config.icon}</span>
                    <h2 className="component-group__name">{config.name}</h2>
                    <span className="component-group__badge">{totalQuestions} questões</span>
                    {validatedCount > 0 && (
                        <span className="component-group__validated">
                            ✅ {validatedCount} validadas
                        </span>
                    )}
                </div>
                <span className={`component-group__chevron ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                </span>
            </button>

            {isExpanded && (
                <div className="component-group__content">
                    {children}
                </div>
            )}
        </div>
    );
}
