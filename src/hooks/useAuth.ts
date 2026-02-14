import { useAppStore } from '../app/store';
import { authApi } from '../services/auth.api';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout } = useAppStore();

    const handleLogin = async (username: string, pass: string): Promise<string | null> => {
        try {
            const response = await authApi.login(username, pass);
            console.log('Login API response:', response);

            // Handle both response structures (with or without user object)
            // Backend currently returns { accessToken, refreshToken, expiresIn }
            const { accessToken, refreshToken, expiresIn } = response as any;
            // Type assertion used because authApi might return strict type but we want to be flexible for now

            // Check for accessToken (renamed from token in some contexts)
            const tokenToSave = accessToken || response.token;
            const refreshTokenToSave = refreshToken || response.refreshToken;

            if (!tokenToSave) {
                throw new Error('Login failed: Missing access token');
            }

            // Save to localStorage
            localStorage.setItem('accessToken', tokenToSave);
            if (refreshTokenToSave) {
                localStorage.setItem('refreshToken', refreshTokenToSave);
            }
            if (expiresIn) {
                localStorage.setItem('expiresIn', String(expiresIn));
            }

            // Synthesize default user if missing (Project requirement: #3)
            let userObj = response.user;
            if (!userObj) {
                userObj = {
                    id: 'default-user-id',
                    name: 'User',
                    email: 'user@example.com',
                    role: 'ADMIN', // Default role to show all pages
                    avatarUrl: undefined
                };
            }

            // Update store
            login(userObj, tokenToSave);
            return null; // Success, no error
        } catch (error: any) {
            console.error('Login failed', error);
            // Return specific error message from backend if available
            if (error.response && error.response.data) {
                const msg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
                return typeof msg === 'string' ? msg : JSON.stringify(msg);
            }
            return error.message || 'Login failed';
        }
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            // Include cleanup even if API call fails
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            logout();
        }
    };

    return {
        user,
        isAuthenticated,
        login: handleLogin,
        logout: handleLogout,
    };
};
