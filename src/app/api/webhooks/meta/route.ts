import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

type LeadgenValue = {
    leadgen_id: string
    form_id?: string
    created_time?: number
}

type GraphLead = {
    created_time?: string
    field_data?: { name: string; values: string[] }[]
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.META_VERIFY_TOKEN

    if (verifyToken && mode === 'subscribe' && token === verifyToken) {
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse('Forbidden', { status: 403 })
}

function hasValidSignature(rawBody: string, signatureHeader: string | null) {
    const secret = process.env.META_APP_SECRET
    // Without a configured secret we cannot verify (e.g. local development)
    if (!secret) return true
    if (!signatureHeader?.startsWith('sha256=')) return false

    const expected = createHmac('sha256', secret).update(rawBody).digest()
    const received = Buffer.from(signatureHeader.slice('sha256='.length), 'hex')
    return received.length === expected.length && timingSafeEqual(received, expected)
}

async function fetchLeadDetails(leadgenId: string): Promise<GraphLead | null> {
    const accessToken = process.env.META_ACCESS_TOKEN
    if (!accessToken) return null

    const res = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(leadgenId)}?access_token=${encodeURIComponent(accessToken)}`
    )
    if (!res.ok) {
        console.error('Graph API error for lead', leadgenId, res.status)
        return null
    }
    return res.json()
}

function field(lead: GraphLead, ...names: string[]) {
    return lead.field_data?.find(f => names.includes(f.name))?.values?.[0] ?? null
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text()

        if (!hasValidSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
            return new NextResponse('Invalid signature', { status: 401 })
        }

        const body = JSON.parse(rawBody)
        const supabase = createAdminClient()

        if (body.object === 'page') {
            for (const entry of body.entry ?? []) {
                for (const change of entry.changes ?? []) {
                    if (change.field !== 'leadgen') continue

                    const { leadgen_id, form_id, created_time } = change.value as LeadgenValue
                    if (!leadgen_id) continue

                    // 1. Fetch the real lead details. Without a token we must NOT invent data,
                    //    so the lead is skipped (Meta keeps it available in the Leads Center).
                    const details = await fetchLeadDetails(leadgen_id)
                    if (!details) {
                        console.error('Skipping lead (no details available):', leadgen_id)
                        continue
                    }

                    // 2. Find associated campaign
                    // TODO: map form_id -> campaign. Until then, fall back to the newest campaign.
                    const { data: latestCampaign } = await supabase
                        .from('campaigns')
                        .select('id')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    if (!latestCampaign) {
                        console.error('No campaign found to assign lead to.')
                        continue
                    }

                    // 3. Upsert on meta_lead_id: Meta retries deliveries, this keeps them idempotent
                    const { error } = await supabase.from('leads').upsert({
                        full_name: field(details, 'full_name', 'name') ?? 'Unbekannt',
                        email: field(details, 'email'),
                        phone_number: field(details, 'phone_number', 'phone'),
                        meta_lead_id: leadgen_id,
                        meta_form_id: form_id ?? null,
                        status: 'new',
                        platform: 'facebook',
                        created_at: new Date((created_time ?? Date.now() / 1000) * 1000).toISOString(),
                        campaign_id: latestCampaign.id,
                    }, { onConflict: 'meta_lead_id', ignoreDuplicates: true })

                    if (error) {
                        console.error('Error saving lead:', error)
                        // Non-2xx makes Meta retry the delivery
                        return new NextResponse('Internal Server Error', { status: 500 })
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
