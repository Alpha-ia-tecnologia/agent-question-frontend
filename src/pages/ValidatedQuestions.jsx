import { useState, useEffect, useMemo, useCallback } from 'react'
import Layout from '../components/Layout'
import QuestionCard from '../components/QuestionCard'
import SkillGroup from '../components/SkillGroup'
import ComponentGroup from '../components/ComponentGroup'
import GradeGroup from '../components/GradeGroup'
import { questionsApi } from '../api/api'
import { evaluationData } from '../data/evaluationData'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, X, ShieldCheck, Clock, FileText, Trophy } from 'lucide-react'

export default function ValidatedQuestions() {
    const [questions, setQuestions] = useState([])
    const [counts, setCounts] = useState({ total: 0, validated: 0, pending: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [validationFilter, setValidationFilter] = useState('all')

    const fetchCounts = useCallback(async () => {
        try { setCounts(await questionsApi.getCounts()) } catch (err) { console.error(err) }
    }, [])

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const params = { limit: 200 }
            if (validationFilter === 'validated') params.validated = true
            else if (validationFilter === 'pending') params.validated = false
            const data = await questionsApi.list(params)
            setQuestions(data.questions || [])
        } catch (err) {
            setError('Erro ao carregar questões: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }, [validationFilter])

    useEffect(() => {
        fetchQuestions()
        fetchCounts()
    }, [fetchQuestions, fetchCounts])

    const { groupedByComponent, sortedComponents } = useMemo(() => {
        const inferComponent = (question) => {
            if (question.curriculum_component) return question.curriculum_component
            const skill = question.skill || ''
            const idSkill = question.id_skill || ''
            for (const [, model] of Object.entries(evaluationData)) {
                for (const [compKey, compGrades] of Object.entries(model.components || {})) {
                    for (const [, skillsList] of Object.entries(compGrades)) {
                        if (!Array.isArray(skillsList)) continue
                        if (skillsList.some(s => s.code === idSkill || s.description === skill)) return compKey
                    }
                }
            }
            return 'OTHER'
        }
        const byComponent = {}
        questions.forEach(question => {
            const comp = inferComponent(question)
            const grade = question.grade || 'Sem série'
            const skill = question.skill || 'Sem categoria'
            if (!byComponent[comp]) byComponent[comp] = {}
            if (!byComponent[comp][grade]) byComponent[comp][grade] = {}
            if (!byComponent[comp][grade][skill]) byComponent[comp][grade][skill] = { skillId: question.id_skill, questions: [] }
            byComponent[comp][grade][skill].questions.push(question)
        })
        const order = ['LP', 'MT', 'OTHER']
        const sorted = Object.keys(byComponent).sort((a, b) => {
            return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
        })
        return { groupedByComponent: byComponent, sortedComponents: sorted }
    }, [questions])

    const handleToggleValidation = async (question) => {
        const newValidated = !question.validated
        try {
            await questionsApi.toggleValidation(question.id, newValidated)
            setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, validated: newValidated } : q))
            setCounts(prev => ({
                ...prev,
                validated: newValidated ? prev.validated + 1 : prev.validated - 1,
                pending: newValidated ? prev.pending - 1 : prev.pending + 1,
            }))
            setSuccess(newValidated ? 'Questão validada!' : 'Validação removida')
            setTimeout(() => setSuccess(''), 2500)
        } catch (err) {
            setError('Erro ao atualizar validação: ' + err.message)
        }
    }

    const rate = counts.total > 0 ? Math.round((counts.validated / counts.total) * 100) : 0

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Validação de Questões</h1>
                    <p className="text-sm text-muted-foreground mt-1">Revise e valide a qualidade das questões geradas, organizadas por componente, série e habilidade.</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription className="flex items-center justify-between gap-2">
                            <span>{error}</span>
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => setError('')}><X className="size-3" /></Button>
                        </AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="border-emerald-500/30 bg-emerald-500/5">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <AlertDescription className="flex items-center justify-between gap-2">
                            <span>{success}</span>
                            <Button variant="ghost" size="icon" className="size-6" onClick={() => setSuccess('')}><X className="size-3" /></Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><FileText className="size-5" /></div>
                                <div>
                                    <div className="text-2xl font-semibold">{counts.total}</div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><ShieldCheck className="size-5" /></div>
                                <div>
                                    <div className="text-2xl font-semibold">{counts.validated}</div>
                                    <div className="text-xs text-muted-foreground">Validadas</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="size-5" /></div>
                                <div>
                                    <div className="text-2xl font-semibold">{counts.pending}</div>
                                    <div className="text-xs text-muted-foreground">Pendentes</div>
                                </div>
                            </div>
                        </div>
                        {counts.total > 0 && (
                            <div className="flex items-center gap-3">
                                <Progress value={rate} className="flex-1 h-2" />
                                <span className="text-xs font-medium tabular-nums text-muted-foreground w-10 text-right">{rate}%</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Tabs value={validationFilter} onValueChange={setValidationFilter}>
                    <TabsList>
                        <TabsTrigger value="all">Todas ({counts.total})</TabsTrigger>
                        <TabsTrigger value="validated">Validadas ({counts.validated})</TabsTrigger>
                        <TabsTrigger value="pending">Pendentes ({counts.pending})</TabsTrigger>
                    </TabsList>
                </Tabs>

                {isLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : questions.length === 0 ? (
                    <Card>
                        <CardContent className="py-14 text-center">
                            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                {validationFilter === 'validated' ? <Trophy className="size-5" /> : validationFilter === 'pending' ? <Clock className="size-5" /> : <FileText className="size-5" />}
                            </div>
                            <h3 className="font-semibold">
                                {validationFilter === 'validated' ? 'Nenhuma questão validada ainda' : validationFilter === 'pending' ? 'Todas as questões foram validadas!' : 'Nenhuma questão salva no banco'}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {validationFilter === 'all' ? 'Gere questões para que apareçam aqui para validação.' : 'Tente outro filtro.'}
                            </p>
                            {validationFilter !== 'all' && (
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setValidationFilter('all')}>Ver todas</Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {sortedComponents.map(compId => {
                            const gradeGroups = groupedByComponent[compId]
                            const sortedGrades = Object.keys(gradeGroups)
                            const allCompQuestions = sortedGrades.flatMap(g => Object.values(gradeGroups[g]).flatMap(s => s.questions))
                            return (
                                <ComponentGroup key={compId} componentId={compId} questions={allCompQuestions} defaultExpanded={false}>
                                    {sortedGrades.map(grade => {
                                        const skillGroups = gradeGroups[grade]
                                        const sortedSkillNames = Object.keys(skillGroups).sort()
                                        const allGradeQuestions = sortedSkillNames.flatMap(s => skillGroups[s].questions)
                                        return (
                                            <GradeGroup key={grade} grade={grade} questions={allGradeQuestions} defaultExpanded={false}>
                                                {sortedSkillNames.map(skillName => {
                                                    const group = skillGroups[skillName]
                                                    return (
                                                        <SkillGroup key={skillName} skillName={skillName} skillId={group.skillId} questions={group.questions} defaultExpanded={false}>
                                                            <div className="flex flex-col gap-2">
                                                                {group.questions.map((q) => (
                                                                    <QuestionCard key={q.id} question={q} onToggleValidation={handleToggleValidation} isGeneratingImage={false} />
                                                                ))}
                                                            </div>
                                                        </SkillGroup>
                                                    )
                                                })}
                                            </GradeGroup>
                                        )
                                    })}
                                </ComponentGroup>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}
