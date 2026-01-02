'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChurchUser(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: 'Bitte alle Felder ausfüllen.' }
    }

    // 1. Check if requester is Admin
    const supabase = await createClient()
    const { data: { user: requester } } = await supabase.auth.getUser()

    // Simple check: In a real app, check DB role. Here we trust the auth context for now 
    // or we check the profile role if we want to be strict.
    // For now, let's assume if they have access to the dashboard (which calls this), they are authorized, 
    // but ideally we check the profile.

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', requester?.id)
        .single()

    if (requesterProfile?.role !== 'agency') {
        return { error: 'Keine Berechtigung.' }
    }

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
            role: 'church' // Force role to church
        })

    if (profileError) {
        // Cleanup if profile fails? For now just report error
        return { error: 'Profil konnte nicht erstellt werden: ' + profileError.message }
    }

    // 4. Create Default Settings (Optional)
    await supabaseAdmin.from('dashboard_settings').insert({
        church_id: newUser.user.id,
        agency_id: requester?.id,
        primary_color: '#3b82f6',
        welcome_message: `Willkommen, ${name}!`,
        show_future_projects: true
    })

    revalidatePath('/dashboard')
    return { success: true, message: 'Kunde erfolgreich angelegt.' }
}

export async function getChurchUsers() {
    const supabase = await createClient()
    const { data: { user: requester } } = await supabase.auth.getUser()

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', requester?.id)
        .single()

    if (requesterProfile?.role !== 'agency') {
        return []
    }

    const supabaseAdmin = createAdminClient()

    // Get all profiles with role 'church'
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'church')
        .order('created_at', { ascending: false })

    // We can't easily join auth.users here, but we can try to fetch emails if needed.
    // Since we created them, we might want to store email in profile?
    // For now, let's just return profiles. If we need emails, we'd need to fetch auth users too.

    // Let's fetch auth users to get emails
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

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

export async function deleteCampaignAction(id: string) {
    const supabase = await createClient()
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) return { error: 'Nicht authentifiziert.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', requester.id)
        .single()

    if (profile?.role !== 'agency' && profile?.role !== 'church') {
        return { error: 'Keine Berechtigung zum Löschen.' }
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
}

export async function updateCampaignStatusAction(id: string, status: string) {
    const supabase = await createClient()
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) return { error: 'Nicht authentifiziert.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', requester.id)
        .single()

    if (profile?.role !== 'agency' && profile?.role !== 'church') {
        return { error: 'Keine Berechtigung zur Statusänderung.' }
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
