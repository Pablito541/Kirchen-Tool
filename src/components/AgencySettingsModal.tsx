import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Palette, MessageSquare, Eye, EyeOff, Loader2, Save, Users, Plus, Mail, Lock, User as UserIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useRouter } from 'next/navigation'
import { createClientUser, getClientUsers } from '@/app/actions/admin'

interface AgencySettingsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    agencyId: string
}

export function AgencySettingsModal({ isOpen, onOpenChange, agencyId }: AgencySettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [activeTab, setActiveTab] = useState<'design' | 'users'>('users')

    // Design Settings
    const [settings, setSettings] = useState({
        primary_color: '#3b82f6',
        welcome_message: 'Hier sind eure aktuellen Missionen.',
        show_future_projects: true,
        client_id: ''
    })
    const [clientUser, setClientUser] = useState<any>(null)

    // User Management
    const [users, setUsers] = useState<any[]>([])
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' })
    const [msg, setMsg] = useState({ type: '', text: '' })

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const loadData = async () => {
            try {
                setFetching(true)

                // Load Users
                const clientUsers = await getClientUsers()
                setUsers(clientUsers)

                // Select first user for design settings if available
                if (clientUsers && clientUsers.length > 0) {
                    const firstUser = clientUsers[0]
                    setClientUser(firstUser)

                    const { data: existingSettings } = await supabase
                        .from('dashboard_settings')
                        .select('*')
                        .eq('client_id', firstUser.id)
                        .single()

                    if (existingSettings) {
                        setSettings({
                            primary_color: existingSettings.primary_color,
                            welcome_message: existingSettings.welcome_message,
                            show_future_projects: existingSettings.show_future_projects,
                            client_id: firstUser.id
                        })
                    } else {
                        setSettings(s => ({ ...s, client_id: firstUser.id }))
                    }
                }
            } catch (error) {
                console.error('Error loading agency settings:', error)
            } finally {
                setFetching(false)
            }
        }

        if (isOpen) loadData()
    }, [isOpen, agencyId])

    const handleSaveDesign = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('dashboard_settings')
            .upsert({
                client_id: settings.client_id,
                agency_id: agencyId,
                primary_color: settings.primary_color,
                welcome_message: settings.welcome_message,
                show_future_projects: settings.show_future_projects,
                updated_at: new Date().toISOString()
            }, { onConflict: 'client_id' })

        if (!error) {
            router.refresh()
            onOpenChange(false)
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.name) return

        setLoading(true)
        setMsg({ type: '', text: '' })

        const formData = new FormData()
        formData.append('email', newUser.email)
        formData.append('password', newUser.password)
        formData.append('name', newUser.name)

        const result = await createClientUser(null, formData)

        if (result?.error) {
            setMsg({ type: 'error', text: result.error })
        } else {
            setMsg({ type: 'success', text: 'Kunde erfolgreich angelegt!' })
            setNewUser({ name: '', email: '', password: '' })
            // Reload users
            const updatedUsers = await getClientUsers()
            setUsers(updatedUsers)
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] max-w-2xl bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="p-5 md:p-8 pb-4 flex items-center justify-between border-b border-white/5">
                        <div className="space-y-1">
                            <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                                Agentur Dashboard
                                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 uppercase tracking-widest border border-red-500/20">Admin</span>
                            </Dialog.Title>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                Verwaltung & Einstellungen
                            </p>
                        </div>
                        <Dialog.Close asChild>
                            <button className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                                <X className="h-5 w-5 text-zinc-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 px-5 md:px-8 border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'users' ? 'text-white border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
                        >
                            Kunden
                        </button>
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'design' ? 'text-white border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
                        >
                            Design
                        </button>
                    </div>

                    <div className="p-5 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                        {fetching ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="space-y-10">
                                {/* Create User Form */}
                                <div className="space-y-6 bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-wider">Neuen Kunden anlegen</h3>
                                            <p className="text-xs text-zinc-500 font-medium">Erstellt Login & Standard-Dashboard</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Kunden Name</label>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                                    <Input
                                                        value={newUser.name}
                                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                                        className="pl-10 bg-black/20 border-white/10 h-11 rounded-xl"
                                                        placeholder="z.B. City Church"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">E-Mail</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                                    <Input
                                                        value={newUser.email}
                                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                        className="pl-10 bg-black/20 border-white/10 h-11 rounded-xl"
                                                        placeholder="kunde@kirche.de"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Passwort</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                                <Input
                                                    type="password"
                                                    value={newUser.password}
                                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                    className="pl-10 bg-black/20 border-white/10 h-11 rounded-xl"
                                                    placeholder="Sicheres Passwort"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {msg.text && (
                                        <div className={`text-xs font-bold px-4 py-3 rounded-xl ${msg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {msg.text}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleCreateUser}
                                        disabled={loading || !newUser.email || !newUser.password}
                                        className="w-full bg-white text-zinc-900 hover:bg-zinc-200 font-bold h-12 rounded-xl"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kunde erstellen'}
                                    </Button>
                                </div>

                                {/* User List */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Bestehende Kunden</h3>
                                    <div className="space-y-2">
                                        {users.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-black">
                                                        {user.full_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{user.full_name}</p>
                                                        <p className="text-xs text-zinc-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                                                    Kunde
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* Branding Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Palette className="h-4 w-4" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Branding & Farben</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Primärfarbe</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={settings.primary_color}
                                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                                    className="h-12 w-12 rounded-xl bg-transparent border-none cursor-pointer"
                                                />
                                                <Input
                                                    value={settings.primary_color}
                                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                                    className="bg-white/5 border-white/10 h-12 rounded-xl font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Vorschau</label>
                                            <div
                                                className="h-12 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest"
                                                style={{ backgroundColor: settings.primary_color }}
                                            >
                                                Button Stil
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messaging Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <MessageSquare className="h-4 w-4" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Willkommens-Botschaft</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <textarea
                                            className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-sans"
                                            placeholder="Botschaft für den Kunden..."
                                            value={settings.welcome_message}
                                            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Visibility Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Eye className="h-4 w-4" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Sichtbarkeit</h3>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, show_future_projects: !settings.show_future_projects })}
                                        className="flex items-center justify-between w-full p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${settings.show_future_projects ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                {settings.show_future_projects ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold">Zükünftige Projekte anzeigen</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                                    {settings.show_future_projects ? 'Sichtbar für Kunde' : 'Nur für Agentur'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`h-6 w-10 rounded-full transition-colors relative ${settings.show_future_projects ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.show_future_projects ? 'left-5' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>

                                <Button
                                    onClick={handleSaveDesign}
                                    disabled={loading}
                                    className="w-full h-16 bg-white text-zinc-900 hover:bg-zinc-200 rounded-[1.5rem] font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    Design-Update anwenden
                                </Button>
                            </div>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
