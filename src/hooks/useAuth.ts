import { useAppStore } from '../app/store';
import { authApi } from '../services/auth.api';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout } = useAppStore();

    const handleLogin = async (username: string, pass: string): Promise<string | null> => {
        try {
            const response = await authApi.login(username, pass);
            console.log('Login API response:', response);

            // Handle both response structures (with or without user object)
            // Type assertion used because authApi might return strict type but we want to be flexible for now
            const { expiresIn, accessTokenExpiresIn, userId } = response as any;

            const expiry = expiresIn || accessTokenExpiresIn;
            if (expiry) {
                localStorage.setItem('expiresIn', String(expiry));
            }

            // Synthesize user from LoginResponse
            let userObj = {
                id: String(response.id || userId || 'default-user-id'),
                name: response.username || username,
                email: response.email || `${username}@example.com`,
                role: (response.roles && response.roles.length > 0 ? response.roles[0] : 'ADMIN') as any, // Default to first role or ADMIN
                avatarUrl: undefined
            };

            // Update store
            const tokenToSave = response.accessToken || (response as any).token;
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
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
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
