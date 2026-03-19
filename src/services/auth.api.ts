import axiosClient from './axiosClient';
import type {
    LoginResponse,
    ActivateAccountRequest
} from '../types/auth';

export const authApi = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await axiosClient.post<any>('/auth/login', { username, password });
        
        // Correctly unwrap from response.data
        // Handle both { data: { ... } } (wrapped) and { ... } (unwrapped)
        const data = response.data?.data || response.data;
        const { accessToken, refreshToken, token } = data;
        const validAccessToken = accessToken || token;

        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (refreshToken) {
            sessionStorage.setItem('refreshToken', refreshToken);
        }

        return data;
    },

    logout: async (refreshToken: string) => {
        try {
            await axiosClient.post('/auth/logout', { refreshToken });
        } finally {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
        }
    },

    refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
        // Send raw string as body, ensure correct content-type if backend expects plain text
        const response = await axiosClient.post<any>(
            '/auth/refresh',
            refreshToken,
            { headers: { 'Content-Type': 'text/plain' } }
        );

        const data = response.data?.data || response.data;
        const { accessToken, refreshToken: newRefreshToken, token } = data;
        const validAccessToken = accessToken || token;

        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
        }

        return data;
    },

    activateAccount: async (data: ActivateAccountRequest): Promise<string> => {
        const response = await axiosClient.post<any>('/auth/activate', data);
        const result = response.data?.data !== undefined ? response.data.data : response.data;
        return result;
    },

    forgotPassword: async (email: string): Promise<string> => {
        const response = await axiosClient.post<any>('/auth/forgot-password', { email });
        const result = response.data?.data !== undefined ? response.data.data : response.data;
        return result;
    },

    resetPassword: async (token: string, newPassword: string): Promise<string> => {
        const response = await axiosClient.post<any>('/auth/reset-password', { token, newPassword });
        const result = response.data?.data !== undefined ? response.data.data : response.data;
        return result;
    }
};
