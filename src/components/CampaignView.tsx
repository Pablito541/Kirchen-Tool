'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MessageCircle, Mail, Clock, Calendar, Facebook, Instagram, User } from 'lucide-react'
import { cn } from '@/lib/utils' // Assuming access, or I'll implement inline utility if needed. Usually cn is local.
// I'll check imports. DashboardClient used clsx/tailwind-merge via local util? 
// No it used @/components/ui/button.
// I'll use inline classes or just standard format.

function PhoneButton({ number }: { number: string }) {
    if (!number) return null
    return (
        <a href={`tel:${number}`} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors">
            <Phone className="h-4 w-4" />
        </a>
    )
}

function WhatsAppButton({ number }: { number: string }) {
    if (!number) return null
    // Format number: remove + and spaces
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return (
        <a href={`https://wa.me/${cleanNumber}`} target="_blank" rel="noreferrer" className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors">
            <MessageCircle className="h-4 w-4" />
        </a>
    )
}

export function CampaignView({ campaign, leads }: { campaign: any, leads: any[] }) {
    const router = useRouter()

    return (
        <div>
            {/* Header */}
            <header className="flex h-16 md:h-20 items-center border-b border-black/5 px-4 md:px-8 sticky top-0 bg-white/80 backdrop-blur-xl z-30">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2 rounded-xl hover:bg-zinc-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Zurück
                </button>
                <div className="flex items-center gap-2 md:gap-3 ml-4 border-l border-zinc-200 pl-4">
                    <h1 className="text-sm font-black text-zinc-900 uppercase tracking-wider">{campaign.title}</h1>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{campaign.status}</span>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-zinc-100">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Bewerbungen Total</span>
                        <span className="text-4xl font-black text-zinc-900">{leads.length}</span>
                    </div>
                </div>

                {/* Leads List */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="text-xl font-black text-zinc-900">Eingegangene Bewerbungen</h2>
                        {/* Maybe filter buttons here later */}
                    </div>

                    {leads.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-zinc-400 font-medium">Noch keine Bewerbungen eingegangen.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {leads.map((lead) => (
                                <div key={lead.id} className="p-6 hover:bg-zinc-50/50 transition-colors flex flex-col md:flex-row md:items-center gap-6">
                                    {/* Lead Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-lg shrink-0">
                                            {lead.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-zinc-900 leading-tight">{lead.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {lead.email || '-'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 self-start md:self-center">
                                        {lead.phone_number && (
                                            <>
                                                <PhoneButton number={lead.phone_number} />
                                                <WhatsAppButton number={lead.phone_number} />
                                            </>
                                        )}
                                    </div>

                                    {/* Source Badge */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-lg self-start md:self-center">
                                        {lead.platform === 'facebook' ? <Facebook className="h-3 w-3 text-blue-600" /> :
                                            lead.platform === 'instagram' ? <Instagram className="h-3 w-3 text-pink-600" /> :
                                                <User className="h-3 w-3 text-zinc-400" />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{lead.platform}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
