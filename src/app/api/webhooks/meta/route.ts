import { createAdminClient } from '@/utils/supabase/admin'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    // In production, use process.env.META_VERIFY_TOKEN
    const VERIFY_TOKEN = 'kirche123'

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = createAdminClient()

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadData = change.value
                        const { leadgen_id, form_id, created_time } = leadData

                        console.log('Received Lead:', leadgen_id)

                        // 1. Fetch Lead Details from Meta Graph API
                        // Note: This requires a valid PAGE_ACCESS_TOKEN
                        // const details = await fetch(`https://graph.facebook.com/v21.0/${leadgen_id}?access_token=${process.env.META_ACCESS_TOKEN}`)
                        // const data = await details.json()

                        // MOCK DATA (since we don't have a real token yet)
                        // In a real scenario, we would map the field_data from response
                        const mockLead = {
                            full_name: 'Max Mustermann', // data.field_data.find(f => f.name === 'full_name')?.values[0]
                            email: 'max@example.com',
                            phone_number: '+49123456789',
                            meta_lead_id: leadgen_id,
                            meta_form_id: form_id,
                            status: 'new',
                            platform: 'facebook',
                            created_at: new Date(created_time * 1000).toISOString()
                        }

                        // 2. Find associated Campaign
                        // Strategie: Wir speichern die Form-ID in der Campaign?
                        // Oder wir suchen erstmal einfach eine "Default" Campaign oder lassen es null (wenn wir constraint entfernen)
                        // Aktuell erzwingt DB: campaign_id IS NOT NULL.
                        // WORKAROUND: Wir nehmen die *neueste* Kampagne als Fallback für Demo-Zwecke

                        const { data: latestCampaign } = await supabase
                            .from('campaigns')
                            .select('id')
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single()

                        if (latestCampaign) {
                            // 3. Insert into Database
                            const { error } = await supabase.from('leads').insert({
                                ...mockLead,
                                campaign_id: latestCampaign.id
                            })

                            if (error) {
                                console.error('Error saving lead:', error)
                            }
                        } else {
                            console.error('No campaign found to assign lead to.')
                        }
                    }
                }
            }
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 })
    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
