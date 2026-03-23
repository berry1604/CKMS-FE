import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, User } from '../types/user';

interface AppStore extends AuthState {
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,

            login: (user: User, token: string) => set({ user, isAuthenticated: true, token }),
            logout: () => set({ user: null, isAuthenticated: false, token: null }),
            updateUser: (userData: Partial<User>) => set((state) => ({ 
                user: state.user ? { ...state.user, ...userData } : null 
            })),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                token: state.token
            }),
            storage: createJSONStorage(() => localStorage),
        }
    )
);
