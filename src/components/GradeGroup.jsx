import { useState } from 'react'
import { ChevronDown, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function GradeGroup({ grade, questions, children, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const total = questions?.length || 0
    const validated = questions?.filter(q => q.validated)?.length || 0

    return (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(e => !e)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/40 transition-colors text-left"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{grade}</span>
                    <Badge variant="outline" className="text-[10px]">{total}</Badge>
                    {validated > 0 && <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">✓ {validated}</Badge>}
                </div>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
            </button>
            {isExpanded && <div className="border-t border-border p-2 space-y-2 bg-muted/10">{children}</div>}
        </div>
    )
}
