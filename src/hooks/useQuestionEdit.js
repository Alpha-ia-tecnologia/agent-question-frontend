import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar o estado de edição da questão
 */
export function useQuestionEdit(question, onUpdateQuestion) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState({
        title: question.title,
        text: question.text,
        question_statement: question.question_statement,
        alternatives: [...question.alternatives],
        explanation_question: question.explanation_question,
    });

    // Sincroniza quando a questão muda externamente
    useEffect(() => {
        setEditedQuestion({
            title: question.title,
            text: question.text,
            question_statement: question.question_statement,
            alternatives: [...question.alternatives],
            explanation_question: question.explanation_question,
        });
    }, [question]);

    const handleSaveEdits = useCallback(() => {
        if (onUpdateQuestion) {
            onUpdateQuestion(question.id, editedQuestion);
        }
        setIsEditing(false);
    }, [onUpdateQuestion, question.id, editedQuestion]);

    const handleCancelEdits = useCallback(() => {
        setEditedQuestion({
            title: question.title,
            text: question.text,
            question_statement: question.question_statement,
            alternatives: [...question.alternatives],
            explanation_question: question.explanation_question,
        });
        setIsEditing(false);
    }, [question]);

    const handleAlternativeChange = useCallback((index, newText) => {
        setEditedQuestion(prev => {
            const updatedAlternatives = [...prev.alternatives];
            updatedAlternatives[index] = { ...updatedAlternatives[index], text: newText };
            return { ...prev, alternatives: updatedAlternatives };
        });
    }, []);

    const handleDistractorChange = useCallback((index, newDistractor) => {
        setEditedQuestion(prev => {
            const updatedAlternatives = [...prev.alternatives];
            updatedAlternatives[index] = { ...updatedAlternatives[index], distractor: newDistractor };
            return { ...prev, alternatives: updatedAlternatives };
        });
    }, []);

    const updateField = useCallback((field, value) => {
        setEditedQuestion(prev => ({ ...prev, [field]: value }));
    }, []);

    const startEditing = useCallback(() => setIsEditing(true), []);

    return {
        isEditing,
        editedQuestion,
        startEditing,
        handleSaveEdits,
        handleCancelEdits,
        handleAlternativeChange,
        handleDistractorChange,
        updateField,
    };
}
