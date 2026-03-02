export interface StoreResponse {
    id: number;
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
    managerId?: number;
}

export interface GetStoresParams {
    page?: number;
    size?: number;
    search?: string;
}
