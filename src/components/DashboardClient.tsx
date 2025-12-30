'use client'

import { useState, useMemo, useEffect } from 'react'
import { CampaignCard } from '@/components/CampaignCard'
import { CreateCampaignModal } from '@/components/CreateCampaignModal'
import { CampaignDetailModal } from '@/components/CampaignDetailModal'
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal'
import { AgencySettingsModal } from '@/components/AgencySettingsModal'
import { UserMenu } from '@/components/UserMenu'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Settings, Sliders } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCampaignDnd } from '@/hooks/useCampaignDnd'
import { ROLES, CAMPAIGN_STATUS, type CampaignStatus } from '@/lib/constants'

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
    const role = profile.role
    const { items, setItems, sensors, handleDragEnd } = useCampaignDnd(campaigns, role)

    // Local UI state
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isAgencySettingsOpen, setIsAgencySettingsOpen] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    // Apply branding color
    const primaryColor = brandingSettings?.primary_color || '#3b82f6'

    useEffect(() => {
        setItems(campaigns.filter(c => !c.archived_at))
    }, [campaigns, setItems])

    const activeItems = useMemo(() => items.filter((_, idx) => idx < 6), [items])
    const futureItems = useMemo(() => items.filter((_, idx) => idx >= 6), [items])

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

    const handlePriorityChange = async (id: string, priority_level: string) => {
        const { error } = await supabase
            .from('campaigns')
            .update({ priority_level })
            .eq('id', id)

        if (!error) {
            setItems(prev => prev.map(item => item.id === id ? { ...item, priority_level } : item))
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
            <header className="flex h-16 md:h-20 items-center border-b border-black/5 px-4 md:px-8 sticky top-0 bg-white/80 backdrop-blur-xl z-30">
                <div className="flex items-center gap-2 md:gap-3">
                    <img
                        src="/eip-media-logo.png"
                        alt="EIP Media"
                        className="h-12 md:h-20 object-contain"
                    />
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <UserMenu
                        profile={profile}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenAgencySettings={() => setIsAgencySettingsOpen(true)}
                    />
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Active Missions Zone */}
                <section className="bg-white border-b border-black/5 pb-12 md:pb-20 pt-8 md:pt-12 relative overflow-hidden">
                    <div className="mx-auto max-w-5xl px-4 md:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 md:mb-12">
                            <div className="space-y-1">
                                <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
                                    {brandingSettings?.welcome_message ? 'Fokus' : 'Fokus'}
                                </h2>
                                <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
                                    {role === 'church' && brandingSettings?.welcome_message ? brandingSettings.welcome_message : 'Aktive Kampagnen'}
                                </p>
                            </div>
                            <CreateCampaignModal
                                userId={userId}
                                nextPriority={items.length + 1}
                                onCreated={(nc) => setItems(prev => [...prev, nc])}
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <SortableContext items={activeItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                {activeItems.map((campaign) => (
                                    <SortableItem key={campaign.id} id={campaign.id} disabled={role !== 'church'}>
                                        <CampaignCard
                                            campaign={campaign}
                                            isFocus
                                            role={role}
                                            onClick={() => openDetail(campaign)}
                                            onStatusChange={handleStatusChange}
                                            onPriorityChange={handlePriorityChange}
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
                    <section className="py-12 md:py-20 min-h-[500px] relative">
                        <div className="mx-auto max-w-5xl px-4 md:px-8">
                            <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Ausblick</h2>
                                    <p className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">Zukünftige Kampagnen</p>
                                </div>
                                {brandingSettings && !brandingSettings.show_future_projects && role === 'agency' && (
                                    <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 italic w-fit">
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
                                                role={role}
                                                onClick={() => openDetail(campaign)}
                                                onStatusChange={handleStatusChange}
                                                onPriorityChange={handlePriorityChange}
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
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                role={role}
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
