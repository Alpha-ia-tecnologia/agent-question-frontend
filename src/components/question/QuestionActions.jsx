/**
 * Botões de ação do card de questão
 */
export default function QuestionActions({
    isEditing,
    hasImage,
    isGeneratingImage,
    isValidated,
    onStartEditing,
    onSaveEdits,
    onCancelEdits,
    onGenerateImage,
    onRegenerateImage,
    onToggleValidation,
}) {
    if (isEditing) {
        return (
            <div className="question-actions">
                <button className="btn btn-primary btn-sm" onClick={onSaveEdits}>
                    💾 Salvar
                </button>
                <button className="btn btn-secondary btn-sm" onClick={onCancelEdits}>
                    ❌ Cancelar
                </button>
            </div>
        );
    }

    return (
        <div className="question-actions">
            <button className="btn btn-ghost btn-sm" onClick={onStartEditing}>
                ✏️ Editar
            </button>

            {!hasImage ? (
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={onGenerateImage}
                    disabled={isGeneratingImage}
                >
                    {isGeneratingImage ? '⏳ Gerando...' : '🖼️ Gerar Imagem'}
                </button>
            ) : (
                <>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={onGenerateImage}
                        disabled={isGeneratingImage}
                    >
                        {isGeneratingImage ? '⏳ Gerando...' : '🔄 Nova Imagem'}
                    </button>
                    {onRegenerateImage && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={onRegenerateImage}
                            disabled={isGeneratingImage}
                        >
                            ✏️ Corrigir Imagem
                        </button>
                    )}
                </>
            )}

            {/* Botão de Validação */}
            {onToggleValidation && (
                <button
                    className={`btn btn-sm ${isValidated ? 'btn-success' : 'btn-outline'}`}
                    onClick={onToggleValidation}
                    title={isValidated ? 'Remover validação' : 'Marcar como validada'}
                >
                    {isValidated ? '✓ Validada' : '○ Validar'}
                </button>
            )}

            <button className="btn btn-ghost btn-sm">
                📋 Copiar
            </button>
        </div>
    );
}
