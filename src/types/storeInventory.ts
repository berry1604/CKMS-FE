export interface StoreStockItemResponse {
    productId: number;
    productName: string;
    unit: string;
    totalQuantity: number;
    nearestExpiryDate: string | null;
    batchCount: number;
}

export interface StoreStockBatchResponse {
    batchId: number;
    batchCode: string;
    quantity: number;
    manufacturingDate: string;
    expiryDate: string;
    status: string;
}

export interface GetStoreInventoryParams {
    name?: string;
    productId?: number;
    page?: number;
    size?: number;
    sort?: string;
}
