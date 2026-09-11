import type { Point } from 'chart.js';

export interface PerformanceData {
    [timestamp: string]: {
        [metricName: string]: number
    }
}

// Color palette designed for high contrast and accessibility
// Supports up to 12 distinct metrics with clearly distinguishable colors
const DISTINCT_COLORS = [
    '#1E88E5', // Vibrant Blue
    '#43A047', // Strong Green
    '#FB8C00', // Bright Orange
    '#E53935', // Bold Red
    '#8E24AA', // Rich Purple
    '#00ACC1', // Teal
    '#F4511E', // Deep Orange
    '#D81B60', // Deep Pink
    '#4CAF50', // Medium Green
    '#2196F3', // Light Blue
    '#FF6F00', // Dark Orange
    '#7B1FA2', // Deep Purple
];

let colorIndex = 0;

function getNextDistinctColor(): string {
    const color = DISTINCT_COLORS[colorIndex % DISTINCT_COLORS.length];
    colorIndex++;
    return color;
}

// Reset color index for each new chart
export function resetColorIndex(): void {
    colorIndex = 0;
}

export function mapPerformanceData(apiData: Record<string, Record<string, number>>): { label: string; data: Point[] }[] {
    resetColorIndex();
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
        borderColor: getNextDistinctColor(),
        backgroundColor: 'transparent',
        tension: 0.3,
    }));
}
