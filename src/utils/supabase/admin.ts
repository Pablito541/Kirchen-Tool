import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.error('Admin Client Error: SUPABASE_SERVICE_ROLE_KEY is missing!')
        console.log('Available Env Vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_') || k.startsWith('SUPABASE_')))
    }

    return createClient(
        supabaseUrl!,
        serviceRoleKey || '', // Prevent crash to see log, but will fail inside createClient if empty
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
