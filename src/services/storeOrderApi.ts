import axiosClient from './axiosClient';
import type {
    StoreOrderRequest,
    StoreOrderResponse,
    PageResponse,
    OrderQueryParams,
    StoreSimpleResponse
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
            const payload: Record<string, string> = { status: status.toUpperCase() };
            const response = await axiosClient.patch<StoreOrderResponse>(`/orders/${id}/status`, payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating order status ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get simple stores list for dropdown
     */
    getMyStores: async (): Promise<StoreSimpleResponse[]> => {
        try {
            // Placeholder: Assume there's an API for this
            const response = await axiosClient.get<{ data: StoreSimpleResponse[] } | StoreSimpleResponse[]>('/stores');
            // Support both wrapped ApiResponse or direct array
            return Array.isArray(response.data) ? response.data : response.data.data;
        } catch (error) {
            console.error(`Error fetching stores:`, error);
            return [];
        }
    },

    /**
     * Update an existing order
     * PUT /orders/:id
     * Security: hasAuthority('CREATE_STORE_ORDER')
     */
    updateOrder: async (id: number | string, data: StoreOrderRequest): Promise<StoreOrderResponse> => {
        const response = await axiosClient.put<StoreOrderResponse>(`/orders/${id}`, data);
        return response.data;
    },

    /**
     * Cancel an order (soft-delete)
     * DELETE /orders/:id
     * Security: hasAuthority('CREATE_STORE_ORDER')
     */
    cancelOrder: async (id: number | string): Promise<void> => {
        await axiosClient.delete(`/orders/${id}`);
    }
};
