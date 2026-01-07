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
import { Settings, Sliders, History } from 'lucide-react'
import { deleteCampaignAction, updateCampaignStatusAction } from '@/app/actions/admin'
import { DndContext, closestCorners, useDroppable } from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
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
    } = useSortable({
        id: props.id,
        disabled: props.disabled
    })

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

function DroppableSection({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { setNodeRef } = useDroppable({ id })
    return (
        <section ref={setNodeRef} className={className}>
            {children}
        </section>
    )
}

export default function DashboardClient({ campaigns, profile, userId, brandingSettings }: DashboardLayoutProps) {
    const role = profile.role
    const { items, setItems, sensors } = useCampaignDnd(campaigns, role)

    // Local UI state
    const [isMounted, setIsMounted] = useState(false)
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isAgencySettingsOpen, setIsAgencySettingsOpen] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Apply branding color
    const primaryColor = brandingSettings?.primary_color || '#3b82f6'

    useEffect(() => {
        setItems(campaigns)
    }, [campaigns, setItems])

    const activeItems = useMemo(() => {
        return items
            .filter(i => i.status === 'live' || i.status === 'in_preparation')
            .sort((a, b) => (a.priority || 999) - (b.priority || 999))
    }, [items])

    const futureItems = useMemo(() => {
        const priorityWeights: Record<string, number> = {
            high: 0,
            medium: 1,
            low: 2
        }

        return items
            .filter(i => i.status === 'waiting')
            .sort((a, b) => {
                const weightA = priorityWeights[a.priority_level || 'medium']
                const weightB = priorityWeights[b.priority_level || 'medium']

                if (weightA !== weightB) {
                    return weightA - weightB
                }

                // Same priority: oldest first (FIFO)
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            })
    }, [items])

    const handleDragOver = (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Find the containers
        const activeContainer = active.data.current?.sortable?.containerId || (activeItems.find(i => i.id === activeId) ? 'active-container' : 'future-container')
        const overContainer = over.data.current?.sortable?.containerId || overId

        if (!overContainer || activeContainer === overContainer) {
            return
        }

        // It triggers when moving between containers
        const activeItem = items.find(i => i.id === activeId)
        if (!activeItem) return

        let newStatus = activeItem.status
        if (overContainer === 'future-container' || overContainer === 'future-items') { // flexible check
            newStatus = 'waiting'
        } else {
            newStatus = 'in_preparation'
        }

        if (activeItem.status !== newStatus) {
            setItems((items) => {
                const activeIndex = items.findIndex((i) => i.id === activeId)
                const newItems = [...items]
                // If moving to active, append to bottom (highest priority index)
                let newPriority = activeItem.priority
                if (newStatus === 'in_preparation' && activeItem.status === 'waiting') {
                    // Find max priority of current active items
                    const maxPriority = Math.max(...items.filter(i => i.status === 'live' || i.status === 'in_preparation').map(i => i.priority || 0), 0)
                    newPriority = maxPriority + 1
                }

                newItems[activeIndex] = {
                    ...newItems[activeIndex],
                    status: newStatus,
                    priority: newPriority
                }
                return newItems
            })
        }
    }

    const handleDragEnd = async (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        const activeItem = items.find(i => i.id === activeId)
        if (!activeItem) return

        // Calculate final status one last time to be sure
        let newStatus = activeItem.status
        const isOverFuture = overId === 'future-container' || items.find(i => i.id === overId)?.status === 'waiting'
        const isActiveFuture = activeItem.status === 'waiting'

        if (isOverFuture && !isActiveFuture) {
            newStatus = 'waiting'
        } else if (!isOverFuture && isActiveFuture) {
            newStatus = 'in_preparation'
        }

        // Final reorder
        const oldIndex = items.findIndex((item) => item.id === activeId)
        const newIndex = items.findIndex((item) => item.id === overId)

        let newItems = arrayMove(items, oldIndex, newIndex)

        // Ensure status is correct in final array
        newItems = newItems.map(i => i.id === activeId ? { ...i, status: newStatus } : i)

        setItems(newItems)

        // DB Updates
        const { error } = await supabase.from('campaigns').upsert(
            newItems.map((item, index) => ({
                id: item.id,
                title: item.title,
                priority: item.status === 'waiting' ? 999 : (index + 1), // Future items don't strictly need priority index maintenance, but active items do
                status: item.id === activeId ? newStatus : item.status,
                updated_at: new Date().toISOString()
            }))
        )

        if (error) {
            console.error('Error updating campaign sort/status:', error)
            router.refresh()
        }
    }

    const handleStatusChange = async (id: string, status: CampaignStatus) => {
        const result = await updateCampaignStatusAction(id, status)

        if (result.success) {
            setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item))
        } else {
            alert('Fehler beim Status-Update: ' + result.error)
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

    const handleDeleteCampaign = async (id: string) => {
        try {
            const result = await deleteCampaignAction(id)

            if (result.success) {
                setItems(prev => prev.filter(item => item.id !== id))
                setIsDetailOpen(false)
            } else {
                console.error('Delete action failed:', result.error)
                alert('Fehler beim Löschen: ' + result.error)
            }
        } catch (error: any) {
            console.error('Unexpected error during delete:', error)
            alert('Ein unerwarteter Fehler ist aufgetreten: ' + (error?.message || JSON.stringify(error)))
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
                sensors={role === ROLES.CLIENT ? [] : sensors}
                collisionDetection={closestCorners}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {/* Active Missions Zone */}
                <DroppableSection id="active-container" className="bg-white border-b border-black/5 pb-12 md:pb-20 pt-8 md:pt-12 relative overflow-hidden">
                    <div className="mx-auto max-w-5xl px-4 md:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 md:mb-12">
                            <div className="space-y-1">
                                <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-accent-blue">
                                    {`Willkommen, ${profile.full_name || 'Nutzer'}!`}
                                </h2>
                                <p className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight flex items-center gap-4">
                                    Aktive Kampagnen
                                    <span className="inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-full bg-brand text-on-brand text-sm font-bold shadow-lg shadow-zinc-200">
                                        {activeItems.length}
                                    </span>
                                </p>
                            </div>
                            <CreateCampaignModal
                                userId={userId}
                                nextPriority={items.length + 1}
                                onCreated={(nc) => setItems(prev => [...prev, nc])}
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            {isMounted ? (
                                <SortableContext items={activeItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {activeItems.map((campaign) => (
                                        <SortableItem key={campaign.id} id={campaign.id} disabled={false}>
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
                            ) : (
                                activeItems.map((campaign) => (
                                    <CampaignCard
                                        key={campaign.id}
                                        campaign={campaign}
                                        isFocus
                                        role={role}
                                        onClick={() => openDetail(campaign)}
                                        onStatusChange={handleStatusChange}
                                        onPriorityChange={handlePriorityChange}
                                    />
                                ))
                            )}
                            {activeItems.length === 0 && (
                                <div className="border-2 border-dashed border-zinc-200 rounded-[2.5rem] py-24 flex flex-col items-center justify-center text-center px-6 bg-zinc-50/50">
                                    <p className="font-black text-xl text-zinc-900 tracking-tight">Keine aktiven Kampagnen</p>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-3 text-zinc-400 max-w-[280px] md:max-w-none leading-relaxed">
                                        Erstellen Sie eine neue Kampagne oder verschieben Sie bestehende Projekte hierher, um sie zu priorisieren.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DroppableSection>

                {/* Future Projects Zone */}
                <DroppableSection id="future-container" className="py-12 md:py-20 min-h-[500px] relative">
                    <div className="mx-auto max-w-5xl px-4 md:px-8">
                        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Ausblick</h2>
                                <p className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                                    Zukünftige Kampagnen
                                    <span className="inline-flex items-center justify-center h-7 min-w-[1.75rem] px-2 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold">
                                        {futureItems.length}
                                    </span>
                                </p>
                            </div>

                        </div>

                        <div className="space-y-4">
                            {isMounted ? (
                                <SortableContext items={futureItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {futureItems.map((campaign, index) => (
                                        <SortableItem key={campaign.id} id={campaign.id} disabled={false}>
                                            <CampaignCard
                                                campaign={{ ...campaign, priority: index + 1 }}
                                                role={role}
                                                onClick={() => openDetail(campaign)}
                                                onStatusChange={handleStatusChange}
                                                onPriorityChange={handlePriorityChange}
                                            />
                                        </SortableItem>
                                    ))}
                                </SortableContext>
                            ) : (
                                futureItems.map((campaign, index) => (
                                    <CampaignCard
                                        key={campaign.id}
                                        campaign={{ ...campaign, priority: index + 1 }}
                                        role={role}
                                        onClick={() => openDetail(campaign)}
                                        onStatusChange={handleStatusChange}
                                        onPriorityChange={handlePriorityChange}
                                    />
                                ))
                            )}
                            {futureItems.length === 0 && (
                                <div className="border-2 border-dashed border-zinc-200 rounded-[2.5rem] py-24 flex flex-col items-center justify-center text-center px-6 bg-zinc-50/50">
                                    <p className="font-black text-xl text-zinc-900 tracking-tight">Keine zukünftigen Kampagnen</p>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-3 text-zinc-400 max-w-[280px] md:max-w-none leading-relaxed">
                                        Hier erscheinen Projekte, die für eine spätere Umsetzung geplant sind.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-24 pt-12 border-t border-black/5 text-center px-4 md:px-0">
                            <a
                                href="/archive"
                                className="group relative inline-flex items-center gap-6 px-10 py-6 bg-white border border-black/5 rounded-[2.5rem] shadow-premium hover:shadow-2xl hover:border-zinc-200 transition-all duration-500"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-zinc-900 group-hover:rotate-[-12deg] transition-all duration-500">
                                        <History className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-sm font-black text-zinc-900 uppercase tracking-[0.2em] group-hover:text-zinc-600 transition-colors">Vorherige Projekte</span>
                                    </div>
                                </div>
                                <div className="w-8 h-[1px] bg-zinc-200 group-hover:bg-zinc-900 group-hover:w-12 transition-all duration-500" />
                            </a>
                        </div>
                    </div>
                </DroppableSection>

            </DndContext>

            <CampaignDetailModal
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                campaign={selectedCampaign}
                canEdit={role === ROLES.CLIENT || role === 'agency'}
                onUpdate={handleUpdateCampaign}
                onDelete={handleDeleteCampaign}
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
        </div >
    )
}
