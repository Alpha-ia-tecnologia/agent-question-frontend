import { useState } from 'react'
import { MessageSquare, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export default function AlternativesList({
    alternatives,
    correctAnswer,
    isEditing,
    onAlternativeChange,
    onDistractorChange,
}) {
    const [expandedDistractors, setExpandedDistractors] = useState(() => {
        const initial = {}
        alternatives.forEach(alt => {
            if (alt.distractor && alt.distractor.trim()) initial[alt.letter] = true
        })
        return initial
    })
    const toggleDistractor = (letter) => setExpandedDistractors(prev => ({ ...prev, [letter]: !prev[letter] }))

    return (
        <div className="space-y-2">
            {alternatives.map((alt, index) => {
                const isCorrect = alt.letter === correctAnswer
                const hasDistractor = alt.distractor && alt.distractor.trim()
                const isExpanded = expandedDistractors[alt.letter]
                return (
                    <div key={alt.letter}>
                        <div className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                            isCorrect
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-border bg-card'
                        )}>
                            <div className={cn(
                                'flex items-center justify-center size-8 rounded-md font-semibold text-xs shrink-0',
                                isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                            )}>
                                {isCorrect ? <Check className="size-4" /> : alt.letter}
                            </div>
                            {isEditing ? (
                                <Input className="flex-1 h-8" value={alt.text} onChange={(e) => onAlternativeChange(index, e.target.value)} />
                            ) : (
                                <span className="flex-1 text-sm">{alt.text}</span>
                            )}
                            {(hasDistractor || isEditing) && (
                                <Button
                                    type="button"
                                    variant={isExpanded ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className="size-7 shrink-0"
                                    onClick={() => toggleDistractor(alt.letter)}
                                    title={isExpanded ? 'Ocultar distrator' : 'Ver distrator'}
                                >
                                    <MessageSquare className="size-3.5" />
                                </Button>
                            )}
                        </div>
                        {isExpanded && (
                            <div className={cn(
                                'mt-1 ml-11 rounded-md border-l-2 px-3 py-2 text-xs',
                                isCorrect
                                    ? 'border-emerald-500/60 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100'
                                    : 'border-muted-foreground/30 bg-muted/40 text-muted-foreground'
                            )}>
                                {isEditing ? (
                                    <Textarea
                                        rows={2}
                                        value={alt.distractor || ''}
                                        onChange={(e) => onDistractorChange(index, e.target.value)}
                                        placeholder={isCorrect ? 'Por que esta é a alternativa correta' : 'Por que esta alternativa é incorreta'}
                                        className="text-xs"
                                    />
                                ) : (
                                    <>
                                        <span className={cn('inline-block rounded px-1.5 py-0.5 mr-2 text-[10px] font-medium', isCorrect ? 'bg-emerald-500/20' : 'bg-muted')}>
                                            {isCorrect ? 'Correta' : 'Incorreta'}
                                        </span>
                                        {alt.distractor}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
