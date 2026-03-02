import axiosClient from './axiosClient';
import type { StoreResponse, StoreCreateRequest, GetStoresParams } from '../types/store';
import type { ApiResponse, Page } from '../types/product';

export const storeApi = {
    createStore: async (data: StoreCreateRequest): Promise<StoreResponse> => {
        const response = await axiosClient.post<StoreResponse>('/stores', data);
        return response.data;
    },

    getStoreById: async (id: number): Promise<ApiResponse<StoreResponse>> => {
        const response = await axiosClient.get<ApiResponse<StoreResponse>>(`/stores/${id}`);
        return response.data;
    },

    getAllStores: async (params: GetStoresParams = {}): Promise<ApiResponse<Page<StoreResponse>>> => {
        const response = await axiosClient.get<ApiResponse<Page<StoreResponse>>>('/stores', { params });
        return response.data;
    },
};
