/**
 * Componente de exibição de imagem da questão com tratamento de erro
 */
export default function QuestionImage({ imageSrc }) {
    if (!imageSrc) return null;

    return (
        <div className="question-image-container">
            <img
                src={imageSrc}
                alt="Ilustração da questão"
                className="question-image"
                onError={(e) => {
                    console.error('Erro ao carregar imagem:', imageSrc?.substring(0, 50));
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );
}
