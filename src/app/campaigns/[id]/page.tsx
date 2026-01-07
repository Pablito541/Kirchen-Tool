import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CampaignView } from '@/components/CampaignView'

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Verify User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Fetch Campaign
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !campaign) return redirect('/dashboard')

    // Check Permissions (Agency or Owner)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'agency' && campaign.created_by !== user.id) {
        return redirect('/dashboard')
    }

    // Fetch Leads (using RLS)
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-[#fafaf9]">
            <CampaignView campaign={campaign} leads={leads || []} />
        </div>
    )
}
