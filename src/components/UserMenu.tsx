'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Settings, Eye } from 'lucide-react'

interface UserMenuProps {
    profile: {
        full_name: string
        role: 'client' | 'agency'
    }
    onOpenSettings?: () => void
    onOpenAgencySettings?: () => void
}

export function UserMenu({ profile, onOpenSettings, onOpenAgencySettings }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleLogout = () => {
        const form = document.createElement('form')
        form.method = 'post'
        form.action = '/auth/signout'
        document.body.appendChild(form)
        form.submit()
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 w-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-zinc-200/50"
            >
                <User className="h-4 w-4 text-blue-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-black/5 shadow-xl shadow-black/5 overflow-hidden z-50">
                    <div className="p-5 border-b border-black/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-zinc-400 mb-0.5">Angemeldet als</p>
                                <p className="text-sm font-bold text-zinc-900 truncate">{profile.full_name || 'Nutzer'}</p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200/50">
                                {profile.role === 'client' ? 'Kundenkonto' : 'Agentur'}
                            </span>
                        </div>
                    </div>

                    <div className="p-2 space-y-1">
                        {profile.role === 'agency' && onOpenAgencySettings && (
                            <button
                                onClick={() => {
                                    onOpenAgencySettings()
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
                            >
                                <Eye className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                <span>Kunden-Ansicht</span>
                            </button>
                        )}

                        {onOpenSettings && profile.role !== 'client' && (
                            <button
                                onClick={() => {
                                    onOpenSettings()
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
                            >
                                <Settings className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                                <span>Einstellungen</span>
                            </button>
                        )}

                        <div className="h-[1px] bg-black/5 my-1" />

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all group"
                        >
                            <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                            <span>Abmelden</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
