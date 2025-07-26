export interface Check {
    check_name: string
    interval: number,
    language: string
}

export interface CheckWithStatus {
    check_name: string
    output: string,
    status: string,
    timestamp: string
}