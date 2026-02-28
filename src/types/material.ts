export type UnitType = 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PIECE';

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
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
