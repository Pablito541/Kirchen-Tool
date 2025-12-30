import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadLogo() {
    const filePath = '/Users/paulheilig/.gemini/antigravity/brain/b975836e-dbcf-475c-b3c8-f8a3e47367b5/uploaded_image_1767091738220.png'
    const fileBuffer = readFileSync(filePath)

    const { data, error } = await supabase.storage
        .from('logos')
        .upload('agency-logo.png', fileBuffer, {
            contentType: 'image/png',
            upsert: true
        })

    if (error) {
        console.error('Error uploading:', error)
        return
    }

    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl('agency-logo.png')

    console.log('Public URL:', publicUrl)

    // Find agency user and update profile
    const { data: agencyProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'agency')
        .limit(1)
        .single()

    if (agencyProfile) {
        await supabase
            .from('profiles')
            .update({ logo_url: publicUrl })
            .eq('id', agencyProfile.id)
        console.log('Updated agency profile logo')
    }
}

uploadLogo()
