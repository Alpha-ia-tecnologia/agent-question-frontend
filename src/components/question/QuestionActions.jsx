import { Button } from '@/components/ui/button'
import {
    Pencil, Save, X, Image as ImageIcon, RefreshCw, Wrench, CheckCircle2, Circle, Loader2,
    FileEdit,
} from 'lucide-react'

export default function QuestionActions({
    isEditing,
    hasImage,
    isGeneratingImage,
    isRegeneratingQuestion,
    isValidated,
    onStartEditing,
    onSaveEdits,
    onCancelEdits,
    onGenerateImage,
    onRegenerateImage,
    onRegenerateQuestion,
    onToggleValidation,
}) {
    if (isEditing) {
        return (
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 bg-muted/20">
                <Button size="sm" onClick={onSaveEdits}><Save className="size-3.5" />Salvar</Button>
                <Button size="sm" variant="outline" onClick={onCancelEdits}><X className="size-3.5" />Cancelar</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 bg-muted/20">
            <Button size="sm" variant="ghost" onClick={onStartEditing}><Pencil className="size-3.5" />Editar</Button>

            {!hasImage ? (
                <Button size="sm" variant="outline" onClick={onGenerateImage} disabled={isGeneratingImage}>
                    {isGeneratingImage ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                    {isGeneratingImage ? 'Gerando…' : 'Gerar Imagem'}
                </Button>
            ) : (
                <>
                    <Button size="sm" variant="outline" onClick={onGenerateImage} disabled={isGeneratingImage}>
                        {isGeneratingImage ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                        {isGeneratingImage ? 'Gerando…' : 'Nova Imagem'}
                    </Button>
                    {onRegenerateImage && (
                        <Button size="sm" variant="ghost" onClick={onRegenerateImage} disabled={isGeneratingImage}>
                            <Wrench className="size-3.5" />Corrigir Imagem
                        </Button>
                    )}
                </>
            )}

            {onRegenerateQuestion && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRegenerateQuestion}
                    disabled={isRegeneratingQuestion}
                    title="Regenerar questão com orientações do revisor"
                >
                    {isRegeneratingQuestion ? <Loader2 className="size-3.5 animate-spin" /> : <FileEdit className="size-3.5" />}
                    {isRegeneratingQuestion ? 'Regenerando…' : 'Regenerar Questão'}
                </Button>
            )}

            {onToggleValidation && (
                <Button
                    size="sm"
                    variant={isValidated ? 'default' : 'outline'}
                    onClick={onToggleValidation}
                    className={isValidated ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : ''}
                    title={isValidated ? 'Remover validação' : 'Marcar como validada'}
                >
                    {isValidated ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
                    {isValidated ? 'Validada' : 'Validar'}
                </Button>
            )}
        </div>
    )
}
