export interface RecipeDetailRequest {
    materialId: number;
    quantityNeeded: number;
}

export interface RecipeRequest {
    productId: number;
    recipeDetails: RecipeDetailRequest[];
    instructions: string;
    yield: number;
}

export interface RecipeDetailResponse {
    id: number;
    materialId: number;
    materialName: string;
    materialUnit: string;
    quantityNeeded: number;
}

export interface RecipeResponse {
    recipeId: number;
    productId: number;
    productName: string;
    createdByUserId: number;
    createdByUserName: string;
    version: number;
    isActive: boolean;
    yield: number;
    instructions: string;
    recipeDetails: RecipeDetailResponse[];
}
