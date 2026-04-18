import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await login(email, password)
            navigate(from, { replace: true })
        } catch (err) {
            setError(err.message || 'Falha ao fazer login. Verifique suas credenciais.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-background via-muted/40 to-background p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Sparkles className="size-7" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Question AI</h1>
                    <p className="text-sm text-muted-foreground">Gerador de Questões Educacionais</p>
                </div>

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Entrar</CardTitle>
                        <CardDescription>Acesse com suas credenciais institucionais.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="size-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (<><Loader2 className="size-4 animate-spin" /> Entrando…</>) : 'Entrar'}
                            </Button>
                        </form>
                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            Não tem conta? Contate o administrador.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
