import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import GenerationProgress from '../components/GenerationProgress'
import { agentApi } from '../api/api'
import {
    evaluationData,
    curriculumComponents,
    getFilteredSkills,
    getAvailableGrades,
    getSeamaAvailableGrades,
    getSeamaAvailableComponents,
    getSeamaAvailableLevels,
    getSeamaSkills,
} from '../data/evaluationData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Sparkles, RotateCcw, Plus, Trash2, AlertCircle, Image as ImageIcon, Link2,
    GraduationCap, Palette, Target, Layers, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MODEL_TYPES = [
    { id: 'SAEB', name: 'SAEB', desc: 'Sistema de Avaliação da Educação Básica' },
    { id: 'SEAMA', name: 'SEAMA', desc: 'Sistema de Avaliação do Maranhão' },
    { id: 'BNCC', name: 'BNCC', desc: 'Base Nacional Comum Curricular' },
]

const newExtra = () => ({ id: crypto.randomUUID?.() || String(Date.now() + Math.random()), curriculumComponent: '', skill: '' })

export default function QuestionGenerator() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        modelEvaluationType: '',
        curriculumComponent: '',
        grade: '',
        skill: '',
        proficiencyLevel: '',
        countQuestions: 5,
        countAlternatives: 4,
        imageDependency: 'none',
        contextTheme: '',
        llmModel: '',
    })
    const [extraSkills, setExtraSkills] = useState([])
    const [contextMode, setContextMode] = useState('theme') // 'theme' | 'skills' | 'none'
    const [needsImage, setNeedsImage] = useState(false)
    const [imageRequired, setImageRequired] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [progressEvents, setProgressEvents] = useState([])
    const [llmModels, setLlmModels] = useState([])

    useEffect(() => {
        agentApi.listModels()
            .then(data => setLlmModels(Array.isArray(data?.models) ? data.models : []))
            .catch(() => setLlmModels([]))
    }, [])

    const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

    // Which data bank to use for skill lookups (BNCC reuses SAEB descriptors)
    const dataKey = useMemo(() => {
        const m = MODEL_TYPES.find(t => t.id === form.modelEvaluationType)
        return m?.useDataFrom || m?.id || 'SAEB'
    }, [form.modelEvaluationType])

    const currentModel = useMemo(() => evaluationData[dataKey] || evaluationData['SAEB'], [dataKey])

    const availableGrades = useMemo(() => {
        if (!form.curriculumComponent) return []
        return getAvailableGrades(dataKey, form.curriculumComponent)
    }, [dataKey, form.curriculumComponent])

    const filteredSkills = useMemo(() => {
        if (!form.curriculumComponent || !form.grade) return []
        return getFilteredSkills(dataKey, form.curriculumComponent, form.grade)
    }, [dataKey, form.curriculumComponent, form.grade])

    useEffect(() => {
        if (form.modelEvaluationType) {
            setForm(prev => ({ ...prev, curriculumComponent: '', grade: '', skill: '', proficiencyLevel: '' }))
            setExtraSkills([])
        }
    }, [form.modelEvaluationType])

    // Cascata do SAEB/BNCC: componente→série→skill. NÃO aplicar ao SEAMA
    // (no SEAMA a ordem é série→componente→nível→skill, tratada no SeamaSkillPicker).
    useEffect(() => {
        // SEAMA e BNCC controlam a cascata nos seus próprios pickers.
        if (form.modelEvaluationType === 'SEAMA' || form.modelEvaluationType === 'BNCC') return
        if (form.curriculumComponent) setForm(prev => ({ ...prev, grade: '', skill: '' }))
    }, [form.curriculumComponent, form.modelEvaluationType])

    useEffect(() => {
        if (form.modelEvaluationType === 'SEAMA' || form.modelEvaluationType === 'BNCC') return
        if (form.grade) {
            setForm(prev => ({ ...prev, skill: '' }))
            setExtraSkills([])
        }
    }, [form.grade, form.modelEvaluationType])

    useEffect(() => {
        if (!needsImage) { setImageRequired(false); setField('imageDependency', 'none') }
        else setField('imageDependency', imageRequired ? 'required' : 'optional')
    }, [needsImage, imageRequired])

    // O modo interdisciplinar SEMPRE usa a base BNCC (9 componentes, 9 anos,
    // ~1.402 descritores), independentemente da avaliação primária escolhida.
    // Isso garante o leque completo de habilidades para combinação.
    const interDataKey = 'BNCC'

    const getSkillsFor = useCallback((componentId) => {
        if (!componentId || !form.grade) return []
        return getFilteredSkills(interDataKey, componentId, form.grade)
    }, [interDataKey, form.grade])

    // Filtra a lista de componentes oferecidos no modo interdisciplinar:
    // só mostra os que têm habilidades cadastradas para a série selecionada.
    const interComponents = useMemo(() => {
        if (!form.grade) return curriculumComponents
        return curriculumComponents.filter(c =>
            (evaluationData[interDataKey]?.components?.[c.id]?.[form.grade] || []).length > 0
        )
    }, [interDataKey, form.grade])

    const usedComponents = useMemo(
        () => new Set([form.curriculumComponent, ...extraSkills.map(e => e.curriculumComponent)].filter(Boolean)),
        [form.curriculumComponent, extraSkills]
    )

    const updateExtra = (id, field, value) => {
        setExtraSkills(prev => prev.map(e => e.id === id ? { ...e, [field]: value, ...(field === 'curriculumComponent' ? { skill: '' } : {}) } : e))
    }
    const addExtra = () => setExtraSkills(prev => [...prev, newExtra()])
    const removeExtra = (id) => setExtraSkills(prev => prev.filter(e => e.id !== id))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const validExtras = extraSkills.filter(s => s.curriculumComponent && s.skill)
        const combinedSkills = contextMode === 'skills' && validExtras.length > 0
            ? [{ curriculumComponent: form.curriculumComponent, skill: form.skill }, ...validExtras]
            : undefined

        const payload = {
            ...form,
            combinedSkills,
            contextTheme: contextMode === 'theme' ? form.contextTheme : '',
        }

        setIsLoading(true)
        setProgressEvents([])
        try {
            const result = await agentApi.generateQuestionsStream(payload, (event) => {
                setProgressEvents(prev => [...prev, event])
            })
            if (result?.groupId) {
                setTimeout(() => navigate(`/grupo/${result.groupId}`), 800)
            } else if (result?.questions) {
                setTimeout(() => navigate('/questoes'), 1200)
            } else {
                setError('Nenhuma questão foi gerada. Tente novamente.')
                setIsLoading(false)
            }
        } catch (err) {
            setError(err.message || 'Erro ao gerar questões.')
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        setForm({
            modelEvaluationType: '', curriculumComponent: '', grade: '', skill: '',
            proficiencyLevel: '', countQuestions: 5, countAlternatives: 4,
            imageDependency: 'none', contextTheme: '',
        })
        setExtraSkills([])
        setContextMode('theme')
        setNeedsImage(false)
        setImageRequired(false)
        setError('')
    }

    if (isLoading) return <GenerationProgress events={progressEvents} error={error} />

    // BNCC não exige nível de proficiência; SAEB/SEAMA exigem.
    const primaryReady = form.modelEvaluationType === 'BNCC'
        ? Boolean(form.modelEvaluationType && form.skill)
        : Boolean(form.modelEvaluationType && form.skill && form.proficiencyLevel)
    const interdisciplinary = contextMode === 'skills' && extraSkills.filter(s => s.curriculumComponent && s.skill).length > 0

    return (
        <Layout>
            <div className="flex flex-col gap-6 max-w-4xl">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Gerar Questões</h1>
                        <p className="text-sm text-muted-foreground mt-1">Escolha o tipo de avaliação e configure o contexto da geração.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {llmModels.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Label htmlFor="llmModel" className="text-xs text-muted-foreground whitespace-nowrap">Modelo IA:</Label>
                                <Select value={form.llmModel || 'default'} onValueChange={(v) => setField('llmModel', v === 'default' ? '' : v)}>
                                    <SelectTrigger className="h-9 min-w-[200px]" id="llmModel">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        <SelectItem value="default">Padrão do servidor</SelectItem>
                                        {llmModels.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{m.label}</span>
                                                    <span className="text-[10px] text-muted-foreground">{m.hint}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button type="button" variant="ghost" onClick={handleReset}>
                            <RotateCcw className="size-4" /> Limpar
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Tipo de Avaliação */}
                    <Section
                        step={1}
                        icon={<Layers className="size-4" />}
                        title="Tipo de Avaliação"
                        description="Selecione o modelo de referência."
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {MODEL_TYPES.map(t => {
                                const selected = form.modelEvaluationType === t.id
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setField('modelEvaluationType', t.id)}
                                        className={cn(
                                            'relative text-left rounded-lg border p-4 transition-all',
                                            selected
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                                        )}
                                    >
                                        {selected && (
                                            <div className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                <Check className="size-3" />
                                            </div>
                                        )}
                                        <div className="text-base font-semibold tracking-tight">{t.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </Section>

                    {/* 2. Habilidade — fluxo por tipo de avaliação */}
                    {form.modelEvaluationType === 'SEAMA' && (
                        <Section
                            step={2}
                            icon={<Target className="size-4" />}
                            title="Habilidade da Avaliação SEAMA"
                            description="Selecione série, componente curricular, nível e a habilidade associada ao nível."
                        >
                            <SeamaSkillPicker form={form} setField={setField} />
                        </Section>
                    )}
                    {form.modelEvaluationType === 'BNCC' && (
                        <Section
                            step={2}
                            icon={<Target className="size-4" />}
                            title="Habilidade da BNCC"
                            description="Selecione série, componente curricular e a habilidade BNCC."
                        >
                            <BnccSkillPicker form={form} setField={setField} />
                        </Section>
                    )}
                    {form.modelEvaluationType && form.modelEvaluationType !== 'SEAMA' && form.modelEvaluationType !== 'BNCC' && (
                        <Section
                            step={2}
                            icon={<Target className="size-4" />}
                            title={`Habilidade da Avaliação ${form.modelEvaluationType}`}
                            description="Selecione componente, série e o descritor alvo."
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Componente Curricular</Label>
                                    <Select value={form.curriculumComponent} onValueChange={(v) => setField('curriculumComponent', v)}>
                                        <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                                        <SelectContent>
                                            {curriculumComponents.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ano/Série</Label>
                                    <Select value={form.grade} onValueChange={(v) => setField('grade', v)} disabled={!form.curriculumComponent}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={form.curriculumComponent ? 'Selecione…' : 'Selecione o componente primeiro'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Habilidade (Descritor)</Label>
                                    <Select value={form.skill} onValueChange={(v) => setField('skill', v)} disabled={!form.grade}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={form.grade ? 'Selecione a habilidade…' : 'Selecione o ano/série primeiro'} />
                                        </SelectTrigger>
                                        <SelectContent className="max-w-[calc(100vw-4rem)]">
                                            {filteredSkills.map(s => (
                                                <SelectItem key={s.code} value={`${s.code} - ${s.description}`}>
                                                    <span className="font-mono text-xs text-primary mr-1.5">{s.code}</span>
                                                    <span className="truncate">{s.description}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.grade && filteredSkills.length > 0 && (
                                        <p className="text-[11px] text-muted-foreground">{filteredSkills.length} habilidade(s) disponível(is)</p>
                                    )}
                                    {form.grade && filteredSkills.length === 0 && (
                                        <p className="text-[11px] text-amber-600">Sem habilidades cadastradas para esta combinação.</p>
                                    )}
                                </div>
                                {currentModel.proficiencyLevels?.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1.5"><GraduationCap className="size-3.5" />Nível de Proficiência</Label>
                                        <Select value={form.proficiencyLevel} onValueChange={(v) => setField('proficiencyLevel', v)}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o nível…" /></SelectTrigger>
                                            <SelectContent>
                                                {currentModel.proficiencyLevels.map(p => <SelectItem key={p.level} value={p.level}>{p.level}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* 3. Contexto Complementar */}
                    {form.skill && (
                        <Section
                            step={3}
                            icon={<Palette className="size-4" />}
                            title="Contexto Complementar"
                            description="Tema temático ou combinação interdisciplinar para direcionar a geração."
                            badge={contextMode === 'theme' && form.contextTheme ? 'Tema definido' : interdisciplinary ? `${extraSkills.length + 1} habilidades` : null}
                        >
                            <Tabs value={contextMode} onValueChange={setContextMode}>
                                <TabsList>
                                    <TabsTrigger value="none">Sem contexto</TabsTrigger>
                                    <TabsTrigger value="theme">Tema livre</TabsTrigger>
                                    <TabsTrigger value="skills">Interdisciplinar</TabsTrigger>
                                </TabsList>

                                <TabsContent value="none" className="mt-4">
                                    <p className="text-xs text-muted-foreground">A questão usará apenas a habilidade principal, sem orientação temática adicional.</p>
                                </TabsContent>

                                <TabsContent value="theme" className="mt-4 space-y-2">
                                    <Label htmlFor="contextTheme">Tema ou assunto</Label>
                                    <Input
                                        id="contextTheme"
                                        placeholder='Ex: "Canção do Exílio", "Semana da Água"…'
                                        value={form.contextTheme}
                                        onChange={(e) => setField('contextTheme', e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        O agente usará este tema como pano de fundo da questão (ambientação, texto-base, referências), mantendo o foco na habilidade avaliada.
                                    </p>
                                </TabsContent>

                                <TabsContent value="skills" className="mt-4 space-y-3">
                                    {extraSkills.length === 0 && (
                                        <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-4 text-center">
                                            Nenhuma habilidade adicional. Cada questão cobrirá a habilidade principal junto com as habilidades abaixo.
                                        </div>
                                    )}
                                    {extraSkills.map((extra, idx) => {
                                        const extraOptions = getSkillsFor(extra.curriculumComponent)
                                        return (
                                            <div key={extra.id} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">#{idx + 2}</Badge>
                                                        <span className="text-xs text-muted-foreground">Habilidade adicional</span>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => removeExtra(extra.id)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Componente</Label>
                                                        <Select value={extra.curriculumComponent} onValueChange={(v) => updateExtra(extra.id, 'curriculumComponent', v)}>
                                                            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                                                            <SelectContent>
                                                                {interComponents.map(c => (
                                                                    <SelectItem key={c.id} value={c.id} disabled={usedComponents.has(c.id) && extra.curriculumComponent !== c.id}>
                                                                        {c.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Habilidade</Label>
                                                        <Select value={extra.skill} onValueChange={(v) => updateExtra(extra.id, 'skill', v)} disabled={!extra.curriculumComponent}>
                                                            <SelectTrigger><SelectValue placeholder={extra.curriculumComponent ? 'Selecione…' : 'Componente primeiro'} /></SelectTrigger>
                                                            <SelectContent className="max-w-[calc(100vw-4rem)]">
                                                                {extraOptions.map(s => (
                                                                    <SelectItem key={s.code} value={`${s.code} - ${s.description}`}>
                                                                        <span className="font-mono text-xs text-primary mr-1.5">{s.code}</span>
                                                                        <span className="truncate">{s.description}</span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <Button type="button" variant="outline" size="sm" onClick={addExtra}>
                                        <Plus className="size-4" />Adicionar habilidade
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </Section>
                    )}

                    {/* 4. Imagem */}
                    {form.skill && (
                        <Section
                            step={4}
                            icon={<ImageIcon className="size-4" />}
                            title="Imagem"
                            description="Define se a questão deve conter imagem ilustrativa."
                        >
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <Checkbox checked={needsImage} onCheckedChange={setNeedsImage} />
                                <span className="text-sm">Esta questão precisa de imagem</span>
                            </label>
                            {needsImage && (
                                <label className="flex items-center gap-2.5 cursor-pointer mt-3 ml-6">
                                    <Checkbox checked={imageRequired} onCheckedChange={setImageRequired} />
                                    <span className="text-sm">
                                        <span className="font-medium">Imagem obrigatória</span>
                                        <span className="block text-[11px] text-muted-foreground">A resolução depende dela (não é apenas ilustrativa).</span>
                                    </span>
                                </label>
                            )}
                        </Section>
                    )}

                    {/* 5. Quantidades */}
                    {form.skill && (
                        <Section
                            step={5}
                            icon={<Target className="size-4" />}
                            title="Quantidades"
                            description="Quantas questões gerar e quantas alternativas cada uma terá."
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="countQuestions">Quantidade de Questões</Label>
                                    <Input id="countQuestions" type="number" min={1} max={10} value={form.countQuestions}
                                        onChange={(e) => setField('countQuestions', Number(e.target.value))} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Alternativas por Questão</Label>
                                    <Select value={String(form.countAlternatives)} onValueChange={(v) => setField('countAlternatives', Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="4">4 alternativas (A–D)</SelectItem>
                                            <SelectItem value="5">5 alternativas (A–E)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Section>
                    )}

                    <Separator />

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
                        <Button type="submit" disabled={!primaryReady} size="lg">
                            <Sparkles className="size-4" />
                            {interdisciplinary ? 'Gerar Questões Interdisciplinares' : 'Gerar Questões'}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

function SeamaSkillPicker({ form, setField }) {
    const grades = getSeamaAvailableGrades()
    const components = getSeamaAvailableComponents(form.grade)
    const levels = getSeamaAvailableLevels(form.grade, form.curriculumComponent)
    const skills = getSeamaSkills(form.grade, form.curriculumComponent, form.proficiencyLevel)

    const handleGrade = (v) => {
        setField('grade', v)
        setField('curriculumComponent', '')
        setField('proficiencyLevel', '')
        setField('skill', '')
    }
    const handleComponent = (v) => {
        setField('curriculumComponent', v)
        setField('proficiencyLevel', '')
        setField('skill', '')
    }
    const handleLevel = (v) => {
        setField('proficiencyLevel', v)
        setField('skill', '')
    }

    const empty = grades.length === 0
    const componentName = (id) => curriculumComponents.find(c => c.id === id)?.name || id

    return (
        <div className="space-y-4">
            {empty && (
                <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Nenhuma habilidade SEAMA cadastrada. Forneça os documentos de referência para
                    preencher <code className="text-foreground">skillsByGradeComponentLevel</code> em
                    <code className="text-foreground"> evaluationData.js</code>.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Série</Label>
                    <Select value={form.grade} onValueChange={handleGrade} disabled={empty}>
                        <SelectTrigger><SelectValue placeholder={empty ? 'Sem habilidades' : 'Selecione…'} /></SelectTrigger>
                        <SelectContent>
                            {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Componente Curricular</Label>
                    <Select value={form.curriculumComponent} onValueChange={handleComponent} disabled={!form.grade}>
                        <SelectTrigger><SelectValue placeholder={form.grade ? 'Selecione…' : 'Selecione a série primeiro'} /></SelectTrigger>
                        <SelectContent>
                            {components.map(c => <SelectItem key={c} value={c}>{componentName(c)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><GraduationCap className="size-3.5" />Nível de Proficiência</Label>
                    <Select value={form.proficiencyLevel} onValueChange={handleLevel} disabled={!form.curriculumComponent}>
                        <SelectTrigger><SelectValue placeholder={form.curriculumComponent ? 'Selecione…' : 'Componente primeiro'} /></SelectTrigger>
                        <SelectContent>
                            {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Habilidades relacionadas ao nível {form.proficiencyLevel || '—'}</Label>
                <Select value={form.skill} onValueChange={(v) => setField('skill', v)} disabled={!form.proficiencyLevel}>
                    <SelectTrigger>
                        <SelectValue placeholder={form.proficiencyLevel ? 'Selecione a habilidade…' : 'Selecione o nível primeiro'} />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-4rem)]">
                        {skills.map(s => (
                            <SelectItem key={s.code} value={`${s.code} - ${s.description}`}>
                                <span className="font-mono text-xs text-primary mr-1.5">{s.code}</span>
                                <span className="truncate">{s.description}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.proficiencyLevel && skills.length === 0 && (
                    <p className="text-[11px] text-amber-600">Sem habilidades cadastradas para este nível. Forneça o documento SEAMA correspondente.</p>
                )}
                {form.proficiencyLevel && skills.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">{skills.length} habilidade(s) disponível(is) no nível {form.proficiencyLevel}</p>
                )}
            </div>
        </div>
    )
}

function BnccSkillPicker({ form, setField }) {
    // BNCC tem dados próprios (1402 habilidades, 9 componentes).
    const DATA_KEY = 'BNCC'

    // Lista todos os anos/séries que aparecem em qualquer componente do SAEB.
    const allGrades = useMemo(() => {
        const set = new Set()
        const comps = evaluationData[DATA_KEY]?.components || {}
        for (const compId of Object.keys(comps)) {
            for (const g of Object.keys(comps[compId] || {})) set.add(g)
        }
        return [...set]
    }, [])

    // Para uma série, quais componentes têm habilidades cadastradas.
    const availableComponents = useMemo(() => {
        if (!form.grade) return []
        const comps = evaluationData[DATA_KEY]?.components || {}
        return curriculumComponents.filter(c => (comps[c.id]?.[form.grade] || []).length > 0)
    }, [form.grade])

    const skills = useMemo(() => {
        if (!form.grade || !form.curriculumComponent) return []
        return getFilteredSkills(DATA_KEY, form.curriculumComponent, form.grade)
    }, [form.grade, form.curriculumComponent])

    const handleGrade = (v) => {
        setField('grade', v)
        setField('curriculumComponent', '')
        setField('skill', '')
        setField('proficiencyLevel', '')
    }
    const handleComponent = (v) => {
        setField('curriculumComponent', v)
        setField('skill', '')
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Série</Label>
                    <Select value={form.grade} onValueChange={handleGrade}>
                        <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                        <SelectContent>
                            {allGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Componente Curricular</Label>
                    <Select value={form.curriculumComponent} onValueChange={handleComponent} disabled={!form.grade}>
                        <SelectTrigger>
                            <SelectValue placeholder={form.grade ? 'Selecione…' : 'Selecione a série primeiro'} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableComponents.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Habilidade BNCC</Label>
                <Select value={form.skill} onValueChange={(v) => setField('skill', v)} disabled={!form.curriculumComponent}>
                    <SelectTrigger>
                        <SelectValue placeholder={form.curriculumComponent ? 'Selecione a habilidade…' : 'Selecione o componente primeiro'} />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-4rem)]">
                        {skills.map(s => (
                            <SelectItem key={s.code} value={`${s.code} - ${s.description}`}>
                                <span className="font-mono text-xs text-primary mr-1.5">{s.code}</span>
                                <span className="truncate">{s.description}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.curriculumComponent && skills.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">{skills.length} habilidade(s) disponível(is)</p>
                )}
                {form.curriculumComponent && skills.length === 0 && (
                    <p className="text-[11px] text-amber-600">Sem habilidades cadastradas para esta combinação.</p>
                )}
            </div>
        </div>
    )
}

function Section({ step, icon, title, description, badge, children }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0 font-semibold text-sm">
                            {step}
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {icon}
                                {title}
                            </CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>
                    {badge && <Badge variant="secondary">{badge}</Badge>}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}
