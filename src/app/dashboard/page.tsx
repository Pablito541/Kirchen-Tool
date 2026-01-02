import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { UserMenu } from '@/components/UserMenu'

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

    console.log('Dashboard: Profile lookup result:', profile ? `Found (${profile.role})` : 'Not found')

    const isEipMedia = user.email?.includes('@eip-media')

    if (profile) {
        // Runtime check: if current role is agency but email is not @eip-media, downgrade to church
        if (profile.role === 'agency' && !isEipMedia) {
            console.log('Dashboard: Non-EIP user with agency role detected. Reverting to church role.')
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'church' })
                .eq('id', user.id)
                .select()
                .single()

            if (!updateError) {
                profile = updatedProfile
            }
        }
    } else {
        // Auto-create profile for password login if it doesn't exist
        const role = isEipMedia ? 'agency' : 'church'

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
        console.log('Dashboard: Auto-created profile for', user.email, 'with role', role)
        profile = newProfile
    }

    if (!profile) {
        // Redirect to setup for intentional onboarding
        console.log('Dashboard: No profile found, redirecting to setup')
        return redirect('/setup')
    }

    // Parallel data fetching
    const [campaignsResult, settingsResult] = await Promise.all([
        supabase
            .from('campaigns')
            .select('*')
            .neq('status', 'completed') // Zeige nur nicht-abgeschlossene auf dem Dashboard
            .order('priority', { ascending: true }),
        profile.role === 'church'
            ? supabase.from('dashboard_settings').select('*').eq('church_id', user.id).single()
            : Promise.resolve({ data: null })
    ])

    const campaigns = campaignsResult.data
    const brandingSettings = settingsResult.data

    return (
        <div className="flex min-h-screen flex-col bg-[#fafaf9]">
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
