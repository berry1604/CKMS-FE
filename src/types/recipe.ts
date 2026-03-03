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
    id: number;
    productId: number;
    productName: string;
    status: string;
    recipeDetails: RecipeDetailResponse[];
    createdAt: string;
    updatedAt: string;
}
