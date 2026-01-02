'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, ArrowRight } from 'lucide-react'
import { login, signInWithOtp } from './actions'

export default function LoginPage() {
    const [role, setRole] = useState<'church' | 'agency'>('church')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [emailDetails, setEmailDetails] = useState('')
    const [isPending, startTransition] = useTransition()

    // Persistent workspace selection
    useEffect(() => {
        const savedRole = localStorage.getItem('last_workspace') as 'church' | 'agency'
        if (savedRole) setRole(savedRole)
    }, [])

    const handleRoleChange = (newRole: 'church' | 'agency') => {
        setRole(newRole)
        localStorage.setItem('last_workspace', newRole)
        setError('') // Clear any previous errors
    }

    // Domain Guard
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setEmailDetails(val)
        if (role === 'agency' && val.includes('@') && !val.includes('@eip-media')) {
            setError('Kein Agentur-Zugang: Bitte nutze deine @eip-media.de Adresse.')
        } else {
            setError('')
        }
    }

    async function handleAction(formData: FormData) {
        setMessage('')
        setError('')

        // Client-side domain guard for agency
        const email = formData.get('email') as string
        if (role === 'agency' && !email.includes('@eip-media')) {
            setError('Zugriff verweigert: Nur für EIP Media Mitarbeiter.')
            return
        }

        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
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
                className="w-full max-w-[400px] space-y-4 md:space-y-6 text-center relative z-10 pt-2 md:pt-4"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={role}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-0"
                    >
                        <div className="transition-all duration-700 flex items-center justify-center mb-1 md:mb-2">
                            <img
                                src="/eip-media-logo.png"
                                alt="EIP Media Logo"
                                className="h-24 md:h-34 w-auto object-contain transition-all duration-700"
                            />
                        </div>
                        <div className="space-y-1 md:space-y-2">
                            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight transition-colors duration-700 ${role === 'church' ? 'text-zinc-900' : 'text-zinc-50'
                                }`}>
                                {role === 'church' ? 'Kunden Login' : 'Agentur Login'}
                            </h1>
                            <p className={`text-sm md:text-base font-medium transition-colors duration-700 ${role === 'church' ? 'text-zinc-500' : 'text-zinc-400'
                                }`}>
                                {role === 'church'
                                    ? 'Dein zentraler Ort für Kampagnen-Management.'
                                    : 'Projektübersicht, Analysen und Status.'}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-premium transition-all duration-700 border glass ${role === 'church'
                    ? 'border-white/40 ring-1 ring-black/5'
                    : 'border-white/5 ring-1 ring-white/5 shadow-2xl shadow-black/40'
                    }`}>
                    <AnimatePresence>
                        {(message || error) && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`text-xs md:text-sm font-bold mb-4 md:mb-8 p-3 md:p-5 rounded-xl md:rounded-2xl border text-center relative overflow-hidden ${error
                                    ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20'
                                    : 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                                    }`}
                            >
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                                />
                                {error || message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form action={handleAction} className="space-y-4 text-left">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className={`text-[11px] font-bold uppercase tracking-[0.2em] ml-2 ${role === 'church' ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}>E-Mail Adresse</label>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="name@beispiel.de"
                                    required
                                    onChange={handleEmailChange}
                                    className={`h-12 md:h-14 rounded-xl md:rounded-2xl px-5 border-none transition-all ${role === 'church'
                                        ? 'bg-zinc-100/50 text-zinc-900 focus:bg-zinc-100 focus:ring-2 ring-zinc-200'
                                        : 'bg-zinc-950/50 text-white focus:bg-zinc-950 focus:ring-2 ring-zinc-800 placeholder:text-zinc-700'
                                        }`}
                                />
                            </div>
                            <div className="space-y-1 md:space-y-2">
                                <label className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] ml-2 ${role === 'church' ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}>Passwort</label>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className={`h-12 md:h-14 rounded-xl md:rounded-2xl px-5 border-none transition-all ${role === 'church'
                                        ? 'bg-zinc-100/50 text-zinc-900 focus:bg-zinc-100 focus:ring-2 ring-zinc-200'
                                        : 'bg-zinc-950/50 text-white focus:bg-zinc-950 focus:ring-2 ring-zinc-800 placeholder:text-zinc-700'
                                        }`}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className={`w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold text-base shadow-lg mt-2 md:mt-4 transition-all duration-300 active:scale-[0.98] ${role === 'church'
                                ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-xl'
                                : 'bg-white text-zinc-900 hover:bg-zinc-200 hover:shadow-xl shadow-zinc-950/20'
                                }`}
                            disabled={isPending}
                        >
                            {isPending ? 'Authentifizierung...' : 'Anmelden'}
                        </Button>
                    </form>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${role === 'church' ? 'text-zinc-300' : 'text-zinc-600'}`}>Arbeitsbereich wechseln</span>
                    <div className="flex justify-center pb-4 md:pb-8">
                        {role === 'church' ? (
                            <button
                                onClick={() => handleRoleChange('agency')}
                                className="flex items-center gap-3 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-all group"
                            >
                                <Briefcase className="h-4 w-4" />
                                <span>Agentur Login</span>
                                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleRoleChange('church')}
                                className="flex items-center gap-3 text-sm font-bold text-zinc-500 hover:text-white transition-all group"
                            >
                                <Briefcase className="h-4 w-4" />
                                <span>Kunden Login</span>
                                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

            </motion.div >
        </div >
    )
}
