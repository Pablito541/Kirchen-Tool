const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadLogo() {
    const filePath = '/Users/paulheilig/.gemini/antigravity/brain/b975836e-dbcf-475c-b3c8-f8a3e47367b5/uploaded_image_1767091738220.png';
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
        .from('logos')
        .upload('agency-logo.png', fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        console.error('Error uploading:', error);
        return;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl('agency-logo.png');

    console.log('Public URL:', publicUrl);

    const { data: profiles, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'agency')
        .limit(1);

    if (profiles && profiles.length > 0) {
        await supabase
            .from('profiles')
            .update({ logo_url: publicUrl })
            .eq('id', profiles[0].id);
        console.log('Updated agency profile logo');
    }
}

uploadLogo();
