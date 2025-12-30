'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ExternalLink, Link as LinkIcon, Save, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from './ui/button'

interface CampaignDetailModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    campaign: any
    onUpdate: (updatedCampaign: any) => void
    onArchive: (id: string) => void
    onStatusChange: (id: string, status: any) => void
    onPriorityChange: (id: string, priority: any) => void
    canEdit: boolean
    role: string
}

export function CampaignDetailModal({
    isOpen,
    onOpenChange,
    campaign,
    onUpdate,
    onArchive,
    onStatusChange,
    onPriorityChange,
    canEdit,
    role
}: CampaignDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(campaign?.status || 'waiting')
    const [currentPriority, setCurrentPriority] = useState(campaign?.priority_level || 'medium')
    const [formData, setFormData] = useState({
        title: campaign?.title || '',
        info_link: campaign?.info_link || '',
        description: campaign?.description || '',
    })

    useEffect(() => {
        if (campaign) {
            setCurrentStatus(campaign.status)
            setCurrentPriority(campaign.priority_level || 'medium')
            setFormData({
                title: campaign.title,
                info_link: campaign.info_link,
                description: campaign.description,
            })
        }
    }, [campaign])

    const supabase = createClient()

    const handleSave = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('campaigns')
            .update(formData)
            .eq('id', campaign.id)
            .select()
            .single()

        if (!error) {
            onUpdate(data)
            setIsEditing(false)
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    if (!campaign) return null

    const statuses = [
        { value: 'waiting', label: 'Wartet', color: 'bg-zinc-100 text-zinc-600' },
        { value: 'in_preparation', label: 'Vorbereitung', color: 'bg-amber-100 text-amber-700' },
        { value: 'live', label: 'Live', color: 'bg-blue-100 text-blue-700' },
        { value: 'completed', label: 'Fertig', color: 'bg-emerald-100 text-emerald-700' },
    ]

    const priorities = [
        { value: 'low', label: 'Niedrig', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
        { value: 'medium', label: 'Mittel', color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { value: 'high', label: 'Hoch', color: 'bg-rose-50 text-rose-600 border-rose-100' },
    ]

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] md:w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl z-50 animate-in zoom-in-95 duration-300 overflow-hidden outline-none border border-white/20 max-h-[90vh] overflow-y-auto">
                    <div className="relative p-6 md:p-12">
                        <Dialog.Close asChild>
                            <button className="absolute right-4 top-4 md:right-8 md:top-8 p-3 hover:bg-zinc-100 rounded-2xl transition-all active:scale-95 group z-10">
                                <X className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                            </button>
                        </Dialog.Close>

                        <div className="space-y-10">
                            {/* Header Section */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-full">
                                            #{campaign.priority}
                                        </span>

                                        {/* Status only for top 6 */}
                                        {campaign.priority <= 6 && (
                                            role === 'agency' ? null : (
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                    campaign.status === 'waiting' ? 'bg-zinc-100 text-zinc-600 border-zinc-200' :
                                                        campaign.status === 'in_preparation' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            campaign.status === 'live' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                )}>
                                                    {campaign.status}
                                                </span>
                                            )
                                        )}
                                    </div>

                                    {/* Selectors for Agency/Both */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {campaign.priority <= 6 && role === 'agency' && (
                                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl border border-black/5">
                                                {statuses.map((s) => (
                                                    <button
                                                        key={s.value}
                                                        onClick={() => {
                                                            setCurrentStatus(s.value)
                                                            onStatusChange(campaign.id, s.value)
                                                        }}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                                                            currentStatus === s.value
                                                                ? s.color + " shadow-sm scale-105"
                                                                : "text-zinc-500 hover:text-zinc-700"
                                                        )}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl border border-black/5">
                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-2">Prio:</span>
                                            {priorities.map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => {
                                                        setCurrentPriority(p.value)
                                                        onPriorityChange(campaign.id, p.value)
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                                                        currentPriority === p.value
                                                            ? p.color + " shadow-sm scale-105"
                                                            : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                                                    )}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <>
                                        <Dialog.Title className="sr-only">Kampagne bearbeiten: {campaign.title}</Dialog.Title>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="text-2xl md:text-4xl font-black tracking-tight border-none p-0 focus:ring-0 h-auto bg-transparent border-b border-zinc-200"
                                        />
                                    </>
                                ) : (
                                    <Dialog.Title className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 leading-tight">
                                        {campaign.title}
                                    </Dialog.Title>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Beschreibung / Briefing</h3>
                                        {isEditing ? (
                                            <textarea
                                                className="w-full min-h-[150px] rounded-2xl border border-zinc-200 p-4 text-sm font-medium focus:ring-2 ring-zinc-100 outline-none transition-all"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-sm text-zinc-600 leading-relaxed font-medium whitespace-pre-wrap">
                                                {campaign.description || 'Keine Beschreibung vorhanden.'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Dokumente & Links</h3>
                                        {isEditing ? (
                                            <Input
                                                value={formData.info_link}
                                                onChange={(e) => setFormData({ ...formData, info_link: e.target.value })}
                                                placeholder="https://..."
                                                className="h-12 rounded-xl"
                                            />
                                        ) : campaign.info_link ? (
                                            <a
                                                href={campaign.info_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-black/5 hover:bg-zinc-100 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <LinkIcon className="h-5 w-5 text-zinc-400" />
                                                    <span className="text-sm font-bold text-zinc-900">Projekt-Dokumentation</span>
                                                </div>
                                                <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-all" />
                                            </a>
                                        ) : (
                                            <p className="text-sm text-zinc-400 font-medium italic">Keine Links hinterlegt.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            {canEdit && (
                                <div className="pt-8 md:pt-10 flex flex-col md:flex-row gap-8 md:items-center justify-between border-t border-black/[0.03]">
                                    <button
                                        onClick={() => onArchive(campaign.id)}
                                        className="flex items-center gap-2 text-xs font-black text-zinc-400 hover:text-red-500 transition-all uppercase tracking-widest group order-2 md:order-1"
                                    >
                                        <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                        Kampagne Archivieren
                                    </button>

                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 order-1 md:order-2">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    onClick={() => setIsEditing(false)}
                                                    className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-xl md:rounded-2xl font-bold px-6 h-12 md:h-11"
                                                    disabled={loading}
                                                >
                                                    Abbrechen
                                                </Button>
                                                <Button
                                                    onClick={handleSave}
                                                    className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl md:rounded-2xl font-bold px-6 h-12 md:h-11 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                                    disabled={loading}
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Speichern
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl md:rounded-2xl font-bold px-8 h-12 md:h-11 shadow-lg shadow-black/10 transition-all active:scale-95"
                                            >
                                                Bearbeiten
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
