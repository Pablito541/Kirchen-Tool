'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Church, Briefcase, ArrowRight } from 'lucide-react'
import { login, signInWithOtp } from './actions'

export default function LoginPage() {
    const [role, setRole] = useState<'church' | 'agency'>('church')
    const [isPasswordLogin, setIsPasswordLogin] = useState(true)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    async function handleAction(formData: FormData) {
        setMessage('')
        setError('')

        startTransition(async () => {
            // Append role hint to email if needed, or handle in action
            if (isPasswordLogin) {
                const result = await login(formData)
                if (result?.error) {
                    setError(result.error)
                }
            } else {
                const result = await signInWithOtp(formData, window.location.origin)
                if (result?.error) {
                    setError(result.error)
                } else if (result?.message) {
                    setMessage(result.message)
                }
            }
        })
    }

    return (
        <div className={`flex min-h-screen items-center justify-center transition-colors duration-1000 px-4 relative overflow-hidden ${role === 'church' ? 'bg-[#fafaf9]' : 'bg-[#0c0a09]'
            }`}>
            {/* Subtle background glow effect */}
            <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${role === 'church' ? 'bg-blue-400' : 'bg-blue-600'
                }`} />
            <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${role === 'church' ? 'bg-amber-200' : 'bg-amber-900'
                }`} />

            <motion.div
                layout
                className="w-full max-w-[400px] space-y-10 text-center relative z-10"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={role}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className={`rounded-[2rem] p-6 shadow-premium border transition-all duration-700 ${role === 'church'
                            ? 'bg-white border-white/50 ring-1 ring-black/5'
                            : 'bg-zinc-900 border-zinc-800 ring-1 ring-white/5'
                            }`}>
                            {role === 'church' ? (
                                <Church className="h-10 w-10 text-zinc-900" />
                            ) : (
                                <Briefcase className="h-10 w-10 text-white" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className={`text-3xl font-bold tracking-tight transition-colors duration-700 ${role === 'church' ? 'text-zinc-900' : 'text-zinc-50'
                                }`}>
                                {role === 'church' ? 'Kirche Login' : 'Agentur Dashboard'}
                            </h1>
                            <p className={`text-base font-medium transition-colors duration-700 ${role === 'church' ? 'text-zinc-500' : 'text-zinc-400'
                                }`}>
                                {role === 'church'
                                    ? 'Verwalte deine Kampagnen und Prioritäten.'
                                    : 'Projektübersicht und Statusberichte.'}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className={`p-10 rounded-[2.5rem] shadow-premium transition-all duration-700 border glass ${role === 'church'
                    ? 'border-white/40 ring-1 ring-black/5'
                    : 'border-white/5 ring-1 ring-white/5 shadow-2xl shadow-black/40'
                    }`}>
                    <form action={handleAction} className="space-y-6 text-left">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className={`text-[11px] font-bold uppercase tracking-[0.2em] ml-2 ${role === 'church' ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}>E-Mail Adresse</label>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="name@beispiel.de"
                                    required
                                    className={`h-14 rounded-2xl px-5 border-none transition-all ${role === 'church'
                                        ? 'bg-zinc-100/50 text-zinc-900 focus:bg-zinc-100 focus:ring-2 ring-zinc-200'
                                        : 'bg-zinc-950/50 text-white focus:bg-zinc-950 focus:ring-2 ring-zinc-800 placeholder:text-zinc-700'
                                        }`}
                                />
                            </div>
                            {isPasswordLogin && (
                                <div className="space-y-2">
                                    <label className={`text-[11px] font-bold uppercase tracking-[0.2em] ml-2 ${role === 'church' ? 'text-zinc-400' : 'text-zinc-500'
                                        }`}>Passwort</label>
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className={`h-14 rounded-2xl px-5 border-none transition-all ${role === 'church'
                                            ? 'bg-zinc-100/50 text-zinc-900 focus:bg-zinc-100 focus:ring-2 ring-zinc-200'
                                            : 'bg-zinc-950/50 text-white focus:bg-zinc-950 focus:ring-2 ring-zinc-800 placeholder:text-zinc-700'
                                            }`}
                                    />
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className={`w-full h-14 rounded-2xl font-bold text-base shadow-lg mt-4 transition-all duration-300 active:scale-[0.98] ${role === 'church'
                                ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-xl'
                                : 'bg-white text-zinc-900 hover:bg-zinc-200 hover:shadow-xl shadow-zinc-950/20'
                                }`}
                            disabled={isPending}
                        >
                            {isPending ? 'Authentifizierung...' : 'Anmelden'}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-zinc-200/10 flex justify-center">
                        <button
                            onClick={() => setIsPasswordLogin(!isPasswordLogin)}
                            className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:tracking-[0.25em] ${role === 'church' ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {isPasswordLogin ? 'Magic Link senden' : 'Passwort verwenden'}
                        </button>
                    </div>
                </div>

                <div className="flex justify-center pb-8">
                    {role === 'church' ? (
                        <button
                            onClick={() => setRole('agency')}
                            className="flex items-center gap-3 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-all group"
                        >
                            <Briefcase className="h-4 w-4" />
                            <span>Agentur Dashboard</span>
                            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setRole('church')}
                            className="flex items-center gap-3 text-sm font-bold text-zinc-500 hover:text-white transition-all group"
                        >
                            <Church className="h-4 w-4" />
                            <span>Kirchen-Login</span>
                            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
                        </button>
                    )}
                </div>

                {(message || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-sm font-bold mt-10 p-5 rounded-2xl border ${error
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}
                    >
                        {error || message}
                    </motion.div>
                )}
            </motion.div>
        </div>
    )

}
