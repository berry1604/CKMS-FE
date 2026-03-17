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
     * Submit a draft order
     */
    submitOrder: async (id: number | string): Promise<StoreOrderResponse> => {
        try {
            const response = await axiosClient.patch<StoreOrderResponse>(`/orders/${id}/submit`);
            return response.data;
        } catch (error) {
            console.error(`Error submitting order ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get simple stores list for dropdown
     */
    getMyStores: async (): Promise<StoreSimpleResponse[]> => {
        try {
            const response = await axiosClient.get<any>('/stores');
            // Backend returns ApiResponse<Page<StoreResponse>> with data.content
            const resData = response.data;
            let stores: any[] = [];

            if (resData?.data?.content) {
                // ApiResponse<Page<StoreResponse>>
                stores = resData.data.content;
            } else if (resData?.content) {
                // Page<StoreResponse> directly
                stores = resData.content;
            } else if (Array.isArray(resData?.data)) {
                stores = resData.data;
            } else if (Array.isArray(resData)) {
                stores = resData;
            }

            return stores.map((s: any) => ({ id: s.id, name: s.name || s.storeName || `Store #${s.id}` }));
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
    },

    /**
     * Approve an order
     */
    approveOrder: async (id: number | string): Promise<StoreOrderResponse> => {
        return storeOrderApi.updateOrderStatus(id, 'APPROVED');
    },

    /**
     * Reject an order with reason
     * Note: Current backend status endpoint might not support 'reason' yet.
     */
    rejectOrder: async (id: number | string, _reason: string): Promise<StoreOrderResponse> => {
        return storeOrderApi.updateOrderStatus(id, 'REJECTED');
    },


    /**
     * Send notification email manually
     */
    notifyOrder: async (id: number | string): Promise<void> => {
        await axiosClient.post(`/orders/${id}/notify`);
    },

    /**
     * Reschedule delivery date
     * PATCH /api/v1/orders/{id}/reschedule
     */
    rescheduleOrder: async (id: number | string, deliveryDate: string): Promise<StoreOrderResponse> => {
        try {
            const response = await axiosClient.patch<StoreOrderResponse>(`/orders/${id}/reschedule`, { deliveryDate });
            return response.data;
        } catch (error) {
            console.error(`Error rescheduling order ${id}:`, error);
            throw error;
        }
    },

    /**
     * Split order into two
     * POST /api/v1/orders/{id}/split
     */
    splitOrder: async (id: number | string, items: { productId: number, quantity: number }[]): Promise<StoreOrderResponse[]> => {
        try {
            const response = await axiosClient.post<StoreOrderResponse[]>(`/orders/${id}/split`, items);
            return response.data;
        } catch (error) {
            console.error(`Error splitting order ${id}:`, error);
            throw error;
        }
    }
};
