import axiosClient from './axiosClient';
import type {
    LoginResponse,
    ActivateAccountRequest
} from '../types/auth';

export const authApi = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>('/auth/login', { username, password });

        // axiosClient response interceptor already unwraps `response.data.data`
        const { accessToken, refreshToken, token } = response as any;
        const validAccessToken = accessToken || token;

        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (refreshToken) {
            sessionStorage.setItem('refreshToken', refreshToken);
        }

        return response;
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

        const { accessToken, refreshToken: newRefreshToken, token } = response as any;
        const validAccessToken = accessToken || token;

        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
        }

        return response;
    },

    activateAccount: async (data: ActivateAccountRequest): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/activate', data);
        return response as any;
    },

    forgotPassword: async (email: string): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/forgot-password', { email });
        return response as any;
    },

    resetPassword: async (token: string, newPassword: string): Promise<string> => {
        const response = await axiosClient.post<string>('/auth/reset-password', { token, newPassword });
        return response as any;
    }
};
