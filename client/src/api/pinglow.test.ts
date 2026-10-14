import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({ get: getMock })),
    },
}));

import { getCheckHistory } from './pinglow';
import type { CheckWithStatus } from '@/types/Check';

const check: CheckWithStatus = {
    check_name: 'check one',
    passive: false,
    output: '',
    status: 'Ok',
    timestamp: null,
    notifications_muted: null,
    notifications_muted_until: null,
};

describe('getCheckHistory', () => {
    beforeEach(() => {
        getMock.mockReset();
        getMock.mockResolvedValue({
            data: { page: 1, size: 10, total: 0, history: [] },
        });
    });

    it('requests the first page with defaults and disables state-change filtering', async () => {
        await getCheckHistory(check);

        expect(getMock).toHaveBeenCalledWith('/check-history/check%20one', {
            params: { page: 1, size: 10, state_changes: false },
        });
    });

    it('passes the requested page, size, and state-change filter', async () => {
        await getCheckHistory(check, 3, 25, true);

        expect(getMock).toHaveBeenCalledWith('/check-history/check%20one', {
            params: { page: 3, size: 25, state_changes: true },
        });
    });
});
