// Types matching backend ShipmentController DTOs — from Swagger

export type ShipmentStatus = 'PENDING' | 'PREPARED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export type AhamoveServiceIdType = 'SGN-BIKE' | 'SGN-PREMIUM' | 'SGN-POOL' | 'SGN-TRUCK-500' | 'SGN-TRUCK-1000' | 'SGN-TRUCK-2000';

export interface DropPointRequest {
    storeId: number;
    storeOrderIds: number[];
    remarks?: string;
}

export interface CreateShipmentRequest {
    productionPlanId: number;
    storeId: number;
    storeOrderIds: number[];
    dropPoints?: DropPointRequest[];
    ahamoveServiceId: AhamoveServiceIdType;
    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
    shippingFee?: number;
    remarks?: string;
}

export interface ConfirmDeliveryRequest {
    note?: string;
    receivedQuantities?: Record<number, number>;
}

export interface ShipmentStop {
    stopId: number;
    storeId: number;
    storeName: string;
    storePhone?: string;
    storeOrderIds: number[];
}

export interface ShipmentResponse {
    shipmentId: number;
    storeId?: number; // Might be null for multi-drop
    storeName?: string; // Might be null for multi-drop
    storePhone?: string;
    productionPlanId: number;
    status: ShipmentStatus;

    // Ahamove specific fields
    ahamoveOrderId?: string;
    trackingLink?: string;
    ahamoveStatus?: string;

    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
    shippingFee?: number;
    remarks?: string;
    note?: string; // Also keeping note for backwards compatibility if used elsewhere

    createdByUserId?: number;
    createdByUsername?: string;
    confirmedByUserId?: number;
    confirmedByUsername?: string;

    createdAt: string;
    shippedAt?: string;
    deliveredAt?: string;
    storeOrderIds?: number[];
    stops?: ShipmentStop[];
}

export interface ShipmentQueryParams {
    status?: ShipmentStatus;
    page?: number;
    size?: number;
    sort?: string;
}
