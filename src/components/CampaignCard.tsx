'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, ChevronDown, Flag } from 'lucide-react'
import { cn } from '@/components/ui/button'

export type CampaignStatus = 'waiting' | 'in_preparation' | 'live' | 'completed'
export type PriorityLevel = 'high' | 'medium' | 'low'

interface CampaignCardProps {
    campaign: {
        id: string
        title: string
        info_link: string
        description: string
        status: CampaignStatus
        priority_level: PriorityLevel
        priority: number
    }
    isFocus?: boolean
    role?: string
    onClick?: () => void
    onStatusChange?: (id: string, status: CampaignStatus) => void
    onPriorityChange?: (id: string, priority: PriorityLevel) => void
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

const priorityConfig = {
    high: {
        label: 'Prio: Hoch',
        color: 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-200/50',
        dot: 'bg-rose-500'
    },
    medium: {
        label: 'Prio: Mittel',
        color: 'bg-orange-50 text-orange-600 border-orange-100 shadow-sm shadow-orange-200/50',
        dot: 'bg-orange-500'
    },
    low: {
        label: 'Prio: Niedrig',
        color: 'bg-yellow-50 text-yellow-600 border-yellow-100 shadow-sm shadow-yellow-200/50',
        dot: 'bg-yellow-400'
    }
}

export function CampaignCard({ campaign, isFocus, role, onClick, onStatusChange, onPriorityChange }: CampaignCardProps) {
    const [isOpen, setIsOpen] = useState<'status' | 'priority' | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)

    const canEditStatus = role === 'agency'
    const canEditPriority = role === 'agency' || role === 'church'

