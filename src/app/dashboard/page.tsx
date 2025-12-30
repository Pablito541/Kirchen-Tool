import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()

    console.log('Dashboard: Checking user')
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        console.log('Dashboard: No user found, redirecting to login')
        return redirect('/login')
    }

    console.log('Dashboard: User found', user.email)

    let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Auto-create profile for password login if it doesn't exist
        const isAgency = user.email?.endsWith('@agency.com') || user.email?.startsWith('bruder@')
        const role = isAgency ? 'agency' : 'church'

        const { data: newProfile, error: profileError } = await supabase.from('profiles').insert([
            {
                id: user.id,
                full_name: user.email?.split('@')[0],
                role: role,
            }
        ]).select().single()

        if (profileError) {
            console.error('Dashboard: Error creating profile:', JSON.stringify(profileError, null, 2))
            return redirect(`/login?error=profile_creation_failed&details=${encodeURIComponent(JSON.stringify(profileError))}`)
        }
        console.log('Dashboard: Auto-created profile for', user.email)
        profile = newProfile
    }

    // Parallel data fetching
    const [campaignsResult, settingsResult] = await Promise.all([
        supabase
            .from('campaigns')
            .select('*')
            .is('archived_at', null) // Server-side filtering
            .order('priority', { ascending: true }),
        profile.role === 'church'
            ? supabase.from('dashboard_settings').select('*').eq('church_id', user.id).single()
            : Promise.resolve({ data: null })
    ])

    const campaigns = campaignsResult.data
    const brandingSettings = settingsResult.data

    return (
        <div className="flex min-h-screen flex-col bg-[#fafaf9]">
            <header className="flex h-20 items-center border-b border-black/5 px-8 sticky top-0 bg-white/80 backdrop-blur-xl z-30">
                <div className="flex items-center gap-3">
                    <img
                        src="/eip-media-logo.png"
                        alt="EIP Media"
                        className="h-20 object-contain"
                    />
                </div>

                <div className="ml-auto flex items-center gap-8">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block leading-none mb-1.5">Angemeldet als</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 leading-none">
                                {profile.full_name || 'Nutzer'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${profile.role === 'church'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                }`}>
                                {profile.role === 'church' ? 'Kirche' : 'Agentur'}
                            </span>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-zinc-100 mx-2 hidden md:block" />
                    <form action="/auth/signout" method="post">
                        <button className="text-xs font-black text-zinc-400 hover:text-zinc-900 transition-all uppercase tracking-[0.2em] hover:tracking-[0.25em]">
                            Abmelden
                        </button>
                    </form>
                </div>
            </header>
            <main className="flex-1">
                <DashboardClient
                    campaigns={campaigns || []}
                    profile={profile}
                    userId={user.id}
                    brandingSettings={brandingSettings}
                />
            </main>
        </div>
    )

}
