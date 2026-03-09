import axiosClient from './axiosClient';
import type { StoreStockItemResponse, StoreStockBatchResponse, GetStoreInventoryParams } from '../types/storeInventory';
import type { ApiResponse, Page } from '../types/product';

export const storeInventoryApi = {
    getStoreInventory: async (params: GetStoreInventoryParams = {}): Promise<ApiResponse<Page<StoreStockItemResponse>>> => {
        const response = await axiosClient.get<ApiResponse<Page<StoreStockItemResponse>>>('/store-inventory', { params });
        return response.data;
    },

    getProductBatches: async (productId: number, storeId?: number): Promise<ApiResponse<StoreStockBatchResponse[]>> => {
        const response = await axiosClient.get<ApiResponse<StoreStockBatchResponse[]>>(`/store-inventory/${productId}/batches`, {
            params: { storeId }
        });
        return response.data;
    },
};
