import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import QuestionCard from '../components/QuestionCard'
import { agentApi, groupsApi, questionsApi } from '../api/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertCircle, FileText, Image as ImageIcon, Calendar, Layers } from 'lucide-react'

export default function GroupView() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [group, setGroup] = useState(null)
    const [questions, setQuestions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [generatingImageId, setGeneratingImageId] = useState(null)

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

    const handleGenerateImage = async (question) => {
        setGeneratingImageId(question.id)
        try {
            const result = await agentApi.generateImage(question)
            setQuestions(prev => prev.map(q => q.id === question.id
                ? { ...q, image_base64: result.image_base64, image_url: result.image_url }
                : q))
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

    const handleToggleValidation = async (questionId, validated) => {
        await questionsApi.toggleValidation(questionId, validated)
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, validated } : q))
    }

    const formatDate = (iso) => {
        if (!iso) return ''
        try { return new Date(iso).toLocaleString('pt-BR') } catch { return iso }
    }

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-3 -ml-2">
                        <ArrowLeft className="size-4" /> Dashboard
                    </Button>
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

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
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
                                onUpdateQuestion={handleUpdateQuestion}
                                onToggleValidation={handleToggleValidation}
                                isGeneratingImage={generatingImageId === q.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}
