'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Palette, MessageSquare, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useRouter } from 'next/navigation'

interface AgencySettingsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    agencyId: string
}

export function AgencySettingsModal({ isOpen, onOpenChange, agencyId }: AgencySettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [settings, setSettings] = useState({
        primary_color: '#3b82f6',
        welcome_message: 'Hier sind eure aktuellen Missionen.',
        show_future_projects: true,
        church_id: ''
    })

    // For simplicity in this 1:1 context, we fetch the first church-user we find
    // In a multi-tenant app, this would be passed or selected
    const [churchUser, setChurchUser] = useState<any>(null)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const loadSettings = async () => {
            setFetching(true)
            // 1. Find a church user
            const { data: church } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'church')
                .limit(1)
                .single()

            if (church) {
                setChurchUser(church)
                // 2. Load settings for this church
                const { data: existingSettings } = await supabase
                    .from('dashboard_settings')
                    .select('*')
                    .eq('church_id', church.id)
                    .single()

                if (existingSettings) {
                    setSettings({
                        primary_color: existingSettings.primary_color,
                        welcome_message: existingSettings.welcome_message,
                        show_future_projects: existingSettings.show_future_projects,
                        church_id: church.id
                    })
                } else {
                    setSettings(s => ({ ...s, church_id: church.id }))
                }
            }
            setFetching(false)
        }

        if (isOpen) loadSettings()
    }, [isOpen, agencyId])

    const handleSave = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('dashboard_settings')
            .upsert({
                church_id: settings.church_id,
                agency_id: agencyId,
                primary_color: settings.primary_color,
                welcome_message: settings.welcome_message,
                show_future_projects: settings.show_future_projects,
                updated_at: new Date().toISOString()
            }, { onConflict: 'church_id' })

        if (!error) {
            router.refresh()
            onOpenChange(false)
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <Dialog.Title className="text-2xl font-black tracking-tight">Kirchen-Ansicht steuern</Dialog.Title>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                Änderungen für: {churchUser?.full_name || 'Lädt...'}
                            </p>
                        </div>
                        <Dialog.Close asChild>
                            <button className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                                <X className="h-5 w-5 text-zinc-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {fetching ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Branding Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Palette className="h-4 w-4" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Branding & Farben</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Primärfarbe</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={settings.primary_color}
                                                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                                className="h-12 w-12 rounded-xl bg-transparent border-none cursor-pointer"
                                            />
                                            <Input
                                                value={settings.primary_color}
                                                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                                className="bg-white/5 border-white/10 h-12 rounded-xl font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Vorschau</label>
                                        <div
                                            className="h-12 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest"
                                            style={{ backgroundColor: settings.primary_color }}
                                        >
                                            Button Stil
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messaging Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <MessageSquare className="h-4 w-4" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Willkommens-Botschaft</h3>
                                </div>
                                <div className="space-y-2">
                                    <textarea
                                        className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                                        placeholder="Botschaft für die Kirche..."
                                        value={settings.welcome_message}
                                        onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Visibility Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Eye className="h-4 w-4" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Sichtbarkeit</h3>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, show_future_projects: !settings.show_future_projects })}
                                    className="flex items-center justify-between w-full p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${settings.show_future_projects ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                            {settings.show_future_projects ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold">Zükünftige Projekte anzeigen</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                                {settings.show_future_projects ? 'Sichtbar für Kirche' : 'Nur für Agentur'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`h-6 w-10 rounded-full transition-colors relative ${settings.show_future_projects ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.show_future_projects ? 'left-5' : 'left-1'}`} />
                                    </div>
                                </button>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full h-16 bg-white text-zinc-900 hover:bg-zinc-200 rounded-[1.5rem] font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                Design-Update anwenden
                            </Button>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
