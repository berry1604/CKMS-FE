export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface Page<T> {
    content: T[];
    pageable: {
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
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface ProductCategory {
    id: number;
    name: string;
    description: string;
}

export interface ProductResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    unit: string;
    category: ProductCategory;
    isActive: boolean;
    imageUrl?: string;
    materials?: any[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductRequest {
    unit: string;
    name: string;
    description?: string;
    price: number;
    categoryId: number;
    isActive?: boolean;
}

export interface AddMaterialRequest {
    materialId: number;
    quantity: number;
}
