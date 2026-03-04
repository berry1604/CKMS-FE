import axiosClient from './axiosClient';
import type {
    LoginResponse,
    ActivateAccountRequest
} from '../types/auth';

export const authApi = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>('/auth/login', { username, password });

        // Save tokens to localStorage upon successful login
        const { accessToken, refreshToken, token } = response.data as any;
        const validAccessToken = accessToken || token;

        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (refreshToken) {
            sessionStorage.setItem('refreshToken', refreshToken);
        }

        return response.data;
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
        const response = await axiosClient.post<LoginResponse>(
            '/auth/refresh',
            refreshToken,
            { headers: { 'Content-Type': 'text/plain' } }
        );

        const { accessToken, refreshToken: newRefreshToken, token } = response.data as any;
        const validAccessToken = accessToken || token;

        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
        }

        return response.data;
    },

    activateAccount: async (data: ActivateAccountRequest): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/activate', data);
        return response.data;
    },

    forgotPassword: async (email: string): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/reset-password', { token, newPassword });
        return response.data;
    }
};
