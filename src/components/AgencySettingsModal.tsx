import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Users, Plus, Mail, Lock, User as UserIcon } from 'lucide-react'
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

    // User Management
    const [users, setUsers] = useState<any[]>([])
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' })
    const [msg, setMsg] = useState({ type: '', text: '' })

    const router = useRouter()

    useEffect(() => {
        const loadData = async () => {
            try {
                setFetching(true)
                const clientUsers = await getClientUsers()
                setUsers(clientUsers)
            } catch (error) {
                console.error('Error loading agency settings:', error)
            } finally {
                setFetching(false)
            }
        }

        if (isOpen) loadData()
    }, [isOpen, agencyId])

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

                    <div className="p-5 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                        {fetching ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                            </div>
                        ) : (
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
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
