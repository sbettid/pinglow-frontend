import axios from 'axios';
import type { Check, CheckWithStatus } from '@/types/Check'
import type { PerformanceData } from '@/types/PerformanceData';

const axiosInstance = axios.create({ baseURL: "http://localhost:80/api" });

export async function getChecks(): Promise<Check[]> {
    const response = await axiosInstance.get<Check[]>('/checks');
    console.log(response);
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