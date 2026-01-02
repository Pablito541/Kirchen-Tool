'use client'

import { CampaignCompletionModal } from '@/components/CampaignCompletionModal'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ExternalLink, Link as LinkIcon, Save, Trash2, RotateCcw, Calendar } from 'lucide-react'
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
    const [isCompletionOpen, setIsCompletionOpen] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(campaign?.status || 'waiting')
    const [currentPriority, setCurrentPriority] = useState(campaign?.priority_level || 'medium')
    const [formData, setFormData] = useState({
        title: campaign?.title || '',
        info_link: campaign?.info_link || '',
        description: campaign?.description || '',
        start_date: campaign?.start_date || '',
    })

    useEffect(() => {
        if (campaign) {
            setCurrentStatus(campaign.status)
            setCurrentPriority(campaign.priority_level || 'medium')
            setFormData({
                title: campaign.title,
                info_link: campaign.info_link,
                description: campaign.description,
                start_date: campaign.start_date || '',
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
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] md:w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl z-50 animate-in zoom-in-95 duration-300 overflow-hidden outline-none ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
                    <div className="relative p-8 md:p-14">
                        <Dialog.Close asChild>
                            <button className="absolute right-6 top-6 md:right-10 md:top-10 p-3 hover:bg-black/5 rounded-full transition-all active:scale-95 group z-10 border border-transparent hover:border-black/5">
                                <X className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                            </button>
                        </Dialog.Close>

                        <div className="space-y-12">
                            {/* Header Section */}
                            <div className="space-y-6 max-w-2xl">
                                {campaign.status !== 'completed' && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-4 py-1.5 rounded-full ring-1 ring-blue-100">
                                                #{campaign.priority}
                                            </span>
                                        </div>

                                        {/* Status and Priority Dropdowns - Available for all users */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            {/* Status Selector */}
                                            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-100/80 rounded-2xl border border-black/5 backdrop-blur-sm">
                                                {statuses.filter(s => s.value !== 'completed').map((s) => (
                                                    <button
                                                        key={s.value}
                                                        onClick={() => {
                                                            setCurrentStatus(s.value)
                                                            onStatusChange(campaign.id, s.value)
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                            currentStatus === s.value
                                                                ? s.color + " shadow-sm scale-105 ring-1 ring-black/5"
                                                                : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                                                        )}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Priority Selector */}
                                            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-100/80 rounded-2xl border border-black/5 backdrop-blur-sm">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-3">Prio:</span>
                                                {priorities.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        onClick={() => {
                                                            setCurrentPriority(p.value)
                                                            onPriorityChange(campaign.id, p.value)
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                            currentPriority === p.value
                                                                ? p.color + " shadow-sm scale-105 ring-1 ring-black/5"
                                                                : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                                                        )}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <>
                                        <Dialog.Title className="sr-only">Kampagne bearbeiten: {campaign.title}</Dialog.Title>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="text-3xl md:text-5xl font-black tracking-tight border-none p-0 focus:ring-0 h-auto bg-transparent border-b border-zinc-200 placeholder:text-zinc-200 text-zinc-900"
                                        />
                                    </>
                                ) : (
                                    <Dialog.Title className="text-3xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-[1.1]">
                                        {campaign.title}
                                    </Dialog.Title>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-x-20">
                                <div className="md:col-span-2 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                            Briefing
                                        </h3>
                                        {isEditing ? (
                                            <textarea
                                                className="w-full min-h-[200px] rounded-3xl border border-zinc-200 p-6 text-base font-medium focus:ring-2 ring-zinc-100 outline-none transition-all bg-zinc-50/50 resize-y text-zinc-900"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Beschreibe die Kampagne..."
                                            />
                                        ) : (
                                            <p className="text-base md:text-lg text-zinc-600 leading-relaxed font-medium whitespace-pre-wrap">
                                                {campaign.description || <span className="text-zinc-400 italic">Keine Beschreibung vorhanden.</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                            Assets
                                        </h3>
                                        {isEditing ? (
                                            <div className="space-y-4 pt-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Asset Link</label>
                                                    <Input
                                                        value={formData.info_link}
                                                        onChange={(e) => setFormData({ ...formData, info_link: e.target.value })}
                                                        placeholder="https://..."
                                                        className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-zinc-900"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Start-Datum</label>
                                                    <Input
                                                        type="date"
                                                        value={formData.start_date}
                                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                        className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-zinc-900"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {campaign.info_link && (
                                                    <a
                                                        href={campaign.info_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex flex-col gap-3 p-5 bg-zinc-50 rounded-[1.5rem] border border-black/5 hover:bg-zinc-100 hover:border-black/10 transition-all group shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="p-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
                                                                <LinkIcon className="h-5 w-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 text-zinc-300 group-hover:text-zinc-900 transition-all" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-zinc-900 block group-hover:underline decoration-2 underline-offset-2 decoration-zinc-200">Dokumentation öffnen</span>
                                                            <span className="text-xs font-medium text-zinc-400 truncate block mt-0.5 max-w-[200px]">
                                                                {(() => {
                                                                    try {
                                                                        return new URL(campaign.info_link).hostname
                                                                    } catch (e) {
                                                                        return 'Link öffnen'
                                                                    }
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </a>
                                                )}

                                                {campaign.start_date && (
                                                    <div className="p-5 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50 shadow-sm flex items-center gap-4">
                                                        <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                                                            <Calendar className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest block">Kampagnen-Start</span>
                                                            <span className="text-sm font-bold text-zinc-900">
                                                                {new Date(campaign.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {!campaign.info_link && !campaign.start_date && (
                                                    <div className="p-6 rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50/50 text-center">
                                                        <p className="text-sm text-zinc-400 font-medium italic">Keine Assets oder Termine hinterlegt.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Completion Report Section (only shown if completed) */}
                            {campaign.status === 'completed' && (
                                <div className="pt-10 mt-10 border-t border-blue-100 bg-blue-50/20 -mx-6 md:-mx-14 px-6 md:px-14 py-12 rounded-b-[2.5rem]">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                        <div>
                                            <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Abschlussbericht & Analysen</h3>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Diese Kampagne wurde erfolgreich abgeschlossen</p>
                                        </div>
                                        <div className={cn(
                                            "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest border shadow-sm",
                                            campaign.goals_reached
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-rose-50 text-rose-600 border-rose-100"
                                        )}>
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", campaign.goals_reached ? "bg-emerald-500" : "bg-rose-500")} />
                                            {campaign.goals_reached ? 'Ziele erreicht' : 'Ziele nicht erreicht'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-[0.2em]">Allgemeiner Verlauf</p>
                                                <div className="p-6 bg-white rounded-3xl border border-blue-100/50 shadow-sm leading-relaxed text-zinc-600 font-medium italic">
                                                    "{campaign.performance_summary || 'Keine Zusammenfassung vorhanden.'}"
                                                </div>
                                            </div>

                                            {campaign.goals_reached_reason && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-[0.2em]">
                                                        {campaign.goals_reached ? 'Erfolgsfaktoren' : 'Analyse der Verfehlung'}
                                                    </p>
                                                    <div className="p-6 bg-white rounded-3xl border border-blue-100/50 shadow-sm text-zinc-600 font-medium">
                                                        {campaign.goals_reached_reason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-[0.2em]">Qualität & Optimierung</p>
                                                <div className="p-6 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-200 leading-relaxed font-bold">
                                                    <p className="text-[9px] uppercase tracking-widest mb-3 opacity-70">Learnings für die Zukunft:</p>
                                                    {campaign.lessons_learned || 'Keine spezifischen Optimierungsvorschläge vermerkt.'}
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 flex items-center justify-center">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">
                                                    Abgeschlossen am {new Date(campaign.completed_at || campaign.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions Footer */}
                            {canEdit && (
                                <div className="pt-8 md:pt-10 flex flex-col md:flex-row gap-8 md:items-center justify-between border-t border-black/[0.03]">
                                    {campaign.status !== 'completed' && (
                                        <button
                                            onClick={() => onArchive(campaign.id)}
                                            className="flex items-center gap-2 text-xs font-black text-zinc-400 hover:text-red-500 transition-all uppercase tracking-widest group order-2 md:order-1"
                                        >
                                            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            Kampagne Archivieren
                                        </button>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 order-1 md:order-2">
                                        {/* Completion Button for valid statuses */}
                                        {!isEditing && campaign.status !== 'completed' && (
                                            <Button
                                                onClick={() => setIsCompletionOpen(true)}
                                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl md:rounded-2xl font-bold px-6 h-12 md:h-11 shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                                            >
                                                Kampagne abschließen
                                            </Button>
                                        )}

                                        {/* Restore Button for completed campaigns */}
                                        {!isEditing && campaign.status === 'completed' && (
                                            <Button
                                                onClick={() => onStatusChange(campaign.id, 'waiting')}
                                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl md:rounded-2xl font-bold px-6 h-12 md:h-11 shadow-sm active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Wiederherstellen
                                            </Button>
                                        )}

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

            <CampaignCompletionModal
                isOpen={isCompletionOpen}
                onOpenChange={setIsCompletionOpen}
                campaign={campaign}
                onComplete={() => {
                    onStatusChange(campaign.id, 'completed')
                    onOpenChange(false) // Close detail modal too
                }}
            />
        </Dialog.Root>
    )
}
