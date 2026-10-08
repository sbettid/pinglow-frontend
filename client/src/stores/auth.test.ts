import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { getCurrentUser, logout } from '@/api/pinglow';
import { useAuthStore } from './auth';

vi.mock('@/api/pinglow', () => ({
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
}));

describe('auth store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.mocked(getCurrentUser).mockReset();
        vi.mocked(logout).mockReset();
    });

    it('hydrates an authenticated operator and grants operating access', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({ user: 'alice', role: 'operator' });
        const store = useAuthStore();

        await store.hydrate();

        expect(store.user).toEqual({ user: 'alice', role: 'operator' });
        expect(store.isAuthenticated).toBe(true);
        expect(store.canOperate).toBe(true);
        expect(store.loading).toBe(false);
    });

    it('does not grant operating access to a viewer', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({ user: 'bob', role: 'viewer' });
        const store = useAuthStore();

        await store.hydrate();

        expect(store.isAuthenticated).toBe(true);
        expect(store.canOperate).toBe(false);
    });

    it('clears loading when there is no current user', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue(null);
        const store = useAuthStore();

        await store.hydrate();

        expect(store.user).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(store.loading).toBe(false);
    });

    it('clears the current user after a successful logout', async () => {
        vi.mocked(logout).mockResolvedValue();
        const store = useAuthStore();
        store.user = { user: 'alice', role: 'admin' };

        await store.logout();

        expect(logout).toHaveBeenCalledOnce();
        expect(store.user).toBeNull();
    });
});
