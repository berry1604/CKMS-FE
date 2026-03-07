import axiosClient from './axiosClient';
import type {
    ApiResponse,
    KitchenStockItemResponse,
    KitchenStockImportRequest
} from '../types/kitchenInventory';

export const kitchenInventoryApi = {
    /**
     * Get stock inventory for a specific kitchen warehouse.
     * Roles required: ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF
     */
    getWarehouseStock: async (warehouseId: number): Promise<ApiResponse<KitchenStockItemResponse[]>> => {
        try {
            const response = await axiosClient.get<ApiResponse<KitchenStockItemResponse[]>>(
                `/kitchen-inventory/${warehouseId}/stock`
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching stock for warehouse ${warehouseId}:`, error);
            throw error;
        }
    },

    /**
     * Import raw materials into the kitchen warehouse.
     * Roles required: ROLE_ADMIN, ROLE_MANAGER
     * @param warehouseId The ID of the kitchen warehouse
     * @param data Array of material import requests
     */
    importMaterials: async (warehouseId: number, data: KitchenStockImportRequest[]): Promise<ApiResponse<KitchenStockItemResponse[]>> => {
        try {
            const response = await axiosClient.post<ApiResponse<KitchenStockItemResponse[]>>(
                `/kitchen-inventory/${warehouseId}/import/materials`,
                data
            );
            return response.data;
        } catch (error) {
            console.error(`Error importing materials for warehouse ${warehouseId}:`, error);
            throw error;
        }
    },

    /**
     * Import prepared products/items into the kitchen warehouse.
     * Roles required: ROLE_ADMIN, ROLE_MANAGER
     * @param warehouseId The ID of the kitchen warehouse
     * @param data Array of product import requests
     */
    importProducts: async (warehouseId: number, data: KitchenStockImportRequest[]): Promise<ApiResponse<KitchenStockItemResponse[]>> => {
        try {
            const response = await axiosClient.post<ApiResponse<KitchenStockItemResponse[]>>(
                `/kitchen-inventory/${warehouseId}/import/products`,
                data
            );
            return response.data;
        } catch (error) {
            console.error(`Error importing products for warehouse ${warehouseId}:`, error);
            throw error;
        }
    },

    /**
     * Get all warehouses belonging to a specific kitchen.
     * Used by coordinators to know which warehouseId to query for stock.
     */
    getWarehousesByKitchenId: async (kitchenId: number): Promise<{ warehouseId: number; name: string }[]> => {
        try {
            const response = await axiosClient.get<{ warehouseId: number; name: string }[]>(
                `/kitchen-warehouses`,
                { params: { kitchenId } }
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching warehouses for kitchen ${kitchenId}:`, error);
            return [];
        }
    }
};
