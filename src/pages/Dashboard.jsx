import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { groupsApi, questionsApi } from '../api/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Sparkles,
    FileText,
    ImageIcon,
    TrendingUp,
    ShieldCheck,
    Clock,
    ArrowRight,
    Plus,
    Brain,
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
    const toneMap = {
        default: 'bg-primary/10 text-primary',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    }
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
                        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
                    </div>
                    <div className={`flex items-center justify-center size-10 rounded-lg ${toneMap[tone]}`}>
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [counts, setCounts] = useState({ total: 0, validated: 0, pending: 0 })
    const [recentGroups, setRecentGroups] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        Promise.all([
            questionsApi.getCounts().catch(() => ({ total: 0, validated: 0, pending: 0 })),
            groupsApi.list(5, 0).catch(() => []),
        ]).then(([countsData, groups]) => {
            if (!mounted) return
            setCounts(countsData)
            setRecentGroups(Array.isArray(groups) ? groups : [])
            setLoading(false)
        })
        return () => { mounted = false }
    }, [])

    const formatDate = (iso) => {
        if (!iso) return ''
        try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) } catch { return iso }
    }

    const validationRate = counts.total > 0 ? Math.round((counts.validated / counts.total) * 100) : 0

    return (
        <Layout>
            <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">Visão geral das suas questões e ações rápidas.</p>
                    </div>
                    <Button onClick={() => navigate('/gerar-questoes')} className="shrink-0">
                        <Plus className="size-4" /> Nova Geração
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={FileText} label="Total de Questões" value={counts.total} tone="default" />
                    <StatCard icon={ShieldCheck} label="Validadas" value={counts.validated} hint={`${validationRate}% do total`} tone="success" />
                    <StatCard icon={Clock} label="Pendentes" value={counts.pending} hint="aguardando revisão" tone="accent" />
                    <StatCard icon={Brain} label="Modelo" value="Gemini" hint="gemini-3-pro + nano-banana" tone="warning" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Últimas Gerações</CardTitle>
                                <CardDescription>Os 5 grupos mais recentes.</CardDescription>
                            </div>
                            {recentGroups.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => navigate('/questoes')}>
                                    Ver todas <ArrowRight className="size-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : recentGroups.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                                        <Sparkles className="size-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Nenhuma geração ainda.</p>
                                    <Button variant="link" size="sm" onClick={() => navigate('/gerar-questoes')} className="mt-1">
                                        Gerar primeira questão
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border -mx-6">
                                    {recentGroups.map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => navigate(`/grupo/${g.id}`)}
                                            className="w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-center size-9 rounded-md bg-primary/10 text-primary shrink-0">
                                                <FileText className="size-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{g.name}</div>
                                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {g.skill}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="secondary" className="text-[10px] font-medium">{g.grade || '—'}</Badge>
                                                    <Badge variant="outline" className="text-[10px]">{g.total_questions}q</Badge>
                                                    {g.questions_with_image > 0 && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            <ImageIcon className="size-3 mr-0.5" />{g.questions_with_image}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">{formatDate(g.created_at)}</div>
                                            </div>
                                            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ações Rápidas</CardTitle>
                            <CardDescription>Atalhos para fluxos comuns.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="default" className="w-full justify-start" onClick={() => navigate('/gerar-questoes')}>
                                <Sparkles className="size-4" /> Gerar Novas Questões
                            </Button>
                            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/questoes')}>
                                <FileText className="size-4" /> Ver Minhas Questões
                            </Button>
                            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/questoes-validadas')}>
                                <ShieldCheck className="size-4" /> Fila de Validação
                            </Button>

                            <div className="pt-3 mt-3 border-t border-border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <TrendingUp className="size-3.5" />
                                    Taxa de validação: <span className="font-medium text-foreground">{validationRate}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    )
}
