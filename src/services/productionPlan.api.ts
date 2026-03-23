import axiosClient from './axiosClient';
import type { PageResponse } from '../types/storeOrder';
import type {
    ProductionPlanRequest,
    ProductionPlanResponse,
    ProductionPlanSummaryResponse,
    ProductionPlanDetailResponse
} from '../types/productionPlan';

export const productionPlanApi = {
    /**
     * Create a new Production Plan from Store Orders
     * Security: hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    createProductionPlan: async (data: ProductionPlanRequest): Promise<ProductionPlanResponse> => {
        try {
            const response = await axiosClient.post<ProductionPlanResponse>('/production-plans', data);
            return response.data;
        } catch (error) {
            console.error('Error creating production plan:', error);
            throw error;
        }
    },

    /**
     * Mark plan as ready (Old specific endpoint)
     * Security: hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    readyProductionPlan: async (id: number): Promise<ProductionPlanResponse> => {
        try {
            const response = await axiosClient.put<ProductionPlanResponse>(`/production-plans/${id}/ready`);
            return response.data;
        } catch (error) {
            console.error(`Error marking plan ${id} ready:`, error);
            throw error;
        }
    },

    /**
     * Confirm material allocation and mark plan ready to produce
     * Security: hasAuthority('ORGANIZE_PRODUCTION')
     */
    confirmAllocation: async (id: number, version?: number, data?: any): Promise<ProductionPlanResponse> => {
        try {
            const config = version ? { headers: { 'If-Match': version } } : {};
            const response = await axiosClient.post<ProductionPlanResponse>(`/allocations/confirm/${id}`, data || {}, config);
            return response.data;
        } catch (error) {
            console.error(`Error confirming allocation for plan ${id}:`, error);
            throw error;
        }
    },

    /**
     * Start production for a plan
     * Security: hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    startProductionPlan: async (id: number, version?: number): Promise<ProductionPlanResponse> => {
        try {
            const config = version ? { headers: { 'If-Match': version } } : {};
            const response = await axiosClient.post<ProductionPlanResponse>(`/production-plans/${id}/start`, null, config);
            return response.data;
        } catch (error) {
            console.error(`Error starting plan ${id}:`, error);
            throw error;
        }
    },

    /**
     * Finish production plan
     * Security: hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    finishProductionPlan: async (id: number, version?: number, data?: any): Promise<ProductionPlanResponse> => {
        try {
            const config = version ? { headers: { 'If-Match': version } } : {};
            // Corrected endpoint from /finish to /yield as per backend controller
            const response = await axiosClient.post<ProductionPlanResponse>(`/production-plans/${id}/yield`, data || {}, config);
            return response.data;
        } catch (error) {
            console.error(`Error finishing plan ${id}:`, error);
            throw error;
        }
    },

    /**
     * Cancel production plan
     * Security: hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    cancelProductionPlan: async (id: number, version?: number, returnInventory: boolean = true): Promise<ProductionPlanResponse> => {
        try {
            const config: any = version ? { headers: { 'If-Match': version }, params: { returnInventory } } : { params: { returnInventory } };
            const response = await axiosClient.post<ProductionPlanResponse>(`/production-plans/${id}/cancel`, null, config);
            return response.data;
        } catch (error) {
            console.error(`Error cancelling plan ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get all Production Plans (paged)
     * Security: hasRole('KITCHEN_STAFF') or hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    getAllProductionPlans: async (params?: { status?: string, page?: number, size?: number }): Promise<PageResponse<ProductionPlanSummaryResponse>> => {
        try {
            // Reusing PageResponse from storeOrderApi since standard Page responses share shape
            const response = await axiosClient.get<PageResponse<ProductionPlanSummaryResponse>>('/production-plans', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching production plans:', error);
            throw error;
        }
    },

    /**
     * Get Production Plan Details
     * Security: hasRole('KITCHEN_STAFF') or hasRole('COORDINATOR') or hasRole('ADMIN')
     */
    getProductionPlanDetail: async (id: number): Promise<ProductionPlanDetailResponse> => {
        try {
            const response = await axiosClient.get<ProductionPlanDetailResponse>(`/production-plans/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching plan detail ${id}:`, error);
            throw error;
        }
    }
};
