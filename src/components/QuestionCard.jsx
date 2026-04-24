import { useState, useEffect, useRef } from 'react'
import { useQuestionImage } from '../hooks/useQuestionImage'
import { useQuestionEdit } from '../hooks/useQuestionEdit'
import QuestionHeader from './question/QuestionHeader'
import QuestionImage from './question/QuestionImage'
import AlternativesList from './question/AlternativesList'
import QuestionActions from './question/QuestionActions'
import { questionsApi } from '../api/api'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, ExternalLink, Lightbulb, NotebookPen, Loader2, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuestionCard({
    question,
    onGenerateImage,
    onRegenerateImage,
    onRegenerateQuestion,
    onUpdateQuestion,
    onToggleValidation,
    isGeneratingImage,
    isRegeneratingQuestion,
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [observation, setObservation] = useState(question.observation || '')
    const [saveStatus, setSaveStatus] = useState('')
    const debounceRef = useRef(null)

    const { imageSrc, hasImage } = useQuestionImage(question)
    const {
        isEditing, editedQuestion, startEditing, handleSaveEdits, handleCancelEdits,
        handleAlternativeChange, handleDistractorChange, updateField,
    } = useQuestionEdit(question, onUpdateQuestion)

    useEffect(() => { setObservation(question.observation || '') }, [question.observation])

    const handleObservationChange = (e) => {
        const value = e.target.value
        setObservation(value)
        setSaveStatus('')
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            try {
                setSaveStatus('saving')
                await questionsApi.updateObservation(question.id, value || null)
                setSaveStatus('saved')
                setTimeout(() => setSaveStatus(''), 2000)
            } catch (err) {
                console.error('Erro ao salvar observação:', err)
                setSaveStatus('')
            }
        }, 800)
    }

    const handleGenerateImage = async () => {
        if (onGenerateImage) await onGenerateImage(question)
    }

    return (
        <div className={cn(
            'rounded-lg border bg-card overflow-hidden transition-colors',
            question.validated ? 'border-emerald-500/30' : 'border-border'
        )}>
            <QuestionHeader
                questionNumber={question.question_number}
                skillId={question.id_skill}
                isExpanded={isExpanded}
                isValidated={question.validated}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                        {/* Título + Texto de apoio */}
                        <div className="space-y-2">
                            {isEditing ? (
                                <>
                                    <Input value={editedQuestion.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Título" />
                                    <Textarea rows={5} value={editedQuestion.text} onChange={(e) => updateField('text', e.target.value)} placeholder="Texto de apoio" />
                                </>
                            ) : (
                                <>
                                    {question.title && <h3 className="text-sm font-semibold">{question.title}</h3>}
                                    {question.text && <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{question.text}</p>}
                                </>
                            )}
                            {(question.source || question.source_author) && (
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                                    {question.source_author && <span>Autor: <span className="font-medium text-foreground/70">{question.source_author}</span></span>}
                                    {question.source && <span>• {question.source}</span>}
                                    {question.source_url && (
                                        <a href={question.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                            <ExternalLink className="size-3" /> fonte
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        <QuestionImage
                            imageSrc={imageSrc}
                            onRegenerate={onGenerateImage ? handleGenerateImage : null}
                            isRegenerating={isGeneratingImage}
                        />

                        {question.needs_manual_image && !hasImage && (
                            <Alert variant="default" className="border-amber-500/30 bg-amber-500/5">
                                <AlertTriangle className="size-4 text-amber-600" />
                                <AlertDescription>
                                    <div className="font-medium text-amber-900 dark:text-amber-200">Imagem não validada automaticamente</div>
                                    <p className="mt-0.5 text-xs">Gere a imagem manualmente.</p>
                                    {question.image_validation_issues?.length > 0 && (
                                        <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground">
                                            {question.image_validation_issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                        </ul>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Enunciado */}
                        {isEditing ? (
                            <Textarea rows={3} value={editedQuestion.question_statement} onChange={(e) => updateField('question_statement', e.target.value)} placeholder="Enunciado" />
                        ) : (
                            <p className="text-sm font-medium leading-relaxed">{question.question_statement}</p>
                        )}

                        <AlternativesList
                            alternatives={isEditing ? editedQuestion.alternatives : question.alternatives}
                            correctAnswer={question.correct_answer}
                            isEditing={isEditing}
                            onAlternativeChange={handleAlternativeChange}
                            onDistractorChange={handleDistractorChange}
                        />

                        {/* Explicação */}
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 mb-1.5">
                                <Lightbulb className="size-3.5 text-amber-500" />
                                <span>Explicação</span>
                            </div>
                            {isEditing ? (
                                <Textarea rows={3} value={editedQuestion.explanation_question} onChange={(e) => updateField('explanation_question', e.target.value)} placeholder="Explicação" className="text-sm" />
                            ) : (
                                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{question.explanation_question}</p>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {question.skill && <Badge variant="secondary" className="max-w-full truncate">{question.skill}</Badge>}
                            {question.proficiency_level && <Badge variant="outline">{question.proficiency_level}</Badge>}
                            {question.grade && <Badge variant="outline">{question.grade}</Badge>}
                        </div>

                        {/* Observação */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                                    <NotebookPen className="size-3.5" />
                                    <span>Observação</span>
                                </div>
                                {saveStatus === 'saving' && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Loader2 className="size-3 animate-spin" /> salvando…
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                                        <Check className="size-3" /> salvo
                                    </span>
                                )}
                            </div>
                            <Textarea
                                rows={2}
                                value={observation}
                                onChange={handleObservationChange}
                                placeholder="Ex.: 'Faltou citar o tema no texto-base', 'Distratores muito óbvios'…"
                                className="text-sm"
                            />
                            <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                                <Sparkles className="size-3 shrink-0 mt-0.5 text-primary/70" />
                                <span>
                                    Esta observação será usada no <span className="font-medium text-foreground/80">aprendizado do modelo</span>:
                                    em próximas gerações da mesma habilidade, série e componente, o agente e o revisor recebem este feedback como lição aprendida para evitar o mesmo problema.
                                </span>
                            </p>
                        </div>
                    </div>

                    <QuestionActions
                        isEditing={isEditing}
                        hasImage={hasImage}
                        isGeneratingImage={isGeneratingImage}
                        isRegeneratingQuestion={isRegeneratingQuestion}
                        isValidated={question.validated}
                        onStartEditing={startEditing}
                        onSaveEdits={handleSaveEdits}
                        onCancelEdits={handleCancelEdits}
                        onGenerateImage={handleGenerateImage}
                        onRegenerateImage={onRegenerateImage ? () => onRegenerateImage(question) : null}
                        onRegenerateQuestion={onRegenerateQuestion ? () => onRegenerateQuestion(question) : null}
                        onToggleValidation={onToggleValidation ? () => onToggleValidation(question) : null}
                    />
                </>
            )}
        </div>
    )
}
