/**
 * AgentAvatars - 5 SVG Specialist Agent Characters
 * Each avatar is a unique animated robot with personality matching its role.
 */

// ── Pesquisador (Searcher) ─ Sky blue, magnifying glass, books ──
export function AvatarPesquisador({ size = 80, active = false }) {
    const cls = `agent-avatar ${active ? 'agent-avatar--active' : ''}`;
    return (
        <div className={cls} style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head */}
                <rect x="30" y="18" width="60" height="52" rx="16" fill="#0c2d48" stroke="#0ea5e9" strokeWidth="2.5" />
                {/* Visor */}
                <rect x="40" y="32" width="40" height="16" rx="6" fill="#0ea5e9" opacity="0.85">
                    {active && <animate attributeName="opacity" values="0.85;1;0.6;1;0.85" dur="2s" repeatCount="indefinite" />}
                </rect>
                {/* Eyes */}
                <circle cx="50" cy="40" r="4" fill="#e0f2fe">
                    {active && <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />}
                </circle>
                <circle cx="70" cy="40" r="4" fill="#e0f2fe">
                    {active && <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />}
                </circle>
                {/* Antenna */}
                <line x1="60" y1="18" x2="60" y2="8" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="6" r="4" fill="#0ea5e9">
                    {active && <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />}
                    {active && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
                </circle>
                {/* Body */}
                <rect x="38" y="72" width="44" height="30" rx="8" fill="#0c2d48" stroke="#0ea5e9" strokeWidth="2" />
                {/* Magnifying glass arm */}
                <circle cx="92" cy="50" r="10" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <line x1="99" y1="57" x2="108" y2="66" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
                    {active && <animateTransform attributeName="transform" type="rotate" values="0 99 57;5 99 57;-5 99 57;0 99 57" dur="1.5s" repeatCount="indefinite" />}
                </line>
                {/* Book in other arm */}
                <rect x="10" y="60" width="16" height="20" rx="2" fill="#38bdf8" opacity="0.6">
                    {active && <animate attributeName="y" values="60;58;60" dur="2s" repeatCount="indefinite" />}
                </rect>
                <line x1="12" y1="65" x2="24" y2="65" stroke="#0c2d48" strokeWidth="1.5" />
                <line x1="12" y1="70" x2="24" y2="70" stroke="#0c2d48" strokeWidth="1.5" />
                {/* Mouth */}
                <path d="M50 52 Q60 58 70 52" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ── Gerador (Generator) ─ Purple, sparks, creative energy ──
export function AvatarGerador({ size = 80, active = false }) {
    const cls = `agent-avatar ${active ? 'agent-avatar--active' : ''}`;
    return (
        <div className={cls} style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head */}
                <rect x="30" y="20" width="60" height="50" rx="14" fill="#1e0a3c" stroke="#a855f7" strokeWidth="2.5" />
                {/* Visor - wide creative screen */}
                <rect x="38" y="32" width="44" height="18" rx="6" fill="#a855f7" opacity="0.8">
                    {active && <animate attributeName="opacity" values="0.8;1;0.5;1;0.8" dur="1.8s" repeatCount="indefinite" />}
                </rect>
                {/* Eyes - star shaped pupils */}
                <polygon points="50,36 51.5,39.5 55,40 52,42.5 53,46 50,44 47,46 48,42.5 45,40 48.5,39.5" fill="#f0e6ff">
                    {active && <animateTransform attributeName="transform" type="rotate" values="0 50 40;360 50 40" dur="4s" repeatCount="indefinite" />}
                </polygon>
                <polygon points="70,36 71.5,39.5 75,40 72,42.5 73,46 70,44 67,46 68,42.5 65,40 68.5,39.5" fill="#f0e6ff">
                    {active && <animateTransform attributeName="transform" type="rotate" values="0 70 40;-360 70 40" dur="4s" repeatCount="indefinite" />}
                </polygon>
                {/* Spark antenna */}
                <line x1="45" y1="20" x2="40" y2="8" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="75" y1="20" x2="80" y2="8" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                {/* Spark tips */}
                <circle cx="40" cy="6" r="3" fill="#e9d5ff">
                    {active && <animate attributeName="r" values="3;5;3" dur="0.8s" repeatCount="indefinite" />}
                </circle>
                <circle cx="80" cy="6" r="3" fill="#e9d5ff">
                    {active && <animate attributeName="r" values="3;5;3" dur="0.8s" begin="0.4s" repeatCount="indefinite" />}
                </circle>
                {/* Body */}
                <rect x="36" y="72" width="48" height="32" rx="10" fill="#1e0a3c" stroke="#a855f7" strokeWidth="2" />
                {/* Lightning bolt on chest */}
                <polygon points="56,78 52,88 58,88 54,98 66,84 58,84 62,78" fill="#c084fc" opacity="0.8">
                    {active && <animate attributeName="opacity" values="0.8;1;0.4;1;0.8" dur="1.2s" repeatCount="indefinite" />}
                </polygon>
                {/* Arms with energy */}
                <line x1="36" y1="82" x2="20" y2="76" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="84" y1="82" x2="100" y2="76" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="18" cy="74" r="5" fill="#c084fc" opacity="0.6">
                    {active && <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />}
                    {active && <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />}
                </circle>
                <circle cx="102" cy="74" r="5" fill="#c084fc" opacity="0.6">
                    {active && <animate attributeName="r" values="5;7;5" dur="1.5s" begin="0.7s" repeatCount="indefinite" />}
                    {active && <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" begin="0.7s" repeatCount="indefinite" />}
                </circle>
                {/* Smile */}
                <path d="M50 54 Q60 60 70 54" fill="none" stroke="#d8b4fe" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ── Revisor (Reviewer) ─ Amber, clipboard, eagle-eyed ──
export function AvatarRevisor({ size = 80, active = false }) {
    const cls = `agent-avatar ${active ? 'agent-avatar--active' : ''}`;
    return (
        <div className={cls} style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head - slightly wider, authoritative */}
                <rect x="28" y="18" width="64" height="52" rx="14" fill="#2d1f00" stroke="#f59e0b" strokeWidth="2.5" />
                {/* Glasses/visor - distinctive reviewer look */}
                <rect x="34" y="30" width="22" height="14" rx="4" fill="#fbbf24" opacity="0.7" />
                <rect x="64" y="30" width="22" height="14" rx="4" fill="#fbbf24" opacity="0.7" />
                <line x1="56" y1="37" x2="64" y2="37" stroke="#f59e0b" strokeWidth="2" />
                {/* Sharp analyzing eyes */}
                <ellipse cx="45" cy="37" rx="4" ry="3" fill="#fef3c7">
                    {active && <animate attributeName="rx" values="4;2;4;4;2;4" dur="3s" repeatCount="indefinite" />}
                </ellipse>
                <ellipse cx="75" cy="37" rx="4" ry="3" fill="#fef3c7">
                    {active && <animate attributeName="rx" values="4;2;4;4;2;4" dur="3s" repeatCount="indefinite" />}
                </ellipse>
                {/* Stern expression */}
                <line x1="48" y1="52" x2="72" y2="52" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
                {/* Antenna - single, official */}
                <line x1="60" y1="18" x2="60" y2="6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="54" y="2" width="12" height="6" rx="2" fill="#f59e0b" />
                {/* Body */}
                <rect x="34" y="72" width="52" height="32" rx="8" fill="#2d1f00" stroke="#f59e0b" strokeWidth="2" />
                {/* Clipboard in hand */}
                <g>
                    {active && <animateTransform attributeName="transform" type="translate" values="0,0;2,-2;0,0" dur="2s" repeatCount="indefinite" />}
                    <rect x="90" y="52" width="20" height="28" rx="3" fill="#fbbf24" opacity="0.5" />
                    <rect x="93" y="50" width="14" height="4" rx="2" fill="#f59e0b" />
                    {/* Checkmarks on clipboard */}
                    <polyline points="94,60 96,62 100,58" fill="none" stroke="#2d1f00" strokeWidth="1.5" strokeLinecap="round" />
                    <polyline points="94,66 96,68 100,64" fill="none" stroke="#2d1f00" strokeWidth="1.5" strokeLinecap="round" />
                    <polyline points="94,72 96,74 100,70" fill="none" stroke="#2d1f00" strokeWidth="1.5" strokeLinecap="round">
                        {active && <animate attributeName="opacity" values="0;1;1" dur="2s" repeatCount="indefinite" />}
                    </polyline>
                </g>
                {/* Arm connections */}
                <line x1="86" y1="82" x2="96" y2="66" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="34" y1="82" x2="22" y2="88" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                {/* Badge on chest */}
                <circle cx="60" cy="86" r="6" fill="#fbbf24" opacity="0.6" />
                <text x="60" y="89" textAnchor="middle" fill="#2d1f00" fontSize="8" fontWeight="bold">Q</text>
            </svg>
        </div>
    );
}

// ── Artista (Image Generator) ─ Pink, paint brush, creative ──
export function AvatarArtista({ size = 80, active = false }) {
    const cls = `agent-avatar ${active ? 'agent-avatar--active' : ''}`;
    return (
        <div className={cls} style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head - rounded, friendly */}
                <rect x="30" y="20" width="60" height="50" rx="18" fill="#2d0a1e" stroke="#ec4899" strokeWidth="2.5" />
                {/* Beret */}
                <ellipse cx="60" cy="20" rx="28" ry="10" fill="#ec4899" opacity="0.7" />
                <circle cx="60" cy="12" r="4" fill="#f9a8d4" />
                {/* Eyes - round, dreamy */}
                <circle cx="48" cy="40" r="6" fill="#fce7f3" opacity="0.9">
                    {active && <animate attributeName="cy" values="40;38;40" dur="3s" repeatCount="indefinite" />}
                </circle>
                <circle cx="48" cy="40" r="3" fill="#ec4899" />
                <circle cx="72" cy="40" r="6" fill="#fce7f3" opacity="0.9">
                    {active && <animate attributeName="cy" values="40;38;40" dur="3s" repeatCount="indefinite" />}
                </circle>
                <circle cx="72" cy="40" r="3" fill="#ec4899" />
                {/* Happy smile */}
                <path d="M48 54 Q60 62 72 54" fill="none" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round" />
                {/* Body */}
                <rect x="36" y="72" width="48" height="30" rx="10" fill="#2d0a1e" stroke="#ec4899" strokeWidth="2" />
                {/* Paint palette */}
                <g>
                    {active && <animateTransform attributeName="transform" type="rotate" values="0 20 80;5 20 80;-5 20 80;0 20 80" dur="2s" repeatCount="indefinite" />}
                    <ellipse cx="20" cy="82" rx="16" ry="12" fill="#3d0f28" stroke="#ec4899" strokeWidth="1.5" />
                    <circle cx="14" cy="78" r="3" fill="#f43f5e" />
                    <circle cx="22" cy="76" r="3" fill="#8b5cf6" />
                    <circle cx="28" cy="80" r="3" fill="#0ea5e9" />
                    <circle cx="18" cy="86" r="3" fill="#22c55e" />
                </g>
                {/* Paint brush in other hand */}
                <g>
                    {active && <animateTransform attributeName="transform" type="rotate" values="0 100 60;-10 100 60;10 100 60;0 100 60" dur="1.5s" repeatCount="indefinite" />}
                    <line x1="100" y1="40" x2="100" y2="80" stroke="#f9a8d4" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="96" y="36" width="8" height="10" rx="2" fill="#ec4899" />
                    {/* Paint drip */}
                    <circle cx="100" cy="34" r="3" fill="#f43f5e">
                        {active && <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite" />}
                    </circle>
                </g>
                {/* Arm connections */}
                <line x1="84" y1="82" x2="100" y2="72" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                <line x1="36" y1="82" x2="28" y2="82" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ── Validador (Image Validator) ─ Green, shield, scanning eye ──
export function AvatarValidador({ size = 80, active = false }) {
    const cls = `agent-avatar ${active ? 'agent-avatar--active' : ''}`;
    return (
        <div className={cls} style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head - angular, precise */}
                <rect x="30" y="18" width="60" height="52" rx="12" fill="#052e16" stroke="#22c55e" strokeWidth="2.5" />
                {/* Scanning visor */}
                <rect x="36" y="30" width="48" height="16" rx="5" fill="#052e16" stroke="#4ade80" strokeWidth="1.5" />
                {/* Scanning beam */}
                {active && (
                    <rect x="38" y="32" width="6" height="12" rx="2" fill="#22c55e" opacity="0.6">
                        <animate attributeName="x" values="38;78;38" dur="2s" repeatCount="indefinite" />
                    </rect>
                )}
                {/* Eye - single large central scanner */}
                <circle cx="60" cy="38" r="7" fill="#bbf7d0" opacity="0.9">
                    {active && <animate attributeName="r" values="7;8;6;7" dur="2s" repeatCount="indefinite" />}
                </circle>
                <circle cx="60" cy="38" r="3" fill="#22c55e">
                    {active && <animate attributeName="r" values="3;4;2;3" dur="2s" repeatCount="indefinite" />}
                </circle>
                {/* Crosshair lines */}
                <line x1="60" y1="28" x2="60" y2="32" stroke="#86efac" strokeWidth="1" opacity="0.5" />
                <line x1="60" y1="44" x2="60" y2="48" stroke="#86efac" strokeWidth="1" opacity="0.5" />
                <line x1="50" y1="38" x2="53" y2="38" stroke="#86efac" strokeWidth="1" opacity="0.5" />
                <line x1="67" y1="38" x2="70" y2="38" stroke="#86efac" strokeWidth="1" opacity="0.5" />
                {/* Mouth - digital readout */}
                <rect x="48" y="54" width="24" height="4" rx="2" fill="#052e16" stroke="#4ade80" strokeWidth="1" />
                <rect x="50" y="55" width="4" height="2" fill="#22c55e" opacity="0.8">
                    {active && <animate attributeName="x" values="50;66;50" dur="1.5s" repeatCount="indefinite" />}
                </rect>
                {/* Antenna array */}
                <line x1="44" y1="18" x2="44" y2="10" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="60" y1="18" x2="60" y2="6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="76" y1="18" x2="76" y2="10" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="44" cy="8" r="2" fill="#86efac" />
                <circle cx="60" cy="4" r="2.5" fill="#86efac">
                    {active && <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />}
                </circle>
                <circle cx="76" cy="8" r="2" fill="#86efac" />
                {/* Body */}
                <rect x="34" y="72" width="52" height="32" rx="8" fill="#052e16" stroke="#22c55e" strokeWidth="2" />
                {/* Shield on chest */}
                <path d="M60 76 L70 80 L70 90 Q70 96 60 100 Q50 96 50 90 L50 80 Z" fill="#14532d" stroke="#4ade80" strokeWidth="1.5">
                    {active && <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />}
                </path>
                <polyline points="55,88 58,92 66,84" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {active && <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />}
                </polyline>
                {/* Arms */}
                <line x1="34" y1="82" x2="20" y2="78" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                <line x1="86" y1="82" x2="100" y2="78" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ── Avatar Map for dynamic lookup ──
export const AGENT_AVATARS = {
    searcher: AvatarPesquisador,
    generator: AvatarGerador,
    reviewer: AvatarRevisor,
    image_generator: AvatarArtista,
    image_validator: AvatarValidador,
};
