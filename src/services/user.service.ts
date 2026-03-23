import axiosClient from './axiosClient';
import type { CreateUserRequest, CreateUserResponse, UserResponse, GetUsersParams, UserUpdateRequest } from '../types/user';
import type { ApiResponse, Page } from '../types/product';

export const userService = {
    createUser: async (data: CreateUserRequest): Promise<ApiResponse<CreateUserResponse>> => {
        const response = await axiosClient.post<ApiResponse<CreateUserResponse>>('/users', data);
        return response.data;
    },

    getUsers: async (params: GetUsersParams = {}): Promise<ApiResponse<Page<UserResponse>>> => {
        const response = await axiosClient.get<ApiResponse<Page<UserResponse>>>('/users', { params });
        return response.data;
    },

    getUserByUsernameOrEmail: async (username?: string, email?: string): Promise<ApiResponse<UserResponse>> => {
        const response = await axiosClient.get<ApiResponse<UserResponse>>('/users/search', {
            params: { username, email },
        });
        return response.data;
    },

    updateUser: async (id: number, data: Record<string, any>): Promise<ApiResponse<UserResponse>> => {
        const response = await axiosClient.put<ApiResponse<UserResponse>>(`/users/${id}`, data);
        return response.data;
    },

    updateProfile: async (id: number, data: UserUpdateRequest): Promise<ApiResponse<UserResponse>> => {
        const response = await axiosClient.put<ApiResponse<UserResponse>>(`/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: number): Promise<ApiResponse<string>> => {
        const response = await axiosClient.delete<ApiResponse<string>>(`/users/${id}`);
        return response.data;
    },
};
