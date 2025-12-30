import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CampaignCard } from '@/components/CampaignCard'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'

export default async function ArchivePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return redirect('/login')
    }

    const { data: archivedCampaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50">
            <header className="flex h-16 items-center border-b px-6 bg-white sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-zinc-100 rounded-full transition-colors font-bold flex items-center gap-2">
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
                            <div key={campaign.id} className="relative">
                                <CampaignCard campaign={campaign} />
                                {profile.role === 'church' && (
                                    <button
                                        className="absolute top-4 right-12 p-2 bg-white border border-zinc-200 rounded-lg hover:border-zinc-900 transition-all shadow-sm group"
                                        title="Wiederverwenden"
                                    >
                                        <RotateCcw className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900" />
                                    </button>
                                )}
                            </div>
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
        </div>
    )
}
