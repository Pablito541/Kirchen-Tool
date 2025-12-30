export const ROLES = {
    CHURCH: 'church',
    AGENCY: 'agency',
} as const

export const CAMPAIGN_STATUS = {
    WAITING: 'waiting',
    IN_PREPARATION: 'in_preparation',
    LIVE: 'live',
    COMPLETED: 'completed',
} as const

export const DASHBOARD_SECTIONS = {
    ACTIVE: 'Aktive Missionen',
    FUTURE: 'Zukünftige Projekte',
}

export type Role = typeof ROLES[keyof typeof ROLES]
export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS]
