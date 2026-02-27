import axiosClient from './axiosClient';
import type {
    StoreOrderRequest,
    StoreOrderResponse,
    PageResponse,
    OrderQueryParams
} from '../types/storeOrder';

export const storeOrderApi = {
    /**
     * Create a new Store Order
     * Security: hasAuthority('CREATE_STORE_ORDER')
     */
    createOrder: async (data: StoreOrderRequest): Promise<StoreOrderResponse> => {
        try {
            const response = await axiosClient.post<StoreOrderResponse>('/orders', data);
            return response.data;
        } catch (error) {
            console.error('Error creating store order:', error);
            throw error;
        }
    },

    /**
     * Get My Orders (paged)
     * Security: hasAuthority('VIEW_STORE_ORDER')
     */
    getMyOrders: async (params?: OrderQueryParams): Promise<PageResponse<StoreOrderResponse>> => {
        try {
            const response = await axiosClient.get<PageResponse<StoreOrderResponse>>('/orders/my', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching my store orders:', error);
            throw error;
        }
    },

    /**
     * Get All Orders (paged)
     * Security: hasAuthority('VIEW_STORE_ORDER')
     */
    getAllOrders: async (params?: OrderQueryParams): Promise<PageResponse<StoreOrderResponse>> => {
        try {
            const response = await axiosClient.get<PageResponse<StoreOrderResponse>>('/orders', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching all store orders:', error);
            throw error;
        }
    },

    /**
     * Get Order by ID
     * Security: hasAuthority('VIEW_STORE_ORDER')
     */
    getOrderById: async (id: number | string): Promise<StoreOrderResponse> => {
        try {
            const response = await axiosClient.get<StoreOrderResponse>(`/orders/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            throw error;
        }
    },

    /**
     * Update order status
     * Security: hasAnyAuthority('UPDATE_STORE_ORDER', 'ORDER_APPROVE')
     */
    updateOrderStatus: async (id: number | string, status: string): Promise<StoreOrderResponse> => {
        try {
            const response = await axiosClient.patch<StoreOrderResponse>(`/orders/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating order status ${id}:`, error);
            throw error;
        }
    }
};
