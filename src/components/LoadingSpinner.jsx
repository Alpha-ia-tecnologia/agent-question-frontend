export default function LoadingSpinner({ text = 'Carregando...' }) {
    return (
        <div className="loading-overlay">
            <div>
                <div className="loading-spinner"></div>
                <p className="loading-text">{text}</p>
            </div>
        </div>
    );
}
