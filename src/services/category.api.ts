import axiosClient from './axiosClient';
import type { CategoryResponse, CategoryRequest, CategoryApiResponse } from '../types/category';

export const categoryApi = {
    getAll: async (): Promise<CategoryResponse[]> => {
        const response = await axiosClient.get<CategoryApiResponse<CategoryResponse[]>>('/categories');
        return response.data.data;
    },

    create: async (data: CategoryRequest): Promise<CategoryResponse> => {
        const response = await axiosClient.post<CategoryApiResponse<CategoryResponse>>('/categories', data);
        return response.data.data;
    },

    update: async (id: number, data: CategoryRequest): Promise<CategoryResponse> => {
        const response = await axiosClient.patch<CategoryApiResponse<CategoryResponse>>(`/categories/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/categories/${id}`);
    }
};
