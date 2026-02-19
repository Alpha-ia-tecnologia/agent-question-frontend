import { useMemo } from 'react';

/**
 * Hook para gerenciar a lógica de fonte de imagem da questão
 * Prioridade: image_base64 > imageFromServer
 */
export function useQuestionImage(question) {
    const imageSrc = useMemo(() => {
        if (question.image_base64) {
            return `data:image/png;base64,${question.image_base64}`;
        }
        if (question.imageFromServer) {
            return question.imageFromServer;
        }
        return null;
    }, [question.image_base64, question.imageFromServer]);

    const hasImage = Boolean(imageSrc);

    return { imageSrc, hasImage };
}
