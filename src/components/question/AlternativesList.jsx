import { useState } from 'react';

/**
 * Lista de alternativas da questão com distratores e modo de edição
 */
export default function AlternativesList({
    alternatives,
    correctAnswer,
    isEditing,
    onAlternativeChange,
    onDistractorChange
}) {
    // Inicializa com todos os distratores visíveis por padrão
    const [expandedDistractors, setExpandedDistractors] = useState(() => {
        const initial = {};
        alternatives.forEach(alt => {
            if (alt.distractor && alt.distractor.trim()) {
                initial[alt.letter] = true;
            }
        });
        return initial;
    });

    const toggleDistractor = (letter) => {
        setExpandedDistractors(prev => ({
            ...prev,
            [letter]: !prev[letter]
        }));
    };

    return (
        <div className="alternatives-list">
            {alternatives.map((alt, index) => {
                const isCorrect = alt.letter === correctAnswer;
                const hasDistractor = alt.distractor && alt.distractor.trim();
                const isExpanded = expandedDistractors[alt.letter];

                return (
                    <div key={alt.letter} className="alternative-wrapper">
                        <div className={`alternative ${isCorrect ? 'correct' : ''}`}>
                            <span className="alternative-letter">{alt.letter}</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input alternative-input"
                                    value={alt.text}
                                    onChange={(e) => onAlternativeChange(index, e.target.value)}
                                />
                            ) : (
                                <span className="alternative-text">{alt.text}</span>
                            )}
                            {(hasDistractor || isEditing) && (
                                <button
                                    className={`distractor-toggle ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleDistractor(alt.letter)}
                                    title={isExpanded ? 'Ocultar distrator' : 'Ver distrator'}
                                >
                                    💬
                                </button>
                            )}
                        </div>

                        {isExpanded && (
                            <div className={`distractor-explanation ${isCorrect ? 'distractor-correct' : 'distractor-incorrect'}`}>
                                {isEditing ? (
                                    <textarea
                                        className="input distractor-input"
                                        value={alt.distractor || ''}
                                        onChange={(e) => onDistractorChange(index, e.target.value)}
                                        rows={2}
                                        placeholder={isCorrect
                                            ? 'Explique por que esta é a alternativa correta'
                                            : 'Explique por que esta alternativa é incorreta'
                                        }
                                    />
                                ) : (
                                    <p className="distractor-text">
                                        <span className={`distractor-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}`}>
                                            {isCorrect ? '✅ Correta' : '❌ Incorreta'}
                                        </span>
                                        {alt.distractor}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
