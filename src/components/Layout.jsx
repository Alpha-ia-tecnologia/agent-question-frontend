import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    LayoutDashboard,
    Sparkles,
    FileText,
    ShieldCheck,
    Users,
    LogOut,
    GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NAV = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/gerar-questoes', label: 'Gerar Questões', icon: Sparkles },
    { to: '/questoes', label: 'Minhas Questões', icon: FileText },
    { to: '/questoes-validadas', label: 'Validação', icon: ShieldCheck },
]

const ADMIN_NAV = [
    { to: '/usuarios', label: 'Usuários', icon: Users },
]

function NavItem({ to, label, icon: Icon, end }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground shadow-sm'
            )}
        >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
        </NavLink>
    )
}

export default function Layout({ children }) {
    const { user, isAdmin, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const initials = (user?.name || 'U').slice(0, 2).toUpperCase()

    return (
        <TooltipProvider delayDuration={200}>
            <div className="min-h-screen flex bg-background text-foreground">
                <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
                    <div className="px-4 py-5 border-b border-sidebar-border">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground shadow-sm">
                                <GraduationCap className="size-5" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-semibold">Question AI</span>
                                <span className="text-[11px] text-muted-foreground">Educational Generator</span>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                        <div className="space-y-1">
                            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</div>
                            {NAV.map((item) => <NavItem key={item.to} {...item} />)}
                        </div>

                        {isAdmin && (
                            <div className="space-y-1">
                                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Administração</div>
                                {ADMIN_NAV.map((item) => <NavItem key={item.to} {...item} />)}
                            </div>
                        )}
                    </nav>

                    <div className="border-t border-sidebar-border p-3">
                        <div className="flex items-center gap-2.5 rounded-lg p-2">
                            <Avatar className="size-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 leading-tight">
                                <div className="text-sm font-medium truncate">{user?.name || 'Usuário'}</div>
                                <div className="text-[11px] text-muted-foreground">{isAdmin ? 'Administrador' : 'Colaborador'}</div>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8" onClick={handleLogout}>
                                        <LogOut className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Sair</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 overflow-x-hidden">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                        {children}
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}
