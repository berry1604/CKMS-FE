export interface ProductionPlanRequest {
    plannedDate: string; // Required, format: "YYYY-MM-DD"
    storeOrderIds: number[];
}

export type ProductionPlanStatus = 'PLANNED' | 'READY_TO_PRODUCE' | 'IN_PRODUCTION' | 'PRODUCED' | 'FINISHED' | 'CANCELLED';

export interface ProductionPlanResponse {
    planId: number;
    planName: string;
    batchCode: string;
    kitchenId: number;
    status: ProductionPlanStatus;
    createdAt: string;
    coordinatorUserId: number;
    version?: number;
}

export interface ProductionPlanSummaryResponse {
    planId: number;
    planName: string;
    batchCode: string;
    kitchenId: number;
    status: string;
    createdAt: string;
    coordinatorUserId: number;
    version?: number;
}

export interface MaterialRequirementResponse {
    materialId: number;
    materialName: string;
    requiredQuantity: number;
    unit?: string;
}

export interface ProductionPlanDetailResponse extends ProductionPlanSummaryResponse {
    materials: MaterialRequirementResponse[];
}
