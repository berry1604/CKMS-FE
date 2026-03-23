export interface KitchenResponse {
    kitchenId: number;
    name: string;
    address: string;
    maxDailyCapacity: number;
    isActive: boolean;
}

export interface KitchenUpdateRequest {
    name?: string;
    address?: string;
    maxDailyCapacity?: number;
    isActive?: boolean;
}
