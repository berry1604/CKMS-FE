export interface RecipeDetailRequest {
    materialId: number;
    quantityNeeded: number;
}

export interface RecipeRequest {
    productId: number;
    yield: number;
    instructions: string;
    recipeDetails: RecipeDetailRequest[];
}

export interface RecipeDetailResponse {
    id: number;
    materialId: number;
    materialName: string;
    materialUnit: string;
    quantityNeeded: number;
    costPerUnit?: number;
}

export interface RecipeResponse {
    id: number;
    productId: number;
    productName: string;
    yield: number;
    instructions: string;
    status: string;
    totalCost: number;
    recipeDetails: RecipeDetailResponse[];
    createdAt: string;
    updatedAt: string;
}
