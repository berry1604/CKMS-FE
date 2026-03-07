import { useAppStore } from '../app/store';
import { authApi } from '../services/auth.api';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout } = useAppStore();

    const handleLogin = async (username: string, pass: string): Promise<string | null> => {
        try {
            const response = await authApi.login(username, pass);
            console.log('--- AUTH DEBUG: Raw Login Response ---', response);

            // Handle both response structures (with or without user object)
            // Type assertion used because authApi might return strict type but we want to be flexible for now
            const { expiresIn, accessTokenExpiresIn, userId, storeId, storeName } = response as any;
            const kitchenId = (response as any).kitchenId;
            const kitchenName = (response as any).kitchenName;

            console.log('--- AUTH DEBUG: Extracted fields ---', { userId, storeId, storeName, kitchenId, kitchenName });

            const expiry = expiresIn || accessTokenExpiresIn;
            if (expiry) {
                sessionStorage.setItem('expiresIn', String(expiry));
            }

            // Synthesize user from LoginResponse: Use roles array from backend
            const responseAny = response as any;
            let userRole = responseAny.roleName || (response.roles && response.roles.length > 0 ? response.roles[0] : '');

            let userObj = {
                id: String(response.id || userId || 'default-user-id'),
                name: responseAny.fullName || response.username || username,
                email: response.email || `${username}@example.com`,
                role: userRole as any,
                authorities: response.authorities || responseAny.privileges || [],
                avatarUrl: undefined,
                storeId: response.storeId,
                storeName: response.storeName,
                kitchenId: kitchenId,
                kitchenName: kitchenName,
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
            const refreshToken = sessionStorage.getItem('refreshToken');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            // Include cleanup even if API call fails
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            logout();
        }
    };

    const hasAuthority = (authority: string): boolean => {
        const normalizedAuthority = authority.toUpperCase();

        let userRoleStr = user?.role || '';
        let authoritiesArr = user?.authorities || [];

        // Fallback: extract role directly from token if it's missing in store
        const token = sessionStorage.getItem('accessToken');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded.roles && Array.isArray(decoded.roles) && decoded.roles.length > 0) {
                    // Update role from JWT if explicitly found
                    if (!userRoleStr) userRoleStr = decoded.roles[0];
                    if (authoritiesArr.length === 0) authoritiesArr = decoded.roles;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        if (!userRoleStr && authoritiesArr.length === 0) return false;

        const userRole = userRoleStr.toUpperCase().replace('ROLE_', '');

        // Check role (e.g., ADMIN, KITCHEN_STAFF)
        if (userRole === normalizedAuthority) return true;

        // Check specific authorities/privileges (e.g., EXECUTE_PRODUCTION)
        return authoritiesArr.some(a => a.toUpperCase() === normalizedAuthority) || false;
    };

    return {
        user,
        isAuthenticated,
        login: handleLogin,
        logout: handleLogout,
        hasAuthority
    };
};
