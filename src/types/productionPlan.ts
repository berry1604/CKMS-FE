export type ProductionPlanStatus = 'DRAFT' | 'READY_TO_PRODUCE' | 'PRODUCING' | 'COMPLETED' | 'CANCELLED' | 'PLANNED' | 'IN_PRODUCTION' | 'PRODUCED' | 'FINISHED' | 'APPROVED';

export interface DispatchSuggestionItem {
    productName: string;
    demandQty: number;
    kitchenCapacity: number;
    ingredientCapacity: number;
    suggestedQty: number;
    shortageDetails?: string;
}

export interface DispatchSuggestionResponse {
    targetDate: string;
    suggestions: DispatchSuggestionItem[];
}

export interface ProductionPlanRequest {
    kitchenId: number;
    plannedDate: string; // Changed from targetDate to plannedDate as per backend validation fix
    storeOrderIds: number[];
}

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
    status: ProductionPlanStatus;
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

export interface ProductionPlanDetailItem {
    productId: number;
    productName: string;
    plannedQuantity: number;
    producedQuantity?: number;
    unit?: string;
}

export interface ProductionPlanOutputItem {
    productId: number;
    productName: string;
    quantity: number;
}

export interface ProductionPlanDetailResponse extends ProductionPlanSummaryResponse {
    materials: MaterialRequirementResponse[];
    items?: ProductionPlanDetailItem[];
    outputs?: ProductionPlanOutputItem[];
}
