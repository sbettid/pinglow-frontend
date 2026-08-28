import { defineStore } from 'pinia';
import { getCurrentUser, login, logout, type SessionUser } from '@/api/pinglow';

export const useAuthStore = defineStore('auth', {
    state: () => ({ user: null as SessionUser | null, loading: true }),
    getters: {
        isAuthenticated: (state) => state.user !== null,
        canOperate: (state) => state.user?.role === 'operator' || state.user?.role === 'admin',
    },
    actions: {
        async hydrate() {
            try {
                this.user = await getCurrentUser();
            } finally {
                this.loading = false;
            }
        },
        login,
        async logout() { await logout(); this.user = null; },
    },
});