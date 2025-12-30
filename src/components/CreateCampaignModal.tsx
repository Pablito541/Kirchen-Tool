'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface CreateCampaignModalProps {
    userId: string
    nextPriority: number
    onCreated?: (campaign: any) => void
}

export function CreateCampaignModal({ userId, nextPriority, onCreated }: CreateCampaignModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        info_link: '',
        description: '',
    })
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase
            .from('campaigns')
            .insert([
                {
                    ...formData,
                    priority: nextPriority,
                    created_by: userId,
                    status: 'waiting',
                },
            ])
            .select()
            .single()

        if (!error) {
            setIsOpen(false)
            setFormData({ title: '', info_link: '', description: '' })
            if (onCreated) onCreated(data)
            router.refresh()
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95 group">
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    Neue Kampagne
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] md:w-full max-w-md bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl z-50 animate-in zoom-in-95 duration-200 outline-none max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <Dialog.Title className="text-2xl font-black tracking-tight">Neue Kampagne</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Titel der Stelle</label>
                            <Input
                                placeholder="z.B. Erzieher Kita St. Martin"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="h-14 rounded-2xl px-5 border-zinc-100 bg-zinc-50 focus:bg-white focus:ring-2 ring-zinc-100 transition-all font-bold placeholder:font-normal placeholder:text-zinc-400"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Link zu Dokumenten</label>
                            <Input
                                placeholder="https://..."
                                value={formData.info_link}
                                onChange={(e) => setFormData({ ...formData, info_link: e.target.value })}
                                className="h-14 rounded-2xl px-5 border-zinc-100 bg-zinc-50 focus:bg-white focus:ring-2 ring-zinc-100 transition-all font-bold placeholder:font-normal placeholder:text-zinc-400"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Beschreibung / Briefing</label>
                            <textarea
                                className="w-full min-h-[120px] rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:bg-white focus:border-zinc-900 transition-all placeholder:font-normal placeholder:text-zinc-400"
                                placeholder="Details zur Kampagne..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl font-bold mt-4 shadow-lg shadow-black/10 transition-all active:scale-95"
                        >
                            {loading ? 'Wird gespeichert...' : 'Kampagne speichern'}
                        </Button>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
