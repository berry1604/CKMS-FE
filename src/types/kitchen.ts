export type KitchenStatus = 'IDLE' | 'IN_PRODUCTION';

export interface KitchenResponse {
    kitchenId: number;
    name: string;
    address: string;
    maxDailyCapacity: number;
    isActive: boolean;
    currentStatus?: KitchenStatus;
    activePlanCount?: number;
    todayUsedCapacity?: number;
    latitude?: number;
    longitude?: number;
}

export interface KitchenCreateRequest {
    name: string;
    address: string;
    maxDailyCapacity: number;
    isActive: boolean;
    latitude?: number;
    longitude?: number;
}

export interface KitchenUpdateRequest {
    name?: string;
    address?: string;
    maxDailyCapacity?: number;
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
}
