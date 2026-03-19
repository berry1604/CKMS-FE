import axiosClient from './axiosClient';
import type { KitchenResponse, KitchenUpdateRequest } from '../types/kitchen';
import type { ApiResponse } from '../types/product';

export const kitchenApi = {
    /**
     * GET /kitchens
     */
    getAllKitchens: async (): Promise<ApiResponse<KitchenResponse[]>> => {
        const response = await axiosClient.get<ApiResponse<KitchenResponse[]>>('/kitchens');
        return response.data;
    },

    /**
     * GET /kitchens/{kitchenId}
     */
    getKitchenById: async (kitchenId: number): Promise<ApiResponse<KitchenResponse>> => {
        const response = await axiosClient.get<ApiResponse<KitchenResponse>>(`/kitchens/${kitchenId}`);
        return response.data;
    },

    /**
     * PATCH /kitchens/{kitchenId}
     */
    updateKitchen: async (kitchenId: number, data: KitchenUpdateRequest): Promise<ApiResponse<KitchenResponse>> => {
        const response = await axiosClient.patch<ApiResponse<KitchenResponse>>(`/kitchens/${kitchenId}`, data);
        return response.data;
    }
};
