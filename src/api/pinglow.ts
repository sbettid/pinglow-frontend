import axios from 'axios';
import type { Check, CheckWithStatus } from '@/types/Check'
import type { PerformanceData } from '@/types/PerformanceData';

const apiUrl = import.meta.env.VITE_PINGLOW_URL;

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'x-api-key': `${import.meta.env.VITE_PINGLOW_API_KEY}` // or 'x-api-key' depending on your backend
    }
});

export async function getChecks(): Promise<Check[]> {
    const response = await api.get<Check[]>('/checks');
    return response.data;
}

export async function getCheckStatus(check: Check): Promise<CheckWithStatus> {
    const response = await api.get<CheckWithStatus>(`/check-status/${check.check_name}`);
    return response.data;
}

export async function getCheckPerformanceData(check: CheckWithStatus): Promise<PerformanceData> {
    const response = await api.get<PerformanceData>(`/performance-data/${check.check_name}`);
    return response.data;
}