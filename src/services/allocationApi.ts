import axiosClient from './axiosClient';

export interface AllocationPreviewRequest {
    productionPlanId: number;
}

export interface AllocationCell {
    storeId: number;
    storeName: string;
    requestedQuantity: number;
    allocatedQuantity: number;
    maxAvailable: number; // Based on production output
}

export interface AllocationRow {
    productId: number;
    productName: string;
    totalAvailable: number;
    allocations: AllocationCell[];
}

export interface ConfirmAllocationRequest {
    productionPlanId: number;
    allocations: {
        storeId: number;
        productId: number;
        allocatedQuantity: number;
    }[];
}

export const allocationApi = {
    /**
     * Preview allocation matrix for a specific production plan.
     */
    previewAllocation: async (productionPlanId: number): Promise<AllocationRow[]> => {
        try {
            const response = await axiosClient.get(`/allocations/preview/${productionPlanId}`);
            const resData = response.data as any;

            // Try to find the array in common properties
            let rawArray: any[] | null = null;
            if (Array.isArray(resData)) rawArray = resData;
            else if (resData?.allocations && Array.isArray(resData.allocations)) rawArray = resData.allocations;
            else if (resData?.allocationRows && Array.isArray(resData.allocationRows)) rawArray = resData.allocationRows;
            else if (resData?.items && Array.isArray(resData.items)) rawArray = resData.items;
            else if (resData?.rows && Array.isArray(resData.rows)) rawArray = resData.rows;
            else if (resData?.content && Array.isArray(resData.content)) rawArray = resData.content;
            else if (resData?.data && Array.isArray(resData.data)) rawArray = resData.data;
            else if (resData?.data?.content && Array.isArray(resData.data.content)) rawArray = resData.data.content;
            else if (resData?.data?.allocations && Array.isArray(resData.data.allocations)) rawArray = resData.data.allocations;

            // Aggressive search for any array
            if (!rawArray) {
                for (const key in resData) {
                    if (Array.isArray(resData[key])) {
                        rawArray = resData[key];
                        break;
                    }
                }
            }
            if (!rawArray && resData?.data) {
                for (const key in resData.data) {
                    if (Array.isArray(resData.data[key])) {
                        rawArray = resData.data[key];
                        break;
                    }
                }
            }

            if (!rawArray || !Array.isArray(rawArray)) {
                console.error('Unknown allocation structure:', resData);
                throw new Error('DEBUG RAW DATA: ' + JSON.stringify(resData));
            }

            if (rawArray.length === 0) return [];

            // DETECT & TRANSFORM: 
            // If the array contains objects like {"orderId":3,"storeName":"CN1","items":[]}
            if (rawArray[0].orderId !== undefined && Array.isArray(rawArray[0].items)) {
                const productMap = new Map<number, AllocationRow>();

                rawArray.forEach((order: any) => {
                    // Try to extract storeId from storeName string (e.g. "CN1" -> 1), or fallback to orderId
                    const match = order.storeName ? order.storeName.match(/\d+/) : null;
                    const storeId = match ? parseInt(match[0], 10) : order.orderId;

                    order.items.forEach((item: any) => {
                        if (!productMap.has(item.productId)) {
                            productMap.set(item.productId, {
                                productId: item.productId,
                                productName: item.productName || `Product ${item.productId}`,
                                totalAvailable: 0,
                                allocations: []
                            });
                        }

                        const prod = productMap.get(item.productId)!;
                        const allocated = item.proposedQty ?? item.allocatedQuantity ?? 0;
                        const requested = item.requestedQty ?? item.requestedQuantity ?? 0;

                        prod.allocations.push({
                            storeId: storeId,
                            storeName: order.storeName || `Order #${order.orderId}`,
                            requestedQuantity: requested,
                            allocatedQuantity: allocated,
                            maxAvailable: 999999 // Backend doesn't provide maxAvailable per store rule, use high number or total
                        });
                        prod.totalAvailable += allocated; // Safest estimate for total available is sum of proposed
                    });
                });

                return Array.from(productMap.values());
            }

            return rawArray as AllocationRow[];
        } catch (error: any) {
            console.error('Failed to preview allocation', error);
            throw error;
        }
    },

    /**
     * Confirm allocations.
     * Maps to requirement: POST /api/v1/allocations/confirm/{productionPlanId}
     */
    confirmAllocation: async (data: ConfirmAllocationRequest): Promise<any> => {
        try {
            const response = await axiosClient.post(`/allocations/confirm/${data.productionPlanId}`, {
                allocations: data.allocations
            });
            return response.data;
        } catch (error: any) {
            console.error('Failed to confirm allocation', error);
            throw error;
        }
    }
};
