import axiosClient from './axiosClient';
import type { User } from '../types/user';

export interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

export const authApi = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>('/auth/login', { username, password });
        return response.data;
    },

    logout: async (refreshToken: string) => {
        await axiosClient.post('/auth/logout', { refreshToken });
    }
};
