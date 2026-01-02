'use client'

import { useState, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Upload, User, Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useRouter } from 'next/navigation'

interface ProfileSettingsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    profile: any
}

export function ProfileSettingsModal({ isOpen, onOpenChange, profile }: ProfileSettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(profile?.full_name || '')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            // Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ logo_url: publicUrl })
                .eq('id', profile.id)

            if (updateError) throw updateError

            router.refresh()
        } catch (error: any) {
            alert('Fehler beim Upload: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSaveProfile = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', profile.id)

        if (!error) {
            router.refresh()
            onOpenChange(false)
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] max-w-md bg-white rounded-[2rem] p-5 md:p-8 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-8">
                        <Dialog.Title className="text-2xl font-black tracking-tight">Profil & Design</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-3xl bg-zinc-100 border border-black/5 flex items-center justify-center overflow-hidden shadow-inner">
                                    {profile?.logo_url ? (
                                        <img src={profile.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <Camera className="h-8 w-8 text-zinc-400" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute -bottom-2 -right-2 h-10 w-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-zinc-900">
                                    {profile.role === 'church' ? 'Kundenkonto' : 'Agentur-Logo'}
                                </p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Upload empfohlen (PNG/JPG)</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dein Name</label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Vorname Nachname"
                                    className="h-14 rounded-2xl px-5 border-zinc-100 bg-zinc-50 focus:bg-white focus:ring-2 ring-zinc-100 transition-all font-bold"
                                />
                            </div>

                            <Button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                {loading ? 'Speichere...' : 'Einstellungen speichern'}
                            </Button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
