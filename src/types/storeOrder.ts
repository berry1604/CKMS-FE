export interface OrderItemRequest {
    productId: number;
    quantity: number;
}

export interface StoreOrderRequest {
    storeId: number;
    deliveryDate: string;
    note?: string;
    items: OrderItemRequest[];
}

export interface OrderDetailResponse {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
    kitchenStockQuantity?: number;
}

export type OrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SCHEDULED' | 'LOCKED' | 'ALLOCATED' | 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export interface StoreOrderResponse {
    orderId: number;
    storeId: number;
    storeName?: string;
    storePhone?: string;
    createdByUserId: number;
    orderDate: string; // ISO 8601 string
    status: OrderStatus;
    batchId?: number;
    planId?: number;
    totalAmount: number;
    deliveryDate: string; // ISO 8601 date string
    note?: string;
    shipmentStopId?: number;
    trackingLink?: string;
    orderDetails: OrderDetailResponse[];
}


export interface PageResponse<T> {
    content: T[];
    pageable?: {
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort?: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface StoreSimpleResponse {
    id: number;
    name: string;
}

export interface OrderQueryParams {
    status?: string;
    page?: number;     // default=0
    size?: number;     // default=10
    sortBy?: string;   // default=orderId or orderDate
    sortDir?: string;  // default=desc
    storeId?: number;
    productionPlanId?: number;
}

export interface MaterialPreviewRequest {
    kitchenId?: number;
    orderIds?: number[];
}

export interface MaterialPreviewOrderResult {
    orderId: number;
    deliveryDate: string;
    status: string;
    requestedQty: number;
    approvable: boolean;
    reason: string;
}

export interface MaterialPreviewItem {
    materialId: number;
    materialName: string;
    unit: string;
    availableQty: number;
    requiredQtyForSelected: number;
    requiredQtyForApprovable: number;
    remainingQty: number;
    shortageQty: number;
}

export interface MaterialPreviewResponse {
    kitchenId: number;
    selectedOrderCount: number;
    approvableOrderCount: number;
    approvableRatePercent: number;
    orderResults: MaterialPreviewOrderResult[];
    materials: MaterialPreviewItem[];
}
