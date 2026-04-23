import { useMemo } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050'

function resolveUrl(url) {
    if (!url || typeof url !== 'string') return null
    const trimmed = url.trim()
    if (!trimmed || trimmed === '/' || trimmed.endsWith('/')) return null
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed
    return `${API_BASE.replace(/\/$/, '')}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}

/**
 * Fonte da imagem da questão. Prioridade:
 * 1. image_base64 (embutido) — usado logo após geração em memória
 * 2. image_url (servidor) — persistido no banco; sobrevive a refresh
 * 3. imageFromServer (campo legado) — fallback
 */
export function useQuestionImage(question) {
    const imageSrc = useMemo(() => {
        if (question.image_base64) {
            return `data:image/png;base64,${question.image_base64}`
        }
        if (question.image_url) {
            return resolveUrl(question.image_url)
        }
        if (question.imageFromServer) {
            return resolveUrl(question.imageFromServer)
        }
        return null
    }, [question.image_base64, question.image_url, question.imageFromServer])

    const hasImage = Boolean(imageSrc)

    return { imageSrc, hasImage }
}
