import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function QuestionImage({ imageSrc }) {
    const [failed, setFailed] = useState(false)

    if (!imageSrc) return null

    // Guarda contra URLs claramente inválidas (vazias, só "/", sem extensão útil)
    const looksInvalid = typeof imageSrc === 'string' && (
        imageSrc === '' ||
        imageSrc === '/' ||
        /\/$/.test(imageSrc)
    )
    if (looksInvalid) return null

    if (failed) {
        return (
            <div className="my-4 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-10 px-4 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <ImageOff className="size-6" />
                    <span>Imagem indisponível</span>
                </div>
            </div>
        )
    }

    return (
        <div className="my-4 flex justify-center">
            <img
                src={imageSrc}
                alt="Ilustração da questão"
                className="max-h-96 rounded-lg border border-border bg-muted/30 object-contain"
                onError={() => {
                    console.error('Erro ao carregar imagem:', imageSrc)
                    setFailed(true)
                }}
            />
        </div>
    )
}
