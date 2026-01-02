'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface CampaignCompletionModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    campaign: any
    onComplete: () => void
}

export function CampaignCompletionModal({ isOpen, onOpenChange, campaign, onComplete }: CampaignCompletionModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // 1: Form, 2: Success
    const [formData, setFormData] = useState({
        performance_summary: '',
        goals_reached: null as boolean | null,
        goals_reached_reason: '',
        lessons_learned: ''
    })

    const supabase = createClient()
    const router = useRouter()

    const handleSubmit = async () => {
        if (formData.goals_reached === null) {
            alert('Bitte gib an, ob die Ziele erreicht wurden.')
            return
        }

        setLoading(true)
        const { error } = await supabase
            .from('campaigns')
            .update({
                status: 'completed',
                performance_summary: formData.performance_summary,
                goals_reached: formData.goals_reached,
                goals_reached_reason: formData.goals_reached_reason,
                lessons_learned: formData.lessons_learned,
                completed_at: new Date().toISOString(),
                archived_at: new Date().toISOString()
            })
            .eq('id', campaign.id)

        if (!error) {
            onComplete()
            onOpenChange(false)
            router.refresh()
        } else {
            alert('Fehler beim Speichern: ' + error.message)
        }
        setLoading(false)
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] md:w-full max-w-lg bg-white rounded-[2rem] p-6 md:p-10 shadow-2xl z-[60] animate-in zoom-in-95 duration-300 outline-none max-h-[90vh] overflow-y-auto">

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Dialog.Title className="text-2xl font-black tracking-tight text-zinc-900">
                                Kampagne abschließen
                            </Dialog.Title>
                            <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-wide">
                                Abschlussbericht & Learnings
                            </p>
                        </div>
                        <Dialog.Close asChild>
                            <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-8">
                        {/* 1. Performance Summary */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">1</span>
                                Wie lief die Kampagne generell?
                            </label>
                            <textarea
                                value={formData.performance_summary}
                                onChange={(e) => setFormData({ ...formData, performance_summary: e.target.value })}
                                className="w-full min-h-[100px] p-4 bg-zinc-50 rounded-2xl border-none focus:ring-2 ring-blue-100 resize-none text-zinc-900 font-medium transition-all"
                                placeholder="Kurze Zusammenfassung des Verlaufs..."
                            />
                        </div>

                        {/* 2. Goals Reached */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">2</span>
                                Wurde das Kampagnenziel erreicht?
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, goals_reached: true })}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.goals_reached === true
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm scale-[1.02]'
                                        : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                                        }`}
                                >
                                    <CheckCircle2 className={`h-6 w-6 ${formData.goals_reached === true ? 'fill-current' : ''}`} />
                                    <span className="font-bold text-sm">Ja, erreicht</span>
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, goals_reached: false })}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.goals_reached === false
                                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm scale-[1.02]'
                                        : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                                        }`}
                                >
                                    <AlertCircle className={`h-6 w-6 ${formData.goals_reached === false ? 'fill-current' : ''}`} />
                                    <span className="font-bold text-sm">Nein, verfehlt</span>
                                </button>
                            </div>

                            {/* Conditional Reason Input */}
                            {formData.goals_reached !== null && (
                                <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block ml-1">
                                        {formData.goals_reached ? 'Was war der Schlüsselfaktor für den Erfolg?' : 'Woran hat es gelegen / Was hat gefehlt?'}
                                    </label>
                                    <textarea
                                        value={formData.goals_reached_reason}
                                        onChange={(e) => setFormData({ ...formData, goals_reached_reason: e.target.value })}
                                        className="w-full min-h-[80px] p-4 bg-zinc-50 rounded-2xl border-none focus:ring-2 ring-blue-100 resize-none text-zinc-900 font-medium text-sm transition-all"
                                        placeholder="Deine Begründung..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* 3. Lessons Learned / Quality Improvement */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">3</span>
                                Was können wir tun, um die Qualität für die nächsten Male zu verbessern?
                            </label>
                            <textarea
                                value={formData.lessons_learned}
                                onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                                className="w-full min-h-[100px] p-4 bg-zinc-50 rounded-2xl border-none focus:ring-2 ring-blue-100 resize-none text-zinc-900 font-medium transition-all"
                                placeholder="Deine Ideen zur Qualitätssteigerung..."
                            />
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-95 mt-4"
                        >
                            {loading ? 'Kampagne wird archiviert...' : 'Abschlussbericht speichern'}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
