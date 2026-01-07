import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if profile exists
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (!profile) {
                    // Auto-assign role based on email (example logic)
                    // For now, let's assume specific domain is agency
                    const isAgency = user.email?.endsWith('@agency.com') || user.email?.startsWith('bruder@')
                    const role = isAgency ? 'agency' : 'client'

                    await supabase.from('profiles').insert([
                        {
                            id: user.id,
                            full_name: user.email?.split('@')[0],
                            role: role,
                        }
                    ])
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // i.e. localhost:3000
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
