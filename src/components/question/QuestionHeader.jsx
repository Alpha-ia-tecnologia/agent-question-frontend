import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function QuestionHeader({ questionNumber, skillId, isExpanded, isValidated, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                    'flex items-center justify-center size-9 rounded-lg text-sm font-semibold shrink-0',
                    isValidated
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                )}>
                    {questionNumber}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight">Questão {questionNumber}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {skillId && <span className="text-[11px] font-mono text-muted-foreground truncate">{skillId}</span>}
                        {isValidated && (
                            <Badge variant="outline" className="h-4 px-1.5 gap-1 text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="size-2.5" /> Validada
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
        </button>
    )
}
