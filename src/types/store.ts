export interface StoreResponse {
    id: number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    managerName?: string;
    isActive: boolean;
    warehouseCapacity?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface StoreCreateRequest {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    managerId?: number;
    warehouseCapacity: number;
}

export interface StoreUpdateRequest {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    managerId?: number;
    isActive?: boolean;
    warehouseCapacity?: number;
}

export interface GetStoresParams {
    page?: number;
    size?: number;
    search?: string;
}
