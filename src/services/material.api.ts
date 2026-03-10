import axiosClient from './axiosClient';
import type { MaterialRequest, MaterialResponse, ApiResponse } from '../types/material';

export const materialApi = {
    getAll: async (): Promise<MaterialResponse[]> => {
        const response = await axiosClient.get<ApiResponse<MaterialResponse[]>>('/materials');
        return response.data.data;
    },

    create: async (data: MaterialRequest): Promise<MaterialResponse> => {
        const response = await axiosClient.post<ApiResponse<MaterialResponse>>('/materials', data);
        return response.data.data;
    },

    getById: async (id: number): Promise<MaterialResponse> => {
        const response = await axiosClient.get<ApiResponse<MaterialResponse>>(`/materials/${id}`);
        return response.data.data;
    },

    update: async (id: number, data: MaterialRequest): Promise<MaterialResponse> => {
        const response = await axiosClient.patch<ApiResponse<MaterialResponse>>(`/materials/${id}`, data);
        return response.data.data;
    }
};