    const handleOpen = (e: React.MouseEvent, type: 'status' | 'priority') => {
        e.stopPropagation()

        const target = e.currentTarget as HTMLButtonElement
        const rect = target.getBoundingClientRect()
        setCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: 224
        })
        setIsOpen(isOpen === type ? null : type)
    }

    const handleStatusClick = (e: React.MouseEvent, status: CampaignStatus) => {
        e.stopPropagation()
        e.preventDefault()
        if (onStatusChange) {
            onStatusChange(campaign.id, status)
        }
        setIsOpen(null)
    }

    const handlePriorityClick = (e: React.MouseEvent, priority: PriorityLevel) => {
        e.stopPropagation()
        e.preventDefault()
        if (onPriorityChange) {
            onPriorityChange(campaign.id, priority)
        }
        setIsOpen(null)
    }

    useEffect(() => {
        if (!isOpen) return

        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current?.contains(e.target as Node)) return
            setIsOpen(null)
        }

        window.addEventListener('mousedown', handleClick)
        window.addEventListener('scroll', () => setIsOpen(null), { passive: true })
        window.addEventListener('resize', () => setIsOpen(null))

        return () => {
            window.removeEventListener('mousedown', handleClick)
            window.removeEventListener('scroll', () => setIsOpen(null))
            window.removeEventListener('resize', () => setIsOpen(null))
        }
    }, [isOpen])

    return (
        <motion.div
            layout
            onClick={(e) => {
                if (isOpen) {
                    setIsOpen(null)
                    return
                }
                onClick?.()
            }}
            className={cn(
                "group relative py-3 px-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-300 active:scale-[0.99] cursor-pointer border overflow-hidden",
                isFocus
                    ? "bg-blue-50/50 border-blue-200 shadow-premium"
                    : statusConfig[campaign.status].cardBg
            )}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-1.5 py-0.5 rounded">
                            #{campaign.priority}
                        </span>
                        <h3 className="text-base font-black text-zinc-900 tracking-tight leading-tight md:leading-none truncate">
                            {campaign.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="hidden md:block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Kampagnen-Details
                        </p>
                        {!isFocus && campaign.priority_level && (
                            <span className={cn(
                                "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                priorityConfig[campaign.priority_level].color
                            )}>
                                <Flag className="h-2 w-2 fill-current" />
                                {priorityConfig[campaign.priority_level].label.split(': ')[1]}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-3">
                    {isFocus ? (
                        <button
                            onClick={(e) => handleOpen(e, 'status')}
                            className={cn(
                                "flex-1 md:flex-none px-4 md:px-3 py-1.5 md:py-1.5 rounded-xl md:rounded-full text-[10px] md:text-[9px] font-black border uppercase tracking-wider transition-all flex items-center justify-center gap-2 md:gap-1.5",
                                statusConfig[campaign.status].color,
                                canEditStatus && "hover:brightness-95 active:scale-95 cursor-pointer"
                            )}
                        >
                            {statusConfig[campaign.status].label}
                            {canEditStatus && <ChevronDown className={cn("h-3.5 w-3.5 md:h-3 md:w-3 transition-transform", isOpen === 'status' && "rotate-180")} />}
                        </button>
                    ) : (
                        /* Priority Toggle (Prominent in Future) */
                        <button
                            onClick={(e) => handleOpen(e, 'priority')}
                            className={cn(
                                "flex-1 md:flex-none px-4 md:px-3 py-1.5 md:py-1.5 rounded-xl md:rounded-full text-[10px] md:text-[9px] font-black border uppercase tracking-wider transition-all flex items-center justify-center gap-2 md:gap-1.5",
                                priorityConfig[campaign.priority_level || 'medium'].color,
                                canEditPriority && "hover:brightness-95 active:scale-95 cursor-pointer shadow-sm"
                            )}
                        >
                            <Flag className="h-3.5 w-3.5 md:h-3 md:w-3" />
                            {priorityConfig[campaign.priority_level || 'medium'].label.split(': ')[1]}
                            <ChevronDown className={cn("h-3.5 w-3.5 md:h-3 md:w-3 transition-transform", isOpen === 'priority' && "rotate-180")} />
                        </button>
                    )}

                    <a
                        href={campaign.info_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 w-9 md:h-8 md:w-8 flex items-center justify-center bg-zinc-900 text-white hover:bg-blue-600 rounded-xl md:rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110 active:scale-95 shrink-0"
                    >
                        <ExternalLink className="h-4 w-4 md:h-4 md:w-4" />
                    </a>
                </div>
            </div>

            {/* Portal for Dropdowns */}
            {isOpen && coords && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: coords.top + 12,
                        left: coords.left - (coords.width - 80), // Offset to align right
                        width: coords.width,
                        zIndex: 9999,
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-white rounded-[26px] shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-zinc-200 p-2.5 overflow-hidden"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <div className="px-4 py-2.5 mb-1 bg-zinc-50 rounded-t-[20px] -mx-2.5 -mt-2.5 border-b border-zinc-100" style={{ backgroundColor: '#f9fafb' }}>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                {isOpen === 'status' ? 'Status aktualisieren' : 'Priorität wählen'}
                            </p>
                        </div>
                        <div className="space-y-1 mt-1">
                            {isOpen === 'status' ? (
                                (Object.entries(statusConfig) as [CampaignStatus, typeof statusConfig['waiting']][]).map(([val, config]) => {
                                    const isActive = campaign.status === val
                                    return (
                                        <button
                                            key={val}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => handleStatusClick(e, val)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-[18px] text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-between group/item",
                                                isActive
                                                    ? "bg-zinc-900 text-white shadow-xl shadow-black/10"
                                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-white" : config.color.split(' ')[0])} />
                                                {config.label}
                                            </div>
                                            {isActive && <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />}
                                        </button>
                                    )
                                })
                            ) : (
                                (Object.entries(priorityConfig) as [PriorityLevel, typeof priorityConfig['high']][]).map(([val, config]) => {
                                    const isActive = campaign.priority_level === val
                                    return (
                                        <button
                                            key={val}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => handlePriorityClick(e, val)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-between group/item border border-transparent",
                                                isActive
                                                    ? config.color + " shadow-sm scale-[1.02] border-current/10"
                                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-current" : config.dot)} />
                                                {config.label.split(': ')[1]}
                                            </div>
                                            {isActive && <div className="w-1.5 h-1.5 bg-current opacity-20 rounded-full" />}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </motion.div>
    )
}
