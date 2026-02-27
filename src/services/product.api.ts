import axiosClient from './axiosClient';
import type { ApiResponse, Page, ProductResponse, ProductRequest, AddMaterialRequest } from '../types/product';

export const productApi = {
    getProducts: async (params?: {
        search?: string;
        categoryId?: number;
        page?: number;
        size?: number;
        sort?: string;
    }): Promise<ApiResponse<Page<ProductResponse>>> => {
        try {
            const response = await axiosClient.get<ApiResponse<Page<ProductResponse>>>('/products', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    getProductById: async (id: number | string): Promise<ApiResponse<ProductResponse>> => {
        try {
            const response = await axiosClient.get<ApiResponse<ProductResponse>>(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product ${id}:`, error);
            throw error;
        }
    },

    createProduct: async (data: ProductRequest): Promise<ApiResponse<ProductResponse>> => {
        try {
            const response = await axiosClient.post<ApiResponse<ProductResponse>>('/products', data);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    updateProduct: async (id: number | string, data: Partial<ProductRequest>): Promise<ApiResponse<ProductResponse>> => {
        try {
            const response = await axiosClient.patch<ApiResponse<ProductResponse>>(`/products/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating product ${id}:`, error);
            throw error;
        }
    },

    deleteProduct: async (id: number | string): Promise<ApiResponse<void>> => {
        try {
            const response = await axiosClient.delete<ApiResponse<void>>(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting product ${id}:`, error);
            throw error;
        }
    },

    addMaterial: async (id: number | string, data: AddMaterialRequest): Promise<ApiResponse<any>> => {
        try {
            const response = await axiosClient.post<ApiResponse<any>>(`/products/${id}/materials`, data);
            return response.data;
        } catch (error) {
            console.error(`Error adding material to product ${id}:`, error);
            throw error;
        }
    },

    removeMaterial: async (id: number | string, materialId: number | string): Promise<ApiResponse<void>> => {
        try {
            const response = await axiosClient.delete<ApiResponse<void>>(`/products/${id}/materials/${materialId}`);
            return response.data;
        } catch (error) {
            console.error(`Error removing material ${materialId} from product ${id}:`, error);
            throw error;
        }
    },
};
