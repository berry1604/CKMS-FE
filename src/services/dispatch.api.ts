import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/product';

export interface OrderSuggestion {
    orderId: number;
    isFulfilled: boolean; // Green (true) / Red (false)
    shortageItems?: string[];
}

export interface SuggestionResponse {
    kitchenId: number;
    kitchenName: string;
    kitchenCapacity: number; // Remaining capacity
    orderSuitability: OrderSuggestion[]; // Added as per new spec
}

export const dispatchApi = {
    /**
     * GET /api/v1/dispatch/suggest
     * Returns remaining capacity for a kitchen on a target date.
     */
    getSuggestion: async (kitchenId: number, targetDate: string): Promise<ApiResponse<SuggestionResponse[]>> => {
        try {
            const response = await axiosClient.get<ApiResponse<SuggestionResponse[]>>('/dispatch/suggest', {
                params: { kitchenId, targetDate }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching dispatch suggestion:', error);
            throw error;
        }
    }
};
