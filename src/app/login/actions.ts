'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    console.log('Login Action: Attempting login for', email)

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login Action: Error', error.message)
        return { error: error.message }
    }

    console.log('Login Action: Success, redirecting to dashboard')
    redirect('/dashboard')
}

export async function signInWithOtp(formData: FormData, origin: string) {
    const email = formData.get('email') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { message: 'Überprüfe deine E-Mails für den Login-Link!' }
}

export async function createProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No authenticated user' }
    }

    const isEipMedia = user.email?.includes('@eip-media')
    const role = isEipMedia ? 'agency' : 'church'

    const { error } = await supabase.from('profiles').insert([
        {
            id: user.id,
            full_name: user.email?.split('@')[0],
            role: role,
        }
    ])

    if (error) {
        console.error('Create Profile Error:', error)
        return { error: error.message }
    }

    redirect('/dashboard')
}
