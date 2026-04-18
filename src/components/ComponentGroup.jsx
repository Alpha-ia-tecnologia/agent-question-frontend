import { useState } from 'react'
import { ChevronDown, BookOpen, Sigma, Microscope, Globe, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const COMPONENT_CONFIG = {
    LP: { name: 'Língua Portuguesa', Icon: BookOpen, accent: 'text-sky-600 bg-sky-500/10 border-sky-500/20' },
    MT: { name: 'Matemática', Icon: Sigma, accent: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
    CN: { name: 'Ciências da Natureza', Icon: Microscope, accent: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
    CH: { name: 'Ciências Humanas', Icon: Globe, accent: 'text-violet-600 bg-violet-500/10 border-violet-500/20' },
}

export default function ComponentGroup({ componentId, questions, children, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const config = COMPONENT_CONFIG[componentId] || { name: componentId, Icon: Layers, accent: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' }
    const total = questions?.length || 0
    const validated = questions?.filter(q => q.validated)?.length || 0

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(e => !e)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('flex items-center justify-center size-9 rounded-lg border', config.accent)}>
                        <config.Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold tracking-tight">{config.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{total} {total === 1 ? 'questão' : 'questões'}</span>
                            {validated > 0 && <><span>•</span><span className="text-emerald-600 dark:text-emerald-400">{validated} validadas</span></>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{total}</Badge>
                    <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                </div>
            </button>
            {isExpanded && <div className="border-t border-border p-3 space-y-2 bg-muted/20">{children}</div>}
        </div>
    )
}
