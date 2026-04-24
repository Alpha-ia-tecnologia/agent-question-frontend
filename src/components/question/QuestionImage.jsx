import { useState, useEffect } from 'react'
import { ImageOff, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function QuestionImage({ imageSrc, onRegenerate, isRegenerating }) {
    const [failed, setFailed] = useState(false)

    // Reset failed state when src changes (e.g., após regerar)
    useEffect(() => {
        setFailed(false)
    }, [imageSrc])

    if (!imageSrc) return null

    const looksInvalid = typeof imageSrc === 'string' && (
        imageSrc === '' ||
        imageSrc === '/' ||
        /\/$/.test(imageSrc)
    )
    if (looksInvalid) return null

    if (failed) {
        return (
            <div className="my-4 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 py-8 px-4 text-center text-sm text-muted-foreground">
                <ImageOff className="size-6" />
                <div>
                    <div className="font-medium text-foreground">Imagem indisponível</div>
                    <p className="mt-0.5 text-xs">O arquivo original foi perdido do servidor. Gere uma nova imagem.</p>
                </div>
                {onRegenerate && (
                    <Button size="sm" variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
                        {isRegenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                        {isRegenerating ? 'Gerando…' : 'Regerar imagem'}
                    </Button>
                )}
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
