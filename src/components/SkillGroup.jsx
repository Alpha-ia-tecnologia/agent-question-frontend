import { useState } from 'react'
import { ChevronDown, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function SkillGroup({ skillName, skillId, questions, children, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const total = questions?.length || 0
    const validated = questions?.filter(q => q.validated)?.length || 0
    const progress = total > 0 ? (validated / total) * 100 : 0

    return (
        <div className="rounded-md border border-border bg-card overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(e => !e)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Target className="size-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{skillName}</div>
                        {skillId && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{skillId}</div>}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{validated}/{total}</span>
                    </div>
                    <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                </div>
            </button>
            {isExpanded && <div className="border-t border-border p-2 bg-background">{children}</div>}
        </div>
    )
}
