export type UnitType = 'KG' | 'G' | 'L' | 'ML' | 'PCS' | 'BOX' | 'PACK';

export interface MaterialResponse {
    id: number;
    name: string;
    unit: UnitType;
    minStockLevel: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface MaterialRequest {
    name: string;
    unit: UnitType;
    minStockLevel: number;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
