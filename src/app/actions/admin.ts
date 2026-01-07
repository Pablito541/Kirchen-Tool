'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { BRANDING, ROLES, type ActionResponse } from '@/lib/constants'

// Helper to check permissions
async function checkPermission(allowedRoles: string[]) {
    const supabase = await createClient()
    const { data: { user: requester } } = await supabase.auth.getUser()

    if (!requester) return null

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', requester.id)
        .single()

    if (!requesterProfile || !allowedRoles.includes(requesterProfile.role)) {
        return null
    }

    return { requester, requesterProfile }
}

export async function createClientUser(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: 'Bitte alle Felder ausfüllen.' }
    }

    // 1. Check if requester is Admin (Agency)
    const permission = await checkPermission([ROLES.AGENCY])
    if (!permission) {
        return { error: 'Keine Berechtigung.' }
    }
    const { requester } = permission

    // 2. Create User via Admin API
    const supabaseAdmin = createAdminClient()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
    })

    if (createError) {
        return { error: createError.message }
    }

    if (!newUser.user) {
        return { error: 'Benutzer konnte nicht erstellt werden.' }
    }

    // 3. Create Profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: newUser.user.id,
            full_name: name,
            role: ROLES.CLIENT // Force role to client
        })

    if (profileError) {
        // Cleanup if profile fails? For now just report error
        return { error: 'Profil konnte nicht erstellt werden: ' + profileError.message }
    }

    // 4. Create Default Settings
    await supabaseAdmin.from('dashboard_settings').insert({
        client_id: newUser.user.id,
        agency_id: requester.id,
        primary_color: BRANDING.DEFAULT_PRIMARY_COLOR,
        welcome_message: `Willkommen, ${name}!`,
        show_future_projects: true
    })

    revalidatePath('/dashboard')
    return { success: true, message: 'Kunde erfolgreich angelegt.' }
}

export async function getClientUsers() {
    // 1. Check permission
    const permission = await checkPermission([ROLES.AGENCY])
    if (!permission) return []

    const supabaseAdmin = createAdminClient()

    // Get all profiles with role 'client'
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', ROLES.CLIENT)
        .order('created_at', { ascending: false })

    // Let's fetch auth users to get emails
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

    if (error || !profiles) return []

    // Merge email into profiles
    const enhancedProfiles = profiles.map(p => {
        const u = users.find(user => user.id === p.id)
        return {
            ...p,
            email: u?.email || 'Keine E-Mail'
        }
    })

    return enhancedProfiles
}

export async function deleteCampaignAction(id: string): Promise<ActionResponse> {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return { error: 'Server Konfiguration Fehler: Supabase URL oder Anon Key fehlt.' }
        }

        const permission = await checkPermission([ROLES.AGENCY, ROLES.CLIENT])
        if (!permission) return { error: 'Keine Berechtigung zum Löschen.' }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { error: 'Server Konfiguration Fehler: Service Role Key fehlt.' }
        }

        const supabaseAdmin = createAdminClient()
        const { error } = await supabaseAdmin
            .from('campaigns')
            .delete()
            .eq('id', id)

        if (error) return { error: error.message }

        revalidatePath('/dashboard')
        revalidatePath('/archive')
        return { success: true }
    } catch (e: any) {
        return { error: 'Server Exception: ' + (e?.message || JSON.stringify(e)) }
    }
}

export async function updateCampaignStatusAction(id: string, status: string): Promise<ActionResponse> {
    const permission = await checkPermission([ROLES.AGENCY, ROLES.CLIENT])
    if (!permission) return { error: 'Keine Berechtigung zur Statusänderung.' }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Server Konfiguration Fehler: Service Role Key fehlt.' }
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
        .from('campaigns')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/archive')
    return { success: true }
}

export async function saveDashboardSettings(settings: any): Promise<ActionResponse> {
    const permission = await checkPermission([ROLES.AGENCY])
    if (!permission) return { error: 'Keine Berechtigung.' }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
        .from('dashboard_settings')
        .upsert({
            client_id: settings.client_id,
            agency_id: settings.agency_id,
            primary_color: settings.primary_color,
            welcome_message: settings.welcome_message,
            show_future_projects: settings.show_future_projects,
            updated_at: new Date().toISOString()
        }, { onConflict: 'client_id' })

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
}
