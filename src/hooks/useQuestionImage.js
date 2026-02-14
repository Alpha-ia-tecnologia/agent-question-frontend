import { useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Hook para gerenciar a lógica de fonte de imagem da questão
 * Prioridade: image_base64 > imageFromServer > image_url
 */
export function useQuestionImage(question) {
    const imageSrc = useMemo(() => {
        if (question.image_base64) {
            return `data:image/png;base64,${question.image_base64}`;
        }
        if (question.imageFromServer) {
            return question.imageFromServer;
        }
        if (question.image_url) {
            // Handle both absolute and relative URLs
            return question.image_url.startsWith('http')
                ? question.image_url
                : `${API_BASE}${question.image_url}`;
        }
        return null;
    }, [question.image_base64, question.imageFromServer, question.image_url]);

    const hasImage = Boolean(imageSrc);

    return { imageSrc, hasImage };
}
