import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import {
    Check, AlertCircle, Sparkles, Loader2, Search, FileText,
    ShieldCheck, Image as ImageIcon, Eye, RefreshCw, ChevronDown,
    Activity,
} from 'lucide-react'

const PHASE_META = {
    routing: { label: 'Análise da Requisição', Icon: Activity },
    searcher: { label: 'Busca de Textos', Icon: Search },
    generator: { label: 'Geração de Questões', Icon: Sparkles },
    reviewer: { label: 'Revisão de Qualidade', Icon: ShieldCheck },
    quality_gate: { label: 'Portal de Qualidade', Icon: FileText },
    __image_decision__: { label: 'Decisão de Imagem', Icon: ImageIcon },
    image_generator: { label: 'Geração de Imagem', Icon: ImageIcon },
    image_validator: { label: 'Validação de Imagem', Icon: Eye },
    image_retry_inc: { label: 'Retry de Imagem', Icon: RefreshCw },
}

const PHASE_ORDER = [
    'routing', 'searcher', 'generator', 'reviewer', 'quality_gate',
    '__image_decision__', 'image_generator', 'image_validator',
]

function formatTime(secs) {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`
}

export default function GenerationProgress({ events, error }) {
    const [elapsed, setElapsed] = useState(0)
    const [finished, setFinished] = useState(false)
    const [result, setResult] = useState(null)
    const [showDetails, setShowDetails] = useState(false)
    const timerRef = useRef(null)
    const logsEndRef = useRef(null)

    // Derived state: which phases exist, their status, last log message per phase
    const { phases, activePhase, logs, retries } = useMemo(() => {
        const ph = {}
        const ls = []
        let active = null
        let retryCount = 0
        for (const e of events || []) {
            if (e.type === 'phase_start') {
                const meta = PHASE_META[e.phase_id] || { label: e.label || e.phase_id, Icon: Activity }
                ph[e.phase_id] = { status: 'active', label: meta.label, Icon: meta.Icon, message: '' }
                active = e.phase_id
            } else if (e.type === 'phase_end') {
                if (ph[e.phase_id]) ph[e.phase_id] = { ...ph[e.phase_id], status: 'done', message: e.summary || ph[e.phase_id].message }
                if (active === e.phase_id) active = null
            } else if (e.type === 'log' || e.type === 'metric') {
                const phaseId = e.phase_id
                if (ph[phaseId]) ph[phaseId] = { ...ph[phaseId], message: e.message || e.label || '' }
                ls.push({
                    id: ls.length, phase: phaseId,
                    icon: e.icon, text: e.message || e.label, detail: e.detail || e.value,
                    type: e.type,
                })
            } else if (e.type === 'retry') {
                retryCount = Math.max(retryCount, e.attempt || 0)
                ls.push({ id: ls.length, phase: 'retry', icon: '🔄', text: `Retry #${e.attempt}: ${e.reason}`, type: 'retry' })
            } else if (e.type === 'finished') {
                // handled in effect
            }
        }
        return { phases: ph, activePhase: active, logs: ls, retries: retryCount }
    }, [events])

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => setElapsed(p => p + 0.1), 100)
        return () => clearInterval(timerRef.current)
    }, [])

    // Process finished event
    useEffect(() => {
        if (!events?.length) return
        const last = events[events.length - 1]
        if (last.type === 'finished') {
            setFinished(true)
            setResult(last)
            clearInterval(timerRef.current)
        } else if (last.type === 'error') {
            setFinished(true)
            clearInterval(timerRef.current)
        }
    }, [events])

    // Auto-scroll logs
    useEffect(() => {
        if (showDetails && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [logs, showDetails])

    // Derive ordered list of phases that have been seen
    const orderedPhases = useMemo(() => {
        const seen = Object.keys(phases)
        const ordered = PHASE_ORDER.filter(id => seen.includes(id))
        const extras = seen.filter(id => !PHASE_ORDER.includes(id))
        return [...ordered, ...extras]
    }, [phases])

    const doneCount = orderedPhases.filter(id => phases[id].status === 'done').length
    const totalCount = Math.max(orderedPhases.length, 1)
    const progressPct = finished ? 100 : Math.round((doneCount / totalCount) * 100)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'flex items-center justify-center size-10 rounded-xl shrink-0',
                                finished && !error
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : error
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-primary/10 text-primary'
                            )}>
                                {finished && !error ? <Check className="size-5" />
                                    : error ? <AlertCircle className="size-5" />
                                    : <Loader2 className="size-5 animate-spin" />}
                            </div>
                            <div>
                                <CardTitle>
                                    {error ? 'Erro na geração'
                                        : finished ? 'Geração concluída'
                                        : 'Gerando questões…'}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-0.5">
                                    <span className={cn(
                                        'inline-block size-1.5 rounded-full',
                                        finished ? 'bg-emerald-500' : 'bg-primary animate-pulse'
                                    )} />
                                    <span className="tabular-nums">{formatTime(elapsed)}</span>
                                    {retries > 0 && <Badge variant="outline" className="text-[10px]">{retries} retry(s)</Badge>}
                                </CardDescription>
                            </div>
                        </div>
                        {finished && result?.questions_count != null && (
                            <Badge variant="secondary" className="shrink-0">
                                {result.questions_count} questão(ões)
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Progress value={progressPct} className="h-1.5" />

                    <div className="space-y-1.5">
                        {orderedPhases.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader variant="dots" />
                                <span>Inicializando pipeline…</span>
                            </div>
                        ) : (
                            orderedPhases.map(id => {
                                const p = phases[id]
                                const isActive = activePhase === id && !finished
                                const isDone = p.status === 'done'
                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                                            isActive && 'bg-primary/5 border border-primary/20',
                                            isDone && 'opacity-70',
                                            !isActive && !isDone && 'opacity-50'
                                        )}
                                    >
                                        <div className={cn(
                                            'flex items-center justify-center size-7 rounded-md shrink-0',
                                            isDone ? 'bg-emerald-500/15 text-emerald-600'
                                                : isActive ? 'bg-primary/15 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        )}>
                                            {isDone ? <Check className="size-3.5" />
                                                : isActive ? <Loader2 className="size-3.5 animate-spin" />
                                                : <p.Icon className="size-3.5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium leading-tight">{p.label}</div>
                                            {p.message && (
                                                <div className="text-[11px] text-muted-foreground truncate mt-0.5">{p.message}</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {finished && !error && result && (
                        <Alert className="border-emerald-500/30 bg-emerald-500/5">
                            <Check className="size-4 text-emerald-600" />
                            <AlertDescription className="text-sm">
                                <div className="font-medium">{result.questions_count} questão(ões) gerada(s)</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {result.quality_score != null && `Score ${(result.quality_score * 100).toFixed(0)}%`}
                                    {result.total_time != null && ` • ${result.total_time.toFixed?.(1) || result.total_time}s`}
                                    {result.retry_count > 0 && ` • ${result.retry_count} retry(s)`}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {logs.length > 0 && (
                        <div className="pt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between text-xs text-muted-foreground"
                                onClick={() => setShowDetails(s => !s)}
                                type="button"
                            >
                                <span>Detalhes do pipeline ({logs.length})</span>
                                <ChevronDown className={cn('size-3.5 transition-transform', showDetails && 'rotate-180')} />
                            </Button>
                            {showDetails && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 space-y-1 font-mono text-[11px]">
                                    {logs.map(l => (
                                        <div key={l.id} className="flex items-start gap-2 py-0.5">
                                            <span className="text-muted-foreground w-4 shrink-0">{l.icon || '•'}</span>
                                            <div className="flex-1 min-w-0">
                                                <span className={cn(
                                                    l.type === 'retry' && 'text-amber-600',
                                                    l.type === 'metric' && 'text-primary'
                                                )}>
                                                    {l.text}
                                                </span>
                                                {l.detail && <span className="text-muted-foreground ml-2">— {l.detail}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
