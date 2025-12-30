'use client'

import { useState, useMemo, useEffect } from 'react'
import { CampaignCard, type CampaignStatus } from '@/components/CampaignCard'
import { CreateCampaignModal } from '@/components/CreateCampaignModal'
import { CampaignDetailModal } from '@/components/CampaignDetailModal'
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal'
import { AgencySettingsModal } from '@/components/AgencySettingsModal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Settings, Sliders } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DashboardLayoutProps {
    campaigns: any[]
    profile: any
    userId: string
    brandingSettings?: any
}

function SortableItem(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {props.children}
        </div>
    )
}

export default function DashboardClient({ campaigns, profile, userId, brandingSettings }: DashboardLayoutProps) {
    const [items, setItems] = useState(campaigns)
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isAgencySettingsOpen, setIsAgencySettingsOpen] = useState(false)

    const router = useRouter()
    const supabase = createClient()
    const role = profile.role

    // Apply branding color
    const primaryColor = brandingSettings?.primary_color || '#3b82f6'

    useEffect(() => {
        setItems(campaigns.filter(c => !c.archived_at))
    }, [campaigns])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const activeItems = useMemo(() => items.filter((_, idx) => idx < 6), [items])
    const futureItems = useMemo(() => items.filter((_, idx) => idx >= 6), [items])

    async function handleDragEnd(event: DragEndEvent) {
        if (role !== 'church') return

        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id)
            const newIndex = items.findIndex((item) => item.id === over.id)

            const newItems = arrayMove(items, oldIndex, newIndex)
            setItems(newItems)

            const { error } = await supabase.from('campaigns').upsert(
                newItems.map((item, index) => ({
                    id: item.id,
                    title: item.title,
                    priority: index + 1,
                }))
            )

            if (error) {
                console.error('Error updating priorities:', error)
                router.refresh()
            }
        }
    }

    const handleStatusChange = async (id: string, status: CampaignStatus) => {
        const { error } = await supabase
            .from('campaigns')
            .update({ status })
            .eq('id', id)

        if (!error) {
            setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item))
            if (status === 'completed') {
                router.refresh()
            }
        }
    }

    const handleUpdateCampaign = (updated: any) => {
        setItems(prev => prev.map(item => item.id === updated.id ? updated : item))
        setSelectedCampaign(updated)
    }

    const handleArchiveCampaign = async (id: string) => {
        const { error } = await supabase
            .from('campaigns')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', id)

        if (!error) {
            setItems(prev => prev.filter(item => item.id !== id))
            setIsDetailOpen(false)
            router.refresh()
        }
    }

    const openDetail = (campaign: any) => {
        setSelectedCampaign(campaign)
        setIsDetailOpen(true)
    }

    return (
        <div className="flex-1">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Active Missions Zone */}
                <section className="bg-white border-b border-black/5 pb-20 pt-12 relative overflow-hidden">
                    <div
                        className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-20"
                        style={{ backgroundColor: primaryColor }}
                    />

                    <div className="mx-auto max-w-5xl px-8 relative z-10">
                        <div className="flex items-end justify-between mb-12">
                            <div className="space-y-1">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
                                    {brandingSettings?.welcome_message ? 'Status: Aktiv' : 'Status: Aktiv'}
                                </h2>
                                <p className="text-4xl font-black text-zinc-900 tracking-tight">
                                    {role === 'church' && brandingSettings?.welcome_message ? brandingSettings.welcome_message : 'Aktive Missionen'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {role === 'agency' && (
                                    <button
                                        onClick={() => setIsAgencySettingsOpen(true)}
                                        className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95 group"
                                    >
                                        <Sliders className="h-4 w-4 group-hover:rotate-180 transition-transform duration-700" />
                                        Kirchen-Ansicht
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-3 hover:bg-zinc-100 rounded-2xl transition-all active:scale-95 group text-zinc-400 hover:text-zinc-900 border border-black/5"
                                >
                                    <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                                {role === 'church' && (
                                    <CreateCampaignModal
                                        userId={userId}
                                        nextPriority={items.length + 1}
                                        onCreated={(nc) => setItems(prev => [...prev, nc])}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <SortableContext items={activeItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                {activeItems.map((campaign) => (
                                    <SortableItem key={campaign.id} id={campaign.id} disabled={role !== 'church'}>
                                        <CampaignCard
                                            campaign={campaign}
                                            isFocus
                                            onClick={() => openDetail(campaign)}
                                        />
                                    </SortableItem>
                                ))}
                            </SortableContext>
                            {activeItems.length === 0 && (
                                <div className="border-2 border-dashed border-zinc-200 rounded-[2rem] py-20 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50">
                                    <p className="font-bold text-lg text-zinc-500">Keine aktiven Missionen</p>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-2 text-zinc-400">Zieh Projekte hierher um sie zu priorisieren</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Future Projects Zone */}
                {(!brandingSettings || brandingSettings.show_future_projects || role === 'agency') && (
                    <section className="py-20 min-h-[500px] relative">
                        <div className="mx-auto max-w-5xl px-8">
                            <div className="mb-12 flex items-center justify-between">
                                <div>
                                    <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Ausblick</h2>
                                    <p className="text-3xl font-black text-zinc-900 tracking-tight">Zükünftige Projekte</p>
                                </div>
                                {brandingSettings && !brandingSettings.show_future_projects && role === 'agency' && (
                                    <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 italic">
                                        Nur für Agentur sichtbar
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <SortableContext items={futureItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {futureItems.map((campaign) => (
                                        <SortableItem key={campaign.id} id={campaign.id} disabled={role !== 'church'}>
                                            <CampaignCard
                                                campaign={campaign}
                                                onClick={() => openDetail(campaign)}
                                            />
                                        </SortableItem>
                                    ))}
                                </SortableContext>
                                {futureItems.length === 0 && (
                                    <div className="py-20 text-center bg-zinc-100/30 rounded-[2rem] border border-black/5">
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Die Vorbereitung ist leer</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-24 pt-12 border-t border-black/5 text-center">
                                <a
                                    href="/archive"
                                    className="group inline-flex items-center gap-3 text-[11px] font-black text-zinc-400 hover:text-zinc-900 transition-all uppercase tracking-[0.3em] hover:tracking-[0.35em]"
                                >
                                    Zum Archiv der Erfolge
                                    <div className="w-8 h-[1px] bg-zinc-200 group-hover:bg-zinc-900 transition-colors" />
                                </a>
                            </div>
                        </div>
                    </section>
                )}
            </DndContext>

            <CampaignDetailModal
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                campaign={selectedCampaign}
                canEdit={role === 'church' || role === 'agency'}
                onUpdate={handleUpdateCampaign}
                onArchive={handleArchiveCampaign}
            />

            <ProfileSettingsModal
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                profile={profile}
            />

            <AgencySettingsModal
                isOpen={isAgencySettingsOpen}
                onOpenChange={setIsAgencySettingsOpen}
                agencyId={userId}
            />
        </div>
    )
}
