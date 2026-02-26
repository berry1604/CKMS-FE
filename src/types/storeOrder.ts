export interface OrderItemRequest {
    productId: number;
    quantity: number;
}

export interface StoreOrderRequest {
    storeId: number;
    items: OrderItemRequest[];
}

export interface OrderDetailResponse {
    id: number;
    productId: number;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}

export interface StoreOrderResponse {
    orderId: number;
    storeId: number;
    createdByUserId: number;
    orderDate: string; // ISO 8601 string
    status: string;    // Enum string like SUBMITTED, APPROVED, etc.
    batchId?: number;
    totalAmount: number;
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

export interface OrderQueryParams {
    status?: string;
    page?: number;     // default=0
    size?: number;     // default=10
    sortBy?: string;   // default=orderId or orderDate
    sortDir?: string;  // default=desc
}
