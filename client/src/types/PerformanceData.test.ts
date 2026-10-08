import { describe, expect, it } from 'vitest';
import { mapPerformanceData } from './PerformanceData';

describe('mapPerformanceData', () => {
    it('groups timestamped values by metric and assigns distinct colors', () => {
        const datasets = mapPerformanceData({
            '2026-01-01T00:00:00.000Z': {
                latency: 12,
                availability: 99,
            },
            '2026-01-01T00:01:00.000Z': {
                latency: 18,
            },
        });

        expect(datasets).toHaveLength(2);
        expect(datasets[0]).toMatchObject({
            label: 'latency',
            data: [
                { x: Date.parse('2026-01-01T00:00:00.000Z'), y: 12 },
                { x: Date.parse('2026-01-01T00:01:00.000Z'), y: 18 },
            ],
            borderColor: '#1E88E5',
            backgroundColor: 'transparent',
            tension: 0.3,
        });
        expect(datasets[1]).toMatchObject({
            label: 'availability',
            data: [{ x: Date.parse('2026-01-01T00:00:00.000Z'), y: 99 }],
            borderColor: '#43A047',
        });
    });

    it('returns no datasets for empty input and resets colors on each call', () => {
        expect(mapPerformanceData({})).toEqual([]);

        const first = mapPerformanceData({ '2026-01-01T00:00:00.000Z': { latency: 12 } });
        const second = mapPerformanceData({ '2026-01-01T00:00:00.000Z': { latency: 13 } });

        expect(first[0]?.borderColor).toBe('#1E88E5');
        expect(second[0]?.borderColor).toBe('#1E88E5');
    });
});
