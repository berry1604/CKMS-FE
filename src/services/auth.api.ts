import axiosClient from './axiosClient';
import type {
    LoginResponse,
    ActivateAccountRequest
} from '../types/auth';

export const authApi = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await axiosClient.post<any>('/auth/login', { username, password });

        const data = response.data?.data || response.data;
        const { accessToken, refreshToken, token } = data;
        const validAccessToken = accessToken || token;

        // ✅ dùng sessionStorage (không chia sẻ tab)
        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }
        if (refreshToken) {
            sessionStorage.setItem('refreshToken', refreshToken);
        }

        return data;
    },

    // ❗ bỏ param refreshToken (tự lấy từ storage cho an toàn)
    logout: async () => {
        try {
            const refreshToken = sessionStorage.getItem('refreshToken');

            if (refreshToken) {
                await axiosClient.post('/auth/logout', { refreshToken });
            }
        } finally {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
        }
    },

    // ✅ FIX QUAN TRỌNG
    refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
        const response = await axiosClient.post<any>(
            '/auth/refresh',
            { refreshToken } // ✅ đúng format BE
        );

        const data = response.data?.data || response.data;
        const { accessToken, refreshToken: newRefreshToken, token } = data;
        const validAccessToken = accessToken || token;

        // ✅ dùng sessionStorage
        if (validAccessToken) {
            sessionStorage.setItem('accessToken', validAccessToken);
        }

        // ⚠️ chỉ overwrite nếu BE trả về refreshToken mới
        if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
        }

        return data;
    },

    activateAccount: async (data: ActivateAccountRequest): Promise<string> => {
        const response = await axiosClient.post<any>('/auth/activate', data);
        return response.data?.data ?? response.data;
    },

    forgotPassword: async (email: string): Promise<string> => {
        const response = await axiosClient.post<any>('/auth/forgot-password', { email });
        return response.data?.data ?? response.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<string> => {
        const response = await axiosClient.post<any>('/auth/reset-password', { token, newPassword });
        return response.data?.data ?? response.data;
    }
};