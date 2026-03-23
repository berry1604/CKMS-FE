export interface StoreResponse {
    id?: number;
    storeId?: number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    managerName?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface StoreCreateRequest {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
}

export interface StoreUpdateRequest {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
}

export interface GetStoresParams {
    page?: number;
    size?: number;
    search?: string;
}
