export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface KitchenStockItemResponse {
    id: number;
    warehouseId: number;
    itemType: string; // "MATERIAL" or "PRODUCT"
    itemId: number;
    itemName: string;
    unit: string;
    quantity: number;
    expiryDate: string;
    productionPlanId: number;
}

export interface KitchenStockImportRequest {
    itemId?: number;
    materialId?: number;
    productId?: number;
    quantity: number;
    expiryDate?: string; // Format: "YYYY-MM-DD"
    productionPlanId?: number;
}
