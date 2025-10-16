import axios from 'axios';
import type { Check, CheckWithStatus } from '@/types/Check'
import type { PerformanceData } from '@/types/PerformanceData';

const axiosInstance = axios.create({ baseURL: "/api" });

export async function getChecks(): Promise<Check[]> {
    const response = await axiosInstance.get<Check[]>('/checks');
    return response.data;
}

export async function getCheckStatus(check: Check): Promise<CheckWithStatus> {
    const response = await axiosInstance.get<CheckWithStatus>(`/check-status/${check.check_name}`);
    return response.data;
}

export async function getCheckPerformanceData(check: CheckWithStatus): Promise<PerformanceData> {
    const response = await axiosInstance.get<PerformanceData>(`/performance-data/${check.check_name}`);
    return response.data;
}

export async function muteNotificaton(check: CheckWithStatus, until: String | null): Promise<void> {
    let baseUrl = `/check/${check.check_name}/mute`;

    if (until !== null) {
        baseUrl += `?until=${until}`;
    }

    await axiosInstance.put<void>(baseUrl);

    return;
}

export async function unmuteNotificaton(check: CheckWithStatus): Promise<void> {
    let baseUrl = `/check/${check.check_name}/mute`;

    await axiosInstance.delete<void>(baseUrl);

    return;
}