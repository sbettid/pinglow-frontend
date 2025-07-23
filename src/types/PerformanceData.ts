import type { Point } from 'chart.js';

export interface PerformanceData {
    [timestamp: string]: {
        [metricName: string]: number
    }
}

function getRandomColor() {
    const colors = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#FF7043'];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function mapPerformanceData(apiData: Record<string, Record<string, number>>): { label: string; data: Point[] }[] {
    const metricsMap: Record<string, Point[]> = {};

    for (const [timestamp, metrics] of Object.entries(apiData)) {
        for (const [metricName, value] of Object.entries(metrics)) {
            if (!metricsMap[metricName]) {
                metricsMap[metricName] = [];
            }
            metricsMap[metricName].push({ x: new Date(timestamp).getTime(), y: value } as Point);
        }
    }

    return Object.entries(metricsMap).map(([label, data]) => ({
        label,
        data,
        borderColor: getRandomColor(),
        backgroundColor: 'transparent', // or a light shade
        tension: 0.3, // optional: smooth line
    }));
}
