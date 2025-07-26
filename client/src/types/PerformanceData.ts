import type { Point } from 'chart.js';

export interface PerformanceData {
    [timestamp: string]: {
        [metricName: string]: number
    }
}

function getRandomColor() {
    const colors = [
        '#1E88E5',
        '#43A047',
        '#FB8C00',
        '#E53935',
        '#8E24AA',
        '#00ACC1',
        '#F4511E'
    ];

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
