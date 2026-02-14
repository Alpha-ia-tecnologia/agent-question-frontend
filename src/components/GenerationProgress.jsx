import { useState, useEffect, useRef } from 'react';
import { AGENT_AVATARS } from './AgentAvatars';
import './GenerationProgress.css';

const PHASE_CONFIG = {
    routing: { label: 'Request Analysis', icon: '🔀' },
    searcher: { label: 'Text Search Agent', icon: '📚' },
    generator: { label: 'Question Generator Agent', icon: '✨' },
    reviewer: { label: 'Quality Review Agent', icon: '📋' },
    quality_gate: { label: 'Quality Gate', icon: '✅' },
    __image_decision__: { label: 'Image Decision', icon: '🖼️' },
    image_generator: { label: 'Image Generation Agent', icon: '🎨' },
    image_validator: { label: 'Image Validation Agent', icon: '👁️' },
    image_retry_inc: { label: 'Image Retry', icon: '🔄' },
};

const AGENTS = [
    { id: 'searcher', label: 'Pesquisador', icon: '📚', description: 'Busca textos', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
    { id: 'generator', label: 'Gerador', icon: '✨', description: 'Cria questões', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    { id: 'reviewer', label: 'Revisor', icon: '📋', description: 'Revisa qualidade', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { id: 'image_generator', label: 'Artista', icon: '🎨', description: 'Gera imagens', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
    { id: 'image_validator', label: 'Validador', icon: '👁️', description: 'Valida imagens', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
];

export default function GenerationProgress({ events, error }) {
    const [timeline, setTimeline] = useState([]);
    const [phases, setPhases] = useState({});
    const [activePhase, setActivePhase] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [finished, setFinished] = useState(false);
    const [result, setResult] = useState(null);
    const timelineEndRef = useRef(null);
    const timerRef = useRef(null);

    // Start timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 0.1);
        }, 100);
        return () => clearInterval(timerRef.current);
    }, []);

    // Process events
    useEffect(() => {
        if (!events || events.length === 0) return;
        const latest = events[events.length - 1];

        switch (latest.type) {
            case 'phase_start': {
                const config = PHASE_CONFIG[latest.phase_id] || { label: latest.label, icon: latest.icon };
                setPhases(prev => ({
                    ...prev,
                    [latest.phase_id]: { status: 'active', label: config.label, icon: config.icon, summary: '' }
                }));
                setActivePhase(latest.phase_id);
                setTimeline(prev => [...prev, {
                    ...latest,
                    displayIcon: config.icon,
                    displayLabel: config.label,
                    category: 'phase_start'
                }]);
                break;
            }
            case 'phase_end': {
                setPhases(prev => ({
                    ...prev,
                    [latest.phase_id]: { ...prev[latest.phase_id], status: 'completed', summary: latest.summary }
                }));
                setTimeline(prev => [...prev, {
                    ...latest,
                    category: 'phase_end'
                }]);
                break;
            }
            case 'log':
            case 'metric': {
                setTimeline(prev => [...prev, {
                    ...latest,
                    category: latest.type
                }]);
                break;
            }
            case 'retry': {
                setTimeline(prev => [...prev, {
                    ...latest,
                    category: 'retry'
                }]);
                break;
            }
            case 'finished': {
                setFinished(true);
                setResult(latest);
                clearInterval(timerRef.current);
                setTimeline(prev => [...prev, {
                    ...latest,
                    category: 'finished'
                }]);
                break;
            }
            case 'error': {
                setFinished(true);
                clearInterval(timerRef.current);
                setTimeline(prev => [...prev, {
                    ...latest,
                    category: 'error'
                }]);
                break;
            }
            default:
                break;
        }
    }, [events]);

    // Auto-scroll
    useEffect(() => {
        if (timelineEndRef.current) {
            timelineEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [timeline]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const phaseOrder = ['routing', 'searcher', 'generator', 'reviewer', 'quality_gate'];

    return (
        <div className="gen-progress">
            {/* Header */}
            <div className="gen-progress__header">
                <div className="gen-progress__title">
                    <span className="gen-progress__title-icon">🤖</span>
                    <span>LangGraph Pipeline</span>
                </div>
                <div className="gen-progress__timer">
                    <span className={`gen-progress__dot ${finished ? 'done' : 'running'}`}></span>
                    {formatTime(elapsed)}
                </div>
            </div>

            {/* Agent Pipeline Visualization */}
            <AgentPipeline activePhase={activePhase} phases={phases} finished={finished} />

            {/* Footer */}
            {finished && result && (
                <div className="gen-progress__result">
                    <div className="result-icon">🎉</div>
                    <div className="result-text">
                        <strong>{result.questions_count} question(s) generated</strong>
                        <span>Score: {result.quality_score ? `${(result.quality_score * 100).toFixed(0)}%` : 'N/A'} · Attempts: {result.retry_count}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="gen-progress__error">
                    <span>❌</span> Error: {error}
                </div>
            )}
        </div>
    );
}

function TimelineEntry({ entry }) {
    switch (entry.category) {
        case 'phase_start':
            return (
                <div className="tl-entry tl-phase-start">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot phase-dot"></div>
                    <div className="tl-content">
                        <span className="tl-icon">{entry.displayIcon}</span>
                        <strong>{entry.displayLabel}</strong>
                        <span className="tl-badge">Started</span>
                    </div>
                </div>
            );
        case 'phase_end':
            return (
                <div className="tl-entry tl-phase-end">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot phase-dot done"></div>
                    <div className="tl-content">
                        <span className="tl-icon">✅</span>
                        <span className="tl-summary">{entry.summary}</span>
                    </div>
                </div>
            );
        case 'log':
            return (
                <div className="tl-entry tl-log">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot log-dot"></div>
                    <div className="tl-content">
                        <span className="tl-icon">{entry.icon}</span>
                        <span>{entry.message}</span>
                        {entry.detail && <span className="tl-detail">{entry.detail}</span>}
                    </div>
                </div>
            );
        case 'metric':
            return (
                <div className="tl-entry tl-metric">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot metric-dot"></div>
                    <div className="tl-content">
                        <span className="tl-icon">{entry.icon}</span>
                        <strong>{entry.label}:</strong>
                        <span className="tl-metric-value">{entry.value}</span>
                    </div>
                </div>
            );
        case 'retry':
            return (
                <div className="tl-entry tl-retry">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot retry-dot"></div>
                    <div className="tl-content">
                        <span className="tl-icon">🔄</span>
                        <span>Retry #{entry.attempt}: {entry.reason}</span>
                    </div>
                </div>
            );
        case 'finished':
            return (
                <div className="tl-entry tl-finished">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot finished-dot"></div>
                    <div className="tl-content">
                        <span className="tl-icon">🏁</span>
                        <strong>Pipeline completed in {entry.total_time}s</strong>
                    </div>
                </div>
            );
        case 'error':
            return (
                <div className="tl-entry tl-error-entry">
                    <div className="tl-time">{entry.timestamp || ''}</div>
                    <div className="tl-dot error-dot"></div>
                    <div className="tl-content">
                        <span className="tl-icon">❌</span>
                        <span>{entry.message}</span>
                    </div>
                </div>
            );
        default:
            return null;
    }
}

function AgentPipeline({ activePhase, phases, finished }) {
    // ──────────────────────────────────────────────────────────────
    // CYCLE ENGINE: Self-driven infinite loop simulation
    // Each agent activates sequentially, plays through activities,
    // completes, then next agent starts. On full completion, cycle resets.
    // ──────────────────────────────────────────────────────────────

    // Cycle state machine
    const [cycleCount, setCycleCount] = useState(0);
    const [simAgents, setSimAgents] = useState(() =>
        AGENTS.map(() => ({ status: 'pending', activityIdx: 0, elapsed: 0 }))
    );
    const [currentAgentIdx, setCurrentAgentIdx] = useState(-1); // -1 = pre-start
    const [cyclePhase, setCyclePhase] = useState('starting'); // starting | running | restarting
    const [chatMessages, setChatMessages] = useState([]);
    const [thinkingDots, setThinkingDots] = useState('');

    const chatEndRef = useRef(null);
    const ACTIVITY_INTERVAL = 2200;   // ms between activity steps
    const AGENT_COMPLETE_DELAY = 800; // ms pause after agent finishes
    const CYCLE_RESTART_DELAY = 2500; // ms pause before cycle restarts

    // Agent-specific activity messages
    const AGENT_ACTIVITIES = {
        searcher: [
            { msg: 'Inicializando motor de busca', icon: '🔍', detail: 'Conectando ao RAG pipeline' },
            { msg: 'Construindo query semântica', icon: '📡', detail: 'Embedding de habilidades BNCC' },
            { msg: 'Escaneando fontes acadêmicas', icon: '🌐', detail: 'DuckDuckGo + bases locais' },
            { msg: 'Ranqueando por relevância', icon: '📄', detail: 'Score de similaridade textual' },
        ],
        generator: [
            { msg: 'Carregando modelo de linguagem', icon: '🧠', detail: 'GPT-4o / DeepSeek' },
            { msg: 'Analisando taxonomia cognitiva', icon: '📐', detail: 'Tabela de habilidades EF09MA' },
            { msg: 'Gerando enunciado e alternativas', icon: '✍️', detail: 'Chain-of-thought prompting' },
            { msg: 'Calibrando distratores', icon: '🎯', detail: 'Erros conceituais plausíveis' },
        ],
        reviewer: [
            { msg: 'Aplicando critérios SAEB', icon: '📋', detail: 'Checklist de 12 pontos' },
            { msg: 'Avaliando alinhamento curricular', icon: '🔬', detail: 'BNCC + Matriz SEAMA' },
            { msg: 'Testando plausibilidade', icon: '🧪', detail: 'Análise de distratores' },
            { msg: 'Calculando score de qualidade', icon: '📊', detail: 'Nota final 0-100' },
        ],
        image_generator: [
            { msg: 'Interpretando dados visuais', icon: '🎨', detail: 'Extração de contexto numérico' },
            { msg: 'Construindo prompt de imagem', icon: '🖌️', detail: 'Descrição pedagógica detalhada' },
            { msg: 'Gerando ilustração via DALL-E', icon: '⚡', detail: 'OpenAI Image API' },
            { msg: 'Renderizando imagem final', icon: '🖼️', detail: 'Base64 encoding + validação' },
        ],
        image_validator: [
            { msg: 'Carregando modelo de visão', icon: '👁️', detail: 'Gemini 2.0 Flash' },
            { msg: 'Analisando coerência visual', icon: '🔍', detail: 'Cross-check com enunciado' },
            { msg: 'Verificando dados numéricos', icon: '📏', detail: 'Validação de precisão' },
            { msg: 'Emitindo veredito final', icon: '✅', detail: 'Aprovado / Reprovar + feedback' },
        ],
    };

    const COMPLETION_SUMMARIES = {
        searcher: 'Fontes relevantes encontradas e ranqueadas',
        generator: 'Questão com 5 alternativas gerada com sucesso',
        reviewer: 'Score de qualidade: 94/100 — Aprovado',
        image_generator: 'Ilustração pedagógica gerada (1024×1024)',
        image_validator: 'Imagem validada — coerência visual confirmada',
    };

    // Animated thinking dots
    useEffect(() => {
        const interval = setInterval(() => {
            setThinkingDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Per-agent elapsed timer (ticks every 100ms for active agents)
    useEffect(() => {
        const interval = setInterval(() => {
            setSimAgents(prev => prev.map(a =>
                a.status === 'active' ? { ...a, elapsed: a.elapsed + 0.1 } : a
            ));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // ── MAIN CYCLE ENGINE ──────────────────────────────────────
    useEffect(() => {
        // Pre-start: brief pause, then activate first agent
        if (cyclePhase === 'starting') {
            const t = setTimeout(() => {
                setCurrentAgentIdx(0);
                setSimAgents(prev => prev.map((a, i) =>
                    i === 0 ? { ...a, status: 'active', activityIdx: 0, elapsed: 0 } : a
                ));
                // Add initial chat message
                const agent = AGENTS[0];
                const activities = AGENT_ACTIVITIES[agent.id];
                if (activities?.[0]) {
                    addChatMessage(agent, activities[0]);
                }
                setCyclePhase('running');
            }, 800);
            return () => clearTimeout(t);
        }
    }, [cyclePhase, cycleCount]); // cycleCount dependency ensures re-trigger on reset

    // Activity stepper: advance activity index for active agent
    useEffect(() => {
        if (cyclePhase !== 'running' || currentAgentIdx < 0) return;

        const interval = setInterval(() => {
            setSimAgents(prev => {
                const idx = currentAgentIdx;
                if (idx < 0 || idx >= AGENTS.length) return prev;
                const agent = AGENTS[idx];
                const activities = AGENT_ACTIVITIES[agent.id] || [];
                const current = prev[idx];

                if (current.status !== 'active') return prev;

                const nextActIdx = current.activityIdx + 1;

                if (nextActIdx < activities.length) {
                    // Advance to next activity
                    addChatMessage(agent, activities[nextActIdx]);
                    return prev.map((a, i) =>
                        i === idx ? { ...a, activityIdx: nextActIdx } : a
                    );
                } else {
                    // All activities done — mark agent as completed
                    clearInterval(interval);
                    addChatMessage(agent, {
                        msg: COMPLETION_SUMMARIES[agent.id] || 'Concluído',
                        icon: '✅',
                        detail: 'Etapa finalizada'
                    });

                    const updated = prev.map((a, i) =>
                        i === idx ? { ...a, status: 'completed' } : a
                    );

                    // After brief pause, activate next agent or finish cycle
                    setTimeout(() => {
                        const nextIdx = idx + 1;
                        if (nextIdx < AGENTS.length) {
                            // Activate next agent
                            setCurrentAgentIdx(nextIdx);
                            setSimAgents(p => p.map((a, i) =>
                                i === nextIdx ? { ...a, status: 'active', activityIdx: 0, elapsed: 0 } : a
                            ));
                            const nextAgent = AGENTS[nextIdx];
                            const nextActivities = AGENT_ACTIVITIES[nextAgent.id];
                            if (nextActivities?.[0]) {
                                addChatMessage(nextAgent, nextActivities[0]);
                            }
                        } else {
                            // All agents completed — enter restart phase
                            setCyclePhase('restarting');
                            setTimeout(() => {
                                // Reset everything for next cycle
                                setCycleCount(c => c + 1);
                                setCurrentAgentIdx(-1);
                                setSimAgents(AGENTS.map(() => ({
                                    status: 'pending', activityIdx: 0, elapsed: 0
                                })));
                                setChatMessages([]);
                                setCyclePhase('starting');
                            }, CYCLE_RESTART_DELAY);
                        }
                    }, AGENT_COMPLETE_DELAY);

                    return updated;
                }
            });
        }, ACTIVITY_INTERVAL);

        return () => clearInterval(interval);
    }, [cyclePhase, currentAgentIdx]);

    function addChatMessage(agent, activity) {
        setChatMessages(prev => [...prev.slice(-10), {
            agentId: agent.id,
            agentLabel: agent.label,
            agentIcon: agent.icon,
            ...activity,
            timestamp: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            })
        }]);
    }

    const formatAgentTime = (secs) => {
        if (!secs) return '0s';
        return secs < 60 ? `${Math.floor(secs)}s` : `${Math.floor(secs / 60)}m${Math.floor(secs % 60)}s`;
    };

    // Computed values
    const completedCount = simAgents.filter(a => a.status === 'completed').length;
    const globalProgress = cyclePhase === 'restarting' ? 100 : (completedCount / AGENTS.length) * 100;
    const activeAgent = currentAgentIdx >= 0 ? AGENTS[currentAgentIdx] : null;

    return (
        <div className="agent-sim">
            {/* Neural Network Background */}
            <div className="agent-sim__neural-bg" />

            {/* Cycle Counter Badge */}
            {cycleCount > 0 && (
                <div className="agent-sim__cycle-badge">
                    🔄 Ciclo #{cycleCount + 1}
                </div>
            )}

            {/* ── Central Specialist Avatar ──────────────────────────── */}
            <div className="agent-sim__specialist">
                {/* Orbiting Agent Steps - Mini avatars */}
                <div className="agent-sim__orbit">
                    {AGENTS.map((agent, i) => {
                        const sim = simAgents[i];
                        const isActive = i === currentAgentIdx;
                        const isDone = sim.status === 'completed';
                        const OrbitAvatar = AGENT_AVATARS[agent.id];
                        return (
                            <div
                                key={agent.id}
                                className={`agent-sim__orbit-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                                style={{
                                    '--dot-color': agent.color,
                                    '--dot-angle': `${(i / AGENTS.length) * 360}deg`
                                }}
                                title={agent.label}
                            >
                                {isDone ? '✓' : OrbitAvatar ? <OrbitAvatar size={22} active={isActive} /> : (i + 1)}
                            </div>
                        );
                    })}
                </div>

                {/* Main Avatar Circle */}
                <div
                    className={`agent-sim__avatar-main ${activeAgent ? 'active' : ''} ${cyclePhase === 'restarting' ? 'restarting' : ''}`}
                    style={{
                        '--agent-color': activeAgent?.color || '#6366f1',
                        '--agent-bg': activeAgent?.bg || 'rgba(99,102,241,0.12)',
                    }}
                >
                    {/* Pulse rings */}
                    {activeAgent && (
                        <>
                            <div className="agent-sim__avatar-pulse" />
                            <div className="agent-sim__avatar-pulse agent-sim__avatar-pulse--2" />
                        </>
                    )}

                    {/* SVG Avatar with transition */}
                    <div className="agent-sim__avatar-face" key={activeAgent?.id || 'idle'}>
                        {(() => {
                            const AvatarComponent = activeAgent ? AGENT_AVATARS[activeAgent.id] : null;
                            return AvatarComponent
                                ? <AvatarComponent size={76} active={true} />
                                : <span style={{ fontSize: '2.4rem' }}>🤖</span>;
                        })()}
                    </div>

                    {/* Brain wave bars */}
                    {activeAgent && (
                        <div className="agent-sim__brain-wave">
                            <span /><span /><span /><span /><span />
                        </div>
                    )}
                </div>

                {/* Agent Name & Role */}
                <div className="agent-sim__agent-info" key={activeAgent?.id || 'idle'}>
                    <span className="agent-sim__agent-name" style={{ color: activeAgent?.color || '#94a3b8' }}>
                        {activeAgent?.label || 'Inicializando'}
                    </span>
                    <span className="agent-sim__agent-role">
                        {activeAgent?.description || 'Preparando pipeline...'}
                    </span>
                </div>
            </div>

            {/* ── Activity Panel ──────────────────────────────────── */}
            {activeAgent && (() => {
                const activities = AGENT_ACTIVITIES[activeAgent.id] || [];
                const sim = simAgents[currentAgentIdx];
                const currentActivity = activities[sim?.activityIdx] || {};
                const agentProgress = sim?.status === 'completed' ? 100
                    : sim?.status === 'active' ? ((sim.activityIdx + 1) / activities.length) * 100
                        : 0;

                return (
                    <div className="agent-sim__activity-panel" style={{ '--agent-color': activeAgent.color }}>
                        {sim?.status === 'active' && currentActivity.msg && (
                            <div className="agent-sim__activity-row">
                                <span className="agent-sim__activity-icon">{currentActivity.icon}</span>
                                <div className="agent-sim__activity-text">
                                    <span className="agent-sim__activity-msg">{currentActivity.msg}</span>
                                    <span className="agent-sim__activity-detail">{currentActivity.detail}</span>
                                </div>
                                <span className="agent-sim__activity-badge">
                                    {sim.activityIdx + 1}/{activities.length}
                                </span>
                            </div>
                        )}
                        {sim?.status === 'completed' && (
                            <div className="agent-sim__activity-row agent-sim__activity-row--done">
                                <span className="agent-sim__activity-icon">✅</span>
                                <span className="agent-sim__activity-msg">{COMPLETION_SUMMARIES[activeAgent.id]}</span>
                            </div>
                        )}
                        <div className="agent-sim__progress-track">
                            <div
                                className={`agent-sim__progress-indicator ${sim?.status === 'completed' ? 'done' : ''}`}
                                style={{
                                    transform: `translateX(-${100 - agentProgress}%)`,
                                    background: activeAgent.color
                                }}
                            />
                        </div>
                    </div>
                );
            })()}

            {/* ── Pipeline Progress Bar ──────────────────────────── */}
            <div className="agent-sim__global-progress">
                <div className="agent-sim__global-progress-track">
                    <div
                        className="agent-sim__global-progress-fill"
                        style={{ transform: `translateX(-${100 - globalProgress}%)` }}
                    />
                </div>
                <span className="agent-sim__global-label">
                    {cyclePhase === 'restarting' ? '🔄 Reset' : `${completedCount}/${AGENTS.length}`}
                </span>
            </div>

            {/* ── Agent Chat Feed ────────────────────────────────── */}
            {chatMessages.length > 0 && (
                <div className="agent-sim__chat">
                    <div className="agent-sim__chat-title">💬 Feed de Atividade</div>
                    <div className="agent-sim__chat-messages">
                        {chatMessages.map((msg, i) => {
                            const msgAgent = AGENTS.find(a => a.id === msg.agentId);
                            return (
                                <div key={`${cycleCount}-${i}`} className="agent-sim__chat-msg">
                                    <span
                                        className="agent-sim__chat-avatar"
                                        style={{ background: msgAgent?.bg, borderColor: msgAgent?.color }}
                                    >
                                        {(() => {
                                            const ChatAvatar = AGENT_AVATARS[msg.agentId];
                                            return ChatAvatar ? <ChatAvatar size={24} active={false} /> : msg.agentIcon;
                                        })()}
                                    </span>
                                    <div className="agent-sim__chat-bubble">
                                        <div className="agent-sim__chat-header">
                                            <strong style={{ color: msgAgent?.color }}>{msg.agentLabel}</strong>
                                            <span className="agent-sim__chat-time">{msg.timestamp}</span>
                                        </div>
                                        <span className="agent-sim__chat-text">{msg.icon} {msg.msg}</span>
                                        {msg.detail && <span className="agent-sim__chat-detail">{msg.detail}</span>}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            )}

            {/* ── Pipeline Status Bar ────────────────────────────── */}
            <div className="agent-sim__status-bar">
                <div className="agent-sim__status-indicator">
                    {cyclePhase === 'restarting' ? (
                        <>
                            <span className="status-dot status-dot--done" />
                            <span>🔄 Ciclo completo — reiniciando...</span>
                        </>
                    ) : activeAgent ? (
                        <>
                            <span className="status-dot status-dot--running" />
                            <span>Executando: <strong style={{ color: activeAgent.color }}>{activeAgent.label}</strong></span>
                        </>
                    ) : (
                        <>
                            <span className="status-dot status-dot--idle" />
                            <span>Inicializando pipeline...</span>
                        </>
                    )}
                </div>
                <div className="agent-sim__agents-count">
                    {completedCount}/{AGENTS.length} agentes
                </div>
            </div>
        </div>
    );
}
