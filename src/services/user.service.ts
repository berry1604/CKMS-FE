import axiosClient from './axiosClient';
import type { CreateUserRequest, CreateUserResponse } from '../types/user';

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

export const userService = {
    createUser: async (data: CreateUserRequest): Promise<ApiResponse<CreateUserResponse>> => {
        try {
            const response = await axiosClient.post<ApiResponse<CreateUserResponse>>('/users', data);
            return response.data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
};
