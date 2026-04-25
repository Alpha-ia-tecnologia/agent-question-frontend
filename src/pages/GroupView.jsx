import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import QuestionCard from '../components/QuestionCard'
import { agentApi, docApi, groupsApi, questionsApi } from '../api/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    ArrowLeft, AlertCircle, FileText, Image as ImageIcon, Calendar, Layers,
    Download, GraduationCap, BookOpen, CheckCircle2, X, Sparkles,
} from 'lucide-react'

export default function GroupView() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [group, setGroup] = useState(null)
    const [questions, setQuestions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [generatingImageId, setGeneratingImageId] = useState(null)
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportFileName, setExportFileName] = useState('')
    const [exportVersion, setExportVersion] = useState('teacher')
    const [selectedExportIds, setSelectedExportIds] = useState(() => new Set())
    const [isExporting, setIsExporting] = useState(false)
    const [showRegenerateQuestionModal, setShowRegenerateQuestionModal] = useState(false)
    const [regenerateQuestionInstructions, setRegenerateQuestionInstructions] = useState('')
    const [questionBeingRegenerated, setQuestionBeingRegenerated] = useState(null)
    const [regeneratingQuestionId, setRegeneratingQuestionId] = useState(null)
    const [showGenerateImageModal, setShowGenerateImageModal] = useState(false)
    const [generateImageInstructions, setGenerateImageInstructions] = useState('')
    const [questionForImage, setQuestionForImage] = useState(null)

    const load = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const data = await groupsApi.getWithQuestions(id)
            setGroup(data.group)
            setQuestions(data.questions || [])
        } catch (err) {
            setError('Erro ao carregar grupo: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => { load() }, [load])

    const handleGenerateImage = (question) => {
        setQuestionForImage(question)
        setGenerateImageInstructions('')
        setShowGenerateImageModal(true)
    }

    const submitImageGeneration = async () => {
        const target = questionForImage
        if (!target) return
        const instructions = generateImageInstructions.trim()
        setShowGenerateImageModal(false)
        setGeneratingImageId(target.id)
        setError('')
        try {
            const result = await agentApi.generateImage(target, instructions)
            setQuestions(prev => prev.map(q => q.id === target.id
                ? { ...q, image_base64: result.image_base64, image_url: result.image_url }
                : q))
            setSuccess(instructions
                ? 'Imagem gerada com suas orientações! Elas alimentarão futuras gerações.'
                : 'Imagem gerada com sucesso!')
            setTimeout(() => setSuccess(''), 3000)
            setQuestionForImage(null)
            setGenerateImageInstructions('')
        } catch (err) {
            setError('Erro ao gerar imagem: ' + err.message)
        } finally {
            setGeneratingImageId(null)
        }
    }

    const handleUpdateQuestion = async (questionId, updates) => {
        const updated = await questionsApi.updateQuestion(questionId, updates)
        setQuestions(prev => prev.map(q => q.id === questionId
            ? { ...q, ...updates, alternatives: updated.alternatives || q.alternatives, correct_answer: updated.correct_answer ?? q.correct_answer }
            : q))
    }

    const handleToggleValidation = async (question) => {
        const newValidated = !question.validated
        try {
            await questionsApi.toggleValidation(question.id, newValidated)
            setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, validated: newValidated } : q))
        } catch (err) {
            setError('Erro ao atualizar validação: ' + err.message)
        }
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
            setTimeout(() => setSuccess(''), 3000)
            setQuestionBeingRegenerated(null)
            setRegenerateQuestionInstructions('')
        } catch (err) {
            setError('Erro ao regenerar questão: ' + err.message)
        } finally {
            setRegeneratingQuestionId(null)
        }
    }

    const formatDate = (iso) => {
        if (!iso) return ''
        try { return new Date(iso).toLocaleString('pt-BR') } catch { return iso }
    }

    const openExportModal = () => {
        setSelectedExportIds(new Set(questions.map(q => q.id)))
        setExportVersion('teacher')
        const suggested = (group?.name || 'questoes')
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60)
        setExportFileName(suggested)
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
            setTimeout(() => setSuccess(''), 3000)
            setShowExportModal(false)
        } catch (err) { setError('Erro ao exportar: ' + err.message) }
        finally { setIsExporting(false) }
    }

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-3 -ml-2">
                        <ArrowLeft className="size-4" /> Dashboard
                    </Button>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{group?.name || 'Grupo de Questões'}</h1>
                            {group && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="gap-1"><Layers className="size-3" />{group.skill?.slice(0, 60)}{group.skill?.length > 60 ? '…' : ''}</Badge>
                                    <Badge variant="outline">{group.grade || '—'}</Badge>
                                    <Badge variant="outline" className="gap-1"><FileText className="size-3" />{group.total_questions} questões</Badge>
                                    {group.questions_with_image > 0 && (
                                        <Badge variant="outline" className="gap-1"><ImageIcon className="size-3" />{group.questions_with_image}</Badge>
                                    )}
                                    <Badge variant="outline" className="gap-1"><Calendar className="size-3" />{formatDate(group.created_at)}</Badge>
                                </div>
                            )}
                        </div>
                        <Button variant="secondary" disabled={questions.length === 0} onClick={openExportModal}>
                            <Download className="size-4" /> Exportar
                        </Button>
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

                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                        Nenhuma questão neste grupo.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {questions.map(q => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                onGenerateImage={handleGenerateImage}
                                onRegenerateQuestion={openRegenerateQuestionModal}
                                onUpdateQuestion={handleUpdateQuestion}
                                onToggleValidation={handleToggleValidation}
                                isGeneratingImage={generatingImageId === q.id}
                                isRegeneratingQuestion={regeneratingQuestionId === q.id}
                            />
                        ))}
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

            {/* Generate Image Modal */}
            <Dialog open={showGenerateImageModal} onOpenChange={setShowGenerateImageModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerar Imagem</DialogTitle>
                        <DialogDescription>
                            Você pode (opcionalmente) dar orientações para o agente gerar uma imagem mais precisa.
                            Suas orientações são salvas e reutilizadas em gerações futuras de questões com mesmo
                            tema/série/componente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="genImageInstructions">Orientações (opcional)</Label>
                        <Textarea
                            id="genImageInstructions"
                            rows={4}
                            placeholder="Ex.: usar paleta sóbria; mostrar exatamente 3 elementos; evitar texto na imagem; estilo livro didático."
                            value={generateImageInstructions}
                            onChange={(e) => setGenerateImageInstructions(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGenerateImageModal(false)}>Cancelar</Button>
                        <Button onClick={submitImageGeneration}>
                            <Sparkles className="size-4" />
                            {generateImageInstructions.trim() ? 'Gerar com orientações' : 'Gerar imagem'}
                        </Button>
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
