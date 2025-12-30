'use client'

import { motion } from 'framer-motion'
import { Link as LinkIcon, ExternalLink } from 'lucide-react'
import { cn } from '@/components/ui/button'

export type CampaignStatus = 'waiting' | 'in_preparation' | 'live' | 'completed'

interface CampaignCardProps {
    campaign: {
        id: string
        title: string
        info_link: string
        description: string
        status: CampaignStatus
        priority: number
    }
    isFocus?: boolean
    onClick?: () => void
}

const statusConfig = {
    waiting: {
        label: 'Wartet',
        color: 'bg-zinc-100 text-zinc-600 border-zinc-200 shadow-none',
        cardBg: 'bg-white border-black/5 hover:border-zinc-300'
    },
    in_preparation: {
        label: 'In Vorbereitung',
        color: 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-200/50',
        cardBg: 'bg-amber-50/10 border-amber-200/50 hover:border-amber-300'
    },
    live: {
        label: 'Live / Läuft',
        color: 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-200/50',
        cardBg: 'bg-blue-50/10 border-blue-200/50 hover:border-blue-300'
    },
    completed: {
        label: 'Fertiggestellt',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-200/50',
        cardBg: 'bg-emerald-50/10 border-emerald-200/50 hover:border-emerald-300'
    },
}

export function CampaignCard({ campaign, isFocus, onClick }: CampaignCardProps) {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={cn(
                "group relative rounded-2xl border transition-all duration-300 active:scale-[0.99] cursor-pointer shadow-premium",
                isFocus
                    ? "bg-blue-50/50 border-blue-200 glow-blue hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 ring-1 ring-blue-500/5"
                    : statusConfig[campaign.status].cardBg
            )}
        >
            <div className="p-5 flex items-center gap-5">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-1.5 py-0.5 rounded">
                            #{campaign.priority}
                        </span>
                        <h3 className="text-base font-black text-zinc-900 tracking-tight truncate flex items-center gap-2">
                            {campaign.title}
                        </h3>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Kampagnen-Details
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-wider transition-all",
                        statusConfig[campaign.status].color
                    )}>
                        {statusConfig[campaign.status].label}
                    </div>

                    <div className="h-8 w-8 flex items-center justify-center bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white rounded-full transition-all">
                        <ExternalLink className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
