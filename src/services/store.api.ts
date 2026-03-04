import axiosClient from './axiosClient';
import type { StoreResponse, StoreCreateRequest, StoreUpdateRequest, GetStoresParams } from '../types/store';
import type { ApiResponse, Page } from '../types/product';

export const storeApi = {
    /**
     * POST /stores
     * Security: hasAuthority('MANAGE_STORES')
     * Returns StoreResponse directly (not wrapped in ApiResponse)
     */
    createStore: async (data: StoreCreateRequest): Promise<StoreResponse> => {
        const response = await axiosClient.post<StoreResponse>('/stores', data);
        return response.data;
    },

    /**
     * GET /stores/{id}
     * Security: hasAuthority('MANAGE_STORES')
     * Returns ApiResponse<StoreResponse>
     */
    getStoreById: async (id: number): Promise<ApiResponse<StoreResponse>> => {
        const response = await axiosClient.get<ApiResponse<StoreResponse>>(`/stores/${id}`);
        return response.data;
    },

    /**
     * GET /stores?page=0&size=10&search=
     * Security: hasAuthority('MANAGE_STORES')
     * Returns ApiResponse<Page<StoreResponse>>
     */
    getAllStores: async (params: GetStoresParams = {}): Promise<ApiResponse<Page<StoreResponse>>> => {
        const response = await axiosClient.get<ApiResponse<Page<StoreResponse>>>('/stores', { params });
        return response.data;
    },

    updateStore: async (id: number, data: StoreUpdateRequest): Promise<ApiResponse<StoreResponse>> => {
        const response = await axiosClient.put<ApiResponse<StoreResponse>>(`/stores/${id}`, data);
        return response.data;
    },

    deleteStore: async (id: number): Promise<ApiResponse<string>> => {
        const response = await axiosClient.delete<ApiResponse<string>>(`/stores/${id}`);
        return response.data;
    }
};
