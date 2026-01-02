'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { CampaignCard } from '@/components/CampaignCard'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CampaignDetailModal } from '@/components/CampaignDetailModal'

export default function ArchivePage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [archivedCampaigns, setArchivedCampaigns] = useState<any[]>([])
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')
            setUser(user)

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            if (!profile) return router.push('/login')

            // Extra check for archive: if role is agency but email is not @eip-media, redirect to dashboard for role fix
            if (profile.role === 'agency' && !user.email?.includes('@eip-media')) {
                return router.push('/dashboard')
            }

            setProfile(profile)

            const { data: campaigns } = await supabase
                .from('campaigns')
                .select('*')
                .eq('status', 'completed')
                .order('updated_at', { ascending: false })

            setArchivedCampaigns(campaigns || [])
            setLoading(false)
        }
        loadData()
    }, [supabase, router])

    const handleStatusChange = async (id: string, status: string) => {
        const { error } = await supabase
            .from('campaigns')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (!error) {
            setArchivedCampaigns(prev => prev.filter(c => c.id !== id))
            setSelectedCampaign(null)
            router.refresh()
        }
    }

    const handlePriorityChange = async (id: string, priority_level: string) => {
        const { error } = await supabase
            .from('campaigns')
            .update({
                priority_level,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (!error) {
            setArchivedCampaigns(prev => prev.map(c => c.id === id ? { ...c, priority_level } : c))
            router.refresh()
        }
    }

    const handleArchive = async (id: string) => {
        // In archive, this might mean 'delete' or 'permanent archive'
        // For now, let's just use the same toggle if needed, or leave as is
        const { error } = await supabase
            .from('campaigns')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', id)

        if (!error) {
            setArchivedCampaigns(prev => prev.filter(c => c.id !== id))
            setSelectedCampaign(null)
            router.refresh()
        }
    }

    if (loading) return null

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50">
            <header className="flex h-16 items-center border-b px-6 bg-white sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-zinc-100 rounded-full transition-colors font-bold flex items-center gap-2 text-zinc-600">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="text-sm">Zurück zum Dashboard</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto max-w-5xl py-12 px-6">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">Historie</h2>
                        <p className="text-3xl font-black text-zinc-900">Archivierte Kampagnen</p>
                        <p className="text-zinc-500 mt-2">Hier findest du alle erfolgreich abgeschlossenen Projekte.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {archivedCampaigns?.map((campaign) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                isArchive={true}
                                onClick={() => setSelectedCampaign(campaign)}
                            />
                        ))}
                        {(!archivedCampaigns || archivedCampaigns.length === 0) && (
                            <div className="col-span-full py-20 bg-white rounded-3xl border border-zinc-100 text-center flex flex-col items-center justify-center text-zinc-400">
                                <RotateCcw className="h-10 w-10 mb-4 opacity-20" />
                                <p className="font-medium">Noch keine Kampagnen im Archiv</p>
                                <p className="text-sm mt-1">Abgeschlossene Kampagnen erscheinen automatisch hier.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedCampaign && (
                <CampaignDetailModal
                    isOpen={!!selectedCampaign}
                    onOpenChange={(open) => !open && setSelectedCampaign(null)}
                    campaign={selectedCampaign}
                    onUpdate={(updated) => {
                        setArchivedCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c))
                        setSelectedCampaign(updated)
                    }}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                    onArchive={handleArchive}
                    canEdit={true}
                    role={profile.role}
                />
            )}
        </div>
    )
}
