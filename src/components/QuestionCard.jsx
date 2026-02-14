import { useState } from 'react';
import { useQuestionImage } from '../hooks/useQuestionImage';
import { useQuestionEdit } from '../hooks/useQuestionEdit';
import QuestionHeader from './question/QuestionHeader';
import QuestionImage from './question/QuestionImage';
import AlternativesList from './question/AlternativesList';
import QuestionActions from './question/QuestionActions';

/**
 * Card de questão modular e expansível
 */
export default function QuestionCard({
    question,
    onGenerateImage,
    onRegenerateImage,
    onUpdateQuestion,
    onToggleValidation,
    isGeneratingImage
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const { imageSrc, hasImage } = useQuestionImage(question);
    const {
        isEditing,
        editedQuestion,
        startEditing,
        handleSaveEdits,
        handleCancelEdits,
        handleAlternativeChange,
        handleDistractorChange,
        updateField,
    } = useQuestionEdit(question, onUpdateQuestion);

    const handleGenerateImage = async () => {
        if (onGenerateImage) {
            await onGenerateImage(question);
        }
    };

    return (
        <div className={`question-card ${question.validated ? 'validated' : ''}`}>
            <QuestionHeader
                questionNumber={question.question_number}
                skillId={question.id_skill}
                isExpanded={isExpanded}
                isValidated={question.validated}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    <div className="question-body">
                        {/* Texto de apoio */}
                        <div className="question-text">
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        className="input input-title"
                                        value={editedQuestion.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        placeholder="Título"
                                    />
                                    <textarea
                                        className="input input-text"
                                        value={editedQuestion.text}
                                        onChange={(e) => updateField('text', e.target.value)}
                                        rows={5}
                                        placeholder="Texto de apoio"
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="question-text-title">{question.title}</div>
                                    <div className="question-text-content">{question.text}</div>
                                </>
                            )}
                            <div className="question-text-source">
                                {question.source_author && (
                                    <span className="source-author">
                                        Autor: {question.source_author} |
                                    </span>
                                )}
                                {' '}{question.source}
                                {question.source_url && (
                                    <a
                                        href={question.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="source-link"
                                    >
                                        🔗 Ver fonte original
                                    </a>
                                )}
                            </div>
                        </div>

                        <QuestionImage imageSrc={imageSrc} />

                        {/* Alerta: imagem falhou na validação automática */}
                        {question.needs_manual_image && !hasImage && (
                            <div className="image-validation-alert">
                                <span className="alert-icon">⚠️</span>
                                <div className="alert-content">
                                    <strong>Imagem não validada automaticamente</strong>
                                    <p>A validação automática falhou após 2 tentativas. Gere a imagem manualmente.</p>
                                    {question.image_validation_issues?.length > 0 && (
                                        <ul className="validation-issues">
                                            {question.image_validation_issues.map((issue, i) => (
                                                <li key={i}>{issue}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Enunciado */}
                        {isEditing ? (
                            <textarea
                                className="input input-statement"
                                value={editedQuestion.question_statement}
                                onChange={(e) => updateField('question_statement', e.target.value)}
                                rows={3}
                                placeholder="Enunciado da questão"
                            />
                        ) : (
                            <p className="question-statement">{question.question_statement}</p>
                        )}

                        <AlternativesList
                            alternatives={isEditing ? editedQuestion.alternatives : question.alternatives}
                            correctAnswer={question.correct_answer}
                            isEditing={isEditing}
                            onAlternativeChange={handleAlternativeChange}
                            onDistractorChange={handleDistractorChange}
                        />

                        {/* Explicação */}
                        <div className="question-explanation">
                            <div className="question-explanation-title">💡 Explicação</div>
                            {isEditing ? (
                                <textarea
                                    className="input input-explanation"
                                    value={editedQuestion.explanation_question}
                                    onChange={(e) => updateField('explanation_question', e.target.value)}
                                    rows={3}
                                    placeholder="Explicação"
                                />
                            ) : (
                                <p className="question-explanation-text">{question.explanation_question}</p>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="question-tags">
                            <span className="tag tag-skill">{question.skill}</span>
                            <span className="tag tag-proficiency">{question.proficiency_level}</span>
                        </div>
                    </div>

                    <QuestionActions
                        isEditing={isEditing}
                        hasImage={hasImage}
                        isGeneratingImage={isGeneratingImage}
                        isValidated={question.validated}
                        onStartEditing={startEditing}
                        onSaveEdits={handleSaveEdits}
                        onCancelEdits={handleCancelEdits}
                        onGenerateImage={handleGenerateImage}
                        onRegenerateImage={onRegenerateImage ? () => onRegenerateImage(question) : null}
                        onToggleValidation={onToggleValidation ? () => onToggleValidation(question) : null}
                    />
                </>
            )}
        </div>
    );
}
