'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Church, Briefcase, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createProfile } from '../login/actions'

export default function SetupPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // If profile exists, redirect to dashboard
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                router.push('/dashboard')
                return
            }

            setUser(user)
            setLoading(false)
        }
        loadUser()
    }, [router, supabase])

    const isAgency = user?.email?.includes('@eip-media')
    const role = isAgency ? 'Agency' : 'Church'

    async function handleJoin() {
        setCreating(true)
        const result = await createProfile()
        if (result?.error) {
            console.error(result.error)
            setCreating(false)
        } else {
            // Success handled by server action redirect
        }
    }

    if (loading) return null

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg text-center space-y-8"
            >
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-emerald-500 blur-2xl opacity-20 rounded-full" />
                    <div className="relative bg-white p-6 rounded-[2rem] shadow-premium border border-zinc-100">
                        {isAgency ? (
                            <Briefcase className="h-12 w-12 text-zinc-900" />
                        ) : (
                            <Church className="h-12 w-12 text-zinc-900" />
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                        Willkommen an Bord!
                    </h1>
                    <p className="text-lg text-zinc-500 font-medium">
                        Wir haben dich als <span className="text-zinc-900 font-bold">{isAgency ? 'Agentur-Partner' : 'Community-Mitglied'}</span> identifiziert.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm text-left space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-zinc-100 shadow-sm text-sm font-bold text-zinc-400">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Angemeldet als</p>
                            <p className="text-sm font-bold text-zinc-900 truncate">{user.email}</p>
                        </div>
                        <Check className="h-5 w-5 text-emerald-500" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-zinc-600">Zugang zum {role} Dashboard</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-zinc-600">Alle Kampagnen im Blick</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-zinc-600">Sichere Umgebung</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleJoin}
                        disabled={creating}
                        className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    >
                        {creating ? 'Verbinde...' : 'Dashboard beitreiten'}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
