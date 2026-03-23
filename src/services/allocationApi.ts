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
    deliveryDate?: string;
}

export interface AllocationRow {
    productId: number;
    productName: string;
    totalAvailable: number;
    allocations: AllocationCell[];
}

export interface AllocationPreviewResponse {
    planId: number;
    orders: any[];
    materials: {
        materialId: number;
        materialName: string;
        requiredQuantity: number;
    }[];
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
    previewAllocation: async (productionPlanId: number): Promise<{ rows: AllocationRow[], materials: any[], rawOrders: any[] }> => {
        try {
            const response = await axiosClient.get(`/allocations/preview/${productionPlanId}`);
            const resData = response.data as any;

            const materials = resData?.materials || [];

            // Try to find the array in common properties
            let rawArray: any[] | null = null;
            if (Array.isArray(resData)) rawArray = resData;
            else if (resData?.orders && Array.isArray(resData.orders)) rawArray = resData.orders;
            else if (resData?.allocations && Array.isArray(resData.allocations)) rawArray = resData.allocations;
            else if (resData?.allocationRows && Array.isArray(resData.allocationRows)) rawArray = resData.allocationRows;
            else if (resData?.items && Array.isArray(resData.items)) rawArray = resData.items;
            else if (resData?.rows && Array.isArray(resData.rows)) rawArray = resData.rows;
            else if (resData?.content && Array.isArray(resData.content)) rawArray = resData.content;
            else if (resData?.data && Array.isArray(resData.data)) rawArray = resData.data;
            else if (resData?.data?.content && Array.isArray(resData.data.content)) rawArray = resData.data.content;
            else if (resData?.data?.allocations && Array.isArray(resData.data.allocations)) rawArray = resData.data.allocations;
            else if (resData?.data?.orders && Array.isArray(resData.data.orders)) rawArray = resData.data.orders;

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
                // Check if the new structure `{ products: [...] }` is present
                if (resData?.products && Array.isArray(resData.products)) {
                    const products = resData.products;
                    const rows: AllocationRow[] = products.map((p: any) => ({
                        productId: p.productId,
                        productName: p.productName || `Product ${p.productId}`,
                        totalAvailable: p.availableQuantity || 0,
                        allocations: (p.allocations || []).map((a: any) => ({
                            storeId: a.storeId,
                            storeName: a.storeName || `Chi nhánh ${a.storeId}`,
                            requestedQuantity: a.requested || 0,
                            allocatedQuantity: a.allocated || 0,
                            maxAvailable: p.availableQuantity || 0,
                            deliveryDate: p.deliveryDate || a.deliveryDate
                        }))
                    }));

                    // Reconstruct rawOrders for summary table
                    const orderMap = new Map<number, any>();
                    products.forEach((p: any) => {
                        (p.allocations || []).forEach((a: any) => {
                            if (!orderMap.has(a.storeId)) {
                                orderMap.set(a.storeId, {
                                    orderId: a.orderId || a.storeId,
                                    storeId: a.storeId,
                                    storeName: a.storeName || `Chi nhánh ${a.storeId}`,
                                    deliveryDate: a.deliveryDate || p.deliveryDate, 
                                    items: []
                                });
                            }
                            orderMap.get(a.storeId).items.push({
                                productId: p.productId,
                                productName: p.productName,
                                requestedQuantity: a.requested || 0,
                                allocatedQuantity: a.allocated || 0
                            });
                        });
                    });

                    return {
                        rows,
                        materials,
                        rawOrders: Array.from(orderMap.values())
                    };
                }

                console.error('Unknown allocation structure:', resData);
                return { rows: [], materials, rawOrders: [] };
            }

            if (rawArray.length === 0) return { rows: [], materials, rawOrders: [] };

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
                            maxAvailable: 999999,
                            deliveryDate: order.deliveryDate || order.orderDate
                        });

                        // Use real stock from backend (actualProducedQty), NOT sum of proposedQty
                        const realStock = item.stockQuantity ?? item.totalAvailable ?? item.actualProducedQty ?? 0;
                        if (prod.totalAvailable === 0 || realStock > prod.totalAvailable) {
                            prod.totalAvailable = Number(realStock);
                        }
                    });
                });

                return { rows: Array.from(productMap.values()), materials, rawOrders: rawArray };
            }

            return { rows: rawArray as AllocationRow[], materials, rawOrders: rawArray };
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
