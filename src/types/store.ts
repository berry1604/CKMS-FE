export interface StoreResponse {
    id?: number;
    storeId?: number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    managerName?: string;
    isActive: boolean;
    paymentCycle?: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
    latitude?: number;
    longitude?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface StoreCreateRequest {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    paymentCycle: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
    latitude?: number | null;
    longitude?: number | null;
}

export interface StoreUpdateRequest {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    paymentCycle?: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
    latitude?: number | null;
    longitude?: number | null;
}

export interface GetStoresParams {
    page?: number;
    size?: number;
    search?: string;
}
