export interface ProductionPlanRequest {
    plannedDate: string; // Required, format: "YYYY-MM-DD"
    storeOrderIds: number[];
}

export interface ProductionPlanResponse {
    planId: number;
    planName: string;
    batchCode: string;
    kitchenId: number;
    status: string;
    createdAt: string;
    coordinatorUserId: number;
}

export interface ProductionPlanSummaryResponse {
    planId: number;
    planName: string;
    batchCode: string;
    kitchenId: number;
    status: string;
    createdAt: string;
    coordinatorUserId: number;
}

export interface MaterialRequirementResponse {
    materialId: number;
    materialName: string;
    requiredQuantity: number;
    unit: string;
}

export interface ProductionPlanDetailResponse extends ProductionPlanSummaryResponse {
    materials: MaterialRequirementResponse[];
}
