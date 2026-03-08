// Types matching backend ShipmentController DTOs — from Swagger

export type ShipmentStatus = 'CREATED' | 'PREPARED' | 'IN_TRANSIT' | 'DELIVERED';

export interface CreateShipmentRequest {
    productionPlanId: number;       // required
    storeId: number;                // required
    storeOrderIds: number[];        // required
    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
    shippingFee?: number;
    note?: string;
}

export interface ConfirmDeliveryRequest {
    note?: string;
    receivedQuantities?: Record<number, number>;
}

export interface ShipmentResponse {
    shipmentId: number;
    storeId: number;
    storeName: string;
    productionPlanId: number;
    status: ShipmentStatus;
    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
    shippingFee?: number;
    note?: string;
    createdByUserId?: number;
    createdByUsername?: string;
    confirmedByUserId?: number;
    confirmedByUsername?: string;
    createdAt: string;
    shippedAt?: string;
    deliveredAt?: string;
    storeOrderIds?: number[];
}

export interface ShipmentQueryParams {
    status?: ShipmentStatus;
    page?: number;
    size?: number;
    sort?: string;
}
