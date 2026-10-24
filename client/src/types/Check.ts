export interface Check {
    check_name: string,
    passive: boolean,
    interval: number,
    language: string,
    group_id?: string | null,
    group_name?: string | null
}

export interface CheckWithStatus {
    check_name: string,
    passive: boolean,
    output: string,
    status: string,
    timestamp: string | null,
    notifications_muted: boolean | null,
    notifications_muted_until: String | null,
    group_id?: string | null,
    group_name?: string | null
}

export interface CheckHistoryEntry {
    timestamp: string,
    status: string,
    output: string
}

export interface CheckHistoryPage {
    page: number,
    size: number,
    total: number,
    history: CheckHistoryEntry[]
}