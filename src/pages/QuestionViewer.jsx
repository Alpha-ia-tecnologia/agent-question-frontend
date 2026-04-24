import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import QuestionCard from '../components/QuestionCard'
import SkillGroup from '../components/SkillGroup'
import ComponentGroup from '../components/ComponentGroup'
import GradeGroup from '../components/GradeGroup'
import { agentApi, docApi, questionsApi } from '../api/api'
import { evaluationData } from '../data/evaluationData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertCircle, CheckCircle2, X, Sparkles, Download, Search, FileText,
    GraduationCap, BookOpen,
} from 'lucide-react'

export default function QuestionViewer() {
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [exportFileName, setExportFileName] = useState('')
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportVersion, setExportVersion] = useState('teacher')
    const [selectedExportIds, setSelectedExportIds] = useState(() => new Set())
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [validationFilter, setValidationFilter] = useState('all')
    const [showRegenerateModal, setShowRegenerateModal] = useState(false)
    const [regenerateInstructions, setRegenerateInstructions] = useState('')
    const [questionToRegenerate, setQuestionToRegenerate] = useState(null)
    const [syncDistractors, setSyncDistractors] = useState(true)
    const [showRegenerateQuestionModal, setShowRegenerateQuestionModal] = useState(false)
    const [regenerateQuestionInstructions, setRegenerateQuestionInstructions] = useState('')
    const [questionBeingRegenerated, setQuestionBeingRegenerated] = useState(null)
    const [regeneratingQuestionId, setRegeneratingQuestionId] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await questionsApi.list({ limit: 200 })
            setQuestions(data.questions || [])
        } catch (err) {
            setError('Erro ao carregar questões: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetchQuestions() }, [fetchQuestions])

    const { groupedByComponent, sortedComponents } = useMemo(() => {
        let filtered = questions
        if (validationFilter === 'validated') filtered = questions.filter(q => q.validated)
        else if (validationFilter === 'pending') filtered = questions.filter(q => !q.validated)
        const sorted = [...filtered].sort((a, b) => {
            const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dB - dA
        })
        const inferComponent = (q) => {
            if (q.curriculum_component) return q.curriculum_component
            const skill = q.skill || ''; const idSkill = q.id_skill || ''
            for (const [, model] of Object.entries(evaluationData)) {
                for (const [compKey, compGrades] of Object.entries(model.components || {})) {
                    for (const [, list] of Object.entries(compGrades)) {
                        if (!Array.isArray(list)) continue
                        if (list.some(s => s.code === idSkill || s.description === skill)) return compKey
                    }
                }
            }
            return 'OTHER'
        }
        const byComponent = {}
        sorted.forEach(q => {
            const comp = inferComponent(q)
            const grade = q.grade || 'Sem série'
            const skill = q.skill || 'Sem categoria'
            if (!byComponent[comp]) byComponent[comp] = {}
            if (!byComponent[comp][grade]) byComponent[comp][grade] = {}
            if (!byComponent[comp][grade][skill]) byComponent[comp][grade][skill] = { skillId: q.id_skill, questions: [] }
            byComponent[comp][grade][skill].questions.push(q)
        })
        const order = ['LP', 'MT', 'OTHER']
        const sortedComps = Object.keys(byComponent).sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)))
        return { groupedByComponent: byComponent, sortedComponents: sortedComps }
    }, [questions, validationFilter])

    const hasQuestions = sortedComponents.length > 0
    const counters = useMemo(() => ({
        total: questions.length,
        validated: questions.filter(q => q.validated).length,
        pending: questions.filter(q => !q.validated).length,
    }), [questions])

    const handleToggleValidation = async (question) => {
        const newValidated = !question.validated
        try {
            await questionsApi.toggleValidation(question.id, newValidated)
            setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, validated: newValidated } : q))
            setSuccess(newValidated ? 'Questão validada!' : 'Validação removida')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err) { setError('Erro ao atualizar validação: ' + err.message) }
    }

    const handleGenerateImage = async (question) => {
        setIsGeneratingImage(true); setError('')
        try {
            const response = await agentApi.generateImage(question)
            setQuestions(prev => prev.map(q => q.id === question.id
                ? { ...q, image_base64: response.image_base64, image_url: response.image_url || q.image_url }
                : q))
            setSuccess('Imagem gerada e salva com sucesso!')
            return response.image_base64
        } catch (err) { setError('Erro ao gerar imagem: ' + err.message); return null }
        finally { setIsGeneratingImage(false) }
    }

    const openRegenerateModal = (question) => {
        setQuestionToRegenerate(question); setRegenerateInstructions(''); setShowRegenerateModal(true)
    }

    const handleRegenerateImage = async () => {
        if (!questionToRegenerate || !regenerateInstructions.trim()) {
            setError('Forneça instruções para a correção da imagem.'); return
        }
        setIsGeneratingImage(true); setError(''); setShowRegenerateModal(false)
        try {
            const existing = questionToRegenerate.image_base64 || null
            const response = await agentApi.regenerateImage(questionToRegenerate, regenerateInstructions, syncDistractors, existing, questionToRegenerate.id)
            setQuestions(prev => prev.map(q => {
                if (q.id !== questionToRegenerate.id) return q
                const updated = { ...q, image_base64: response.image_base64 }
                if (response.distractors_updated && response.alternatives) {
                    if (response.alternatives_recreated) {
                        updated.alternatives = response.alternatives.map(a => ({ letter: a.letter, text: a.text, distractor: a.distractor }))
                    } else {
                        updated.alternatives = q.alternatives.map(alt => {
                            const up = response.alternatives.find(a => a.letter === alt.letter)
                            if (up && up.modified) return { ...alt, text: up.text_modified ? up.text : alt.text, distractor: up.distractor || alt.distractor }
                            return alt
                        })
                    }
                    if (response.correct_answer) updated.correct_answer = response.correct_answer
                }
                return updated
            }))
            const changes = []
            if (response.distractors_updated) {
                if (response.alternatives_recreated) changes.push('alternativas recriadas')
                else {
                    const t = response.alternatives?.filter(a => a.text_modified).length || 0
                    const d = response.alternatives?.filter(a => a.modified && !a.text_modified).length || 0
                    if (t) changes.push(`${t} alternativa(s) corrigida(s)`)
                    if (d) changes.push(`${d} distrator(es) atualizado(s)`)
                }
                if (response.correct_answer && response.correct_answer !== questionToRegenerate.correct_answer) changes.push(`resposta → ${response.correct_answer}`)
            }
            setSuccess(changes.length ? `Imagem regenerada: ${changes.join(', ')}` : 'Imagem regenerada!')
            setQuestionToRegenerate(null); setRegenerateInstructions('')
        } catch (err) { setError('Erro ao regenerar imagem: ' + err.message) }
        finally { setIsGeneratingImage(false) }
    }

    const handleUpdateQuestion = (questionId, updatedFields) => {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updatedFields } : q))
        setSuccess('Questão atualizada!')
    }

    const openRegenerateQuestionModal = (question) => {
        setQuestionBeingRegenerated(question)
        setRegenerateQuestionInstructions('')
        setShowRegenerateQuestionModal(true)
    }

    const handleRegenerateQuestion = async () => {
        if (!questionBeingRegenerated || !regenerateQuestionInstructions.trim()) {
            setError('Descreva o que deve ser corrigido na questão.')
            return
        }
        const target = questionBeingRegenerated
        setRegeneratingQuestionId(target.id)
        setError('')
        setShowRegenerateQuestionModal(false)
        try {
            const response = await agentApi.regenerateQuestion(target, regenerateQuestionInstructions, target.id)
            const patch = response?.question || {}
            setQuestions(prev => prev.map(q => {
                if (q.id !== target.id) return q
                const updated = { ...q, ...patch }
                if (Array.isArray(patch.alternatives)) updated.alternatives = patch.alternatives
                return updated
            }))
            setSuccess('Questão regenerada!')
            setQuestionBeingRegenerated(null)
            setRegenerateQuestionInstructions('')
        } catch (err) {
            setError('Erro ao regenerar questão: ' + err.message)
        } finally {
            setRegeneratingQuestionId(null)
        }
    }

    const openExportModal = () => {
        setSelectedExportIds(new Set(questions.map(q => q.id)))
        setExportVersion('teacher')
        setShowExportModal(true)
    }

    const toggleExportId = (id) => {
        setSelectedExportIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const toggleExportAll = () => {
        setSelectedExportIds(prev => prev.size === questions.length ? new Set() : new Set(questions.map(q => q.id)))
    }

    const handleExport = async () => {
        if (!exportFileName.trim()) { setError('Digite um nome para o arquivo'); return }
        if (selectedExportIds.size === 0) { setError('Selecione ao menos uma questão'); return }
        setIsExporting(true); setError('')
        try {
            const toExport = questions.filter(q => selectedExportIds.has(q.id))
            const formatted = toExport.map(q => ({
                question_number: q.question_number, id_skill: q.id_skill, skill: q.skill,
                proficiency_level: q.proficiency_level, proficiency_description: q.proficiency_description,
                title: q.title, text: q.text, source: q.source,
                question_statement: q.question_statement, alternatives: q.alternatives,
                correct_answer: q.correct_answer, explanation_question: q.explanation_question,
                ...(q.image_base64 && { image_base64: q.image_base64 }),
                ...(!q.image_base64 && (q.image_url || q.imageFromServer) && { image_url: q.image_url || q.imageFromServer }),
            }))
            await docApi.generateDocx(formatted, exportFileName, exportVersion)
            await docApi.downloadDocx(exportFileName)
            setSuccess(`Documento exportado (versão ${exportVersion === 'teacher' ? 'do professor' : 'do aluno'})!`)
            setShowExportModal(false); setExportFileName('')
        } catch (err) { setError('Erro ao exportar: ' + err.message) }
        finally { setIsExporting(false) }
    }

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Minhas Questões</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {counters.total} {counters.total === 1 ? 'questão gerada' : 'questões geradas'}
                            {counters.validated > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-400">• {counters.validated} validadas</span>}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/gerar-questoes')}><Sparkles className="size-4" />Gerar Mais</Button>
                        <Button variant="secondary" disabled={questions.length === 0} onClick={openExportModal}><Download className="size-4" />Exportar</Button>
                    </div>
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

                {questions.length > 0 && (
                    <Tabs value={validationFilter} onValueChange={setValidationFilter}>
                        <TabsList>
                            <TabsTrigger value="all">Todas ({counters.total})</TabsTrigger>
                            <TabsTrigger value="validated">Validadas ({counters.validated})</TabsTrigger>
                            <TabsTrigger value="pending">Pendentes ({counters.pending})</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {isLoading || isExporting ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : questions.length === 0 ? (
                    <Card>
                        <CardContent className="py-14 text-center">
                            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <FileText className="size-5" />
                            </div>
                            <h3 className="font-semibold">Nenhuma questão gerada ainda</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Comece gerando suas primeiras questões com IA.</p>
                            <Button className="mt-4" onClick={() => navigate('/gerar-questoes')}>
                                <Sparkles className="size-4" /> Gerar Questões
                            </Button>
                        </CardContent>
                    </Card>
                ) : !hasQuestions ? (
                    <Card>
                        <CardContent className="py-14 text-center">
                            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                <Search className="size-5" />
                            </div>
                            <h3 className="font-semibold">Nenhuma questão neste filtro</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Tente outro filtro.</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setValidationFilter('all')}>Ver todas</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {sortedComponents.map(compId => {
                            const gradeGroups = groupedByComponent[compId]
                            const sortedGrades = Object.keys(gradeGroups)
                            const allCompQs = sortedGrades.flatMap(g => Object.values(gradeGroups[g]).flatMap(s => s.questions))
                            return (
                                <ComponentGroup key={compId} componentId={compId} questions={allCompQs} defaultExpanded={false}>
                                    {sortedGrades.map(grade => {
                                        const skillGroups = gradeGroups[grade]
                                        const sortedSkillNames = Object.keys(skillGroups).sort()
                                        const allGradeQs = sortedSkillNames.flatMap(s => skillGroups[s].questions)
                                        return (
                                            <GradeGroup key={grade} grade={grade} questions={allGradeQs} defaultExpanded={false}>
                                                {sortedSkillNames.map(skillName => {
                                                    const group = skillGroups[skillName]
                                                    return (
                                                        <SkillGroup key={skillName} skillName={skillName} skillId={group.skillId} questions={group.questions} defaultExpanded={false}>
                                                            <div className="flex flex-col gap-2">
                                                                {group.questions.map((q) => (
                                                                    <QuestionCard
                                                                        key={q.id}
                                                                        question={q}
                                                                        onGenerateImage={handleGenerateImage}
                                                                        onRegenerateImage={openRegenerateModal}
                                                                        onRegenerateQuestion={openRegenerateQuestionModal}
                                                                        onUpdateQuestion={handleUpdateQuestion}
                                                                        onToggleValidation={handleToggleValidation}
                                                                        isGeneratingImage={isGeneratingImage}
                                                                        isRegeneratingQuestion={regeneratingQuestionId === q.id}
                                                                    />
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

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Exportar para DOCX</DialogTitle>
                        <DialogDescription>
                            Escolha a versão do documento e selecione as questões a exportar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="exportName">Nome do arquivo</Label>
                            <Input id="exportName" placeholder="Ex: questoes-5ano-portugues" value={exportFileName} onChange={(e) => setExportFileName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Versão</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExportVersion('student')}
                                    className={`rounded-md border p-3 text-left transition-colors ${exportVersion === 'student' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}
                                >
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <GraduationCap className="size-4" /> Aluno
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">Apenas questões e alternativas, sem gabarito.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExportVersion('teacher')}
                                    className={`rounded-md border p-3 text-left transition-colors ${exportVersion === 'teacher' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}
                                >
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <BookOpen className="size-4" /> Professor
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">Inclui gabarito, explicação e distratores.</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Questões ({selectedExportIds.size}/{questions.length})</Label>
                                <button
                                    type="button"
                                    onClick={toggleExportAll}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {selectedExportIds.size === questions.length ? 'Desmarcar todas' : 'Selecionar todas'}
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto rounded-md border border-border divide-y divide-border">
                                {questions.map(q => (
                                    <label key={q.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/60">
                                        <Checkbox
                                            checked={selectedExportIds.has(q.id)}
                                            onCheckedChange={() => toggleExportId(q.id)}
                                            className="mt-0.5"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono">#{q.question_number}</span>
                                                {q.id_skill && <Badge variant="outline" className="text-[10px]">{q.id_skill}</Badge>}
                                                {q.validated && <span className="text-emerald-600">• validada</span>}
                                            </div>
                                            <p className="mt-0.5 text-sm line-clamp-2">
                                                {q.question_statement || q.title || 'Sem enunciado'}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancelar</Button>
                        <Button onClick={handleExport} disabled={selectedExportIds.size === 0 || isExporting}>
                            <Download className="size-4" />
                            Exportar {selectedExportIds.size > 0 ? `(${selectedExportIds.size})` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Regenerate Image Modal */}
            <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerar Imagem</DialogTitle>
                        <DialogDescription>Descreva o que deve ser corrigido ou melhorado.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="regInstructions">Instruções</Label>
                            <Textarea id="regInstructions" rows={4}
                                placeholder="Ex: Mostre exatamente 3 maçãs vermelhas em cima de uma mesa, sem números visíveis."
                                value={regenerateInstructions} onChange={(e) => setRegenerateInstructions(e.target.value)} />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox checked={syncDistractors} onCheckedChange={setSyncDistractors} />
                            Sincronizar distratores com a nova imagem
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenerateModal(false)}>Cancelar</Button>
                        <Button onClick={handleRegenerateImage}>Regenerar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Regenerate Question Modal */}
            <Dialog open={showRegenerateQuestionModal} onOpenChange={setShowRegenerateQuestionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerar Questão</DialogTitle>
                        <DialogDescription>
                            Descreva os pontos que precisam ser observados e corrigidos.
                            A habilidade, nível de proficiência e ano escolar serão preservados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {questionBeingRegenerated && (
                            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                <div className="font-mono">#{questionBeingRegenerated.question_number}</div>
                                <div className="line-clamp-2 mt-1 text-foreground">
                                    {questionBeingRegenerated.question_statement || questionBeingRegenerated.title}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="regQuestionInstructions">Orientações para correção</Label>
                            <Textarea
                                id="regQuestionInstructions"
                                rows={5}
                                placeholder="Ex: os distratores estão muito parecidos com o gabarito; reescreva-os com erros conceituais mais variados e deixe o enunciado mais direto."
                                value={regenerateQuestionInstructions}
                                onChange={(e) => setRegenerateQuestionInstructions(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenerateQuestionModal(false)}>Cancelar</Button>
                        <Button onClick={handleRegenerateQuestion} disabled={!regenerateQuestionInstructions.trim()}>
                            Regenerar Questão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    )
}
