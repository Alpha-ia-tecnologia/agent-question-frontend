export default function QuestionImage({ imageSrc }) {
    if (!imageSrc) return null
    return (
        <div className="my-4 flex justify-center">
            <img
                src={imageSrc}
                alt="Ilustração da questão"
                className="max-h-96 rounded-lg border border-border bg-muted/30 object-contain"
                onError={(e) => {
                    console.error('Erro ao carregar imagem:', imageSrc?.substring(0, 50))
                    e.target.style.display = 'none'
                }}
            />
        </div>
    )
}
